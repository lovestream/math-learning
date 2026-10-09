export type OperationModel=
 |{type:'split-array';rows:number;cols:number;cut:number}
 |{type:'laws';rows:number;cols:number;piles:number[]}
 |{type:'division-groups';total:number;groups:number;perGroup:number}
 |{type:'wallet';start:number;pay:number;refund:number}
 |{type:'reverse';addend:number;multiplier:number;target:number}
 |{type:'substitution';left:number;right:number;copies:number};
export const operationModels:Record<string,OperationModel>;
export function arrayTurnPoint(col:number,row:number,cols:number,rows:number,turn:number):{x:number;y:number};
export function measureOperationModel(model:OperationModel,state?:{rows?:number;cols?:number;cut?:number}):Record<string,number|string>;
