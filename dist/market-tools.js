const MARKET_DATA_URL="/data/market-history.json";

const ASSET_META={
  OIL:{
    name:"WTI Crude Oil",
    unit:"USD per barrel",
    dec:2,
    path:"/commodities/oil/",
    summary:"A global energy benchmark watched for inflation and growth signals."
  },
  COPPER:{
    name:"Copper",
    unit:"USD per pound",
    dec:4,
    path:"/commodities/copper/",
    summary:"An industrial-demand barometer often called Dr. Copper."
  },
  PL:{
    name:"Platinum",
    unit:"USD per troy ounce",
    dec:2,
    path:"/commodities/platinum/",
    summary:"A precious and industrial metal with major uses in catalytic converters and fuel cells."
  },
  NATGAS:{
    name:"Natural Gas",
    unit:"USD per MMBtu",
    dec:3,
    path:"/commodities/natural-gas/",
    summary:"A weather- and storage-sensitive energy market."
  },
  XAUUSD:{
    name:"Gold",
    unit:"USD per troy ounce",
    dec:2,
    path:"/",
    summary:"The core precious-metal benchmark for GoldAlert."
  },
  XAGUSD:{
    name:"Silver",
    unit:"USD per troy ounce",
    dec:3,
    path:"/",
    summary:"A precious and industrial metal with higher volatility than gold."
  },
  BTC:{
    name:"Bitcoin",
    unit:"USD",
    dec:2,
    path:"/ratios/bitcoin-gold/",
    summary:"Used here only as a macro comparison with gold."
  },
  PL:{
    name:"Platinum",
    unit:"USD per troy ounce",
    dec:2,
    path:"/commodities/platinum/",
    summary:"A precious and industrial metal with major uses in catalytic converters and fuel cells."
  },
  CL:{
    name:"WTI Crude Oil",
    unit:"USD per barrel",
    dec:2,
    path:"/commodities/oil/",
    summary:"A global energy benchmark watched for inflation and growth signals."
  },
  ETH:{
    name:"Ethereum",
    unit:"USD",
    dec:2,
    path:"/ratios/bitcoin-gold/",
    summary:"Second-largest cryptocurrency by market cap."
  }
};

const RATIO_META={
  "gold-silver":{
    name:"Gold/Silver Ratio",
    a:"XAUUSD",
    b:"XAGUSD",
    dec:2,
    path:"/ratios/gold-silver/",
    unit:"ounces of silver per ounce of gold",
    formula:"Gold close ÷ Silver close",
    summary:"Shows how many ounces of silver equal one ounce of gold."
  },
  "bitcoin-gold":{
    name:"Bitcoin/Gold Ratio",
    a:"BTC",
    b:"XAUUSD",
    dec:3,
    path:"/ratios/bitcoin-gold/",
    unit:"ounces of gold per bitcoin",
    formula:"Bitcoin close ÷ Gold close",
    summary:"Compares Bitcoin's USD value with one troy ounce of gold."
  },
  "gold-copper":{
    name:"Gold/Copper Ratio",
    a:"XAUUSD",
    b:"COPPER",
    dec:1,
    path:"/ratios/gold-copper/",
    unit:"ratio points",
    formula:"Gold close ÷ Copper close",
    summary:"A simple defensive-versus-industrial market relationship."
  },
  "gold-platinum":{
    name:"Gold/Platinum Ratio",
    a:"XAUUSD",
    b:"PL",
    dec:3,
    path:"/ratios/gold-platinum/",
    unit:"ratio (gold ÷ platinum)",
    formula:"Gold close ÷ Platinum close",
    summary:"Above 1 means gold is more expensive than platinum — historically unusual."
  },
  "gold-oil":{
    name:"Gold/Oil Ratio",
    a:"XAUUSD",
    b:"CL",
    dec:1,
    path:"/ratios/gold-oil/",
    unit:"barrels of oil per ounce of gold",
    formula:"Gold close ÷ WTI crude close",
    summary:"How many barrels of oil one ounce of gold can buy. A classic macro signal."
  },
  "gold-bitcoin":{
    name:"Gold/Bitcoin Ratio",
    a:"XAUUSD",
    b:"BTC",
    dec:6,
    path:"/ratios/bitcoin-gold/",
    unit:"fraction of Bitcoin per ounce of gold",
    formula:"Gold close ÷ Bitcoin close",
    summary:"How much of one Bitcoin an ounce of gold is worth."
  }
};

const money=(number,decimals=2)=>
  Number(number).toLocaleString(
    "en-US",
    {
      minimumFractionDigits:decimals,
      maximumFractionDigits:decimals
    }
  );

const pct=number=>
  `${number>=0?"+":""}${number.toFixed(2)}%`;

