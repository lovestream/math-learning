export type CodingPart={digits:string;name:string;detail:string};
export const idParts:CodingPart[];
export const postalParts:CodingPart[];
export const codingQuiz:{q:string;options:string[];correct:number;why:string}[];
export function classCode(grade:number,classNo:number,serial:number):string;
export function stableCode(year:number,serial:number):string;
export const identityGroups:{name:string;from:number;to:number}[];
