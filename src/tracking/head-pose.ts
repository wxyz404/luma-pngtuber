const degrees = 180 / Math.PI;
const clamp = (value: number) => Math.max(-90, Math.min(90, value));

/** MediaPipe's column-major camera transform -> unmirrored screen coordinates. */
export function headPose(matrix?: ArrayLike<number>) {
  if (!matrix || matrix.length !== 16 || Array.from(matrix).some(v => !Number.isFinite(v)))
    return { yaw: 0, pitch: 0, roll: 0 };
  // R = Rz * Ry * Rx. Forward yaw is positive toward screen right; local
  // pitch is positive when looking down. Reading the transposed rotation
  // reverses yaw/pitch and mixes nodding into the wrong side's tilt.
  const yaw = Math.atan2(-matrix[2], Math.hypot(matrix[0], matrix[1]));
  const pitch = Math.atan2(matrix[6], matrix[10]);
  // Project the head's up axis into the image (camera Y up -> canvas Y down).
  // Unlike Euler Z alone, this retains the visible nod when facing sideways.
  const upLength = Math.hypot(matrix[4], matrix[5]);
  const roll = upLength > 1e-6 ? Math.atan2(matrix[4], matrix[5]) : 0;
  return { yaw: clamp(yaw * degrees), pitch: clamp(pitch * degrees), roll: clamp(roll * degrees) };
}