const change=(rows,back=1)=>
  rows.length>back
    ?(rows.at(-1).c/rows.at(-1-back).c-1)*100
    :null;

const aligned=(first,second)=>{
  const secondMap=
    new Map(
      second.map(row=>[row.d,row.c])
    );

  return first
    .filter(row=>secondMap.has(row.d))
    .map(row=>({
      d:row.d,
      c:row.c/secondMap.get(row.d)
    }));
};

function stats(rows){
  const year=rows.slice(-252);
  const last=rows.at(-1).c;

  return {
    last,
    date:rows.at(-1).d,
    day:change(rows,1),
    month:change(rows,22),
    year:change(rows,252),
    high:Math.max(...year.map(row=>row.c)),
    low:Math.min(...year.map(row=>row.c))
  };
}

function lineSvg(rows){
  const data=rows.slice(-180);
  const width=900;
  const height=300;
  const padding=24;

  const values=
    data.map(row=>row.c);

  const minimum=Math.min(...values);
  const maximum=Math.max(...values);
  const span=maximum-minimum||1;

  const points=data
    .map((row,index)=>{
      const x=
        padding+
        (width-padding*2)*
        index/
        Math.max(1,data.length-1);

      const y=
        padding+
        (height-padding*2)*
        (maximum-row.c)/
        span;

      return `${x},${y}`;
    })
    .join(" ");

  return `
    <svg
      class="chart"
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="Six-month daily-close trend"
    >
      <defs>
        <linearGradient
          id="fill"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0"
            stop-color="#d9a441"
            stop-opacity=".28"
          />
          <stop
            offset="1"
            stop-color="#d9a441"
            stop-opacity="0"
          />
        </linearGradient>
      </defs>

      <polygon
        points="${padding},${height-padding} ${points} ${width-padding},${height-padding}"
        fill="url(#fill)"
      />

      <polyline
        points="${points}"
        fill="none"
        stroke="#d9a441"
        stroke-width="3"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `;
}

function statBox(label,value,className=""){
  return `
    <div class="stat">
      <b class="${className}">${value}</b>
      <span>${label}</span>
    </div>
  `;
}

function assetCard(id,rows){
  const meta=ASSET_META[id];

  if(!meta){
    return "";
  }

  if(!rows?.length){
    return `
      <a class="card" href="${meta.path}">
        <h2>${meta.name}</h2>
        <p class="meta">
          Daily data temporarily unavailable
        </p>
        <p>${meta.summary}</p>
      </a>
    `;
  }

  const result=stats(rows);
  const daily=result.day??0;

  return `
    <a class="card" href="${meta.path}">
      <h2>${meta.name}</h2>

      <div class="price">
        $${money(result.last,meta.dec)}
      </div>

      <div class="${daily>=0?"up":"down"}">
        ${pct(daily)} daily
      </div>

      <p>${meta.summary}</p>

      <span class="meta">
        ${meta.unit} · close ${result.date}
      </span>
    </a>
  `;
}

function ratioRows(key,data){
  const meta=RATIO_META[key];

  return data[meta.a]&&data[meta.b]
    ?aligned(data[meta.a],data[meta.b])
    :[];
}

function ratioCard(key,data){
  const meta=RATIO_META[key];
  const rows=ratioRows(key,data);

  if(!rows.length){
    return `
      <a class="card" href="${meta.path}">
        <h2>${meta.name}</h2>
        <p class="meta">
          Aligned data temporarily unavailable
        </p>
        <p>${meta.summary}</p>
      </a>
    `;
  }

  const result=stats(rows);
  const daily=result.day??0;

  return `
    <a class="card" href="${meta.path}">
      <h2>${meta.name}</h2>

      <div class="price">
        ${money(result.last,meta.dec)}
      </div>

      <div class="${daily>=0?"up":"down"}">
        ${pct(daily)} daily
      </div>

      <p>${meta.summary}</p>

      <span class="meta">
        ${meta.unit} · ${result.date}
      </span>
    </a>
  `;
}

function renderAssetPage(id,data){
  const meta=ASSET_META[id];
  const rows=data[id];

  const host=
    document.querySelector(
      "[data-asset-page]"
    );

  if(!host){
    return;
  }

  if(!rows?.length){
    host.innerHTML=`
      <div class="status">
        Daily data is temporarily unavailable.
        Please try again after the next scheduled update.
      </div>
    `;

    return;
  }

  const result=stats(rows);
  const daily=result.day??0;

  host.innerHTML=`
    <div class="stats">
      ${statBox(
        "Latest daily close",
        "$"+money(result.last,meta.dec)
      )}

      ${statBox(
        "1-day change",
        pct(daily),
        daily>=0?"up":"down"
      )}

      ${statBox(
        "30-day change",
        result.month==null
          ?"—"
          :pct(result.month),
        result.month>=0
          ?"up"
          :"down"
      )}

      ${statBox(
        "52-week range",
        "$"+
        money(result.low,meta.dec)+
        " – $"+
        money(result.high,meta.dec)
      )}
    </div>

    <div class="panel">
      <h2>Six-month daily-close trend</h2>

      ${lineSvg(rows)}

      <div class="legend">
        <span>${rows.slice(-180)[0].d}</span>
        <span>${result.date}</span>
      </div>
    </div>

    <p class="status">
      Last dataset update:
      <time>
               ${window.__generatedAt||result.date}
      </time>.
      ${meta.unit}.
      Daily closes may differ from intraday quotes.
    </p>
  `;
}

