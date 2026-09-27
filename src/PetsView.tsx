import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Check, ChevronRight, Gift, Heart, Home, Leaf, MessageCircle, Moon, Sparkles, Star, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { api } from './api';
import PetPortrait, { PETS, PET_ITEMS, PET_LEVELS, petLevel } from './PetPortrait';
import type { Data, Progress, PetMission } from './types';
import './pets.css';

type Props={data:Data;setProgress:(p:Progress)=>void;notify:(message:string)=>void;onLearn:(route:string)=>void};
type Tab='bag'|'friends'|'home'|'memories';
const uid=()=>`care:${crypto.randomUUID()}`;
const sceneNames:Record<string,string>={meadow:'晴日花园',sunset:'晚霞小屋',starlight:'星夜小屋'};
const formatDate=(at:string)=>new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric'}).format(new Date(at));
const voiceLines:Record<string,{text:string;file:string}[]>={
  dongdong:[{text:'今天也会有好事发生咩！',file:'dongdong-good-day.mp3'},{text:'DongDong 今天也很喜欢你咩！',file:'dongdong-likes-you.mp3'}],
  honey:[{text:'勤劳的小蜜蜂来了咩！',file:'honey-hello.mp3'}],
  ducky:[{text:'做 DongDong 的旅行搭子咩？',file:'ducky-travel.mp3'}]
};

