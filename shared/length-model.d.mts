export function boundedInteger(value:unknown,fallback:number,min:number,max:number):number;
export function chainMeasure(lengthMm:number,thicknessMm:number,count:number):{lengthMm:number;thicknessMm:number;count:number;overlapMm:number;addedMm:number;starts:number[];joints:{start:number;end:number}[];totalMm:number};
export function boardMeasure(lengths:number[],overlaps:number[]):{starts:number[];materialMm:number;repeatedMm:number;totalMm:number;joints:{start:number;end:number}[]};
export function rulerReading(startMm:number,lengthMm:number):{startMm:number;endMm:number;lengthMm:number};
export function intervalMeasure(lengthMm:number,spacingMm:number,closed:boolean):{segments:number;points:number};
export const routePath:{x:number;y:number}[];
export function pointOnRoute(fraction:number):{x:number;y:number};
export function validateLengthScene(scene:import('../src/studio/types').LengthScene):number;