function renderRatioPage(key,data){
  const meta=RATIO_META[key];
  const rows=ratioRows(key,data);

  const host=
    document.querySelector(
      "[data-ratio-page]"
    );

  if(!host){
    return;
  }

  if(!rows.length){
    host.innerHTML=`
                                           Daily data is temporarily unavailable.
        Please try again after the next scheduled update.
      </div>
    `;

    return;
  }

  const result=stats(rows);
  const daily=result.day??0;

  host.innerHTML=`
    <div class="stats">
      ${statBox(
        "Latest ratio",
        money(result.last,meta.dec)
      )}

      ${statBox(
        "1-day change",
        pct(daily),
        daily>=0?"up":"down"
      )}

      ${statBox(
        "30-day change",
        result.month==null
          ?"—"
          :pct(result.month),
        result.month>=0
          ?"up"
          :"down"
      )}

      ${statBox(
        "52-week range",
        money(result.low,meta.dec)+
        " – "+
        money(result.high,meta.dec)
      )}
    </div>

    <div class="panel">
      <h2>Six-month ratio trend</h2>

      ${lineSvg(rows)}

      <div class="legend">
        <span>${rows.slice(-180)[0].d}</span>
        <span>${result.date}</span>
      </div>
    </div>

    <div class="panel method">
      <div>
        <h2>Formula</h2>
        <div class="formula">
          ${meta.formula}
        </div>
      </div>

      <div>
        <h2>How to read it</h2>
        <p>
          ${meta.summary}
          A rising line means the numerator
          strengthened relative to the denominator;
          a falling line means the opposite.
        </p>
      </div>
    </div>

    <div class="panel">
      <h2>
        Looking for physical gold or silver?
      </h2>

      <p>
        Compare available bullion products from
        an approved GoldAlert partner.
      </p>

      <a
        class="cta"
        href="https://www.sprottmoney.ca/?acc=rudy-rudiawan-6bc8d"
        target="_blank"
        rel="noopener sponsored"
      >
        Browse Sprott Money →
      </a>

      <p class="note">
        Affiliate disclosure: GoldAlert may earn
        a commission from a qualifying purchase,
        at no additional cost to you.
      </p>
    </div>

    <p class="status">
      Calculated from aligned daily closes.
      Latest common date: ${result.date}.
      Ratios are educational observations,
      not trading signals.
    </p>
  `;
}

async function boot(){
  const status=
    document.querySelector(
      "#data-status"
    );

  try{
    const response=await fetch(
      MARKET_DATA_URL,
      {cache:"no-store"}
    );

    if(!response.ok){
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const payload=
      await response.json();

    const data=
      payload.assets||{};

    window.__generatedAt=
      payload.generatedAt||"unknown";

    const assetHub=
      document.querySelector(
        "[data-assets]"
      );

    if(assetHub){
      assetHub.innerHTML=
        assetHub.dataset.assets
          .split(",")
          .map(id=>
            assetCard(
              id.trim(),
              data[id.trim()]
            )
          )
          .join("");
    }

    const ratioHub=
      document.querySelector(
        "[data-ratios]"
      );

    if(ratioHub){
      ratioHub.innerHTML=
        ratioHub.dataset.ratios
          .split(",")
          .map(key=>
            ratioCard(
              key.trim(),
              data
            )
          )
          .join("");
    }

    const assetPage=
      document.querySelector(
        "[data-asset-page]"
      );

    if(assetPage){
      renderAssetPage(
        assetPage.dataset.assetPage,
        data
      );
    }

    const ratioPage=
      document.querySelector(
        "[data-ratio-page]"
      );

    if(ratioPage){
      renderRatioPage(
        ratioPage.dataset.ratioPage,
        data
      );
    }

    if(status){
      status.textContent=
        `Daily dataset updated ${payload.generatedAt||"recently"}`;
    }
  }catch(error){
    console.error(error);

    if(status){
      status.textContent=
        "Market data is temporarily unavailable; the explanatory content remains available.";
    }
  }
}

boot();
