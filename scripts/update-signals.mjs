import fs from "node:fs/promises";

const ASSETS=[
  {id:"XAUUSD",src:"stooq",code:"xauusd"},{id:"XAGUSD",src:"stooq",code:"xagusd"},
  {id:"AU",src:"stooq",code:"au.us"},{id:"KGC",src:"stooq",code:"kgc.us"},
  {id:"HMY",src:"stooq",code:"hmy.us"},{id:"GFI",src:"stooq",code:"gfi.us"},
  {id:"GDX",src:"stooq",code:"gdx.us"},{id:"GLD",src:"stooq",code:"gld.us"},
  {id:"SLV",src:"stooq",code:"slv.us"},{id:"PAXG",src:"coingecko",code:"pax-gold"},
  {id:"XAUT",src:"coingecko",code:"tether-gold"}
];

async function stooq(code){
  const r=await fetch(`https://stooq.com/q/d/l/?s=${code}&i=d`);
  if(!r.ok) throw new Error(`Stooq ${r.status}`);
  const lines=(await r.text()).trim().split(/\r?\n/);
  const rows=lines.slice(1).map(line=>{const p=line.split(",");return {d:p[0],c:Number(p[4])};}).filter(r=>r.d&&Number.isFinite(r.c)&&r.c>0);
  if(rows.length<20) throw new Error("Stooq returned insufficient history");
  return rows.slice(-600);
}
async function coingecko(code){
  const r=await fetch(`https://api.coingecko.com/api/v3/coins/${code}/market_chart?vs_currency=usd&days=365&interval=daily`);
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
    const rows=asset.src==="stooq"?await stooq(asset.code):await coingecko(asset.code);
    assets[asset.id]=rows; signals[asset.id]=tier(rows);
  }catch(error){errors[asset.id]=String(error.message||error);}
}
if(Object.keys(assets).length<8) throw new Error(`Only ${Object.keys(assets).length} assets updated; refusing to publish incomplete data.`);
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
