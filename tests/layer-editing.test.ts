import { expect, it } from 'vitest';
import { layerScaleRange, resizeLayerCentered } from '../src/shared/layer-editing';
import { sampleProfile } from '../src/shared/sample';
import { Layer, layerSchema, profileSchema } from '../src/shared/types';

const center = (layer: Layer) => [layer.x + layer.width * layer.scale / 2, layer.y + layer.height * layer.scale / 2];
const equalCenter = (layer: Layer, expected: number[]) => {
  expect(center(layer)[0]).toBeCloseTo(expected[0], 8);
  expect(center(layer)[1]).toBeCloseTo(expected[1], 8);
};
it('grows and shrinks a non-square layer around its image center', () => {
  const layer = { ...sampleProfile().layers[0], x: 140, y: 85, width: 600, height: 280, scale: .7 };
  const original = center(layer);
  resizeLayerCentered(layer, 1.9); equalCenter(layer, original);
  expect(layer.x).toBeCloseTo(-220); expect(layer.y).toBeCloseTo(-83);
  resizeLayerCentered(layer, .3); equalCenter(layer, original);
});
it('preserves custom pivot, variants, and other layers during resize', () => {
  const profile = sampleProfile();
  const before = structuredClone(profile); profile.layers[1].pivotX = .2; profile.layers[1].pivotY = .8;
  resizeLayerCentered(profile.layers[1], 1.5);
  expect(profile.layers[1].pivotX).toBe(.2); expect(profile.layers[1].pivotY).toBe(.8);
  expect(profile.layers[1].variants).toEqual(before.layers[1].variants);
  expect(profile.layers.filter(l => l.id !== 'head')).toEqual(before.layers.filter(l => l.id !== 'head'));
  expect(profileSchema.parse(JSON.parse(JSON.stringify(profile)))).toEqual(profile);
});
it('does not accumulate center drift while scrubbing repeatedly', () => {
  const layer = sampleProfile().layers[1], original = structuredClone(layer);
  for (let n = 0; n < 100; n++) {
    resizeLayerCentered(layer, 1.73); resizeLayerCentered(layer, .24); resizeLayerCentered(layer, 1);
  }
  equalCenter(layer, center(original)); expect(layer.x).toBeCloseTo(original.x, 8); expect(layer.y).toBeCloseTo(original.y, 8);
});
it('limits scale rather than shifting the center past valid profile coordinates', () => {
  for (const layer of [
    { ...sampleProfile().layers[1], width: 4096, height: 2048, x: 87, y: 298, scale: 850 / 4096 },
    { ...sampleProfile().layers[1], x: 2048, y: 2048, scale: 4 },
    { ...sampleProfile().layers[1], x: -1024, y: -1024, scale: .1 },
  ]) {
    const original = center(layer), range = layerScaleRange(layer);
    expect(range.min).toBeLessThanOrEqual(layer.scale); expect(range.max).toBeGreaterThanOrEqual(layer.scale);
    for (const scale of [4, .1, range.max, range.min]) {
      resizeLayerCentered(layer, scale); equalCenter(layer, original); expect(() => layerSchema.parse(layer)).not.toThrow();
    }
  }
});
it('ignores nonfinite scale requests', () => {
  const layer = sampleProfile().layers[1], before = structuredClone(layer);
  resizeLayerCentered(layer, NaN); resizeLayerCentered(layer, Infinity); expect(layer).toEqual(before);
});
