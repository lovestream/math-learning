import {initialTextbookState,measureTextbook} from '../shared/textbook-models.mjs';
import {initialCoreState,measureCore} from '../shared/core-models.mjs';
// Course-family drivers perform mathematical work, never grant formal points.
export async function operateDesktop(page,lesson){
 const assert=(ok,m)=>{if(!ok)throw Error(lesson.lessonId+': '+m)},lab=page.locator('.classroom-stage');
 const actions=[],checks=[];const click=async (_lab,name)=>{await _lab.getByRole('button',{name,exact:true}).click();actions.push(name)};
 const hit=name=>click(lab,name),feedback=()=>lab.locator('.textbook-feedback').innerText(),has=async(text)=>assert((await lab.innerText()).includes(text),'未出现 '+text);
 const spec=lesson.conceptScenes?.[0],model=spec?.textbookSpec;
 const reset=lab.getByRole('button',{name:'重新开始',exact:true});if(await reset.count())await reset.click();
 if(lesson.interactionStatus==='static-visual'){
  assert(await lab.locator('.static-concept-figure').count()===1,'缺关系图');
  assert(await lab.locator('.static-concept-figure svg,[role=img]').count()>0,'关系图没有可见对象');
  const expected={
   'G3-U05-B01':['线段：两个端点','射线：一个端点','直线：没有端点'],
   'G3-U07-R01':['36份','2张贴纸','20张贴纸','？张贴纸'],
   'G3-L03-B01':['长7，宽4','边长都是4','斜角菱形','四边相等还不够'],
   'G3-L04-B01':['围栏','每小格1平方厘米','3行，每行4格'],
   'G3-L06-B03':['3.8元','2.5元','10角可以换成1元'],
   'G3-L07-R01':['24人，每人2张纸','每包12张，6元','本题不另给库存','15:10—15:50'],
  }[lesson.lessonId];
  for(const text of expected)assert((await lab.locator('.static-concept-figure').innerText()).includes(text),'静态关系缺少条件 '+text);
  checks.push(...expected,'源图形几何和数学关系已手工源审，静态对照不冒充操作');return {actionsPerformed:[],assertions:checks,mathBehavior:'static-relation-verified'};
 }
 if(model?.cases){
  const choice=0,c=model.cases[choice],context=model.contexts[choice];await lab.getByRole('combobox',{name:'选择操作情境'}).selectOption('0');
      if (model.type === "product-place") {
        for (let n = 0; n < c[1]; n++) await click(lab, "再放入一组");
        const amounts = (
          await lab.locator(".core-place-columns strong").allTextContents()
        ).map(Number);
        assert(
          amounts.reduce((sum, n, i) => sum + n * [1000, 100, 10, 1][i], 0) ===
            c[0] * c[1],
          "逐组乘法总量不对",
        );
        const names = ["千", "百", "十", "一"];
        for (let i = 3; i >= 1; i--) {
          for (let tries = 0; tries < 12; tries++) {
            const amount = Number(
              await lab
                .locator(".core-place-columns article")
                .nth(i)
                .locator("strong")
                .innerText(),
            );
            if (amount < 10) break;
            await click(lab, `捆10个${names[i]} → 1个${names[i - 1]}`);
          }
        }
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            `${c[0]}×${c[1]}=${c[0] * c[1]}`,
          ),
          "进位后错误",
        );
        await click(lab, "捆10个一 → 1个十");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不够10",
          ),
          "无效进位未拦截",
        );
      } else if (model.type === "share-place") {
        // Greedy place-value division, including thousands and empty tens.
        const names = ["千", "百", "十", "一"],
          groups = lab.locator(".core-share-groups article");
        for (let i = 0; i < 4; i++) {
          const amount = Number(
              await lab
                .locator(".core-place-columns article")
                .nth(i)
                .locator("strong")
                .innerText(),
            ),
            each = Math.floor(amount / c[1]);
          for (let g = 0; g < c[1]; g++)
            for (let k = 0; k < each; k++)
              await groups
                .nth(g)
                .getByRole("button", { name: "分1个" + names[i], exact: true })
                .click();
          if (i < 3) {
            const left = Number(
              await lab
                .locator(".core-place-columns article")
                .nth(i)
                .locator("strong")
                .innerText(),
            );
            for (let k = 0; k < left; k++)
              await click(lab, `拆1个${names[i]} → 10个${names[i + 1]}`);
          }
        }
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "每组都是" + c[0] / c[1],
          ),
          "不能完全平均分",
        );
        const unit = (c[0] / c[1]) % 10 ? "一" : "十";
        await groups
          .first()
          .getByRole("button", { name: "退回1个" + unit, exact: true })
          .click();
        await groups
          .nth(1)
          .getByRole("button", { name: "分1个" + unit, exact: true })
          .click();
        assert(
          !(await lab.locator(".textbook-feedback").innerText()).includes(
            "每组都是",
          ),
          "分错也完成",
        );
        await click(lab, "撤销上次操作");
        await groups.first().getByRole('button',{name:'分1个'+unit,exact:true}).click();
      } else if (model.type === "pack-remainder") {
        await click(lab, "检验余数");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不能算完成",
          ),
          "余数大却通过",
        );
        for (let n = 0; n < Math.floor(c[0] / c[1]); n++)
          await click(lab, context.kind==='strip'?'剪出一完整段':'装一满袋');
        await click(lab, context.kind==='strip'?'剪出一完整段':'装一满袋');
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不够做",
          ),
          "袋外数量不拦截",
        );
        await click(lab,"检验余数");
        assert((await lab.locator('.textbook-feedback').innerText()).includes(String(c[0]%c[1])), '完整余数错误');
        await click(lab, context.kind==='strip'?'拼回一段':'拆回一袋');
        await click(lab, "检验余数");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不能算完成",
          ),
          "撤袋后大余数被允许",
        );
        await click(lab,context.kind==='strip'?'剪出一完整段':'装一满袋');await click(lab,'检验余数');
      } else if (model.type === "fraction-core") {
        if (model.mode === "add") {
          for (let n = 1; n <= c[1] + c[2]; n++)
            await click(lab, "选择第" + n + "份");
          assert(
            (await lab.locator(".textbook-feedback").innerText()).includes(
              `合计${c[1] + c[2]}/${c[0]}`,
            ),
            "分数加法状态错误",
          );
          await click(lab, "放回第2次取出的1份");
          assert((await lab.locator(".textbook-feedback").innerText()).includes(`＝${c[1]+c[2]-1}/${c[0]}`),"放回一小份没有减少相同计量单位");
          await click(lab,"选择第"+(c[1]+c[2])+"份");
        } else {
          for (let n = 1; n <= c[2]; n++) await click(lab, "选择第" + n + "份");
          assert(
            (await lab.locator(".textbook-feedback").innerText()).includes(
              `共${(c[0] / c[1]) * c[2]}${context.unit}`,
            ),
            "分数实际量错误",
          );
        }
        await click(lab, "选择第1份");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "不能再重复取",
          ),
          "重复取份没拦截",
        );
        await click(lab, "撤销上次操作");
      } else if (model.type === "estimate-product") {
        await click(lab, "把人数估成" + c[3]);
        await click(lab, "把人数估成" + c[4]);
        await click(lab, "精算后检验预算");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "=" + c[0] * c[1] + "元",
          ),
          "估算费用不同数据源",
        );
      } else if (model.type === "nested-groups") {
        await click(lab,`登记第1${context.outer}第1${context.inner}`);
        await click(lab,`登记第1${context.outer}第1${context.inner}`);
        assert((await lab.locator('.textbook-feedback').innerText()).includes('不要重复'),'重复登记未阻止');
        for(let outer=1;outer<=c[0];outer++)for(let inner=1;inner<=c[1];inner++)if(outer!==1||inner!==1)await click(lab,`登记第${outer}${context.outer}第${inner}${context.inner}`);
        assert((await lab.locator('.textbook-feedback').innerText()).includes(String(c[0]*c[1]*c[2])),'层级总量不对');
        await click(lab,`反过来：按${context.outer}、${context.inner}分回去`);
      } else if (model.type === "invariant-table") {
        await click(lab, "总量不变");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "总价会随数量变化",
          ),
          "归一归总没区分",
        );
        await click(lab, "每份数量不变");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "=" + (c[1] / c[0]) * c[2] + "元",
          ),
          "单价不变费用不对",
        );
        await click(lab, "重新分装：总量不变");
        await click(lab, "总量不变");
        assert(
          (await lab.locator(".textbook-feedback").innerText()).includes(
            "=" + (c[3] * c[0]) / c[4] + context.outer,
          ),
          "总量不变分箱不对",
        );
      }
 checks.push('完成当前情境的数学目标及可用错误路径');
 }else if(model){await textbook();}
 else if(spec?.handsOnSpec){await physical(spec.handsOnSpec.mode);}
 else if(lesson.mathScenes?.length){await mixed();}
 else if(lesson.lengthScenes?.length){await length();}
 else if(spec?.modelSpec){await extension(spec.modelSpec);}
 else {await foundation(lesson.widget);}
 // Validate saved state with the production model AND independently calculated goal.
 await page.waitForFunction(id=>document.querySelector('.studio-breadcrumb [role=status]')?.textContent?.includes('操作已保存'),lesson.lessonId);
 const data=await(await page.request.get(new URL('/api/data',page.url()).href)).json(),widgets=data.progress.studio.reading[lesson.lessonId]?.widgets??{},state=widgets[lesson.articleBlocks.find(b=>b.widget).blockId];
 assert(state,'操作未存档');
 if(model){const initial=model.cases?initialCoreState(model,state.choice??0):initialTextbookState(model),clean=Object.fromEntries([...Object.keys(initial),'error','checked','choice'].filter(k=>state[k]!==undefined).map(k=>[k,state[k]])),m=measureTextbook(model,clean);
  if(model.type==='product-place')assert(m.normalized&&m.total===model.cases[0][0]*model.cases[0][1],'乘法没有完成全部进位');
  if(model.type==='pack-remainder')assert(m.remainder<model.cases[0][1]&&m.bags===Math.floor(model.cases[0][0]/model.cases[0][1]),'余数未完成');
  if(model.type==='division'||model.type==='share-place')assert(m.equal,'平均分未完成');
  checks.push('存档通过模型状态约束，完整目标经独立数值断言',JSON.stringify(m));
 }
 assert(actions.length>0,'没有真实数学动作');
 return {actionsPerformed:actions,assertions:checks,mathBehavior:'full-path-verified',savedState:state};

 async function mixed(){
  for(const scene of lesson.mathScenes){
   const index=lesson.mathScenes.indexOf(scene);if(lesson.mathScenes.length>1)await hit('场景 '+String.fromCharCode(65+index));else await hit('恢复初始状态');
   const ops=[],collect=n=>{if(n.type==='operation'){collect(n.left);collect(n.right);ops.push(n)}};collect(scene.expressionAST);
   const text=n=>n.type==='number'?String(n.value):(n.grouped?'(':'')+text(n.left)+' '+({add:'＋',subtract:'－',multiply:'×',divide:'÷'}[n.operator])+' '+text(n.right)+(n.grouped?')':'');
   const calc=n=>n.type==='number'?n.value:({add:(a,b)=>a+b,subtract:(a,b)=>a-b,multiply:(a,b)=>a*b,divide:(a,b)=>a/b}[n.operator])(calc(n.left),calc(n.right));
   await hit(text(ops[0]));await lab.getByRole('textbox',{name:'这一小步得到多少？',exact:true}).fill('-1');await hit('按预测算第一步');assert(await lab.locator('.operation-error').count()>0,'错误结果未阻止');
   for(let i=0;i<ops.length;i++){await lab.getByRole('textbox',{name:'这一小步得到多少？',exact:true}).fill(String(calc(ops[i])));await hit(i===0?'按预测算第一步':'算下一步')}
   await has('整条算式完成');checks.push(scene.sceneId+': AST独立计算='+calc(scene.expressionAST));
  }
 }
 async function physical(mode){
  if(mode==='observe'){for(const dir of ['正前方','右侧','上方']){await hit('从'+dir+'看');await hit('拍下当前方向')}assert(await lab.locator('.photo-shelf .projection-card').count()===3,'三视照片遗漏');}
  if(mode==='hidden'){const front=await lab.locator('[data-view=front] svg').innerHTML(),side=await lab.locator('[data-view=right] svg').innerHTML();await hit('后排加1块');assert(front===await lab.locator('[data-view=front] svg').innerHTML(),'遮挡正面改变');assert(side!==await lab.locator('[data-view=right] svg').innerHTML(),'右侧未改变');await hit('我选正面');await hit('用照片核对我的选择');await has('右面才能');await hit('我选右面');await hit('用照片核对我的选择');await has('右面能看到');}
  if(mode==='fold'){await hit('折成盒子');await lab.getByRole('slider',{name:'折叠程度'}).evaluate(e=>{if(e.value!=='100')throw Error('未闭合')});await hit('2号 · 左面');await lab.getByRole('combobox',{name:'比较的面'}).selectOption('4');await hit('我认为相邻');await hit('折好后核对两面');await has('相对，不共用棱');await hit('我认为相对');await hit('折好后核对两面');await has('你的判断吻合');}
  if(mode==='weigh'){await hit('称米袋');await hit('用千克显示');await has('1kg');await hit('杯、水与净重');await hit('称完整的一杯水');await hit('拆开称：空杯＋水');await hit('从秤上拿走单独的水');await has('0.12');await hit('天平与砝码');await hit('添加200克砝码');await hit('添加200克砝码');await has('横梁水平');await hit('添加500克砝码');await has('右盘低');await hit('撤销上次操作');await has('横梁水平');}
  if(mode==='boat'){await hit('模型象上船');await hit('标记模型象的水线');await hit('把模型象请下船');await has('太轻');for(const n of [2,4,5])await hit(`石块${n}上船`);await has('回到水面');for(const id of ['1','3','4']){await lab.getByRole('combobox',{name:'要称的石块'}).selectOption(id);await hit('称这一块，记下读数')}await hit('用水线与读数验证替换');await has('200＋300＋400＝900克');await hit('试试多上一名乘员');await hit('用水线与读数验证替换');await has('乘员也是载重');await hit('请乘员下船');await hit('用水线与读数验证替换');await has('900克');}
  checks.push('实物模型的目标关系、照片或等量替换经最终状态断言');
 }
 async function textbook(){
  const kind=model.type;
  if(kind==='place-value'){await hit('捆10个一 → 1个十');await has('48');await hit('捆10个一 → 1个十');await has('先凑够10');await hit('撤销上次操作');}
  else if(kind==='division'){
   const names=['百','十','一'],recipients=lab.locator('.bank-recipients article');
   for(let i=0;i<3;i++){
    // Read the live DOM counts, not asynchronously persisted state.
    let n=Number((await lab.locator('.bank-places article').nth(i).locator('h4').innerText()).match(/待整理(\d+)/)[1]);const each=Math.floor(n/model.groups);
    for(let g=0;g<model.groups;g++)for(let k=0;k<each;k++)await recipients.nth(g).getByRole('button',{name:'分1个'+names[i],exact:true}).click();
    n%=model.groups;for(let k=0;k<n&&i<2;k++)await hit(`拆1个${names[i]} → 10个${names[i+1]}`);
   }
   await has('全部分完');await recipients.first().getByRole('button',{name:'退回1个一',exact:true}).click();await recipients.nth(1).getByRole('button',{name:'分1个一',exact:true}).click();assert(!(await feedback()).includes('全部分完'),'不均分误判');await hit('撤销上次操作');await recipients.first().getByRole('button',{name:'分1个一',exact:true}).click();actions.push('全部分配、故意不均分、退回修复');
  }
  else if(kind==='angle'){await hit('叠上直角工具');await hit('让上边对齐直角边');await has('90°');const ray=lab.getByRole('slider',{name:'角的张口',exact:true});await ray.press('ArrowLeft');await has('锐角');await hit('让上边对齐直角边');}
  else if(kind==='fraction'){await hit('把折痕等距摆好');const cut=lab.getByRole('slider',{name:'移动第1条折痕'});await cut.press('ArrowRight');await has('各段不一样长');await hit('把折痕等距摆好');if(model.regroup){await hit('相邻两小格合成一大格');await has('1/3');}else{for(let i=1;i<=(lesson.lessonId==='G3-U06-B02'?3:1);i++)await hit('涂色或放回第'+i+'段');await has((lesson.lessonId==='G3-U06-B02'?'3/8':'1/4'));}}
  else if(kind==='outfits'){await hit('登记这套搭配');await hit('登记这套搭配');await has('重复');for(const shirt of ['A','B'])for(let p=1;p<=3;p++){await hit('选上衣'+shirt);await hit('选裤子'+p);await hit('登记这套搭配')}await has('6');}
  else if(kind==='coding'){await lab.getByRole('combobox',{name:'架号',exact:true}).selectOption('2');await lab.getByRole('combobox',{name:'编码每段位数',exact:true}).selectOption('2');await hit('为这个位置登记编号');await has('02-03-05');await hit('试试只写格号');await has('格号');}
  else if(kind==='paper-fold'){await hit('穿透两层打一孔');await has('先完全对折');await hit('完全对折');await hit('穿透两层打一孔');await hit('完全展开');assert(await lab.locator('circle:not([role=slider])').count()===2,'展开孔不成对');}
  else if(kind==='motion'){await hit('向右平移两格');await hit('绕尾端转90°');await has('90°');}
  else if(kind==='boundary'||kind==='joining'){if(kind==='joining')await hit('两块完整拼好');for(let i=1;i<=(kind==='joining'?6:4);i++)await lab.getByRole('button',{name:`描第${i}条外边`,exact:true}).last().click();await has(kind==='joining'?'18厘米':'26米');actions.push('逐边描完外周；不计内部接缝');}
  else if(kind==='tiling'){for(let i=1;i<=model.rows*model.cols;i++)await hit('铺第'+i+'块方砖');await has('24平方米');await hit('铺第1块方砖');assert(!(await feedback()).includes('25平方米'),'方砖重复计数');}
  else if(kind==='cut-area'){await hit('把剪块移到右边');await has('面积40');const h=lab.getByRole('slider',{name:'移动剪下的方块'});for(let i=0;i<8;i++)await h.press('ArrowLeft');await has('重叠');await hit('把剪块移到右边');await has('面积40');}
  else if(['vote','data-bins','sets'].includes(kind)){
   const names=['安安','贝贝','晨晨','多多','恩恩','芳芳','果果','欢欢','佳佳','可可','乐乐','萌萌','宁宁','平平','琪琪','然然','森森','甜甜'];
   const n=kind==='vote'?model.people:kind==='data-bins'?model.data.length:new Set([...model.left,...model.right]).size;
   for(let i=0;i<n;i++){const label=kind==='data-bins'?model.data[i]+'分钟':names[i];await hit('选择'+label);const expected=kind==='vote'?i%model.options.length:kind==='data-bins'?model.bins.findIndex(([a,b])=>model.data[i]>=a&&model.data[i]<=b):model.left.includes(i)&&model.right.includes(i)?1:model.left.includes(i)?0:2;await lab.locator('.textbook-bin-grid article').nth(expected).getByRole('button').first().click();actions.push(label+'→'+expected);}
   await hit('核对一人一次与分组条件');await has('全部'+n+'条各出现一次');
   if(kind==='vote'){await hit('试试给选中同学再投一票');await has('不能重复累计');await hit('撤销上次操作');}
   else{const i=kind==='sets'?5:2,label=kind==='data-bins'?model.data[i]+'分钟':names[i];await hit('移动或选择'+label);await lab.locator('.textbook-bin-grid article').first().getByRole('button').first().click();await hit('核对一人一次与分组条件');await has('需要重新核对');await hit('移动或选择'+label);await lab.locator('.textbook-bin-grid article').nth(1).getByRole('button').first().click();await hit('核对一人一次与分组条件');await has('全部'+n+'条各出现一次');}
  }
  else if(kind==='calendar'){await hit('2023年2月');await has('28天');await hit('2024年2月');await has('29天');if(lesson.lessonId==='G3-LP01-E01'){await lab.getByRole('spinbutton',{name:'月历年份'}).fill('2024');await lab.getByRole('combobox',{name:'月历月份'}).selectOption('10');}await hit('1');await hit('选中的日期向后7天');await hit('选中的日期向后7天');await has('选中15日');}
  else if(kind==='clock'){await hit('向前40分钟');await hit('向前5分钟');await has('经过45分钟');await hit('撤销上次操作');await has('16:00');await hit('向前5分钟');}
  else if(kind==='decimal'){await hit('数字5');await lab.getByRole('button',{name:'放入选中的数字',exact:true}).first().click();await has('最多4米');await hit('数字3');await lab.getByRole('button',{name:'放入选中的数字',exact:true}).nth(2).click();await has(lesson.lessonId==='G3-L06-B01'?'1.33':'0.93');actions.push('数位对齐与越界拦截');}
  else throw Error('未写教材驱动 '+kind);
  checks.push('专用教材模型完整结论与可用错误/逆操作');
 }
 async function extension(m){
  await hit('重新探索');
  if(m.type==='wallet'){await hit(m.pay+'＋'+m.refund);await hit('把净支出放进钱袋');await has('把退款又扣一次');await hit(m.pay+'－'+m.refund);await hit('把净支出放进钱袋');await has('余额：'+(m.start-m.pay+m.refund));}
  else if(m.type==='division-groups'){await hit(`总人数＝${m.groups}÷${m.perGroup}`);await hit('按选择平均分');await has('不能表示');await hit(`总人数＝${m.groups}×${m.perGroup}`);await hit('按选择平均分');assert(await lab.locator('.sharing-person').count()===m.groups*m.perGroup,'人数不符');}
  else if(m.type==='reverse'){await hit('减去'+m.addend);assert(await lab.locator('.operation-error').count()>0,'错误倒推未提示');await hit('除以'+m.multiplier);await hit('减去'+m.addend);await has('找回□＝'+(m.target/m.multiplier-m.addend));await has('题目原式');}
  else if(m.type==='substitution'){await hit(`□只包住${m.right}`);await hit('替换所选对象');await hit(`□包住（${m.left}＋${m.right}）`);await hit('替换所选对象');assert(await lab.locator('[data-substitution-frame=whole]').count()===m.copies,'替换对象不完整');}
  else{const range=lab.locator('input[type=range]');await range.press('Home');await range.press('ArrowRight');assert(await lab.locator('[data-array-cut]').getAttribute('data-array-cut')==='2','滑块不对应分块');if(m.type==='laws')await hit(`换计数方向：${m.rows}组，每组${m.cols}`);await hit('执行并核对预测');await has('＝'+m.rows*m.cols);}
  checks.push('完整推理/不变量和典型错误纠正');
 }
 async function length(){
  const s=lesson.lengthScenes[0],mode=s.mode;
  if(mode==='chain'){for(const target of [2,5]){await lab.getByRole('combobox',{name:'目标链环个数'}).selectOption(String(target));for(let i=1;i<target;i++)await hit('接上一个链环');assert(await lab.locator('.ring-enter').count()===target,'环数错误');assert(await lab.getByRole('button',{name:/放大第.*处接头/}).count()===target-1,'接头数错误');await hit('放大第1处接头');await hit('撤下最后一个链环');assert(await lab.locator('.ring-enter').count()===target-1,'撤环错误');await hit('接上一个链环');}await lab.locator('.lab-guess input').fill('200');await hit('和我的预测核对');await has('发现一个');await lab.locator('.lab-guess input').fill('160');await hit('和我的预测核对');await has('预测和实验对上了');}
  else if(mode==='boards'){await hit('两板首尾相接');const h=lab.getByRole('slider',{name:'拖动乙板改变重叠厘米数'});await h.press('Home');assert(await h.getAttribute('aria-valuenow')==='0','无重叠边界');await h.press('End');assert(await h.getAttribute('aria-valuenow')==='12','最大重叠');for(let i=0;i<4;i++)await h.press('ArrowRight');await lab.locator('.lab-guess input').fill('47');await hit('和我的预测核对');await has('预测和实验对上了');}
  else if(mode==='ruler'){await hit('把零刻度对齐左端');await hit('试试零刻度坏了');const h=lab.getByRole('slider',{name:'移动尺子调整小棒左端的毫米读数'});await h.press('End');assert(await h.getAttribute('aria-valuenow')==='45','起点边界');await h.press('Home');for(let i=0;i<20;i++)await h.press('ArrowLeft');assert(await h.getAttribute('aria-valuenow')==='20','非零起点');await lab.locator('.lab-guess input').fill(String(s.endMm-s.startMm));await hit('和我的预测核对');await has('预测和实验对上了');}
  else if(mode==='route'){await lab.getByRole('combobox',{name:'路线每段长度'}).selectOption('200000');await hit('回学校');for(let i=0;i<5;i++)await hit('再走200米');await has('已走 1000 米');await hit('退一段');await hit('再走200米');}
  else if(mode==='interval'){for(const name of ['一条直绳','把首尾接起来']){await hit(name);for(let i=0;i<6;i++)await lab.getByRole('button',{name:/走一段/}).click();assert(await lab.locator('.lab-rope-pin').count()===(name==='一条直绳'?7:6),'间隔点数错误');await hit('退一段');await lab.getByRole('button',{name:/走一段/}).click();actions.push('六段全部走完与退回');}}
  checks.push('长度/点数/端点单位不变量，完整与边界撤回');
 }
 async function foundation(kind){
  if(kind==='quantity'){await hit('拿出全部苹果，重新配一次');for(const b of await lab.locator('.lunchboxes>button').all())await b.click();await has('已经配好 7');await hit('摆开一点');assert(await lab.locator('.apple-row.spread span').count()===7,'摆开改变数量');}
  else if(kind==='addition'){await hit('回到左3、右2');await hit('右篮挪1个到左篮');await has('4＋1＝5');await hit('左篮挪1个到右篮');await has('3＋2＝5');await hit('从厨房新添1个到右篮');await has('3＋3＝6');}
  else if(kind==='subtraction'){await hit('送出贴纸：求剩下');await hit('把送出的贴纸拿回来');for(let i=1;i<=5;i++)await hit('送出第'+i+'张贴纸');await has('9−5＝4');await hit('比较两人的贴纸：求相差');await hit('两人各新得1张');await has('10−6＝4');await hit('只有朋友新得1张');await has('10−7＝3');}
  else if(kind==='substitution'){await hit('合上盒子，再数一次');for(let i=1;i<=3;i++)await hit('打开第'+i+'盒');assert(await lab.locator('.snack-contents.opened').count()===3,'拆盒丢物件');await has('3乙＋6');}
  else if(kind==='balance'){await hit('1袋＋3颗，共10颗');await hit('只从左边拿走3颗');assert(await lab.locator('.candy-comparison.unequal').count()===1,'单边拿仍等量');await hit('回到开始');await hit('两边各拿走3颗');assert(await lab.locator('.candy-comparison.equal').count()===1,'同减不等量');await has('x＝7');}
  else if(kind==='area'){await hit('重新数一次');for(let i=1;i<=12;i++)await hit('第'+i+'块地垫');for(let i=0;i<14;i++)await hit('沿外圈走1厘米');await has('14厘米');await hit('2排 · 每排6块');for(let i=0;i<16;i++)await hit('沿外圈走1厘米');await has('16厘米');}
  else if(kind==='fraction'){await hit('回到6份，拿2份');await hit('把每2小份合成1大份');await has('一样长');await has('2/6＝1/3');await lab.locator('.ribbon-controls select').first().selectOption('2');await has('2/3');actions.push('同整体重组及不同整体实际量');}
  else throw Error('未知基础教具 '+kind);
  checks.push('基础桥梁完整关系与逆操作/守恒对照');
 }
}
