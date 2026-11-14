const assert = require('node:assert/strict');
const {mkdtempSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
process.env.ACCOUNT_STORE_DIR = mkdtempSync(join(tmpdir(),'blue-maruya-discovery-'));
delete process.env.VERCEL;
process.env.AUTH_SESSION_SECRET = 'isolated-discovery-test';
process.env.TMDB_BEARER_TOKEN = 'mock-upstream-only';
const {createSession} = require('../lib/session');
const calls=[];
global.fetch=async input=>{
  const url=new URL(input);calls.push(url);
  let data;
  if(url.pathname.includes('/genre/'))data={genres:[{id:28,name:'Action'},{id:10762,name:'Kids'},{id:10770,name:'TV Movie'}]};
  else if(url.pathname.endsWith('/person/popular')||url.pathname.endsWith('/search/person'))data={page:2,total_pages:501,results:[{id:1,name:'Test Actor',known_for_department:'Acting',profile_path:'/actor.jpg',known_for:[{title:'Test Movie'}]},{id:2,name:'Adult',adult:true},{id:3,name:'Director',known_for_department:'Directing'}]};
  else if(url.pathname.endsWith('/person/1'))data={id:1,name:'Test Actor',biography:'A test biography.',combined_credits:{cast:[{id:10,media_type:'movie',title:'A movie',genre_ids:[28],popularity:10},{id:10,media_type:'movie',title:'A movie',genre_ids:[28],popularity:9},{id:10,media_type:'tv',name:'A series',genre_ids:[10762],popularity:8},{id:11,media_type:'movie',title:'Excluded',adult:true}]}};
  else if(url.pathname.endsWith('/movie/10'))data={id:10,title:'A movie',credits:{cast:[{id:1,name:'Test Actor',character:'A role'}]}};
  else if(url.pathname.endsWith('/tv/10'))data={id:10,name:'A series',aggregate_credits:{cast:[{id:1,name:'Test Actor',roles:[{character:'A series role'}]}]}};
  else data={page:1,total_pages:1,results:[]};
  return {ok:true,json:async()=>data};
};
const handler=require('../api/tmdb');
async function call(query,authenticated=true){const req={method:'GET',query,headers:{cookie:authenticated?'blue_maruya_session='+createSession('guest',0):''}};const res={headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=JSON.parse(v)}};await handler(req,res);return res;}
(async()=>{
  for(const mode of ['people','person','genres'])assert.equal((await call({mode,id:1},false)).statusCode,401);
  const people=await call({mode:'people',query:'Test Actor',page:2});
  assert.equal(people.statusCode,200);assert.equal(people.body.results.length,1);assert.equal(people.body.results[0].knownFor,'Test Movie');assert.equal(people.body.totalPages,500);
  const search=calls.find(url=>url.pathname.endsWith('/search/person'));assert.equal(search.searchParams.get('include_adult'),'false');assert.equal(search.searchParams.get('query'),'Test Actor');
  for(const id of ['0','-1','1.5','1x','NaN'])assert.equal((await call({mode:'person',id})).statusCode,400);
  const person=await call({mode:'person',id:1});assert.equal(person.body.results.length,2);assert.deepEqual(person.body.results.map(title=>title.type),['movie','tv']);assert.equal(person.headers['Cache-Control'],'private, no-store');
  assert.equal((await call({mode:'details',id:10,type:'movie'})).body.result.cast[0].character,'A role');
  assert.equal((await call({mode:'details',id:10,type:'tv'})).body.result.cast[0].character,'A series role');
  await call({mode:'discover',genre:'Kids',type:'tv'});assert.equal(calls.at(-1).searchParams.get('with_genres'),'10762');
  await call({mode:'discover',genre:'TV Movie',type:'movie'});assert.equal(calls.at(-1).searchParams.get('with_genres'),'10770');
  console.log('PASS discovery: private endpoints, actor search, pagination, ID validation, cast, deduplicated filmography and added genres.');
})().catch(error=>{console.error(error);process.exitCode=1});
