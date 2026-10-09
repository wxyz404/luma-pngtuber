import { describe,it,expect } from 'vitest';
import { MotionEngine,choosePose,layerAsset } from '../src/shared/engine';
import { IDLE,TrackingFrame,ZERO } from '../src/shared/types';
import { sampleProfile } from '../src/shared/sample';
const p=sampleProfile();p.settings.smoothing=0;p.settings.mirror=false;
const f=(timestamp:number,changes:Partial<TrackingFrame>={}):TrackingFrame=>({...ZERO,status:'tracked',timestamp,audioActive:false,micEnabled:false,...changes});
describe('motion signals',()=>{
 it('holds directional state through threshold jitter',()=>{const e=new MotionEngine();expect(e.step(f(100,{yaw:16}),p).direction).toBe('right');expect(e.step(f(133,{yaw:12}),p).direction).toBe('right');expect(e.step(f(166,{yaw:9}),p).direction).toBe('center');expect(e.step(f(199,{yaw:-16}),p).direction).toBe('left');});
 it('requires bilateral blink and keeps hysteresis',()=>{const e=new MotionEngine();expect(e.step(f(100,{blinkLeft:.9,blinkRight:.1}),p).blinking).toBe(false);expect(e.step(f(133,{blinkLeft:.8,blinkRight:.8}),p).blinking).toBe(true);expect(e.step(f(166,{blinkLeft:.45,blinkRight:.45}),p).blinking).toBe(true);expect(e.step(f(199),p).blinking).toBe(false);});
 it('gates mouth animation with optional microphone',()=>{const e=new MotionEngine();expect(e.step(f(100,{mouth:.7}),p).talking).toBe(true);expect(e.step(f(133,{mouth:.7,micEnabled:true}),p).talking).toBe(false);expect(e.step(f(166,{mouth:.7,micEnabled:true,audioActive:true}),p).talking).toBe(true);});
 it('arbitrates simultaneous expressions',()=>{const e=new MotionEngine();expect(e.step(f(100,{mouth:.7,brow:.8,smile:.9}),p).expression).toBe('surprise');expect(e.step(f(133,{smile:.9}),p).expression).toBe('smile');});
 it('holds 250ms then settles to neutral over 300ms',()=>{const e=new MotionEngine();e.step(f(100,{yaw:30}),p);expect(e.step(f(350,{status:'lost'}),p).yaw).toBeCloseTo(30);expect(e.step(f(500,{status:'lost'}),p).yaw).toBeCloseTo(15);expect(e.step(f(650,{status:'lost'}),p).yaw).toBe(0);expect(e.step(f(700,{yaw:10}),p).tracked).toBe(true);});
 it('smooths with elapsed time and subtracts neutral calibration',()=>{const e=new MotionEngine();const q=structuredClone(p);q.settings.smoothing=100;q.calibration.neutral.yaw=10;const out=e.step(f(100,{yaw:40}),q);expect(out.yaw).toBeGreaterThan(0);expect(out.yaw).toBeLessThan(30);});
});
describe('rig mappings',()=>{
 it('selects direction before center expression',()=>{const q=structuredClone(p);delete q.poses['left.smile'];expect(choosePose(q,{...IDLE,direction:'left',expression:'smile'})).toBe('sample/left.png');});
 it('selects combined talk/blink and gracefully falls back',()=>{const q=structuredClone(p);q.poses['center.neutral.talk.blink']='sample/neutral.png';expect(choosePose(q,{...IDLE,talking:true,blinking:true})).toBe('sample/neutral.png');delete q.poses['center.neutral.talk.blink'];expect(choosePose(q,{...IDLE,talking:true,blinking:true})).toBe('sample/blink.png');});
 it('animates eyes and mouth independently',()=>{const s={...IDLE,talking:true,blinking:true};expect(layerAsset(p.layers.find(l=>l.role==='eyes')!,s)).toBe('sample/eyes-blink.png');expect(layerAsset(p.layers.find(l=>l.role==='mouth')!,s)).toBe('sample/mouth-talk.png');});
});
