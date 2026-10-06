import { Upload, X } from 'lucide-react';
import { AvatarProfile, Layer } from '../shared/types';
import { FACINGS, Facing, facingAssetCount, facingName, getLayerSlot, layerSlots, slotName } from '../shared/facing';

export function FacingStates({ profile, facing, onFacing, onEnabled, preview, onPreview, expression, onExpression, variant, onVariant }: {
  profile: AvatarProfile; facing: Facing; onFacing: (facing: Facing) => void; onEnabled: () => void;
  preview: boolean; onPreview: () => void; expression: string; onExpression: (value: string) => void;
  variant: string; onVariant: (value: string) => void;
}) {
  return <div className="card facing-card"><div className="card-title"><h2>Facing states</h2></div>
    <div className="setting-line"><div><b>Directional sprite states</b><p>{profile.settings.directionalStates ? 'Head turns select Left and Right art.' : 'Centered artwork for every head turn.'}</p></div>
      <button type="button" className={`toggle ${profile.settings.directionalStates ? 'checked' : ''}`} role="switch" aria-checked={profile.settings.directionalStates} aria-label="Directional sprite states" onClick={onEnabled}><span/></button></div>
    <div className="segmented facing-tabs" aria-label="Artwork facing state">{FACINGS.map(d => <button key={d} className={facing === d ? 'chosen' : ''} aria-pressed={facing === d} onClick={() => onFacing(d)}>{facingName(d)}<small>{facingAssetCount(profile, d)} PNGs</small></button>)}</div>
    <p className="hint">Editing {facingName(facing)} artwork. Each facing has its own facial variants. Empty side-facing slots fall back to available artwork.</p>
    <div className="setting-line"><div><b>Preview facing artwork</b><p>Studio preview only; stream uses live input.</p></div><button type="button" className={`toggle ${preview ? 'checked' : ''}`} role="switch" aria-checked={preview} aria-label="Preview facing artwork" onClick={onPreview}><span/></button></div>
    {preview && <><label>Preview expression<select aria-label="Preview expression" value={expression} onChange={e => onExpression(e.target.value)}><option value="neutral">Neutral</option><option value="smile">Smile</option><option value="surprise">Surprised</option></select></label><label>Preview animation<select aria-label="Preview animation" value={variant} onChange={e => onVariant(e.target.value)}><option value="">Resting</option><option value=".talk">Talking</option><option value=".blink">Blinking</option><option value=".talk.blink">Talking + blinking</option></select></label><div className="facing-preview-note">Previewing {facingName(facing)} · {expression}{variant ? ` · ${variant.includes('talk') ? 'Talking' : ''}${variant.includes('talk') && variant.includes('blink') ? ' + ' : ''}${variant.includes('blink') ? 'Blinking' : ''}` : ''}</div></>}
  </div>;
}

export function LayerFacingSlots({ layer, facing, onAssign, onClear }: {
  layer: Layer; facing: Facing; onAssign: (slot: string) => void; onClear: (slot: string) => void;
}) {
  return <div className="layer-facing-slots"><div className="section-label">{facingName(facing).toUpperCase()} ARTWORK</div>
    {layerSlots(layer.role).map(slot => <div className="variant-row" key={slot}>
      <span>{slotName(slot)}<small>{getLayerSlot(layer, facing, slot) ? 'PNG assigned' : facing === 'center' && slot === 'neutral' ? 'Base artwork' : 'Optional · fallback when empty'}</small></span>
      <button className="icon-button" title={`Assign ${facingName(facing)} ${slotName(slot)} PNG`} aria-label={`Assign ${facingName(facing)} ${slotName(slot)} PNG`} onClick={() => onAssign(slot)}><Upload size={14}/></button>
      {getLayerSlot(layer, facing, slot) && <button className="icon-button" title={`Clear ${facingName(facing)} ${slotName(slot)} PNG`} aria-label={`Clear ${facingName(facing)} ${slotName(slot)} PNG`} onClick={() => onClear(slot)}><X size={14}/></button>}
    </div>)}<p className="hint">All facing states share this layer’s position, scale, and pivot. Export variants on matching transparent canvases.</p>
  </div>;
}
