// Teaching labels refer to the active story, never to taskMode's internal A/B enum.
export function mixedSceneContext(scenes, sceneId) {
 const index=Math.max(0,scenes.findIndex(s=>s.sceneId===sceneId)),scene=scenes[index];
 if(!scene)return null;
 const q=id=>scene.story.quantities.find(q=>q.id===id)?.value;
 const missions={
  'people-line':'按当前故事的发生顺序，先拿走，再加入；说清每一步还剩多少。',
  'group-boxes':`先把${q('beads')}颗珠子每${q('perBox')}颗装一盒，再看每盒需要的标签。`,
  'combine-then-share':`先想${q('red')}颗红珠和${q('blue')}颗蓝珠是否都要装盒，再按每盒${q('perBox')}颗分装。`,
  'bags-plus-loose':`原有${q('bags')}袋已经装好；只把${q('loose')}颗散珠每${q('perBag')}颗装一袋，再求共有几袋。`,
  'money-flow':'分别认清原有、付出和退回的钱，比较逐次记账与先求实际花费。',
 };
 const mode=scene.taskMode==='B_equivalent_rewrite'?'等值改写':scene.taskMode==='C_operation_law'?'运算律':'运算顺序';
 return {scene,index,label:`场景 ${String.fromCharCode(65+index)} · ${mode}`,mission:missions[scene.model.type]??'先读清当前故事中每个数的单位，再判断第一步要解决什么。'};
}

export function coreSceneMission(model,state={}){
 const context=model.contexts[state.choice??0],c=model.cases[state.choice??0];
 const goals={
  'product-place':'先按当前每份数量逐组合并，再解释每次满十换一；合并不改变总量。',
  'share-place':'把当前总数平均分，分完以后还要检查每份一样多。',
  'estimate-product':'以当前预算为准，先选上界或下界，说明它能保证什么，再精算验证。',
  'pack-remainder':`按当前每${context.group}的${context.unit}数分组，剩下的还够做一完整${context.group}吗？`,
  'nested-groups':'按当前情境逐层记录数量，检查每个小组都恰好登记一次。',
  'invariant-table':state.mode==='total'?'同一批材料只换分装方法；先说什么没变，再看每份数量和份数怎样变。':'当前商品的单价不变；先求每份价格，再求新的总价。',
  'fraction-core':model.mode==='add'?`两次都以同一整体为准，分别取${c[1]}/${c[0]}与${c[2]}/${c[0]}，不能重复拿同一份。`:'先认清当前整体与平均份数，再求一份和指定几份的数量。',
 };
 return goals[model.type];
}
