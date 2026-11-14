const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const dist=path.join(__dirname,'../dist');const manifest=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest')));
assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');
for(const icon of manifest.icons){const buffer=fs.readFileSync(path.join(dist,icon.src));assert.equal(buffer.toString('hex',0,8),'89504e470d0a1a0a');const [w,h]=icon.sizes.split('x').map(Number);assert.equal(buffer.readUInt32BE(16),w);assert.equal(buffer.readUInt32BE(20),h);}
const listeners={};let intercepted=0;let networkFail=false;
vm.runInNewContext(fs.readFileSync(path.join(dist,'sw.js'),'utf8'),{URL,Response,self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>listeners[name]=fn},fetch:async()=>{if(networkFail)throw Error('Offline');return new Response('online')},caches:{match:async()=>new Response('offline fallback')}});
async function request(url,mode='navigate',method='GET'){let promise;listeners.fetch({request:{url,mode,method},respondWith:p=>{intercepted++;promise=p}});return promise?await(await promise).text():null;}
(async()=>{
  assert.equal(await request('https://example.test/api/auth'),null);
  assert.equal(await request('https://example.test/api/tmdb'),null);
  assert.equal(await request('https://example.test/','navigate','POST'),null);
  assert.equal(await request('https://third-party.test/player'),null);
  assert.equal(await request('https://example.test/assets/app-icon-192.png','cors'),null);
  assert.equal(intercepted,0);assert.equal(await request('https://example.test/'),'online');
  networkFail=true;assert.equal(await request('https://example.test/'),'offline fallback');
  console.log('PASS install: manifest and icon dimensions, network-first navigation, offline fallback, no API or third-party interception.');
})().catch(error=>{console.error(error);process.exitCode=1});
