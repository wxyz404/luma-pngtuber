import { AnimationState, AvatarProfile, Layer } from './types';

export type Facing = AnimationState['direction'];
export const FACINGS: Facing[] = ['center', 'left', 'right'];
export const facingName = (facing: Facing) => facing[0].toUpperCase() + facing.slice(1);
export const slotName = (slot: string) => ({ neutral: 'Resting', talk: 'Talking', blink: 'Blinking', smile: 'Smiling', surprise: 'Surprised', raised: 'Raised brows', 'smile.blink': 'Smiling + blinking', 'smile.talk': 'Smiling + talking', 'surprise.talk': 'Surprised + talking' }[slot] || slot);
export const slotKey = (facing: Facing, slot: string) => facing === 'center' ? slot : `${facing}.${slot}`;
export function effectiveFacing(profile: AvatarProfile, state: AnimationState): Facing {
  return profile.settings.directionalStates === false ? 'center' : state.direction;
}
export function layerSlots(role: Layer['role']): string[] {
  return ['neutral', ...(role === 'eyes' ? ['blink', 'smile', 'smile.blink'] : role === 'mouth' ? ['talk', 'smile', 'surprise', 'smile.talk', 'surprise.talk'] : role === 'brows' ? ['raised'] : [])];
}
export function getLayerSlot(layer: Layer, facing: Facing, slot: string): string | undefined {
  if (facing === 'center' && slot === 'neutral') return layer.asset;
  return layer.variants[slotKey(facing, slot)] ||
    (layer.role === 'head' && facing !== 'center' && slot === 'neutral' ? layer.variants[facing] : undefined);
}
export function setLayerSlot(layer: Layer, facing: Facing, slot: string, asset?: string) {
  if (facing === 'center' && slot === 'neutral') {
    if (asset) layer.asset = asset; else delete layer.asset;
  } else {
    const key = slotKey(facing, slot);
    if (asset) layer.variants[key] = asset; else delete layer.variants[key];
    // Preserve legacy head assignments when reading, but replace/clear them explicitly.
    if (layer.role === 'head' && facing !== 'center' && slot === 'neutral') delete layer.variants[facing];
  }
}
export function facingAssetCount(profile: AvatarProfile, facing: Facing) {
  if (profile.mode === 'simple') return Object.keys(profile.poses).filter(key => key.startsWith(`${facing}.`)).length;
  return profile.layers.reduce((count, layer) => count + layerSlots(layer.role).filter(slot => getLayerSlot(layer, facing, slot)).length, 0);
}
export function previewFacingState(facing: Facing, expression: AnimationState['expression'], variant: string, time: number): AnimationState {
  const talking = variant.includes('.talk'), blinking = variant.includes('.blink');
  return { direction: facing, expression, talking, blinking, tracked: true, time,
    yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, blinkLeft: blinking ? 1 : 0, blinkRight: blinking ? 1 : 0,
    mouth: talking || expression === 'surprise' ? .7 : 0, smile: expression === 'smile' ? .8 : 0, brow: expression === 'surprise' ? .8 : 0 };
}
