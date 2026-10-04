import { AnimationState, AvatarProfile, Layer } from './types';
import { choosePose, layerAsset } from './engine';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class AvatarRenderer {
  private images=new Map<string,HTMLImageElement>();private failed=new Set<string>();
  constructor(private canvas:HTMLCanvasElement,private url:(asset:string)=>string,private onError?:(asset:string)=>void){}
  preload(profile:AvatarProfile){const assets=new Set([...Object.values(profile.poses),...profile.layers.flatMap(l=>[l.asset,...Object.values(l.variants)]).filter(Boolean) as string[]]);for(const a of assets)this.image(a);}
  private image(asset:string){if(!this.images.has(asset)&&!this.failed.has(asset)){const img=new Image();img.onload=()=>{};img.onerror=()=>{this.failed.add(asset);this.onError?.(asset);};img.src=this.url(asset);this.images.set(asset,img);}const img=this.images.get(asset);return img?.complete&&img.naturalWidth&&!this.failed.has(asset)?img:undefined;}
  draw(profile:AvatarProfile,s:AnimationState,selected?:string){
    const c=this.canvas,ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);ctx.save();const scale=Math.min(c.width,c.height)/1024;ctx.translate((c.width-1024*scale)/2,(c.height-1024*scale)/2);ctx.scale(scale,scale);
    const strength=profile.settings.strength;const mirror=profile.settings.mirror?-1:1;
    const dx=clamp(s.x*70+s.yaw*.65,-65,65)*strength*mirror,dy=clamp(s.y*50+s.pitch*.5,-45,45)*strength;
    const roll=clamp(s.roll,-18,18)*Math.PI/180*strength*mirror;
    const bounce=profile.settings.bounce&&s.talking? -Math.abs(Math.sin(s.time/105))*8*strength:0;
    const head=profile.layers.find(l=>l.role==='head');
    if(profile.mode==='simple') {const asset=choosePose(profile,s);const img=asset&&this.image(asset);if(img){ctx.translate(512+dx,512+dy+bounce);ctx.rotate(roll*.6);const fit=Math.min(960/img.naturalWidth,960/img.naturalHeight);ctx.drawImage(img,-img.naturalWidth*fit/2,-img.naturalHeight*fit/2,img.naturalWidth*fit,img.naturalHeight*fit);}}
    else for(const l of [...profile.layers].sort((a,b)=>a.order-b.order)){if(!l.visible)continue;ctx.save();const moves=l.role!=='body'&&l.role!=='accessory';if(moves){const pivot=head||l;const px=pivot.x+pivot.width*pivot.scale*pivot.pivotX,py=pivot.y+pivot.height*pivot.scale*pivot.pivotY;ctx.translate(px+dx,py+dy+bounce);ctx.rotate(roll);ctx.translate(-px,-py);}let ly=l.y;if(l.role==='brows')ly-=s.brow*12*strength;const a=layerAsset(l,s);const img=a&&this.image(a);if(img)ctx.drawImage(img,l.x,ly,l.width*l.scale,l.height*l.scale);if(selected===l.id)this.outline(ctx,{...l,y:ly});ctx.restore();}
    ctx.restore();
  }
  private outline(ctx:CanvasRenderingContext2D,l:Layer){ctx.strokeStyle='#da785e';ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.strokeRect(l.x,l.y,l.width*l.scale,l.height*l.scale);ctx.setLineDash([]);const x=l.x+l.width*l.scale*l.pivotX,y=l.y+l.height*l.scale*l.pivotY;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fillStyle='#da785e';ctx.fill();}
}
