import { it,expect } from 'vitest';import { FaceLock } from '../src/tracking/face-lock';
const face=(x:number,size=.3)=>({x,y:.5,size,shape:[1.2,.5,.4]});
it('locks first face even when another face becomes larger',()=>{const l=new FaceLock();expect(l.select([face(.3),face(.8,.2)],100)).toBe(0);expect(l.select([face(.31),face(.8,.4)],200)).toBe(0);expect(l.select([face(.8,.4)],300)).toBe(-1);});
it('requires reacquisition after prolonged loss',()=>{const l=new FaceLock();l.select([face(.3)],100);expect(l.select([],1200)).toBe(-1);expect(l.select([face(.3)],1300)).toBe(-1);l.reset();expect(l.select([face(.8)],1400)).toBe(0);});
it('does not expire a continuously visible face when inference is slow',()=>{const l=new FaceLock();l.select([face(.3)],100);expect(l.select([face(.31)],1400)).toBe(0);});
