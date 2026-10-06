const VERSION='ledger-v1';
const FONTS='ledger-fonts';
const FONT_CSS="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Public+Sans:wght@400;500;600;700&display=swap";
const PRECACHE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(VERSION);
    await c.addAll(PRECACHE);
    try{const f=await caches.open(FONTS);await f.put(FONT_CSS,await fetch(new Request(FONT_CSS,{mode:'no-cors'})));}catch(_){}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()){if(k.startsWith('ledger-')&&k!==VERSION&&k!==FONTS)await caches.delete(k);}
    await self.clients.claim();
  })());
});
function timeout(ms){return new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms));}
async function navHandler(req){
  const c=await caches.open(VERSION);
  try{
    const res=await Promise.race([fetch(req),timeout(3000)]);
    if(res&&res.ok){c.put('./index.html',res.clone()).catch(()=>{});}
    return res;
  }catch(_){
    return (await c.match('./index.html'))||(await c.match('./'))||Response.error();
  }
}
async function cacheFirst(req){
  const c=await caches.open(VERSION);
  const hit=await c.match(req);
  if(hit)return hit;
  const res=await fetch(req);
  if(res&&res.ok&&res.type==='basic')c.put(req,res.clone()).catch(()=>{});
  return res;
}
async function swr(req){
  const c=await caches.open(FONTS);
  const hit=await c.match(req);
  const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone()).catch(()=>{});return res;}).catch(()=>null);
  if(hit){net.catch(()=>{});return hit;}
  return (await net)||Response.error();
}
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){e.respondWith(swr(req));return;}
  if(u.origin!==self.location.origin)return;
  if(req.mode==='navigate'){e.respondWith(navHandler(req));return;}
  e.respondWith(cacheFirst(req));
});
