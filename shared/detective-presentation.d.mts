export function visibleArrivals<T extends {case:{id:string;version:string}}>(today?:T[],arrivals?:T[]):T[];
export function wrapFigure(visual:{kind:string;values:string[]}):{lowTurns:number;highTurns:number;surplus:number;shortage:number;turnWidth:number;wireWidth:number;fullWidth:number}|null;
