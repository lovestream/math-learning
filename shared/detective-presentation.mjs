// Retain the API's complete inbox inventory. The child sees each exact case
// version only once; a newer active version may coexist with today's snapshot.
export function visibleArrivals(today=[],arrivals=[]){
 const shown=new Set(today.map(p=>JSON.stringify([p.case.id,p.case.version])));
 return arrivals.filter(p=>{const key=JSON.stringify([p.case.id,p.case.version]);if(shown.has(key))return false;shown.add(key);return true;});
}
export function wrapFigure(visual){
 if(visual?.kind!=='manual'||visual.values.length!==4||visual.values[2]!=='同一根线，长度不变'||visual.values[3]!=='示意条件；每圈绕得一样长')return null;
 const low=/^绕(\d+)圈后：还多(\d+)分米$/.exec(visual.values[0]),high=/^绕(\d+)圈：还差(\d+)分米$/.exec(visual.values[1]);if(!low||!high)return null;
 const [a,s,b,t]=[+low[1],+low[2],+high[1],+high[2]];
 if(a<1||b<=a||b>12||s<1||s>100||t<1||t>100)return null;
 const circle=(s+t)/(b-a),scale=440/(b*circle);
 return {lowTurns:a,highTurns:b,surplus:s,shortage:t,turnWidth:circle*scale,wireWidth:(a*circle+s)*scale,fullWidth:440};
}
