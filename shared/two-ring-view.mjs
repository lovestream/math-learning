import {chainMeasure,chainJointGeometry} from './length-model.mjs';

// A teaching comparison, not an alternative chain answer. No progress or score.
export function twoRingView(offsetMm=0){
  if(!Number.isFinite(offsetMm))throw Error('展开位移必须是有限数');
  const chain=chainMeasure(40,5,2),joint=chainJointGeometry(chain.thicknessMm);
  const offset=Math.round(Math.max(0,Math.min(chain.overlapMm,offsetMm))*10)/10;
  const first={left:chain.starts[0],right:chain.extensions[0].end};
  const originalSecond={left:chain.starts[1],right:chain.extensions[1].end};
  return {lengthMm:chain.lengthMm,thicknessMm:chain.thicknessMm,offsetMm:offset,first,originalSecond,
    second:{left:originalSecond.left+offset,right:originalSecond.right+offset},
    joint:{left:chain.joints[0].start,right:chain.joints[0].end,
      nextMetal:joint.nextMetal.map(p=>p+chain.joints[0].start),previousMetal:joint.previousMetal.map(p=>p+chain.joints[0].start)},
    overlapMm:chain.overlapMm,currentOverlapMm:chain.overlapMm-offset,
    extra:{left:chain.extensions[1].start,right:chain.extensions[1].end,lengthMm:chain.addedMm},
    coupledTotalMm:chain.totalMm,comparisonTotalMm:originalSecond.right+offset};
}
