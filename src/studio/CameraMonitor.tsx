import { useEffect, useRef, type RefObject } from 'react';
import { Camera, Maximize2, Minimize2 } from 'lucide-react';
import { drawFaceSkeleton, type FacePreview, type TrackingDiagnostics } from '../tracking/preview';

interface Props {
  video: RefObject<HTMLVideoElement | null>;
  preview: RefObject<FacePreview>;
  visible: boolean;
  skeleton: boolean;
  mirrored: boolean;
  expanded: boolean;
  diagnosticsVisible: boolean;
  diagnostics: TrackingDiagnostics;
  running: boolean;
  starting: boolean;
  tracked: boolean;
  mic: boolean;
  fps: number;
  status: string;
  onExpand: () => void;
}

export function CameraMonitor(props: Props) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!props.visible || !props.skeleton) return;
    let raf = 0;
    const draw = (now: number) => {
      drawFaceSkeleton(ctx, props.preview.current, now);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); };
  }, [props.visible, props.skeleton, props.preview]);

  const d = props.diagnostics;
  return <section className={`camera-monitor ${props.visible ? 'visible' : ''} ${props.expanded ? 'expanded' : ''}`} aria-label="Webcam monitor" aria-hidden={!props.visible}>
    <div className="camera-monitor-heading"><span><Camera size={15}/> WEBCAM MONITOR</span><button className="icon-button" onClick={props.onExpand} title={props.expanded ? 'Shrink webcam preview' : 'Enlarge webcam preview'} aria-label={props.expanded ? 'Shrink webcam preview' : 'Enlarge webcam preview'}>{props.expanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button></div>
    <div className="camera-frame">
      <div className={`camera-image ${props.mirrored ? 'mirrored' : ''}`}>
        {/* Keep the video mounted when hidden: inference uses this same stream. */}
        <video ref={props.video} muted playsInline aria-label="Live webcam feed"/>
        <canvas ref={canvas} width={640} height={480} aria-label="Face skeleton overlay"/>
      </div>
      {!props.running && <div className="camera-empty"><Camera size={25}/><b>{props.starting ? 'Starting your webcam…' : 'Your webcam preview'}</b><span>{props.starting ? 'Loading the bundled face tracker.' : 'Choose a video input, then select Start camera.'}</span></div>}
      <div className="camera-status"><span className={props.tracked ? 'online' : ''}/>{props.status}{props.running && props.skeleton && <small>{props.tracked ? 'Face skeleton on' : 'Waiting for face'}</small>}</div>
    </div>
    <div className="camera-local-note">Only visible in Sprout · {props.mirrored ? 'Mirrored view' : 'Natural view'}</div>
    {props.diagnosticsVisible && <div className="camera-diagnostics" aria-label="Tracking diagnostics">
      <div><span>Tracking</span><b>{props.running ? props.fps : '—'} FPS</b></div>
      <div><span>Last inference</span><b>{props.running && d.inferenceMs ? Math.round(d.inferenceMs) : '—'} ms</b></div>
      <div><span>Camera size</span><b>{d.width ? `${d.width} × ${d.height}` : '—'}</b></div>
      <div className="head-angles"><span>Head angles</span><b>Yaw {Math.round(d.yaw)}° · Pitch {Math.round(d.pitch)}° · Roll {Math.round(d.roll)}°</b></div>
      <div className="audio-diagnostic"><span>{props.mic ? 'Microphone level' : 'Microphone assist off'}</span><div className="meter"><i style={{ width: `${Math.min(100, d.audioLevel * 500)}%` }}/></div></div>
      <p>Inference time measures the tracker only, not total animation latency.</p>
    </div>}
  </section>;
}
