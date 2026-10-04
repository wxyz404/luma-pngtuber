import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { animationSchema, AvatarProfile, IDLE, OutputPacket } from '../src/shared/types';
import { ProfileStore } from './store';
const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.wasm':'application/wasm','.task':'application/octet-stream','.json':'application/json'};
export async function startOutputServer(dist:string,store:ProfileStore,token:string,studioToken:string,profile:AvatarProfile,preferredPort=18743){
  let packet:OutputPacket={profile,state:{...IDLE}};
  const staticFiles=new Map<string,string>();
  async function walk(dir:string,prefix=''){for(const e of await fs.readdir(dir,{withFileTypes:true})){const rel=prefix+'/'+e.name;if(e.isDirectory())await walk(path.join(dir,e.name),rel);else staticFiles.set(rel,path.join(dir,e.name));}}
  await walk(dist);
  const server=http.createServer(async(req,res)=>{try{
    if(req.method!=='GET'){res.writeHead(405);res.end();return;}
    const address=server.address();if(typeof address!=='object'||!address||req.headers.host!==`127.0.0.1:${address.port}`){res.writeHead(403);res.end();return;}
    const u=new URL(req.url||'/',`http://${req.headers.host}`);let file:string|undefined;
    if(u.pathname==='/overlay.html'){if(u.searchParams.get('token')!==token)throw new Error('Forbidden');file=staticFiles.get('/overlay.html');}
    else if(u.pathname==='/index.html'){if(u.searchParams.get('studio')!==studioToken)throw new Error('Forbidden');file=staticFiles.get('/index.html');}
    else if(u.pathname.startsWith('/avatar/')){if(u.searchParams.get('token')!==token)throw new Error('Forbidden');const ref=u.pathname.slice(8);const allowed=new Set([...Object.values(packet.profile.poses),...packet.profile.layers.flatMap(l=>[l.asset,...Object.values(l.variants)])]);if(!allowed.has(ref)){res.writeHead(404);res.end();return;}file=store.assetPath(ref);}
    else if(u.pathname.startsWith('/assets/')||u.pathname.startsWith('/models/'))file=staticFiles.get(u.pathname);
    if(!file){res.writeHead(404);res.end();return;}
    const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:*; object-src 'none'; frame-ancestors 'none'"});res.end(body);
  }catch(e){res.writeHead(e instanceof Error&&e.message==='Forbidden'?403:404);res.end();}});
  const wss=new WebSocketServer({noServer:true,maxPayload:1024});
  server.on('upgrade',(req,socket,head)=>{try{const u=new URL(req.url||'/',`http://${req.headers.host}`);const origin=req.headers.origin;const address=server.address();const expected=typeof address==='object'&&address?`http://127.0.0.1:${address.port}`:'';if(u.pathname!=='/stream'||u.searchParams.get('token')!==token||req.headers.host!==expected.slice(7)||(origin&&origin!==expected)){socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));}catch{socket.destroy();}});
  wss.on('connection',ws=>{ws.send(JSON.stringify(packet));ws.on('message',()=>ws.close(1008,'Read-only output'));ws.on('error',()=>{});});
  async function listen(port:number){return new Promise<void>((resolve,reject)=>{const err=(e:Error)=>reject(e);server.once('error',err);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',err);resolve();});});}
  let warning:string|undefined;try{await listen(preferredPort);}catch(e){if((e as NodeJS.ErrnoException).code!=='EADDRINUSE')throw e;await listen(0);warning='The usual OBS port was occupied. Copy the new output URL into OBS.';}
  const port=(server.address() as import('node:net').AddressInfo).port;
  function broadcast(){const payload=JSON.stringify(packet);for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<128*1024)ws.send(payload);}
  return {port,warning,setProfile(p:AvatarProfile){packet={profile:p,state:packet.state};broadcast();},publish(s:unknown){packet.state=animationSchema.parse(s);broadcast();},close:()=>new Promise<void>(resolve=>{for(const ws of wss.clients)ws.terminate();wss.close();server.close(()=>resolve());}),url:`http://127.0.0.1:${port}`};
}
