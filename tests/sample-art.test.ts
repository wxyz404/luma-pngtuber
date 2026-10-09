import { it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { sampleProfile, upgradeSampleArtwork } from '../src/shared/sample';
import { IDLE } from '../src/shared/types';
import { choosePose, layerAsset } from '../src/shared/engine';
import { ProfileStore } from '../electron/store';

function oldSample() {
  const p = sampleProfile('old-sprout');
  p.poses = Object.fromEntries(Object.entries(p.poses).filter(([key]) => ['center.neutral','center.neutral.talk','center.neutral.blink','center.smile','center.surprise','left.neutral','right.neutral'].includes(key)));
  for (const l of p.layers) for (const key of Object.keys(l.variants)) if (key.includes('.')) delete l.variants[key];
  return p;
}

it('bundles readable, aligned, transparent PNGs for every assigned sample slot', async () => {
  const p = sampleProfile();
  const refs = new Set([...Object.values(p.poses), ...p.layers.flatMap(l => [l.asset!, ...Object.values(l.variants)])]);
  expect(Object.keys(p.poses)).toHaveLength(36);
  expect(refs.size).toBe(76);
  for (const ref of refs) {
    const img = sharp(path.join('public', ref));
    const meta = await img.metadata();
    expect([meta.width, meta.height, meta.hasAlpha]).toEqual([1024, 1024, true]);
    expect((await img.extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer())[3]).toBe(0);
    expect((await sharp(path.join('public', ref)).stats()).channels[3].max).toBeGreaterThan(0);
  }
  const hashes = await Promise.all(Object.values(p.poses).map(async ref => createHash('sha256').update(await fs.readFile(path.join('public', ref))).digest('hex')));
  expect(new Set(hashes).size).toBe(36);
}, 30000);

it('selects supplied artwork for every facing/expression/talk/blink combination', () => {
  const p = sampleProfile();
  for (const direction of ['center','left','right'] as const) for (const expression of ['neutral','smile','surprise'] as const) for (const talking of [false,true]) for (const blinking of [false,true]) {
    const state = { ...IDLE, direction, expression, talking, blinking, brow: expression === 'surprise' ? .8 : 0 };
    const suffix = expression + (talking ? '.talk' : '') + (blinking ? '.blink' : '');
    expect(choosePose(p, state)).toBe(p.poses[`${direction}.${suffix}`]);
    for (const l of p.layers.filter(l => l.role !== 'body')) {
      const asset = layerAsset(l, state);
      expect(asset).toBeTruthy();
      if (direction !== 'center') expect(asset).toContain(`sample/${direction}-`);
    }
  }
});

it('adds missing stock slots without changing saved alignment, settings, name, or calibration', () => {
  const p = oldSample(); p.name = 'My Sprout'; p.layers[1].x = 42; p.layers[1].scale = .7;
  p.calibration.completed = true; p.calibration.neutral.yaw = 4; p.settings.directionalStates = false;
  const before = structuredClone(p), next = upgradeSampleArtwork(p);
  expect(p).toEqual(before);
  expect(next.poses).toEqual(sampleProfile().poses);
  expect(next.layers.map(({ variants, ...geometry }) => geometry)).toEqual(p.layers.map(({ variants, ...geometry }) => geometry));
  expect([next.name, next.settings, next.calibration]).toEqual([p.name, p.settings, p.calibration]);
  expect(upgradeSampleArtwork(next)).toEqual(next);
});

it('preserves imported artwork, reassigned slots, and legacy head variants', () => {
  const imported = oldSample(); imported.layers[1].asset = `assets/${'a'.repeat(64)}.png`;
  const reassigned = oldSample(); reassigned.poses['left.neutral'] = 'sample/right.png';
  const legacy = oldSample(); legacy.layers[1].variants.left = 'sample/left.png';
  const customVariant = oldSample(); customVariant.layers[2].variants['left.blink'] = `assets/${'b'.repeat(64)}.png`;
  for (const p of [imported, reassigned, legacy, customVariant]) expect(upgradeSampleArtwork(p)).toEqual(p);
});

it('loads old saved sample profiles through both storage entry points and saves the upgraded banks', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sprout-art-'));
  try {
    const store = new ProfileStore(dir, path.resolve('public')); await store.init();
    const old = oldSample(); await store.save(old);
    const loaded = await store.load(old.id);
    expect(loaded).toEqual(upgradeSampleArtwork(old)); expect((await store.list())[0]).toEqual(loaded);
    await store.save(loaded); expect(await store.load(old.id)).toEqual(loaded);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
