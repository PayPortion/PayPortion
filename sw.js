/* Offline support.
   Pages: try the internet first (so an update shows on the very next open), and fall back to the saved
   copy after 3 seconds or when offline. Icons and other files: serve the saved copy right away and
   refresh it in the background. */
const C="zb-v5",F=["./","index.html","privacy.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const q=e.request;
  if(q.method!=="GET"||new URL(q.url).origin!==location.origin)return;
  // Save pages under their address without ?query, so a link like ./?source=pwa can't keep an old copy alive.
  const u=new URL(q.url);u.search="";const key=q.mode==="navigate"?u.href:q;
  const net=fetch(q,{cache:"no-cache"}).then(async res=>{if(res.ok)await (await caches.open(C)).put(key,res.clone());return res});
  e.waitUntil(net.catch(()=>{}));
  const saved=()=>caches.match(key,{ignoreSearch:true});
  if(q.mode==="navigate"){
    const timeout=new Promise(r=>setTimeout(r,3000)).then(saved);
    e.respondWith(Promise.race([net.catch(saved),timeout]).then(r=>r||saved()).then(r=>r||net));
  }else e.respondWith(saved().then(r=>r||net));
});
