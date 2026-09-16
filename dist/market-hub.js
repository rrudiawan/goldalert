"use strict";

const theme=()=>document.documentElement.dataset.theme==="light"?"light":"dark";

function mountWidget(host){
  const kind=host.dataset.widget;
  const symbol=host.dataset.symbol;
  const label=host.dataset.label||"Market data";
  const configs={
    quote:{file:"single-quote",height:"126px",config:{symbol,width:"100%",isTransparent:true,colorTheme:theme(),locale:"en"}},
    technical:{file:"technical-analysis",height:"450px",config:{interval:"1D",width:"100%",height:"100%",isTransparent:true,symbol,showIntervalTabs:true,displayMode:"single",locale:"en",colorTheme:theme()}},
    calendar:{file:"events",height:"540px",config:{width:"100%",height:"100%",colorTheme:theme(),isTransparent:true,locale:"en",importanceFilter:"-1,0,1",countryFilter:"us"}},
    news:{file:"timeline",height:"560px",config:{feedMode:"symbol",symbol,colorTheme:theme(),isTransparent:true,displayMode:"regular",width:"100%",height:"100%",locale:"en"}}
  };
  const item=configs[kind];
  if(!item) return;

  host.innerHTML="";
  host.style.minHeight=item.height;
  host.setAttribute("aria-label",label);
  const box=document.createElement("div");
  box.className="tradingview-widget-container";
  box.style.height=item.height;
  const inner=document.createElement("div");
  inner.className="tradingview-widget-container__widget";
  inner.style.height="calc(100% - 22px)";
  box.appendChild(inner);
  const credit=document.createElement("div");
  credit.className="tradingview-widget-copyright";
  credit.innerHTML='<a href="https://www.tradingview.com/?aff_id=170924" rel="noopener sponsored" target="_blank">Market data and tools by TradingView</a>';
  box.appendChild(credit);
  const script=document.createElement("script");
  script.type="text/javascript";
  script.src=`https://s3.tradingview.com/external-embedding/embed-widget-${item.file}.js`;
  script.async=true;
  script.textContent=JSON.stringify(item.config);
  box.appendChild(script);
  host.appendChild(box);
}

const widgets=[...document.querySelectorAll("[data-widget]")];
if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        mountWidget(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },{rootMargin:"300px"});
  widgets.forEach(widget=>observer.observe(widget));
}else{
  widgets.forEach(mountWidget);
}