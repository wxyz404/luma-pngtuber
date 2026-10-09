import { FaceLandmarker,FilesetResolver } from '@mediapipe/tasks-vision';
import { FaceLock } from './face-lock';
import { headPose } from './head-pose';
import { ZERO } from '../shared/types';
const scope=self as unknown as DedicatedWorkerGlobalScope;let model:FaceLandmarker|undefined;let previewEnabled=false;const lock=new FaceLock();
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
scope.onmessage=async({data})=>{try{
  if(data.type==='init'){previewEnabled=!!data.previewEnabled;const files=await FilesetResolver.forVisionTasks(data.base+'/models/wasm');model=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:data.base+'/models/face_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numFaces:2,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true,minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.55});scope.postMessage({type:'ready',connections:[...FaceLandmarker.FACE_LANDMARKS_CONTOURS,...FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,...FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS]});return;}
  if(data.type==='preview'){previewEnabled=!!data.enabled;return;}
  if(data.type==='reset'){lock.reset();return;}
  if(data.type!=='frame')return;
  const bitmap=data.bitmap as ImageBitmap;const begin=performance.now();
  try {if(!model)throw new Error('Tracking model is not ready.');const result=model.detectForVideo(bitmap,data.timestamp);
    const candidates=result.faceLandmarks.map(points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y);const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);const dist=(a:number,b:number)=>Math.hypot(points[a].x-points[b].x,points[a].y-points[b].y)/Math.max(w,.001);return {x:points[1].x,y:points[1].y,size:w,shape:[h/Math.max(w,.001),dist(33,263),dist(1,152)]};});
    const i=lock.select(candidates,data.timestamp);if(i<0){scope.postMessage({type:'result',frame:{...ZERO,timestamp:data.timestamp,status:'lost'},duration:performance.now()-begin});return;}
    const points=previewEnabled?new Float32Array(result.faceLandmarks[i].flatMap(p=>[p.x,p.y])):null;
    const blend=Object.fromEntries(result.faceBlendshapes[i].categories.map(c=>[c.categoryName,c.score]));
    const {yaw,pitch,roll}=headPose(result.facialTransformationMatrixes[i]?.data);
    scope.postMessage({type:'result',frame:{timestamp:data.timestamp,status:'tracked',yaw:clamp(yaw,-90,90),pitch:clamp(pitch,-90,90),roll:clamp(roll,-90,90),x:clamp((candidates[i].x-.5)*2,-1,1),y:clamp((candidates[i].y-.5)*2,-1,1),blinkLeft:blend.eyeBlinkLeft||0,blinkRight:blend.eyeBlinkRight||0,mouth:blend.jawOpen||0,smile:((blend.mouthSmileLeft||0)+(blend.mouthSmileRight||0))/2,brow:Math.max(blend.browInnerUp||0,((blend.browOuterUpLeft||0)+(blend.browOuterUpRight||0))/2)},points,duration:performance.now()-begin},points?[points.buffer]:[]);
  }finally{bitmap.close();}
}catch(e){scope.postMessage({type:'error',message:e instanceof Error?e.message:String(e)});}};
