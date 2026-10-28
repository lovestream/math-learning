// Deterministic teaching diagrams: integer units, one mathematical source of truth.
export function moneyExchange(yuanA,jiaoA,yuanB,jiaoB){
 if(![yuanA,yuanB,jiaoA,jiaoB].every(Number.isSafeInteger)||yuanA<0||yuanB<0||jiaoA<0||jiaoA>9||jiaoB<0||jiaoB>9)throw Error('元角条件无效');
 const yuan=yuanA+yuanB,jiao=jiaoA+jiaoB,carry=Math.floor(jiao/10),remainder=jiao%10;
 return {yuan,jiao,carry,remainder,totalJiao:yuan*10+jiao,resultYuan:yuan+carry};
}
export function supplyPlan(count,each,owned){
 if(![count,each,owned].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('材料条件无效');
 const demand=count*each,used=Math.min(owned,demand);return {count,each,owned,demand,used,missing:Math.max(0,demand-owned),surplus:Math.max(0,owned-demand)};
}
export function regroupPositions(count,oldEach,newEach,changed=false){
 if(![count,oldEach,newEach].every(n=>Number.isSafeInteger(n)&&n>0)||count*oldEach%newEach)throw Error('须能把同一批材料完整分组');
 const total=count*oldEach,each=changed?newEach:oldEach,groups=total/each;
 // Fixed item IDs are the same objects in both arrangements; only x/y change.
 const columns=Math.min(groups,6),boxWidth=570/columns;
 return {total,each,groups,boxes:Array.from({length:groups},(_,i)=>({x:35+(i%columns)*boxWidth,y:62+Math.floor(i/columns)*122,width:boxWidth-12})),items:Array.from({length:total},(_,id)=>{const g=Math.floor(id/each),slot=id%each;return {id,group:g,x:35+(g%columns)*boxWidth+12+(slot%Math.min(each,5))*((boxWidth-35)/Math.min(each,5)),y:88+Math.floor(g/columns)*122+Math.floor(slot/Math.min(each,5))*25};})};
}
