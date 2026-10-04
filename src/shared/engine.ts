import { AnimationState, AvatarProfile, IDLE, Signals, TrackingFrame, ZERO } from './types';
const keys=Object.keys(ZERO) as (keyof Signals)[];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class MotionEngine {
  private state:AnimationState={...IDLE}; private last=0; private lastTracked=-Infinity; private held:Signals={...ZERO};
  reset(){this.state={...IDLE};this.last=0;this.lastTracked=-Infinity;this.held={...ZERO};}
  step(frame:TrackingFrame,profile:AvatarProfile):AnimationState {
    const t=frame.timestamp,dt=this.last?clamp(t-this.last,0,100):33;this.last=t;
    let target:Signals={...ZERO};
    if(frame.status==='tracked') {
      for(const key of keys){const raw=(frame[key]-profile.calibration.neutral[key])*profile.settings.sensitivity;target[key]=clamp(raw,key==='yaw'||key==='pitch'||key==='roll'?-90:key==='x'||key==='y'?-1:0,key==='yaw'||key==='pitch'||key==='roll'?90:1);}
      this.lastTracked=t;this.held={...target};
    } else if(frame.status==='lost') {
      const factor=1-clamp((t-this.lastTracked-250)/300,0,1);for(const key of keys)target[key]=this.held[key]*factor;
    }
    const alpha=frame.status==='tracked'?1-Math.exp(-dt/Math.max(1,profile.settings.smoothing)):1;
    const next={...this.state,time:t,tracked:frame.status==='tracked'};
    for(const key of keys)next[key]+=alpha*(target[key]-next[key]);
    const yaw=next.yaw*(profile.settings.mirror?-1:1);
    if(yaw>15)next.direction='right';else if(yaw< -15)next.direction='left';else if(Math.abs(yaw)<10)next.direction='center';
    const gate=!frame.micEnabled||frame.audioActive;
    next.talking=gate && next.mouth>(this.state.talking?.12:.22);
    next.blinking=Math.min(next.blinkLeft,next.blinkRight)>(this.state.blinking?.35:.6);
    const surprise=next.brow>(this.state.expression==='surprise'?.35:.55)&&next.mouth>.28;
    next.expression=surprise?'surprise':next.smile>(this.state.expression==='smile'?.25:.45)?'smile':'neutral';
    this.state=next;return {...next};
  }
}
export function choosePose(profile:AvatarProfile,s:AnimationState):string|undefined {
  const ds=[s.direction,...(s.direction==='center'?[]:['center'])];
  for(const d of ds){for(const e of [s.expression,...(s.expression==='neutral'?[]:['neutral'])]) {
    const base=`${d}.${e}`;
    const variants=[...(s.blinking&&s.talking?['.talk.blink']:[]),...(s.blinking?['.blink']:[]),...(s.talking?['.talk']:[]),''];
    for(const v of variants)if(profile.poses[base+v])return profile.poses[base+v];
  }}return profile.poses['center.neutral'];
}
export function layerAsset(layer:AvatarProfile['layers'][number],s:AnimationState) {
  if(layer.role==='head')return layer.variants[s.direction]||layer.asset;
  if(layer.role==='eyes')return (s.blinking&&layer.variants.blink)||(s.expression==='smile'&&layer.variants.smile)||layer.asset;
  if(layer.role==='mouth')return (s.expression==='surprise'&&layer.variants.surprise)||(s.talking&&layer.variants.talk)||(s.expression==='smile'&&layer.variants.smile)||layer.asset;
  if(layer.role==='brows')return (s.brow>.4&&layer.variants.raised)||layer.asset;
  return layer.asset;
}
