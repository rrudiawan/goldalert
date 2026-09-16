"use strict";

const $=id=>document.getElementById(id);
const TROY_OUNCE_GRAMS=31.1034768;
const symbols={USD:"$",EUR:"€",GBP:"£",IDR:"Rp",INR:"₹",CNY:"¥",JPY:"¥",CHF:"CHF ",AUD:"A$"};
const decimals={USD:2,EUR:2,GBP:2,IDR:0,INR:2,CNY:2,JPY:0,CHF:2,AUD:2};
let observation="Manual input";

function number(value){
  const parsed=Number(value);
  return Number.isFinite(parsed)?parsed:0;
}

function formatMoney(value,currency){
  return `${symbols[currency]||currency+" "}${value.toLocaleString("en-US",{minimumFractionDigits:decimals[currency]??2,maximumFractionDigits:decimals[currency]??2})}`;
}

function purityValue(){
  return $("purity").value==="custom"?number($("customPurity").value)/1000:number($("purity").value);
}

function gramsValue(){
  const weight=Math.max(0,number($("weight").value));
  return $("weightUnit").value==="kg"?weight*1000:$("weightUnit").value==="oz"?weight*TROY_OUNCE_GRAMS:weight;
}

function calculate(){
  const grams=gramsValue();
  const fineness=Math.min(1,Math.max(0,purityValue()));
  const spot=Math.max(0,number($("spotPrice").value));
  const rate=Math.max(0,number($("exchangeRate").value));
  const premium=Math.max(-100,number($("premium").value));
  const currency=$("currency").value;
  const fineGold=grams*fineness;
  const metalUsd=spot/TROY_OUNCE_GRAMS*fineGold;
  const metalLocal=metalUsd*rate;
  const premiumLocal=metalLocal*premium/100;
  const total=metalLocal+premiumLocal;

  $("resultValue").textContent=formatMoney(total,currency);
  $("grossWeight").textContent=`${grams.toLocaleString("en-US",{maximumFractionDigits:4})} g`;
  $("fineGold").textContent=`${fineGold.toLocaleString("en-US",{maximumFractionDigits:4})} g (${(fineness*100).toFixed(2)}%)`;
  $("metalValue").textContent=formatMoney(metalLocal,currency);
  $("premiumValue").textContent=`${premium>=0?"+":""}${premium.toFixed(2)}% · ${formatMoney(premiumLocal,currency)}`;
  $("observationDate").textContent=observation;
}

async function loadLatestClose(){
  $("priceStatus").textContent="Loading GoldAlert's latest scheduled gold close…";
  try{
    const response=await fetch("/data/market-history.json",{cache:"no-store"});
    if(!response.ok) throw new Error("data unavailable");
    const data=await response.json();
    const rows=data.assets?.XAUUSD;
    const latest=rows?.at(-1);
    if(!latest) throw new Error("gold series unavailable");
    $("spotPrice").value=Number(latest.c).toFixed(2);
    observation=`GoldAlert daily close · ${latest.d}`;
    $("priceStatus").textContent=`Using GoldAlert's scheduled gold close for ${latest.d}. You can replace it with another price.`;
    calculate();
  }catch(error){
    observation="Manual input";
    $("priceStatus").textContent="The latest close could not be loaded. Enter a gold price per troy ounce manually.";
  }
}

async function loadFx(){
  const currency=$("currency").value;
  if(currency==="USD"){
    $("exchangeRate").value="1";
    $("fxStatus").textContent="USD uses an exchange rate of 1.";
    calculate();
    return;
  }
  $("exchangeRate").value="";
  calculate();
  $("fxStatus").textContent=`Loading the ${currency} reference rate…`;
  try{
    const response=await fetch("https://open.er-api.com/v6/latest/USD");
    if(!response.ok) throw new Error("FX unavailable");
    const data=await response.json();
    const rate=data.rates?.[currency];
    if(!rate) throw new Error("currency unavailable");
    $("exchangeRate").value=String(rate);
    $("fxStatus").textContent=`Reference rate loaded: 1 USD = ${rate.toLocaleString("en-US",{maximumFractionDigits:6})} ${currency}. You can edit it.`;
    calculate();
  }catch(error){
    $("fxStatus").textContent=`The ${currency} rate could not be loaded. Enter units of ${currency} per USD manually.`;
  }
}

$("calculatorForm").addEventListener("input",calculate);
$("spotPrice").addEventListener("input",()=>{
  observation="Manual input";
  $("priceStatus").textContent="Using the gold price entered manually.";
  calculate();
});
$("purity").addEventListener("change",()=>{
  $("customPurityWrap").hidden=$("purity").value!=="custom";
  calculate();
});
$("currency").addEventListener("change",loadFx);
$("refreshPrice").addEventListener("click",loadLatestClose);
$("refreshFx").addEventListener("click",loadFx);

loadLatestClose();