export default function PetsView({data,setProgress,notify,onLearn}:Props) {
  const p=data.progress, active=p.pets.active, pet=PETS[active], care=p.pets.care;
  const friend=care.friends[active], level=petLevel(friend.growth), current=PET_LEVELS[level], next=PET_LEVELS[level+1];
  const percent=next?Math.min(100,(friend.growth-current.xp)/(next.xp-current.xp)*100):100;
  const [tab,setTab]=useState<Tab>('bag'),[busy,setBusy]=useState(false),[speech,setSpeech]=useState('DongDong 是你的冬日暖羊咩！');
  const [animation,setAnimation]=useState(''),[effect,setEffect]=useState(''),[selectedFood,setSelectedFood]=useState<string|null>(null);
  const [playing,setPlaying]=useState(false),[stars,setStars]=useState(0),[showGrowth,setShowGrowth]=useState(false),[showSources,setShowSources]=useState(false),[showLegacy,setShowLegacy]=useState(false);
  const [missions,setMissions]=useState<PetMission[]>([]),[missionError,setMissionError]=useState('');
  const [audioState,setAudioState]=useState(''),[tilt,setTilt]=useState(0),[dragOver,setDragOver]=useState(false);
  const audio=useRef<HTMLAudioElement|null>(null),lock=useRef(false),talkCount=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null),starLock=useRef(false);
  const [wish,setWish]=useState('honey');
  const wanted=PETS[wish];
  const recent=care.memories.filter(m=>m.pet===active);

  useEffect(()=>{let live=true;const load=()=>api.petMissions().then(out=>{if(live){setMissions(out.missions);setMissionError('')}}).catch(e=>{if(live)setMissionError(e.message)});void load();const interval=setInterval(load,60000);return()=>{live=false;clearInterval(interval)}},[p]);
  useEffect(()=>{setSpeech(active==='dongdong'?'DongDong 是你的冬日暖羊咩！':`今天让${pet.name}陪你一起探险吧！`);setSelectedFood(null);setPlaying(false);setStars(0);setAnimation('');setEffect('');setAudioState('');talkCount.current=0;starLock.current=false;audio.current?.pause();},[active,pet.name]);
  useEffect(()=>{if(!p.settings.sound){audio.current?.pause();setAudioState('')}},[p.settings.sound]);
  useEffect(()=>()=>{audio.current?.pause();if(timer.current)clearTimeout(timer.current)},[]);

  function animate(kind:string,label='') {
    if(timer.current)clearTimeout(timer.current);
    setAnimation('');setEffect(label);
    requestAnimationFrame(()=>setAnimation(kind));
    timer.current=setTimeout(()=>{setAnimation('');setEffect('')},1800);
  }
  function playVoice(index=0) {
    const lines=voiceLines[active];if(!lines){setSpeech('我们一起想一个新点子吧！');return}
    const line=lines[index%lines.length];setSpeech(line.text);
    if(!p.settings.sound)return;
    audio.current?.pause();const player=new Audio(`/assets/pets/eggy/voices/${line.file}`);audio.current=player;player.volume=.65;
    player.onended=()=>setAudioState('');
    player.onerror=()=>setAudioState('原声暂时没有播放成功，仍可看文字回应');
    void player.play().then(()=>setAudioState('原声播放中')).catch(()=>setAudioState('点击小喇叭重试播放'));
  }
  async function act<T extends {progress:Progress}>(fn:()=>Promise<T>,after?:(out:T)=>void) {
    if(lock.current)return;lock.current=true;setBusy(true);
    try {const out=await fn();setProgress(out.progress);after?.(out)} catch(e){notify(e instanceof Error?e.message:'互动没有保存，请重试。')} finally {lock.current=false;setBusy(false)}
  }
  function feed(item:string) {
    if(!p.inventory[item]){setTab('bag');setSpeech('先去小铺挑一份好吃的，再带过来咩。');return}
    void act(()=>api.feed(item,uid()),out=>{setSelectedFood(null);setSpeech(out.favorite?`你记住了我最爱的${PET_ITEMS[item].name}！一起吃才更香咩。`:`啊呜，${PET_ITEMS[item].name}吃完啦！谢谢你咩。`);animate('munch',`成长 +${out.xp} · 亲密 +${out.bond}`)});
  }
  function touch() {
    if(selectedFood){feed(selectedFood);return}
    if(playing||busy)return;
    animate('squish','♡');
    const count=talkCount.current++;
    if(count%3===1){const memory=recent.find(m=>m.kind==='learn'||m.kind==='review');setSpeech(memory?`我记得呀：${memory.text}`:'遇到难题时，画一画、摆一摆，我们一起慢慢想咩。')}
    else if(count%3===2)setSpeech(`今天想吃${PET_ITEMS[pet.favorite].name}，也想听听你的新发现咩。`);
    else playVoice(Math.floor(count/3));
    void act(()=>api.interact('touch',uid()),out=>{if(out.bond)setEffect(`亲密 +${out.bond}`)});
  }
  function startPlay() {setSelectedFood(null);setStars(0);starLock.current=false;setPlaying(true);setSpeech('帮我接住 5 颗星星，拼成我们的友谊星座！不着急，一颗一颗来。')}
  function catchStar() {
    if(starLock.current)return;
    if(stars<4){setStars(v=>v+1);animate('hop','✦');return}
    starLock.current=true;
    void act(()=>api.interact('play',uid()),out=>{setStars(5);setPlaying(false);setSpeech(out.bond?'五颗星星都接住啦，配合满分！休息好了再一起探险咩。':'又点亮了我们的星座！今天的亲密奖励已经收好啦。');animate('twirl',out.bond?`亲密 +${out.bond}`:'配合成功！')}).finally(()=>{starLock.current=false});
  }
  function gift(type:'mission'|'growth',reward:string|number) {void act(()=>api.petReward(type,reward),()=>{setSpeech('拆礼物啦！这是我们一起努力得到的。');animate('twirl','收到礼物！');notify('礼物已经放进背包，可以去布置小屋或喂给伙伴。')})}
  function switchFriend(id:string) {void act(()=>api.pet(id),()=>notify(`${PETS[id].name}来陪伴你了。`))}
  function purchase(id:string,type:'pet'|'item') {void act(()=>api.purchase({id:uid(),type,item:id}),()=>{notify(type==='pet'?`${PETS[id].name}加入了小屋！`:`${PET_ITEMS[id].name}已经放进背包。`);if(type==='item')animate('hop','收到啦')})}
  const foods=Object.entries(PET_ITEMS).filter(([,item])=>item.kind==='food');
  const giftCount=PET_LEVELS.filter(l=>l.gift&&friend.growth>=l.xp&&!friend.gifts.includes(l.xp)).length;

  return <div className="page companion-page">
    <header className="companion-heading"><div><p className="eyebrow">KEVIN & FRIENDS</p><h1>今天，也有小羊陪你。</h1><p>一点新发现，一点小成长。一起把小日子过得亮晶晶。</p></div><button className="pet-sound-button" disabled={busy} onClick={()=>void act(()=>api.settings({sound:!p.settings.sound}))} aria-label={p.settings.sound?'关闭宠物声音':'开启宠物声音'}>{p.settings.sound?<Volume2 size={19}/>:<VolumeX size={19}/>}<span>{p.settings.sound?'声音开着':'安静陪伴'}</span></button></header>

    <section className="companion-home" aria-label="宠物互动小屋">
      <div className={`companion-stage scene-${care.scene} ${dragOver?'food-hover':''}`} onDragOver={e=>{if(e.dataTransfer.types.includes('application/kevin-food')){e.preventDefault();setDragOver(true)}}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);const food=e.dataTransfer.getData('application/kevin-food');if(PET_ITEMS[food]?.kind==='food')feed(food)}}>
        <div className="scene-title"><span><Leaf size={14}/>{sceneNames[care.scene]}</span><small>{selectedFood?'把食物拖给小羊，或直接点它':playing?'我们来接星星！':'点点小羊，听听它想说什么'}</small></div>
        <div className="cottage-window" aria-hidden="true"><div className="cottage-sun"/><div className="cottage-hill hill-one"/><div className="cottage-hill hill-two"/><i/><b/></div>
        <div className="scene-floor"/><div className={`companion-rug ${care.decorations.includes('cushion')?'cloud-rug':''}`}/>
        {care.decorations.includes('flowers')&&<img className="placed-flowers" src={PET_ITEMS.flowers.image} alt="小屋里的雏菊花束"/>}
        {care.decorations.includes('plant')&&<div className="placed-plant" aria-label="数芽盆栽">🌱<i/></div>}
        {care.decorations.includes('lantern')&&<div className="placed-lantern" aria-label="星星灯">✦</div>}
        {care.decorations.includes('pinwheel')&&<button className="placed-pinwheel" title="点一下，风车转起来" onClick={e=>{e.currentTarget.classList.remove('spinning');void e.currentTarget.offsetWidth;e.currentTarget.classList.add('spinning')}}><span>✣</span><i/></button>}
        <div className="companion-bubble" role="status" aria-live="polite"><MessageCircle size={16}/><p>{speech}</p>{voiceLines[active]&&<button title="听一句原声" aria-label="播放角色原声" onClick={()=>playVoice(talkCount.current++)} disabled={!p.settings.sound}><Volume2 size={17}/></button>}</div>
        <div className="companion-body" style={{'--pet-scale':.82+level*.065,'--pet-tilt':`${tilt}deg`} as CSSProperties}>
          <button className={`companion-touch ${animation}`} disabled={busy||playing} aria-label={selectedFood?`喂给${pet.name}${PET_ITEMS[selectedFood].name}`:`摸摸${pet.name}`} onClick={touch} onPointerMove={e=>{const box=e.currentTarget.getBoundingClientRect();setTilt((e.clientX-box.left-box.width/2)/box.width*6)}} onPointerLeave={()=>setTilt(0)}>
            <PetPortrait pet={active}/>{p.pets.accessory==='scarf'&&<span className="companion-scarf">🧣</span>}
          </button>
          {effect&&<span key={effect+animation} className="pet-feedback">{effect}</span>}
          {selectedFood&&<div className="food-in-hand">{PET_ITEMS[selectedFood].image?<img src={PET_ITEMS[selectedFood].image} alt=""/>:<span>{PET_ITEMS[selectedFood].emoji}</span>}<button aria-label="放回食物" onClick={()=>setSelectedFood(null)}><X size={13}/></button></div>}
        </div>
        {playing&&<><button className="catch-star" aria-label={`接住第 ${stars+1} 颗星星`} disabled={busy} style={{left:`${[18,72,28,79,52][stars%5]}%`,top:`${[49,36,65,62,42][stars%5]}%`}} onClick={catchStar}>✦</button><div className="star-game-progress">{[0,1,2,3,4].map(i=><Star key={i} size={18} fill={i<stars?'currentColor':'none'}/>)}<button onClick={()=>{setPlaying(false);setSpeech('星星等会儿再接，我们随时可以再玩咩。')}}>稍后再玩</button></div></>}
        <div className="scene-caption">{audioState||`${pet.name}正在陪伴 · ${PET_LEVELS[level].name}`}</div>
      </div>

      <aside className="companion-details"><div className="pet-name-row"><div><p className="eyebrow">{pet.english}</p><h2>{pet.name}</h2></div><span className="friend-level">Lv.{level+1}</span></div><p className="pet-personality">{pet.note}</p>
        <div className="friend-stats"><span><Heart size={16}/><b>{friend.bond}</b>亲密</span><span><Sparkles size={16}/><b>{friend.growth}</b>成长</span><span><Gift size={16}/><b>{friend.meals}</b>次分享</span></div>
        <div className="friend-growth"><div><b>{current.name}</b><span>{next?`${friend.growth} / ${next.xp}`:'最高阶段'}</span></div><div className="friend-growth-bar" role="progressbar" aria-label="伙伴成长" aria-valuemin={current.xp} aria-valuemax={next?.xp??current.xp} aria-valuenow={Math.min(friend.growth,next?.xp??current.xp)}><i style={{width:`${percent}%`}}/></div><p>{next?`再长大 ${next.xp-friend.growth} 点，${next.detail.replace('成长礼：','就能得到')}`:'我们的成长故事，还会继续写下去。'}</p><button className="growth-link" onClick={()=>setShowGrowth(v=>!v)}>看看成长礼物 {giftCount>0&&<em>{giftCount} 份待拆</em>}<ChevronRight size={15}/></button></div>
        <div className="pet-action-grid"><button disabled={busy||playing} onClick={touch}><Heart/><span>{selectedFood?'分享美食':'摸摸脑袋'}</span></button><button onClick={()=>{setTab('bag');setSelectedFood(null);setSpeech(`我最喜欢${PET_ITEMS[pet.favorite].name}，你想喂我什么咩？`);document.getElementById('pet-backpack')?.scrollIntoView({behavior:'smooth',block:'nearest'})}}><span className="action-emoji">🍦</span><span>喂点好吃的</span></button><button disabled={busy||playing} onClick={startPlay}><Star/><span>一起接星星</span></button></div>
        <div className="pet-care-note"><Leaf size={14}/><p>每次新关卡 +10 成长，到期复习 +4。<br/>休息、离线，伙伴的成长都会保留。</p></div>
      </aside>
    </section>

    {showGrowth&&<section className="pet-milestones" aria-label="成长礼物">{PET_LEVELS.map((l,i)=><article className={friend.growth>=l.xp?'reached':''} key={l.xp}><span>Lv.{i+1} · {l.xp} 成长</span><b>{l.name}</b><p>{l.detail}</p>{l.gift&&(friend.gifts.includes(l.xp)?<small><Check size={13}/>礼物已收好</small>:<button disabled={busy||friend.growth<l.xp} onClick={()=>gift('growth',l.xp)}>{friend.growth>=l.xp?'拆开礼物':'一起慢慢长大'}</button>)}</article>)}</section>}

    <section className="pet-promises"><div className="pet-section-title"><div><h2>今天的小约定</h2><p>学习后，带一份好吃的回来。</p></div><span>每天重新准备 · 礼物按实际学习领取</span></div>{missionError?<p role="alert">约定暂时没有读到：{missionError}</p>:<div className="promise-grid">{missions.map(m=><article key={m.id} className={m.claimed?'claimed':''}><span className="promise-icon">{m.id==='discover'?'🌱':m.id==='think'?'🧩':'🔎'}</span><div><h3>{m.name}</h3><p>{m.detail}</p><small>{PET_ITEMS[m.item].emoji} {PET_ITEMS[m.item].name} ×{m.amount}</small></div><button disabled={busy||m.claimed} onClick={()=>m.done?gift('mission',m.id):onLearn(m.route)}>{m.claimed?<><Check size={14}/>已收好</>:m.done?<><Gift size={14}/>领礼物</>:<>去发现<ArrowRight size={14}/></>}</button></article>)}</div>}</section>

    <section className="pet-inventory" id="pet-backpack"><div className="companion-tabs" role="tablist" aria-label="小屋功能">{([{id:'bag',name:'零食背包',icon:Gift},{id:'friends',name:'伙伴图鉴',icon:Heart},{id:'home',name:'布置小屋',icon:Home},{id:'memories',name:'我们的回忆',icon:Sparkles}] as const).map(t=><button id={`pet-tab-${t.id}`} role="tab" aria-selected={tab===t.id} aria-controls={`pet-panel-${t.id}`} key={t.id} className={tab===t.id?'active':''} onClick={()=>setTab(t.id)}><t.icon size={17}/>{t.name}</button>)}<span className="pet-wallet">✦ <b>{p.wallet.coins}</b> 学习积分</span></div>
      <div role="tabpanel" id={`pet-panel-${tab}`} aria-labelledby={`pet-tab-${tab}`}>
        {tab==='bag'&&<><div className="backpack-intro"><p>挑一份零食，再点小羊喂给它。也可以直接拖过去。</p>{selectedFood&&<button onClick={()=>setSelectedFood(null)}>放回 {PET_ITEMS[selectedFood].name}</button>}</div><div className="snack-grid">{foods.map(([id,item])=><article key={id} className={selectedFood===id?'selected':''}><button className="snack-pick" disabled={busy||!p.inventory[id]} draggable={Boolean(p.inventory[id])&&!busy} onDragStart={e=>{e.dataTransfer.setData('application/kevin-food',id);setSelectedFood(id)}} onClick={()=>{setSelectedFood(id);setSpeech(`拿到${item.name}啦！点我一下，一起分享吧。`);document.querySelector('.companion-home')?.scrollIntoView({behavior:'smooth',block:'center'})}} aria-label={`拿起${item.name}，背包有 ${p.inventory[id]??0} 份`}><span className="snack-art">{item.image?<img src={item.image} alt=""/>:item.emoji}</span><span className="snack-quantity">×{p.inventory[id]??0}</span></button><h3>{item.name} {pet.favorite===id&&<small>最爱 ♡</small>}</h3><p>{item.note}</p><div className="snack-buttons"><button disabled={busy||!p.inventory[id]} onClick={()=>feed(id)}>喂一份</button><button disabled={busy||p.wallet.coins<item.price} onClick={()=>purchase(id,'item')}>补充 · {item.price} 积分</button></div></article>)}</div><p className="pet-small-note">欢迎礼物已放入背包。最爱的食物额外增加 2 点亲密度。</p></>}
        {tab==='friends'&&<><div className="friend-wish"><span>下一位想邀请的伙伴</span><select value={wish} onChange={e=>setWish(e.target.value)} aria-label="选择下一位伙伴">{Object.entries(PETS).filter(([,x])=>!x.legacy&&x.price>0).map(([id,x])=><option key={id} value={id}>{x.name}</option>)}</select><div><i style={{width:`${Math.min(100,p.wallet.coins/wanted.price*100)}%`}}/></div><b>{p.pets.owned.includes(wish)?'已经是好朋友':p.wallet.coins>=wanted.price?'可以邀请啦':`还差 ${wanted.price-p.wallet.coins} 积分`}</b></div><div className="real-friends">{Object.entries(PETS).filter(([,x])=>!x.legacy).map(([id,x])=><article key={id} className={id===active?'selected':''} style={{'--friend-color':x.color} as CSSProperties}><div className="friend-card-art"><span>{x.english}</span><PetPortrait pet={id} size="medium"/></div><div className="friend-card-info"><h3>{x.name}</h3><p>{x.note}</p><small>最爱 {PET_ITEMS[x.favorite].emoji} {PET_ITEMS[x.favorite].name}</small>{p.pets.owned.includes(id)?<button disabled={busy||active===id} onClick={()=>switchFriend(id)}>{active===id?<><Check size={15}/>正在陪你</>:'邀请它来陪伴'}</button>:<button disabled={busy||p.wallet.coins<x.price} onClick={()=>purchase(id,'pet')}>✦ {x.price} 积分邀请</button>}</div></article>)}</div><button className="legacy-toggle" onClick={()=>setShowLegacy(v=>!v)}>{showLegacy?'收起':'查看'}原有伙伴收藏</button>{showLegacy&&<div className="legacy-friends">{p.pets.owned.filter(id=>PETS[id].legacy).map(id=><button disabled={busy||active===id} onClick={()=>switchFriend(id)} key={id}><PetPortrait pet={id} size="small"/>{PETS[id].name}<small>{active===id?'正在陪伴':'选它陪伴'}</small></button>)}</div>}<p className="pet-small-note">这里的积分邀请仅用于 Kevin 的学习小屋。</p></>}
        {tab==='home'&&<><div className="scene-picker">{([{id:'meadow',xp:0,icon:Sun},{id:'sunset',xp:60,icon:Sun},{id:'starlight',xp:150,icon:Moon}] as const).map(s=>{const unlocked=Object.values(care.friends).some(f=>f.growth>=s.xp);return <button key={s.id} disabled={busy||!unlocked} className={care.scene===s.id?'selected':''} onClick={()=>void act(()=>api.petHome({scene:s.id}))}><s.icon size={20}/><b>{sceneNames[s.id]}</b><small>{care.scene===s.id?'正在这里':unlocked?'换个风景':`任一伙伴 ${s.xp} 成长开启`}</small></button>})}</div><div className="decor-grid">{Object.entries(PET_ITEMS).filter(([,x])=>x.kind!=='food').map(([id,item])=>{const owned=p.inventory[id]>0,placed=id==='scarf'?p.pets.accessory==='scarf':care.decorations.includes(id);return <article key={id}><span className="decor-art">{item.image?<img src={item.image} alt=""/>:item.emoji}</span><div><h3>{item.name}</h3><p>{item.note}</p></div>{owned?<button disabled={busy} className={placed?'placed':''} onClick={()=>void act(()=>id==='scarf'?api.accessory(placed?null:'scarf'):api.petHome({item:id,placed:!placed}))}>{placed?'收起来':id==='scarf'?'戴上':'摆出来'}</button>:<button disabled={busy||p.wallet.coins<item.price} onClick={()=>purchase(id,'item')}>{item.price} 积分</button>}</article>})}</div></>}
        {tab==='memories'&&<div className="pet-memory-book"><header><div><p className="eyebrow">OUR LITTLE DISCOVERIES</p><h2>{pet.name} × {p.profile.name}</h2><p>每一个“原来如此”，都有人和你一起记得。</p></div><PetPortrait pet={active} size="small"/></header>{recent.length?recent.map((m,i)=><article key={`${m.at}-${i}`}><span>{m.kind==='learn'?'💡':m.kind==='review'?'🔎':m.kind==='feed'?'🍦':m.kind==='play'?'⭐':'🎁'}</span><div><time dateTime={m.at}>{formatDate(m.at)}</time><p>{m.text}</p></div></article>):<p>我们的第一篇回忆，会从一次学习或一次分享开始。</p>}<p className="pet-small-note">保存最近 160 条共同回忆；完整作答与积分记录仍在学习进度中。</p></div>}
      </div>
    </section>
    <footer className="pet-sources"><span>角色图片取自《蛋仔派对》官网 · 素材已保存在本地</span><button onClick={()=>setShowSources(v=>!v)}>素材与声音说明</button></footer>{showSources&&<div className="pet-source-details"><p>咚咚羊、蜜蜂羊、鸭鸭羊及配饰使用网易官网公开原图。点击回应中的原声为官方联动视频的短片段，保留原视频背景声；学习鼓励与回忆对白是本网站编写的文字。这里的养成规则属于 Kevin Math Lab。</p><a href="https://party.163.com/official/20231117/35180_1120685.html" target="_blank" rel="noreferrer">咚咚羊与蜜蜂羊来源 ↗</a><a href="https://party.163.com/official/20240621/35180_1162457.html" target="_blank" rel="noreferrer">鸭鸭羊与冰淇淋来源 ↗</a><a href="https://party.163.com/media/index.html?tab=1" target="_blank" rel="noreferrer">原声视频来源 ↗</a></div>}
  </div>;
}
