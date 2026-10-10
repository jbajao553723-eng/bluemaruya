const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { mkdtempSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
process.env.ACCOUNT_STORE_DIR = mkdtempSync(join(tmpdir(), 'blue-maruya-preferences-test-'));
delete process.env.VERCEL;
process.env.AUTH_SESSION_SECRET = randomBytes(32).toString('hex');
process.env.TMDB_BEARER_TOKEN = 'test-only-mocked-upstream';
const { createSession } = require('../lib/session');
const picks = require('../dist/preferences');
let detailCalls = [];
global.fetch = async input => {
  const url = new URL(input);
  let data;
  if (url.pathname.endsWith('/images')) data = {logos:url.pathname.includes('/808/')?[{file_path:'/other.png',iso_639_1:'fr',aspect_ratio:3,vote_average:10},{file_path:'/english.png',iso_639_1:'en',aspect_ratio:3,vote_average:8},{file_path:'/neutral.png',iso_639_1:null,aspect_ratio:4,vote_average:9}]:[]};
  else if (url.pathname.includes('/genre/')) data = { genres: [{ id: 16, name: 'Animation' }] };
  else if (/\/movie\/\d+$/.test(url.pathname)) {
    const id = Number(url.pathname.split('/').pop());
    detailCalls.push(id);
    if (id === 10674) throw new Error('Simulated preference-only upstream outage');
    const pick = picks.find(item => item.id === id);
    data = { id, title: pick.title, release_date: `${pick.year}-01-01`, runtime: 90, genres: [{name:'Animation'}], poster_path: '/test-poster.jpg', backdrop_path: '/test-backdrop.jpg', overview: 'Live metadata from the mock TMDB response.' };
  } else data = { results: [{id:808, media_type:'movie', title:'Shrek', release_date:'2001-01-01', genre_ids:[16], poster_path:'/test.jpg', backdrop_path:'/test.jpg'}] };
  return { ok: true, json: async () => data };
};
const handler = require('../api/tmdb');
async function home(username,query={mode:'home'}) {
  const req = {method:'GET',query,headers:{cookie:username?`blue_maruya_session=${createSession(username, 0)}`:''}};
  const res = {headers:{},setHeader(name,value){this.headers[name]=value;},end(value){this.body=JSON.parse(value);}};
  await handler(req,res);
  return res;
}
(async () => {
  assert.equal((await home()).statusCode,401);
  assert.equal((await home(null,{mode:'artwork',id:808,type:'movie'})).statusCode,401);
  assert.equal((await home('wakengwapo',{mode:'artwork',id:808,type:'movie'})).body.logo,'https://image.tmdb.org/t/p/w500/english.png');
  assert.equal((await home('kdumangas',{mode:'artwork',id:10674,type:'movie'})).body.logo,'');
  assert.equal((await home('wakengwapo',{mode:'artwork',id:'-1',type:'movie'})).statusCode,400);
  assert.equal((await home('wakengwapo',{mode:'artwork',id:'1.5',type:'tv'})).statusCode,400);
  const waken = await home('wakengwapo');
  assert.equal(waken.statusCode,200);
  assert.equal(waken.body.preferences,undefined);
  assert.equal(detailCalls.length,0,'Waken should not fetch Kristine’s preference metadata');
  const kristine = await home('kdumangas');
  assert.equal(kristine.statusCode,200);
  assert.equal(kristine.headers['Cache-Control'],'private, no-store');
  assert.deepEqual(kristine.body.preferences.map(item=>item.id),[808,38757,10020,10674,24428]);
  assert.equal(kristine.body.preferences[1].preferenceLabel,'Rapunzel');
  assert.equal(kristine.body.preferences[0].description,'Live metadata from the mock TMDB response.');
  assert.equal(kristine.body.preferences[3].image,'preference-mulan.jpg','A failed individual title keeps its bundled fallback');
  assert.ok(kristine.body.movies.length && kristine.body.trending.length,'Preference outages must not break the home catalog');
  assert.equal((await home('wakengwapo')).body.preferences,undefined,'Switching accounts must not reuse personalized data');
  for(const pick of picks) assert.ok(existsSync(join(__dirname,'../dist/assets',pick.image)),`Missing fallback poster for ${pick.title}`);
  assert.ok(existsSync(join(__dirname,'../dist/assets/preference-tangled-backdrop.jpg')));
  console.log('PASS preferences: authentication, account isolation, five exact movie IDs, live metadata, individual-title fallback, and bundled artwork.');
})().catch(error=>{console.error(error);process.exitCode=1;});
