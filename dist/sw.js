const CACHE="goldalert-shell-v3";
const SHELL=["./","index.html","methodology.html","about.html","contact.html","privacy.html","terms.html",
  "articles.html","articles/read-gold-buy-signal.html","articles/gold-stocks-etfs-crypto.html",
  "static-page.css","manifest.webmanifest","icons/logo.svg","icons/icon-192.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET"||new URL(event.request.url).origin!==location.origin) return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});
