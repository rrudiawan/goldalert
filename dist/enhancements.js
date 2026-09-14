"use strict";

const TROY_OUNCE_GRAMS=31.1034768;
const SIGNAL_UNIVERSE=["XAUUSD","XAGUSD","AU","KGC","HMY","GFI","GDX","GLD","SLV","PAXG","XAUT"];

function unitMoney(usdValue){
  const value=convert(usdValue);
  const decimals=CURR_DEC[currCode]===0?0:2;
  return `${CURR_SYM[currCode]||currCode+" "}${fmt(value,decimals)}`;
}

function renderUnitPrices(){
  const host=$("unitPrices");
  const gold=slice("XAUUSD"),silver=slice("XAGUSD");
  if(!host||!gold||!silver) return;
  const card=(name,usdPerOunce)=>{
    const perGram=usdPerOunce/TROY_OUNCE_GRAMS;
    const perKilogram=perGram*1000;
    return `<div class="unit-price"><span>${name} · per gram</span><b>${unitMoney(perGram)}</b></div><div class="unit-price"><span>${name} · per kilogram</span><b>${unitMoney(perKilogram)}</b></div>`;
  };
  host.innerHTML=card(aName(byId("XAUUSD")),gold.at(-1).c)+card(aName(byId("XAGUSD")),silver.at(-1).c);
}

function renderSentiment(){
  const available=SIGNAL_UNIVERSE.map(id=>slice(id)).filter(Boolean);
  if(!available.length) return;
  const tiers=available.map(rows=>liveTier(rows,opts()));
  const score=Math.round(tiers.reduce((sum,tier)=>sum+tier.score,0)/tiers.length);
  const watch=tiers.filter(tier=>tier.key==="watch").length;
  const strong=tiers.filter(tier=>tier.key==="strong").length;
  const label=score>=80?"Extreme pullback":score>=60?"Fearful":score>=40?"Stressed":score>=20?"Cautious":"Calm";
  $("sentimentScore").textContent=String(score);
  $("sentimentFill").style.width=`${score}%`;
  $("sentimentLabel").textContent=label;
  $("sentimentDetail").textContent=`${available.length} tracked gold-related assets · ${watch} WATCH · ${strong} STRONG. A higher score means broader or deeper consecutive declines, not a forecast.`;
}

function latestCloseText(id){
  const rows=slice(id),asset=byId(id);
  if(!rows||!asset) return "";
  const latest=rows.at(-1);
  return `${aName(asset)}: ${fmtCurr(latest.c)} per troy ounce · daily close ${latest.d} · GoldAlert.org`;
}

async function copyText(text,statusId){
  const status=$(statusId);
  try{
    await navigator.clipboard.writeText(text);
    status.textContent="Copied";
  }catch(error){
    const area=document.createElement("textarea");
    area.value=text;area.style.position="fixed";area.style.opacity="0";
    document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();
    status.textContent="Copied";
  }
  setTimeout(()=>{status.textContent="";},1800);
}

function mountLiveQuotes(){
  tvEmbed("tvGoldQuote","single-quote",{symbol:"OANDA:XAUUSD",width:"100%",isTransparent:true,colorTheme:tvTheme(),locale:t("tvLocale")},"122px","Gold spot quote by TradingView","https://www.tradingview.com/symbols/XAUUSD/");
  tvEmbed("tvSilverQuote","single-quote",{symbol:"OANDA:XAGUSD",width:"100%",isTransparent:true,colorTheme:tvTheme(),locale:t("tvLocale")},"122px","Silver spot quote by TradingView","https://www.tradingview.com/symbols/XAGUSD/");
}

function renderEnhancements(){
  renderUnitPrices();
  renderSentiment();
}

let installPrompt=null;
function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
}
function setupInstallApp(){
  const button=$("installApp"),dialog=$("installHelp"),instructions=$("installInstructions");
  if(!button||isStandalone()) return;
  const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(isiOS){
    button.classList.add("show");
    button.textContent="Add to Home Screen";
    button.onclick=()=>{
      instructions.textContent="On iPhone or iPad: tap the Share button in Safari, choose 'Add to Home Screen', then tap Add.";
      dialog.showModal();
    };
  }
  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();installPrompt=event;button.classList.add("show");button.textContent="Install App";
    button.onclick=async()=>{button.disabled=true;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;button.disabled=false;button.classList.remove("show");};
  });
  window.addEventListener("appinstalled",()=>{button.classList.remove("show");installPrompt=null;});
}

$("copyGoldClose").addEventListener("click",()=>{const text=latestCloseText("XAUUSD");if(text) copyText(text,"copyGoldStatus");});
$("copySilverClose").addEventListener("click",()=>{const text=latestCloseText("XAGUSD");if(text) copyText(text,"copySilverStatus");});
$("currSel").addEventListener("change",()=>setTimeout(renderEnhancements,50));
document.querySelectorAll("[data-theme-choice]").forEach(button=>button.addEventListener("click",()=>setTimeout(mountLiveQuotes,50)));

const signalBoard=$("boardTable").tBodies[0];
let renderTimer;
new MutationObserver(()=>{
  clearTimeout(renderTimer);
  renderTimer=setTimeout(renderEnhancements,20);
}).observe(signalBoard,{childList:true});

mountLiveQuotes();
renderEnhancements();
setupInstallApp();
