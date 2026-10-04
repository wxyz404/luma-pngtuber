export interface FaceCandidate {x:number;y:number;size:number;shape:number[]}
/** Continuity lock, not biometric identity recognition. Once lost for 1s, explicit reacquisition is required. */
export class FaceLock {
  private anchor?:FaceCandidate;private seen=0;private expired=false;private missing=false;
  reset(){this.anchor=undefined;this.seen=0;this.expired=false;this.missing=false;}
  select(faces:FaceCandidate[],time:number):number {
    if(this.expired)return -1;
    if(!this.anchor){if(!faces.length)return -1;const i=faces.reduce((best,f,index)=>f.size>faces[best].size?index:best,0);this.anchor=faces[i];this.seen=time;return i;}
    if(this.missing&&time-this.seen>1000){this.expired=true;return -1;}
    let index=-1,best=Infinity;
    faces.forEach((f,i)=>{const distance=Math.hypot(f.x-this.anchor!.x,f.y-this.anchor!.y);const ratio=f.size/this.anchor!.size;const shape=f.shape.reduce((sum,v,j)=>sum+Math.abs(v-(this.anchor!.shape[j]||v)),0)/f.shape.length;
      if(distance<.18&&ratio>.65&&ratio<1.55&&shape<.2&&distance+shape<best){best=distance+shape;index=i;}});
    if(index>=0){this.anchor=faces[index];this.seen=time;this.missing=false;}else{this.missing=true;if(time-this.seen>1000)this.expired=true;}return index;
  }
}
