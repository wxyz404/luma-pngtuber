import { expect, it } from 'vitest';
import { headPose } from '../src/tracking/head-pose';
import { MotionEngine } from '../src/shared/engine';
import { sampleProfile } from '../src/shared/sample';
import { ZERO, profileSchema } from '../src/shared/types';
import { artworkPoint } from '../src/shared/layer-editing';

// Compose real camera-space rotations independently of the extraction formulas,
// then serialize column-major like MediaPipe. Camera Y points up, Z toward us.
function transform(yaw: number, pitch: number, roll = 0, scale = 1) {
  const rad = Math.PI / 180, y = yaw * rad, p = pitch * rad, r = roll * rad;
  const rx = [[1,0,0],[0,Math.cos(p),-Math.sin(p)],[0,Math.sin(p),Math.cos(p)]];
  const ry = [[Math.cos(y),0,Math.sin(y)],[0,1,0],[-Math.sin(y),0,Math.cos(y)]];
  const rz = [[Math.cos(r),-Math.sin(r),0],[Math.sin(r),Math.cos(r),0],[0,0,1]];
  const multiply = (a:number[][], b:number[][]) => a.map(row => b[0].map((_,j) => row.reduce((v,x,k) => v + x*b[k][j],0)));
  const rotation = multiply(rz,multiply(ry,rx));
  return Array.from({length:16},(_,i) => i%4<3&&Math.floor(i/4)<3 ? rotation[i%4][Math.floor(i/4)]*scale : i===15 ? 1 : i===12 ? 3 : i===13 ? -4 : i===14 ? -40 : 0);
}

it('extracts column-major yaw and nod with consistent screen signs', () => {
  for (const yaw of [-65,-35,0,35,65]) for (const pitch of [-25,0,25]) {
    const out = headPose(transform(yaw,pitch));
    expect(out.yaw).toBeCloseTo(yaw,8); expect(out.pitch).toBeCloseTo(pitch,8);
    expect(out).toEqual(headPose(transform(yaw,pitch,0,2)));
  }
});
it('sideways looking up tilts the drawn face up, and looking down tilts it down, with either motion mirror setting', () => {
  for (const mirror of [false,true]) for (const yaw of [-65,-35,35,65]) for (const pitch of [-25,25]) {
    const p = sampleProfile(); p.settings.smoothing = 0; p.settings.mirror = mirror;
    const state = new MotionEngine().step({...ZERO,...headPose(transform(yaw,pitch)),timestamp:100,status:'tracked',micEnabled:false,audioActive:false},p);
    const screenRoll = state.roll * (mirror ? -1 : 1);
    // A right-facing nose rotates clockwise to look down; a left-facing nose
    // rotates counterclockwise. This detects the original inversion in context.
    const facingSign = state.direction === 'right' ? 1 : -1;
    expect(Math.sign(screenRoll)*facingSign).toBe(Math.sign(pitch));
    expect(Math.sign(state.pitch)).toBe(Math.sign(pitch));
  }
});
it('keeps projected head lean and nod continuous across yaw rather than reversing at a facing threshold', () => {
  for (const yaw of [-70,-16,-15,-10,0,10,15,16,70]) {
    const angle = headPose(transform(yaw,0,12));
    expect(angle.roll).toBeCloseTo(-12,8);
  }
  for (const yaw of [-35,35]) {
    const matrix = transform(yaw,-20,8), out = headPose(matrix);
    const theta = out.roll*Math.PI/180;
    // Rotating canvas's up axis must agree with the projected camera up axis.
    const length = Math.hypot(matrix[4],matrix[5]);
    expect(Math.sin(theta)).toBeCloseTo(matrix[4]/length,8);
    expect(-Math.cos(theta)).toBeCloseTo(-matrix[5]/length,8);
  }
});
it('returns neutral for missing or invalid transforms without leaking NaN', () => {
  for(const matrix of [undefined,[],Array(16).fill(NaN),Array(16).fill(Infinity)])
    expect(headPose(matrix)).toEqual({yaw:0,pitch:0,roll:0});
});
it('loads old profiles with avatar mirroring off and saves it independently from motion mirroring', () => {
  const legacy = JSON.parse(JSON.stringify(sampleProfile())); delete legacy.settings.mirrorAvatar;
  expect(profileSchema.parse(legacy).settings.mirrorAvatar).toBe(false);
  legacy.settings.mirrorAvatar = true; legacy.settings.mirror = false;
  const restored = profileSchema.parse(JSON.parse(JSON.stringify(legacy)));
  expect(restored.settings.mirrorAvatar).toBe(true); expect(restored.settings.mirror).toBe(false);
});
it('maps mirrored canvas editing to artwork coordinates, including off-canvas dragging', () => {
  expect(artworkPoint(100,75,512,256,false)).toEqual({x:200,y:300});
  expect(artworkPoint(100,75,512,256,true)).toEqual({x:824,y:300});
  expect(artworkPoint(-50,75,512,256,true)).toEqual({x:1124,y:300});
  expect(artworkPoint(120,75,512,256,true).x-artworkPoint(100,75,512,256,true).x).toBe(-40);
});
