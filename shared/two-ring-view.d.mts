export function twoRingView(offsetMm?:number):{
 lengthMm:number;thicknessMm:number;offsetMm:number;
 first:{left:number;right:number};originalSecond:{left:number;right:number};second:{left:number;right:number};
 joint:{left:number;right:number;nextMetal:number[];previousMetal:number[]};
 overlapMm:number;currentOverlapMm:number;extra:{left:number;right:number;lengthMm:number};coupledTotalMm:number;comparisonTotalMm:number;
};
