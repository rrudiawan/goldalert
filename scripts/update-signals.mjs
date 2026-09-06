import fs from "node:fs/promises";

// NOTE (Sep 2026): Stooq was originally used here but reliably returns empty/blocked
// responses when called from GitHub Actions runners (likely blocking Azure's shared IP
// ranges, a known pattern with several free data providers). Switched the 9 metal/stock
// assets to Yahoo Finance's public chart endpoint, which is widely used from server/cloud
// environments precisely because it doesn't have this issue. CoinGecko (for PAXG/XAUT)
// was unaffected and is unchanged.
const ASSETS=[
  {id:"XAUUSD",src:"yahoo",code:"GC=F"},{id:"XAGUSD",src:"yahoo",code:"SI=F"},
  {id:"AU",src:"yahoo",code:"AU"},{id:"KGC",src:"yahoo",code:"KGC"},
  {id:"HMY",src:"yahoo",code:"HMY"},{id:"GFI",src:"yahoo",code:"GFI"},
  {id:"GDX",src:"yahoo",code:"GDX"},{id:"GLD",src:"yahoo",code:"GLD"},
  {id:"SLV",src:"yahoo",code:"SLV"},{id:"PAXG",src:"coingecko",code:"pax-gold"},
  {id:"XAUT",src:"coingecko",code:"tether-gold"}
];

const BROWSER_HEADERS={
  "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept":"text/html,application/json,text/plain,*/*"
};

async function yahoo(symbol){
  const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`,{headers:BROWSER_HEADERS});
  if(!r.ok) throw new Error(`Yahoo ${r.status}`);
  const j=await r.json();
  const result=j?.chart?.result?.[0];
  if(!result) throw new Error(`Yahoo: no data (${j?.chart?.error?.description||"unknown"})`);
  const ts=result.timestamp||[];
  const closes=result.indicators?.quote?.[0]?.close||[];
  const rows=ts.map((t,i)=>({d:new Date(t*1000).toISOString().slice(0,10),c:Number(closes[i])}))
    .filter(r=>Number.isFinite(r.c)&&r.c>0);
  if(rows.length<20) throw new Error(`Yahoo returned insufficient history (${rows.length} rows)`);
  return rows.slice(-600);
}
async function coingecko(code){
  const r=await fetch(`https://api.coingecko.com/api/v3/coins/${code}/market_chart?vs_currency=usd&days=365&interval=daily`,{headers:BROWSER_HEADERS});
  if(!r.ok) throw new Error(`CoinGecko ${r.status}`);
  const j=await r.json();
  const byDay=new Map(j.prices.map(p=>[new Date(p[0]).toISOString().slice(0,10),Number(p[1])]));
  return [...byDay].map(([d,c])=>({d,c})).filter(r=>Number.isFinite(r.c)&&r.c>0);
}
function tier(rows){
  let run=0; for(let i=rows.length-1;i>0&&rows[i].c<rows[i-1].c;i--) run++;
  const start=Math.max(0,rows.length-1-run),drop=(rows[start].c-rows.at(-1).c)/rows[start].c*100;
  return {run,drop:Number(drop.toFixed(2)),level:run>=5?"100% BUY":run>=3?"50% BUY":"HOLD",price:rows.at(-1).c,date:rows.at(-1).d};
}

let previous={signals:{}};
try{previous=JSON.parse(await fs.readFile("dist/data/signals.json","utf8"));}catch{}
const assets={},signals={},errors={};
for(const asset of ASSETS){
  try{
    const rows=asset.src==="yahoo"?await yahoo(asset.code):await coingecko(asset.code);
    assets[asset.id]=rows; signals[asset.id]=tier(rows);
    console.log(`OK  ${asset.id}: ${rows.length} rows, latest close ${rows.at(-1).c} on ${rows.at(-1).d}`);
  }catch(error){
    errors[asset.id]=String(error.message||error);
    console.log(`FAIL ${asset.id}: ${errors[asset.id]}`);
  }
}
if(Object.keys(assets).length<8){
  const summary=Object.entries(errors).map(([id,msg])=>`${id}: ${msg}`).join(" | ");
  console.log(`::error::Only ${Object.keys(assets).length}/${ASSETS.length} assets updated, refusing to publish. ${summary}`);
  throw new Error(`Only ${Object.keys(assets).length} assets updated; refusing to publish incomplete data.`);
}
await fs.mkdir("dist/data",{recursive:true});
const generatedAt=new Date().toISOString();
await fs.writeFile("dist/data/market-history.json",JSON.stringify({generatedAt,assets,errors}));
await fs.writeFile("dist/data/signals.json",JSON.stringify({generatedAt,signals,errors},null,2));

const rank={HOLD:0,"50% BUY":1,"100% BUY":2};
const newlyActive=Object.entries(signals).filter(([id,s])=>rank[s.level]>rank[previous.signals?.[id]?.level||"HOLD"]);
if(newlyActive.length&&process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID){
  const text=["Gold Signal Simulator",...newlyActive.map(([id,s])=>`${id}: ${s.level} · ${s.run} red days · ${s.drop}% · $${s.price}`)].join("\n");
  const r=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text})});
  if(!r.ok) throw new Error(`Telegram notification failed: ${r.status}`);
}
console.log(`Updated ${Object.keys(assets).length} assets; ${Object.keys(errors).length} errors; ${newlyActive.length} new alerts.`);
