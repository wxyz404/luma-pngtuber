import { Layer, LAYER_POSITION_MIN, LAYER_POSITION_MAX } from './types';

// x/y remain top-left coordinates in saved profiles. Editing scale compensates
// those coordinates so existing artwork stays centered without a migration.
export function layerScaleRange(layer: Layer) {
  const cx = layer.x + layer.width * layer.scale / 2;
  const cy = layer.y + layer.height * layer.scale / 2;
  const min = Math.max(.1, 2 * (cx - LAYER_POSITION_MAX) / layer.width,
    2 * (cy - LAYER_POSITION_MAX) / layer.height);
  const max = Math.min(4, 2 * (cx - LAYER_POSITION_MIN) / layer.width,
    2 * (cy - LAYER_POSITION_MIN) / layer.height);
  // Include the current scale despite floating-point rounding at an edge.
  return { min: Math.min(min, layer.scale), max: Math.max(max, layer.scale) };
}

export function resizeLayerCentered(layer: Layer, requestedScale: number) {
  if (!Number.isFinite(requestedScale)) return;
  const { min, max } = layerScaleRange(layer);
  const scale = Math.max(min, Math.min(max, requestedScale));
  const delta = (layer.scale - scale) / 2;
  layer.x = Math.max(LAYER_POSITION_MIN, Math.min(LAYER_POSITION_MAX, layer.x + layer.width * delta));
  layer.y = Math.max(LAYER_POSITION_MIN, Math.min(LAYER_POSITION_MAX, layer.y + layer.height * delta));
  layer.scale = scale;
}
