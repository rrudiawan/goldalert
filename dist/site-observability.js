(function(){
  "use strict";
  const measurementId="G-2JKWMB077G";
  let consent=null;
  try{ consent=JSON.parse(localStorage.getItem("cookie.consent")); }catch(_err){}
  if(consent!=="accepted"||window.__goldAlertAnalyticsLoaded) return;
  window.__goldAlertAnalyticsLoaded=true;
  const script=document.createElement("script");
  script.async=true;
  script.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(measurementId);
  document.head.appendChild(script);
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  window.gtag("js",new Date());
  window.gtag("config",measurementId,{anonymize_ip:true});
})();
