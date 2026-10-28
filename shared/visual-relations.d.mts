export function moneyExchange(yuanA:number,jiaoA:number,yuanB:number,jiaoB:number):{yuan:number;jiao:number;carry:number;remainder:number;totalJiao:number;resultYuan:number};
export function supplyPlan(count:number,each:number,owned:number):{count:number;each:number;owned:number;demand:number;used:number;missing:number;surplus:number};
export function regroupPositions(count:number,oldEach:number,newEach:number,changed?:boolean):{total:number;each:number;groups:number;boxes:{x:number;y:number;width:number}[];items:{id:number;group:number;x:number;y:number}[]};
