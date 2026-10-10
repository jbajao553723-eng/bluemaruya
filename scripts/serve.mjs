import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
const require=createRequire(import.meta.url);
process.env.AUTH_SESSION_SECRET ||= randomBytes(32).toString('hex');
process.env.ACCOUNT_STORE_DIR ||= resolve('.local-members');
const auth=require('../api/auth.js');
const tmdb=require('../api/tmdb.js');
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const name=decodeURIComponent(url.pathname);
    if(name==='/api/auth'||name==='/api/tmdb'){
      req.query=Object.fromEntries(url.searchParams);
      if(['POST','PATCH'].includes(req.method)){
        let body='';for await(const chunk of req){body+=chunk;if(body.length>2048){res.writeHead(413);res.end();return;}}
        req.body=body;
      }
      return await(name==='/api/auth'?auth:tmdb)(req,res);
    }
    const file=resolve(root,`.${name==='/'?'/index.html':name}`);
    if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('blue maruya preview: http://127.0.0.1:'+(process.env.PORT||4173)));
