import {useEffect,useRef,useState} from 'react';

// Animate the picture only. Persist one mathematical target, never animation frames.
export function useMotionValue(target:number,duration=550){
 const [value,setValue]=useState(target),current=useRef(target);
 useEffect(()=>{
  if(duration===0||window.matchMedia('(prefers-reduced-motion: reduce)').matches){current.current=target;setValue(target);return}
  const from=current.current,start=performance.now();let frame=0;
  const tick=(now:number)=>{const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t);current.current=t===1?target:from+(target-from)*ease;setValue(current.current);if(t<1)frame=requestAnimationFrame(tick)};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[target,duration]);
 return value;
}

export function useMotionAngle(target:number,duration=550){
 const angle=useRef({raw:target,unwrapped:target});
 if(angle.current.raw!==target){angle.current.unwrapped+=((target-angle.current.raw+540)%360)-180;angle.current.raw=target}
 return useMotionValue(angle.current.unwrapped,duration);
}
