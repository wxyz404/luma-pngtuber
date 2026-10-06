import { expect, it } from 'vitest';
import { drawFaceSkeleton, type FacePreview } from '../src/tracking/preview';

function surface() {
  const lines: number[][] = [];
  let clears = 0;
  const ctx = {
    canvas: { width: 640, height: 480 }, clearRect: () => { clears++; },
    beginPath: () => {}, moveTo: (...xy: number[]) => lines.push(xy),
    lineTo: (...xy: number[]) => lines.push(xy), stroke: () => {},
    arc: () => {}, fill: () => {},
  } as unknown as CanvasRenderingContext2D;
  return { ctx, lines, clears: () => clears };
}
const face: FacePreview = {
  points: new Float32Array([.25, .5, .75, .5]),
  connections: [{ start: 0, end: 1 }], receivedAt: 100,
};
it('aligns normalized landmarks with the 640×480 webcam surface', () => {
  const s = surface(); drawFaceSkeleton(s.ctx, face, 150);
  expect(s.lines).toEqual([[160, 240], [480, 240]]);
});
it('clears the skeleton on tracking loss and stale inference', () => {
  for (const preview of [face, { ...face, points: null }]) {
    const s = surface(); drawFaceSkeleton(s.ctx, preview, 601);
    expect(s.clears()).toBe(1); expect(s.lines).toEqual([]);
  }
});
it('ignores invalid connections and nonfinite landmark coordinates', () => {
  const s = surface();
  drawFaceSkeleton(s.ctx, { ...face, points: new Float32Array([NaN, .5, .75, .5]), connections: [{ start: 0, end: 1 }, { start: 1, end: 99 }, { start: -1, end: 1 }] }, 150);
  expect(s.lines).toEqual([]);
});
