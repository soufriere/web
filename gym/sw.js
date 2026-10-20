const VERSION='vtaper-v3';
const PRECACHE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('vtaper-')&&k!==VERSION)await caches.delete(k);await self.clients.claim()})())});
const timeout=ms=>new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const u=new URL(req.url);if(u.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    // network-first so updates arrive; cached copy when offline (e.g. gym basement)
    e.respondWith((async()=>{const c=await caches.open(VERSION);
      try{const res=await Promise.race([fetch(req,{cache:'no-store'}),timeout(5000)]);if(res&&res.ok)c.put('./index.html',res.clone()).catch(()=>{});return res}
      catch(_){return (await c.match('./index.html'))||(await c.match('./'))||Response.error()}})());
    return}
  e.respondWith(caches.match(req).then(h=>h||fetch(req)));
});
