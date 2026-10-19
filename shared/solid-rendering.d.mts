import type {SolidFace} from './hands-on-models.mjs';
export function composeSolid(solid:SolidFace[],azimuth:number,elevation:number):{scale:number;faces:{id:number;key:number;points:{x:number;y:number;depth:number}[];depth:number;shade:number}[]};
export function tint(hex:string,factor:number):string;
