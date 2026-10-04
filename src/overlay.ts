import { AvatarRenderer } from './shared/render';
import { OutputPacket } from './shared/types';
const token=new URLSearchParams(location.search).get('token')||'';const canvas=document.querySelector<HTMLCanvasElement>('#avatar')!;
const renderer=new AvatarRenderer(canvas,a=>`/avatar/${a}?token=${encodeURIComponent(token)}`);let packet:OutputPacket|undefined;
let socket:WebSocket;let retry=500;
function connect(){socket=new WebSocket(`ws://${location.host}/stream?token=${encodeURIComponent(token)}`);socket.onopen=()=>{retry=500;};socket.onmessage=({data})=>{try{const p=JSON.parse(data) as OutputPacket;if(packet?.profile!==p.profile)renderer.preload(p.profile);packet=p;}catch{/* Ignore incomplete packets. */}};socket.onclose=()=>{setTimeout(connect,retry);retry=Math.min(10000,retry*2);};socket.onerror=()=>socket.close();}
connect();function draw(){const w=innerWidth,h=innerHeight;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}if(packet)renderer.draw(packet.profile,packet.state);requestAnimationFrame(draw);}requestAnimationFrame(draw);
