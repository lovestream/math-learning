// Explicit textbook activities. Manipulation is exploration, never mastery or credit.
export const textbookModels={
 'G3-U04-B02':{type:'place-value',version:'textbook.v1',title:'把10个一换成1个十',total:48,bank:[0,3,18]},
 'G3-UP02-B01':{type:'coding',version:'textbook.v1',title:'给书架位置编一个地址',limits:[3,4,8]},
 'G3-U05-B02':{type:'angle',version:'textbook.v1',title:'张口、边长、整体朝向是三件事',angle:45},
 'G3-U05-B03':{type:'angle',version:'textbook.v1',title:'把直角工具和待测角对齐',angle:65},
 'G3-U06-B01':{type:'fraction',version:'textbook.v1',title:'你来折、分、取一份',parts:4},
 'G3-U06-B02':{type:'fraction',version:'textbook.v1',title:'分八份，自己涂三份',parts:8},
 'G3-U06-E01':{type:'fraction',version:'textbook.v1',title:'移动分组线，蓝色长度不动',parts:6,regroup:true},
 'G3-U07-B01':{type:'outfits',version:'textbook.v1',title:'亲手配一套，再检查遗漏',shirts:2,pants:3},
 'G3-L01-B01':{type:'paper-fold',version:'textbook.v1',title:'折上、打孔、展开看对应位置'},
 'G3-L01-B02':{type:'motion',version:'textbook.v1',title:'把箭头平移，再绕尾端旋转'},
 'G3-L02-B02':{type:'division',version:'textbook.v1',title:'把52颗糖分给4人',total:52,groups:4,bank:[0,5,2]},
 'G3-L02-B04':{type:'division',version:'textbook.v1',title:'408本书按百、十、个分给4班',total:408,groups:4,bank:[4,0,8]},
 'G3-L03-B02':{type:'boundary',version:'textbook.v1',title:'沿花坛的四条边走一圈',width:8,height:5},
 'G3-L03-E01':{type:'joining',version:'textbook.v1',title:'拖方块拼合，再沿外边走',side:3},
 'G3-L04-B02':{type:'tiling',version:'textbook.v1',title:'一块一块铺满，再解释每行',cols:6,rows:4},
 'G3-L04-B03':{type:'cut-area',version:'textbook.v1',title:'移动剪下的一块，面积与周长一起看',cols:8,rows:5,cutCols:3,cutRows:2},
 'G3-L05-B01':{type:'vote',version:'textbook.v1',title:'每个人只投一票',people:18,options:['公园','科技馆','图书馆']},
 'G3-L05-B02':{type:'data-bins',version:'textbook.v1',title:'把阅读分钟卡拖入唯一分组',data:[5,8,10,12,15,18,20,22],bins:[[0,9],[10,19],[20,100]]},
 'G3-LP01-B01':{type:'calendar',version:'textbook.v1',title:'换年份，二月天数也要核对'},
 'G3-LP01-E01':{type:'calendar',version:'textbook.v1',title:'日期往前走，星期每七天循环'},
 'G3-LP01-B02':{type:'clock',version:'textbook.v1',title:'从15:20走到16:05',start:920,end:965},
 'G3-L06-B01':{type:'decimal',version:'textbook.v1',title:'把3放在分米位还是厘米位',digits:[1,3,0]},
 'G3-L06-B02':{type:'decimal',version:'textbook.v1',title:'在同一把米尺上比较两个位置',digits:[0,9,0],reference:85},
 'G3-L07-B01':{type:'sets',version:'textbook.v1',title:'同一个名字只放一次',left:[0,1,2,3,4,5,6,7],right:[5,6,7,8,9,10,11]}
};
const check=(ok,message)=>{if(!ok)throw Error(message)};
const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export const bankValue=bank=>bank.reduce((sum,n,i)=>sum+n*[100,10,1][i],0);
export function initialTextbookState(model){
 switch(model.type){
  case 'place-value':case 'division':return {bank:[...model.bank],alloc:Array((model.groups??0)*3).fill(0)};
  case 'coding':return {alloc:[2,3,5],width:2,marked:[],show:true};
  case 'angle':return {angle:model.angle,rotation:0,sideLength:125,show:false};
  case 'fraction':return {parts:model.parts,cuts:model.regroup?[0,420,840,1260,1680,2100,2520]:[0,2520],filled:model.regroup?[0,840]:[]};
  case 'outfits':return {shirt:0,pants:0,marked:[]};
  case 'paper-fold':return {angle:0,marked:[]};
  case 'motion':return {left:150,top:190,rotation:0,mode:'translate'};
  case 'boundary':return {marked:[]};
  case 'joining':return {offset:160,marked:[]};
  case 'tiling':return {filled:[]};
  case 'cut-area':return {left:5,top:3};
  case 'vote':return {alloc:Array(model.people).fill(0),choice:0};
  case 'data-bins':return {alloc:Array(model.data.length).fill(0),choice:0};
  case 'calendar':return {year:2024,month:2,marked:[]};
  case 'clock':return {minutes:model.start};
  case 'decimal':return {alloc:[...model.digits]};
  case 'sets':return {alloc:Array(new Set([...model.left,...model.right]).size).fill(0),choice:0};
 }
 throw Error('未注册教材教具');
}
export function gridCells(model,state){
 const cells=[];for(let y=0;y<model.rows;y++)for(let x=0;x<model.cols;x++)if(x<model.cols-model.cutCols||y<model.rows-model.cutRows)cells.push([x,y]);
 for(let y=0;y<model.cutRows;y++)for(let x=0;x<model.cutCols;x++)cells.push([state.left+x,state.top+y]);return cells;
}
export function gridPerimeter(cells){const keys=new Set(cells.map(([x,y])=>`${x},${y}`));return cells.reduce((p,[x,y])=>p+[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>!keys.has(`${x+a},${y+b}`)).length,0)}
export const leapYear=year=>year%4===0&&(year%100!==0||year%400===0);
export function monthDays(year,month){return new Date(Date.UTC(year,month,0)).getUTCDate()}
export function measureTextbook(model,state){
 validateTextbookState(model,state);
 switch(model.type){
  case 'place-value':case 'division':{const pending=bankValue(state.bank),shares=Array.from({length:model.groups??0},(_,i)=>bankValue(state.alloc.slice(i*3,i*3+3)));return {pending,shares,total:pending+shares.reduce((a,b)=>a+b,0),equal:pending===0&&shares.length>0&&shares.every(n=>n===shares[0]),normalized:state.bank.every((n,i)=>i===0||n<10)}}
  case 'coding':{const [a,b,c]=state.alloc,address=(a-1)*32+(b-1)*8+c;return {address,code:state.alloc.map(n=>String(n).padStart(state.width,'0')).join(state.show?'-':''),fits:state.alloc.every(n=>String(n).length<=state.width)}}
  case 'angle':return {degrees:state.angle,kind:state.angle===90?'直角':state.angle<90?'锐角':'钝角'};
  case 'fraction':{const cuts=state.cuts,spans=cuts.slice(1).map((n,i)=>n-cuts[i]),equal=spans.every(n=>n===2520/spans.length),length=state.filled.reduce((n,v,i)=>n+(i%2?v:-v),0),selected=spans.filter((n,i)=>state.filled.some((v,j)=>j%2===0&&cuts[i]>=v&&cuts[i+1]<=state.filled[j+1])).length;return {equal,parts:spans.length,selected,length,whole:2520}}
  case 'outfits':return {count:state.marked.length,total:model.shirts*model.pants};
  case 'paper-fold':return {holes:state.marked.length*(state.angle===180?1:2),folded:state.angle===180};
  case 'motion':return {direction:state.rotation,distance:Math.hypot(state.left-150,state.top-190)};
  case 'boundary':{const lengths=[model.width,model.height,model.width,model.height];return {walked:state.marked.reduce((n,i)=>n+lengths[i],0),perimeter:2*(model.width+model.height),edges:lengths}}
  case 'joining':return {joined:state.offset===0,edges:state.offset===0?6:8,perimeter:state.offset===0?model.side*6:model.side*8,walked:state.marked.length*model.side};
  case 'tiling':return {area:state.filled.length,total:model.rows*model.cols,fullRows:Array.from({length:model.rows},(_,r)=>state.filled.filter(i=>Math.floor(i/model.cols)===r).length)};
  case 'cut-area':{const cells=gridCells(model,state),unique=new Set(cells.map(p=>p.join(',')));return {area:unique.size,overlap:cells.length-unique.size,perimeter:gridPerimeter([...unique].map(k=>k.split(',').map(Number)))}}
  case 'vote':case 'data-bins':{const count=model.type==='vote'?model.options.length:model.bins.length,counts=Array.from({length:count},(_,i)=>state.alloc.filter(v=>v===i+1).length),incorrect=model.type==='vote'?[]:state.alloc.flatMap((bin,i)=>bin&&!(model.data[i]>=model.bins[bin-1][0]&&model.data[i]<=model.bins[bin-1][1])?[i]:[]);return {counts,assigned:counts.reduce((a,b)=>a+b,0),incorrect}}
  case 'calendar':return {days:monthDays(state.year,state.month),offset:(new Date(Date.UTC(state.year,state.month-1,1)).getUTCDay()+6)%7,leap:leapYear(state.year)};
  case 'clock':return {elapsed:state.minutes-model.start,hour:Math.floor(state.minutes/60),minute:state.minutes%60,reached:state.minutes===model.end};
  case 'decimal':{const cm=state.alloc[0]*100+state.alloc[1]*10+state.alloc[2];return {cm,dm:cm/10,m:cm/100}}
  case 'sets':{const counts=[1,2,3].map(zone=>state.alloc.filter(n=>n===zone).length),incorrect=state.alloc.flatMap((zone,i)=>{const l=model.left.includes(i),r=model.right.includes(i),expected=l&&r?2:l?1:3;return zone&&zone!==expected?[i]:[]});return {counts,assigned:counts.reduce((a,b)=>a+b,0),incorrect,total:new Set([...model.left,...model.right]).size}}
 }
}
export function validateTextbookState(model,state){
 const base=initialTextbookState(model),optional=new Set(['checked','error','choice']);
 for(const k of Object.keys(state))check(k in base||optional.has(k),`本教具不使用参数${k}`);
 for(const k of Object.keys(base))check(state[k]!==undefined,`缺少参数${k}`);
 if(state.checked!==undefined)check(typeof state.checked==='boolean','核对状态无效');
 if(state.choice!==undefined)check(int(state.choice,0,20),'所选记录无效');
 if(state.error!==undefined)check(typeof state.error==='string'&&state.error.length<=240,'错误说明过长');
 for(const k of ['bank','alloc','marked','filled','cuts'])if(state[k])check(Array.isArray(state[k])&&state[k].length<=120&&state[k].every(n=>int(n,0,10000)),'无效教具数组');
 for(const k of ['marked','filled'])if(state[k])check(new Set(state[k]).size===state[k].length,'物体或记录不能重复');
 switch(model.type){
  case 'place-value':case 'division':check(state.bank.length===3&&state.alloc.length===(model.groups??0)*3&&bankValue(state.bank)+state.alloc.reduce((sum,n,i)=>sum+n*[100,10,1][i%3],0)===model.total,'小棒拆换与分配必须保持总量');break;
  case 'coding':check(state.alloc.length===3&&state.alloc.every((n,i)=>int(n,1,model.limits[i]))&&int(state.width,1,3)&&typeof state.show==='boolean'&&state.marked.every(n=>int(n,1,96)),'书架地址无效');break;
  case 'angle':check(int(state.angle,1,179)&&int(state.rotation,0,359)&&int(state.sideLength,55,170)&&typeof state.show==='boolean','角参数无效');break;
  case 'fraction':check(int(state.parts,2,10)&&state.cuts.length>=2&&state.cuts[0]===0&&state.cuts.at(-1)===2520&&state.cuts.every((n,i)=>int(n,0,2520)&&(i===0||n>state.cuts[i-1]))&&state.filled.length%2===0&&state.filled.every((n,i)=>int(n,0,2520)&&(i===0||n>state.filled[i-1])),'纸带端点、折痕与涂色无效');break;
  case 'outfits':check(int(state.shirt,0,model.shirts-1)&&int(state.pants,0,model.pants-1)&&state.marked.every(n=>n<model.shirts*model.pants),'搭配无效');break;
  case 'paper-fold':check(int(state.angle,0,180)&&state.marked.every(n=>int(n,0,5)),'折纸参数无效');break;
  case 'motion':check(int(state.left,110,530)&&int(state.top,110,240)&&int(state.rotation,0,359)&&['translate','rotate'].includes(state.mode),'运动参数无效');break;
  case 'boundary':check(state.marked.every(n=>n<4),'边界重复或错误');break;
  case 'joining':check(int(state.offset,0,180)&&state.marked.every(n=>n<(state.offset===0?6:8)),'拼接边界无效');break;
  case 'tiling':check(state.filled.every(n=>n<model.rows*model.cols),'铺砖超出地面');break;
  case 'cut-area':check(int(state.left,0,9)&&int(state.top,0,6),'剪块位置无效');break;
  case 'vote':check(state.alloc.length===model.people&&state.alloc.every(n=>int(n,0,model.options.length)),'投票无效');break;
  case 'data-bins':check(state.alloc.length===model.data.length&&state.alloc.every(n=>int(n,0,model.bins.length)),'分组无效');break;
  case 'calendar':check(int(state.year,1900,2100)&&int(state.month,1,12)&&state.marked.every(n=>int(n,1,monthDays(state.year,state.month))),'月历无效');break;
  case 'clock':check(int(state.minutes,0,1440),'时刻无效');break;
  case 'decimal':check(state.alloc.length===3&&state.alloc.every(n=>int(n,0,9))&&state.alloc[0]<=4,'数位无效');break;
  case 'sets':check(state.alloc.length===new Set([...model.left,...model.right]).size&&state.alloc.every(n=>int(n,0,3)),'集合分类无效');break;
 }
 return state;
}
