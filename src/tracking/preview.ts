// Local studio diagnostics only. This data never enters the avatar output packet.
export interface FacePreview {
  points: Float32Array | null;
  connections: readonly { start: number; end: number }[];
  receivedAt: number;
}
export interface TrackingDiagnostics {
  inferenceMs: number;
  audioLevel: number;
  width: number;
  height: number;
  yaw: number;
  pitch: number;
  roll: number;
}
export const EMPTY_DIAGNOSTICS: TrackingDiagnostics = {
  inferenceMs: 0, audioLevel: 0, width: 0, height: 0, yaw: 0, pitch: 0, roll: 0,
};
export function drawFaceSkeleton(ctx: CanvasRenderingContext2D, preview: FacePreview, now: number) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  // Do not draw a stale face after loss, pause, or a slow worker response.
  if (!preview.points || now - preview.receivedAt > 500) return;
  const points = preview.points;
  const valid = (index: number) => index >= 0 && index * 2 + 1 < points.length &&
    Number.isFinite(points[index * 2]) && Number.isFinite(points[index * 2 + 1]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#83ffe1';
  ctx.shadowColor = '#142b25';
  ctx.shadowBlur = 2;
  ctx.beginPath();
  for (const { start, end } of preview.connections) {
    if (!valid(start) || !valid(end)) continue;
    ctx.moveTo(points[start * 2] * width, points[start * 2 + 1] * height);
    ctx.lineTo(points[end * 2] * width, points[end * 2 + 1] * height);
  }
  ctx.stroke();
  ctx.fillStyle = '#fff7be';
  // Nose and chin make head movement easier to see without covering the image.
  for (const index of [1, 4, 152, 33, 263]) {
    if (!valid(index)) continue;
    ctx.beginPath();
    ctx.arc(points[index * 2] * width, points[index * 2 + 1] * height, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
