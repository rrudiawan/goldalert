import fs from "node:fs/promises";

const ASSETS=[
  {id:"XAUUSD",src:"yahoo",code:"GC=F"},
  {id:"XAGUSD",src:"yahoo",code:"SI=F"},
  {id:"AU",src:"yahoo",code:"AU"},
  {id:"KGC",src:"yahoo",code:"KGC"},
  {id:"HMY",src:"yahoo",code:"HMY"},
  {id:"GFI",src:"yahoo",code:"GFI"},
  {id:"GDX",src:"yahoo",code:"GDX"},
  {id:"GLD",src:"yahoo",code:"GLD"},
  {id:"SLV",src:"yahoo",code:"SLV"},
  {id:"PAXG",src:"coingecko",code:"pax-gold"},
  {id:"XAUT",src:"coingecko",code:"tether-gold"},
  {id:"OIL",src:"yahoo",code:"CL=F"},
  {id:"COPPER",src:"yahoo",code:"HG=F"},
  {id:"NATGAS",src:"yahoo",code:"NG=F"},
  {id:"BTC",src:"coingecko",code:"bitcoin"}
];

const SIGNAL_ASSETS=new Set([
  "XAUUSD",
  "XAGUSD",
  "AU",
  "KGC",
  "HMY",
  "GFI",
  "GDX",
  "GLD",
  "SLV",
  "PAXG",
  "XAUT"
]);

const BROWSER_HEADERS={
  "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept":"text/html,application/json,text/plain,*/*"
};

async function yahoo(symbol){
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;

  const response=await fetch(
    url,
    {headers:BROWSER_HEADERS}
  );

  if(!response.ok){
    throw new Error(
      `Yahoo ${response.status}`
    );
  }

  const json=await response.json();
  const result=json?.chart?.result?.[0];

  if(!result){
    throw new Error(
      `Yahoo: no data (${json?.chart?.error?.description||"unknown"})`
    );
  }

  const timestamps=result.timestamp||[];
  const closes=
    result.indicators?.quote?.[0]?.close||
    [];

  const rows=timestamps
    .map((timestamp,index)=>({
      d:new Date(timestamp*1000)
        .toISOString()
        .slice(0,10),
      c:Number(closes[index])
    }))
    .filter(row=>
      Number.isFinite(row.c)&&
      row.c>0
    );

  if(rows.length<20){
    throw new Error(
      `Yahoo returned insufficient history (${rows.length} rows)`
    );
  }

  return rows.slice(-600);
}

async function coingecko(code){
  const url=`https://api.coingecko.com/api/v3/coins/${code}/market_chart?vs_currency=usd&days=365&interval=daily`;

  const response=await fetch(
    url,
    {headers:BROWSER_HEADERS}
  );

  if(!response.ok){
    throw new Error(
      `CoinGecko ${response.status}`
    );
  }

  const json=await response.json();

  const byDay=new Map(
    json.prices.map(price=>[
      new Date(price[0])
        .toISOString()
        .slice(0,10),
      Number(price[1])
    ])
  );

  return [...byDay]
    .map(([d,c])=>({d,c}))
    .filter(row=>
      Number.isFinite(row.c)&&
      row.c>0
    );
}

function tier(rows){
  let run=0;

  for(
    let index=rows.length-1;
    index>0&&
    rows[index].c<rows[index-1].c;
    index--
  ){
    run++;
  }

  const start=Math.max(
    0,
    rows.length-1-run
  );

  const drop=
    (rows[start].c-rows.at(-1).c)/
    rows[start].c*
    100;

  return {
    run,
    drop:Number(drop.toFixed(2)),
    level:
      run>=5
        ?"100% BUY"
        :run>=3
          ?"50% BUY"
          :"HOLD",
    price:rows.at(-1).c,
    date:rows.at(-1).d
  };
}

let previous={signals:{}};

try{
  previous=JSON.parse(
    await fs.readFile(
      "dist/data/signals.json",
      "utf8"
    )
  );
}catch{}

const assets={};
const signals={};
const errors={};

for(const asset of ASSETS){
  try{
    const rows=
      asset.src==="yahoo"
        ?await yahoo(asset.code)
        :await coingecko(asset.code);

    assets[asset.id]=rows;

    if(SIGNAL_ASSETS.has(asset.id)){
      signals[asset.id]=tier(rows);
    }

    console.log(
      `OK ${asset.id}: ${rows.length} rows, latest close ${rows.at(-1).c} on ${rows.at(-1).d}`
    );
  }catch(error){
    errors[asset.id]=String(
      error.message||error
    );

    console.log(
      `FAIL ${asset.id}: ${errors[asset.id]}`
    );
  }
}

if(Object.keys(assets).length<8){
  const summary=
    Object.entries(errors)
      .map(([id,message])=>
        `${id}: ${message}`
      )
      .join(" | ");

  console.log(
    `::error::Only ${Object.keys(assets).length}/${ASSETS.length} assets updated, refusing to publish. ${summary}`
  );

  throw new Error(
    `Only ${Object.keys(assets).length} assets updated; refusing to publish incomplete data.`
  );
}

await fs.mkdir(
  "dist/data",
  {recursive:true}
);

const generatedAt=
  new Date().toISOString();

await fs.writeFile(
  "dist/data/market-history.json",
  JSON.stringify({
    generatedAt,
    assets,
    errors
  })
);

await fs.writeFile(
  "dist/data/signals.json",
  JSON.stringify({
    generatedAt,
    signals,
    errors
  },null,2)
);

const rank={
  HOLD:0,
  "50% BUY":1,
  "100% BUY":2
};

const newlyActive=
  Object.entries(signals)
    .filter(([id,signal])=>
      rank[signal.level]>
      rank[
        previous.signals?.[id]?.level||
        "HOLD"
      ]
    );

if(
  newlyActive.length&&
  process.env.TELEGRAM_BOT_TOKEN&&
  process.env.TELEGRAM_CHAT_ID
){
  const message=[
    "Gold Signal Simulator",
    ...newlyActive.map(
      ([id,signal])=>
        `${id}: ${signal.level} · ${signal.run} red days · ${signal.drop}% · $${signal.price}`
    )
  ].join("\n");

  const response=await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method:"POST",
      headers:{
        "content-type":"application/json"
      },
      body:JSON.stringify({
        chat_id:
          process.env.TELEGRAM_CHAT_ID,
        text:message
      })
    }
  );

  if(!response.ok){
    throw new Error(
      `Telegram notification failed: ${response.status}`
    );
  }
}

console.log(
  `Updated ${Object.keys(assets).length} assets; ${Object.keys(errors).length} errors; ${newlyActive.length} new alerts.`
);
