const CACHE="goldalert-shell-v6";
const SHELL=["./","index.html","methodology.html","about.html","contact.html","privacy.html","terms.html",
  "articles.html","articles/read-gold-buy-signal.html","articles/gold-stocks-etfs-crypto.html",
  "static-page.css","market-tools.css","market-hub.js","gold-calculator.js","enhancements.js","manifest.webmanifest",
  "icons/logo.svg","icons/icon-192.png","embed/index.html","widget/index.html",
  "market/index.html","tools/gold-calculator/index.html"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET"||url.origin!==location.origin||url.pathname.startsWith("/admin/")) return;

  // Prefer fresh HTML so an old service worker cannot pin visitors to an old
  // release. Offline navigation falls back to a cached page, then the shell.
  if(event.request.mode==="navigate"||event.request.destination==="document"){
    event.respondWith(
      fetch(event.request).then(response=>{
        if(response.ok) caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
        return response;
      }).catch(async()=>await caches.match(event.request)||await caches.match("./"))
    );
    return;
  }

  // Static assets use stale-while-revalidate; errors are never cached.
  event.respondWith(caches.match(event.request).then(cached=>{
    const fresh=fetch(event.request).then(response=>{
      if(response.ok) caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
      return response;
    }).catch(()=>cached);
    return cached||fresh;
  }));
});
