import { expect, it } from 'vitest';
import { MotionEngine, choosePose, layerAsset } from '../src/shared/engine';
import { effectiveFacing, getLayerSlot, setLayerSlot, previewFacingState } from '../src/shared/facing';
import { IDLE, ZERO, TrackingFrame, profileSchema } from '../src/shared/types';
import { sampleProfile } from '../src/shared/sample';

const frame = (timestamp: number, yaw: number): TrackingFrame => ({ ...ZERO, yaw, timestamp, status: 'tracked', micEnabled: false, audioActive: false });
it('holds center when directional states are off and restores yaw switching when enabled', () => {
  const p = sampleProfile(); p.settings.smoothing = 0; p.settings.mirror = false;
  const engine = new MotionEngine(); p.settings.directionalStates = false;
  expect(engine.step(frame(100, 30), p).direction).toBe('center');
  expect(engine.step(frame(133, -30), p).direction).toBe('center');
  p.settings.directionalStates = true;
  expect(engine.step(frame(166, -30), p).direction).toBe('left');
  expect(engine.step(frame(199, -12), p).direction).toBe('left');
  expect(engine.step(frame(232, -9), p).direction).toBe('center');
  expect(engine.step(frame(265, 30), p).direction).toBe('right');
});
it('uses center expression poses even if an incoming state contains a side direction', () => {
  const p = sampleProfile(); p.settings.directionalStates = false;
  expect(choosePose(p, { ...IDLE, direction: 'left', talking: true })).toBe('sample/talk.png');
  expect(effectiveFacing(p, { ...IDLE, direction: 'right' })).toBe('center');
});
it('selects independent whole-image blink, smile, and talking combinations for either side', () => {
  const p = sampleProfile();
  for (const direction of ['left', 'right'] as const) {
    p.poses[`${direction}.neutral.blink`] = 'sample/blink.png';
    p.poses[`${direction}.smile.talk.blink`] = 'sample/talk.png';
    p.poses[`${direction}.surprise.talk`] = 'sample/surprise.png';
    expect(choosePose(p, { ...IDLE, direction, blinking: true })).toBe('sample/blink.png');
    expect(choosePose(p, { ...IDLE, direction, expression: 'smile', talking: true, blinking: true })).toBe('sample/talk.png');
    expect(choosePose(p, { ...IDLE, direction, expression: 'surprise', talking: true })).toBe('sample/surprise.png');
  }
});
it('animates each layered feature from its selected side bank', () => {
  const p = sampleProfile(), eyes = p.layers.find(l => l.role === 'eyes')!, mouth = p.layers.find(l => l.role === 'mouth')!, brows = p.layers.find(l => l.role === 'brows')!;
  setLayerSlot(eyes, 'left', 'blink', 'sample/left.png'); setLayerSlot(eyes, 'right', 'blink', 'sample/right.png');
  setLayerSlot(mouth, 'left', 'talk', 'sample/left.png'); setLayerSlot(mouth, 'right', 'talk', 'sample/right.png');
  setLayerSlot(brows, 'right', 'raised', 'sample/right.png');
  for (const direction of ['left', 'right'] as const) {
    const state = { ...IDLE, direction, blinking: true, talking: true, brow: .8 };
    expect(layerAsset(eyes, state)).toBe(`sample/${direction}.png`);
    expect(layerAsset(mouth, state)).toBe(`sample/${direction}.png`);
  }
  expect(layerAsset(brows, { ...IDLE, direction: 'right', brow: .8 })).toBe('sample/right.png');
});
it('supports simultaneous smile/blink and smile/talk while prioritizing surprise', () => {
  const p = sampleProfile(), eyes = p.layers.find(l => l.role === 'eyes')!, mouth = p.layers.find(l => l.role === 'mouth')!;
  setLayerSlot(eyes, 'left', 'smile.blink', 'sample/left.png'); setLayerSlot(mouth, 'left', 'smile.talk', 'sample/talk.png'); setLayerSlot(mouth, 'left', 'surprise', 'sample/surprise.png');
  setLayerSlot(mouth, 'left', 'surprise.talk');
  const state = { ...IDLE, direction: 'left' as const, expression: 'smile' as const, blinking: true, talking: true };
  expect(layerAsset(eyes, state)).toBe('sample/left.png'); expect(layerAsset(mouth, state)).toBe('sample/talk.png');
  expect(layerAsset(mouth, { ...state, expression: 'surprise' })).toBe('sample/surprise.png');
});
it('prefers a side resting feature over a mismatched center expression and falls back when the side is empty', () => {
  const eyes = sampleProfile().layers.find(l => l.role === 'eyes')!;
  for (const key of Object.keys(eyes.variants)) if (key.startsWith('left.')) delete eyes.variants[key];
  setLayerSlot(eyes, 'left', 'neutral', 'sample/left.png');
  const state = { ...IDLE, direction: 'left' as const, blinking: true };
  expect(layerAsset(eyes, state)).toBe('sample/left.png');
  setLayerSlot(eyes, 'left', 'neutral'); expect(layerAsset(eyes, state)).toBe('sample/eyes-blink.png');
});
it('loads existing profiles and legacy head directions without changing alignment', () => {
  const p = sampleProfile(), head = p.layers.find(l => l.role === 'head')!; delete head.variants['left.neutral']; head.variants.left = 'sample/left.png';
  const legacy = JSON.parse(JSON.stringify(p)); delete legacy.settings.directionalStates;
  const loaded = profileSchema.parse(legacy);
  expect(loaded.settings.directionalStates).toBe(true); expect(loaded.layers).toEqual(p.layers);
  expect(layerAsset(loaded.layers.find(l => l.role === 'head')!, { ...IDLE, direction: 'left' })).toBe('sample/left.png');
  setLayerSlot(head, 'left', 'neutral'); expect(getLayerSlot(head, 'left', 'neutral')).toBeUndefined();
});
it('serializes side banks and centered-only settings and keeps artwork previews independent of live state', () => {
  const p = sampleProfile(); p.settings.directionalStates = false;
  setLayerSlot(p.layers[0], 'right', 'neutral', 'sample/right.png');
  expect(profileSchema.parse(JSON.parse(JSON.stringify(p)))).toEqual(p);
  const preview = previewFacingState('left', 'smile', '.talk.blink', 100);
  expect(preview).toMatchObject({ direction: 'left', expression: 'smile', talking: true, blinking: true });
  expect(effectiveFacing(p, preview)).toBe('center'); expect(IDLE.direction).toBe('center');
});
