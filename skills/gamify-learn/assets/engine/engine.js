/* gamify-learn engine. Reads window.__COURSE (see references/schema.md). No dependencies, works offline. */
(function(){
'use strict';
const D=window.__COURSE;
const SLUG=(D.slug||D.title||'course').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40);
const KEY='gamify_learn_'+SLUG+'_v1';
let S={xp:0,streak:0,last:'',ans:{},cards:{},done:{},dumps:{},hooks:{},badges:{},calm:false,sfx:false,tmin:D.focus_minutes||15,combo:0,best:0,raids:0,seen:false,solves:{},unlockAll:false};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=(el,q)=>el.querySelector(q), $$=(el,q)=>[...el.querySelectorAll(q)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date());
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d)};
const dnum=s=>Math.floor(new Date(s+'T00:00:00').getTime()/864e5);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function fmt(s){
  if(s==null)return '';
  return String(s)
   .replace(/\[\[(\d)\|([^\]]+)\]\]/g,'<b class="k$1">$2</b>')
   .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')
   .replace(/`([^`]+)`/g,'<code>$1</code>')
   .replace(/==([^=]+)==/g,'<mark>$1</mark>');
}
const fmtF=s=>String(s==null?'':s).replace(/\[\[(\d)\|([^\]]+)\]\]/g,'<b class="k$1">$2</b>');

/* ---------- pixel icons ---------- */
const PAL={r:'#e63946',R:'#a4161a',w:'#ffffff',y:'#ffd23f',o:'#ff8a3d',b:'#2a9df4',B:'#1769ab',n:'#12213f',c:'#8fe3ff',g:'#1a9a5f'};
const BM={
 heart:['.rr..rr.','rwrrrrrr','rrrrrrrr','rrrrrrrr','.rrrrrr.','..rrrr..','...rr...'],
 star:['....y....','....y....','...yyy...','yyyyyyyyy','.yyyyyyy.','..yyyyy..','..yyyyy..','.yyy.yyy.','.yy...yy.'],
 flame:['....o...','...oo...','...ooo..','..ooooo.','.ooyyooo','.oyyyyoo','.oyyyyoo','..oyyoo.','...oo...'],
 coin:['..yyyy..','.yyooyy.','yyoyyoyy','yyoyyoyy','yyoyyoyy','yyoyyoyy','.yyooyy.','..yyyy..'],
 trophy:['yyyyyyyyy','y.yyyyy.y','y.yyyyy.y','.yyyyyyy.','..yyyyy..','...yyy...','....y....','...ooo...','..ooooo..'],
 boss:['r.........r','rr.......rr','.rrrrrrrrr.','rrrwwrwwrrr','rrrwnrwnrrr','rrrrrrrrrrr','rrnnnnnnnrr','.rrwrwrwrr.','..rr...rr..'],
 hero:['..nnnn..','.nrrrrn.','nrrrrrrn','.nwnnwn.','..nrrn..','.bbbbbb.','b.bbbb.b','..b..b..','.nn..nn.'],
 book:['.bbbbbbb.','bwwwbcccb','bwwwbcccb','bwwwbcccb','bwwwbcccb','bwwwbcccb','.bbbbbbb.'],
 bolt:['...yy','..yy.','.yy..','yyyyy','..yy.','.yy..','yy...'],
 sword:['......rr','.....rrr','....rrr.','n..rrr..','nn.rr...','.nnr....','..nn....','.n.nn...'],
 skull:['.wwwww.','wwwwwww','wnwwwnw','wnwwwnw','wwwnwww','.wwwww.','.w.w.w.'],
 flag:['nrrrr','nrrrr','nrrr.','n....','n....','n....','n....']
};
function icon(name,px){
  const rows=BM[name];if(!rows)return '';px=px||3;
  const w=Math.max(...rows.map(r=>r.length));let rects='';
  rows.forEach((r,y)=>{[...r].forEach((ch,x)=>{if(ch!=='.')rects+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+PAL[ch]+'"/>'})});
  return '<svg class="ic" width="'+w*px+'" height="'+rows.length*px+'" viewBox="0 0 '+w+' '+rows.length+'" shape-rendering="crispEdges" aria-hidden="true">'+rects+'</svg>';
}

/* ---------- normalise course ---------- */
const QUESTS=D.quests||[];const BANK={},CARDS={};
QUESTS.forEach((q,i)=>{
  q.n=i+1;q.id=q.id||('q'+q.n);q.world=q.world||('1-'+q.n);q.minutes=q.minutes||12;
  q.quiz=(q.quiz||[]).map((x,j)=>{const id=q.id+'-'+(x.id||('q'+(j+1)));const o=Object.assign({},x,{id,quest:q.id});BANK[id]=o;return o});
  q.cardsList=(q.cards||[]).map((c,j)=>{const id=q.id+'-c'+(j+1);CARDS[id]={f:c.front||c.f,b:c.back||c.b,quest:q.id,concepts:c.concepts||[]};return id});
  q.steps=buildSteps(q);
});
function buildSteps(q){
  const out=[{t:'mission'}];const placed=new Set();let cardsPlaced=false;
  if(q.n>1&&q.warmup!==false&&QUESTS.slice(0,q.n-1).some(p=>p.quiz.length))out.push({t:'warmup'});
  (q.steps||[]).forEach(s=>{
    if(s.type==='quiz'){const ids=(s.ids||q.quiz.map(x=>x.id.split('-').slice(1).join('-'))).map(x=>q.id+'-'+x);ids.forEach(id=>{if(BANK[id]&&!placed.has(id)){placed.add(id);out.push({t:'question',id})}})}
    else if(s.type==='cards'){out.push({t:'cards'});cardsPlaced=true}
    else out.push(Object.assign({t:s.type},s));
  });
  q.quiz.forEach(x=>{if(!placed.has(x.id))out.push({t:'question',id:x.id})});
  if(!cardsPlaced&&q.cardsList.length)out.push({t:'cards'});
  out.push({t:'recap'});
  return out;
}
/* concept ledger: what is taught where, so the story stays in one direction and ideas can be relearned */
const CON={};(D.concepts||[]).forEach(c=>{CON[c.id]=Object.assign({},c)});
QUESTS.forEach((q,qi)=>q.steps.forEach((st,i)=>{(st.teaches||[]).forEach(id=>{CON[id]=CON[id]||{id,name:id.replace(/_/g,' ')};if(CON[id].quest==null){CON[id].quest=qi;CON[id].step=i}})}));
const CONLIST=Object.values(CON).filter(c=>c.quest!=null).sort((a,b)=>a.quest-b.quest||a.step-b.step);
const SOLVE={};QUESTS.forEach(q=>q.steps.forEach((st,i)=>{if(st.t==='solve')SOLVE[q.id+'-s'+i]={concepts:st.needs||[],quest:q.id,step:i,title:st.title}}));
const cname=id=>(CON[id]&&CON[id].name)||id;
const chips=ids=>ids.map(id=>'<span class="cchip">'+esc(cname(id))+'</span>').join(' ');
function conceptNeeds(q){const qi=q.n-1,set=new Set(q.needs||[]);q.steps.forEach(st=>(st.needs||[]).forEach(c=>set.add(c)));return [...set].filter(c=>CON[c]&&CON[c].quest!=null&&CON[c].quest<qi)}
function mastery(cid){let n=0;
  Object.keys(BANK).forEach(id=>{if((BANK[id].concepts||[]).includes(cid)&&S.ans[id]&&S.ans[id].last)n++});
  Object.keys(CARDS).forEach(id=>{if((CARDS[id].concepts||[]).includes(cid)&&S.cards[id]&&S.cards[id].box>=2)n++});
  Object.keys(SOLVE).forEach(id=>{const r=S.solves[id];if(r&&r.r!=='no'&&SOLVE[id].concepts.includes(cid))n++});
  return Math.min(3,n)}
const FORCE=/[?&](reveal|selftest)/.test(location.search);
const isLocked=i=>D.linear!==false&&!S.unlockAll&&!FORCE&&i>0&&!S.done[QUESTS[i-1].id];
function track(cur){return '<div class="track">'+QUESTS.map((q,i)=>'<div class="tn '+(S.done[q.id]?'done':i===cur?'cur':'')+'" title="'+esc(q.title)+'"><span>'+(i+1)+'</span>'+(i===cur?'<em>YOU ARE HERE</em>':'')+'</div>').join('<s></s>')+'</div>'}

/* ---------- audio (off by default) ---------- */
let AC=null;
function beep(seq){
  if(!S.sfx||S.calm)return;
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();let t=AC.currentTime;
    seq.forEach(([f,d,type])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.value=f;g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);t+=d*.9})}catch(e){}
}
const SND={ok:()=>beep([[660,.09],[990,.14]]),bad:()=>beep([[180,.18,'sawtooth'],[130,.22,'sawtooth']]),lvl:()=>beep([[523,.1],[659,.1],[784,.1],[1047,.25]]),click:()=>beep([[440,.04]]),badge:()=>beep([[784,.1],[988,.1],[1319,.2]])};

/* ---------- chrome ---------- */
const root=document.getElementById('app');
const hud=document.getElementById('hud');
const navEl=document.getElementById('nav');
const toasts=document.getElementById('toasts');
if(S.calm)document.body.classList.add('calm');
const lvl=()=>Math.floor(S.xp/100)+1;
let where='MAP';
function renderHud(){
  const seg=Math.floor((S.xp%100)/10);
  hud.innerHTML='<span class="brand" data-a="map">'+icon('hero',2)+'<span>'+esc(D.title)+'</span></span><span class="where">'+esc(where)+'</span><span class="sp"></span>'+
   '<span class="combo">'+(S.combo>=2?'COMBO x'+S.combo:'')+'</span>'+
   '<span class="stat">'+icon('bolt',2)+'LV <b>'+lvl()+'</b></span><span class="xpbar" title="'+(S.xp%100)+' / 100 XP to next level">'+Array.from({length:10},(_,i)=>'<i class="'+(i<seg?'on':'')+'"></i>').join('')+'</span>'+
   '<span class="stat">'+icon('coin',2)+'<b>'+S.xp+'</b></span><span class="stat">'+icon('flame',2)+'<b>'+S.streak+'</b></span>'+
   '<button class="hbtn'+(timerRun?' on':'')+'" data-a="timer" title="Focus timer (T)">'+(timerRun?'FOCUS ':'TIMER ')+tFmt()+'</button>'+
   '<button class="hbtn" data-a="gloss" title="Glossary (G)">GLOSS</button><button class="hbtn" data-a="menu" title="Settings">MENU</button>';
}
hud.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;const k=a.dataset.a;
  if(k==='map')go({v:'map'});else if(k==='timer')tToggle();else if(k==='gloss')glToggle(true);else if(k==='menu')menu();});
function toast(msg,cls){const t=document.createElement('div');t.className='toast '+(cls||'');t.textContent=msg;toasts.appendChild(t);setTimeout(()=>t.remove(),2600)}
function confetti(n){if(S.calm)return;const cols=['#e63946','#2a9df4','#ffd23f','#fff','#12213f'];for(let i=0;i<(n||40);i++){const c=document.createElement('i');c.className='conf';c.style.left=Math.random()*100+'vw';c.style.background=cols[i%5];c.style.animationDelay=Math.random()*.4+'s';document.body.appendChild(c);setTimeout(()=>c.remove(),2200)}}
function touch(){const t=today();if(S.last!==t){S.streak=(S.last&&dnum(t)-dnum(S.last)===1)?S.streak+1:1;S.last=t;if(S.streak>=3)award('streak3');if(S.streak>=7)award('streak7')}}
function addXP(n,why){
  if(!n)return;touch();const before=lvl();S.xp+=n;save();renderHud();toast('+'+n+' XP  '+why);
  if(lvl()>before){SND.lvl();confetti(50);levelUp()}
}
function levelUp(){
  const o=overlay('<div class="panel lvl"><div class="sprites">'+icon('star',6)+icon('trophy',6)+icon('star',6)+'</div><div class="big2">LEVEL '+lvl()+'!</div><p>Your brain just got a stronger save file. Keep going or take a break: both are wins.</p><button class="btn" data-x>CONTINUE</button></div>');
  o.classList.add('lvlov');setTimeout(()=>o.remove(),4500);
}
const BADGES={
 first:['book','FIRST BLOOD','Answer your first question right'],
 combo5:['bolt','COMBO x5','Five right answers in a row'],
 clear1:['flag','LEVEL CLEAR','Finish a quest'],
 perfect:['star','PERFECT','Ace a quest quiz on first tries'],
 boss:['boss','BOSS SLAYER','Win a boss raid with 80%+'],
 streak3:['flame','3-DAY STREAK','Study on 3 days in a row'],
 streak7:['flame','7-DAY STREAK','Study on 7 days in a row'],
 comeback:['heart','COMEBACK','Fix every missed question in a retry'],
 allclear:['trophy','ALL CLEAR','Finish every quest']
};
function award(id){if(S.badges[id])return;S.badges[id]=today();save();SND.badge();toast('BADGE: '+BADGES[id][1],'bd2')}

/* ---------- overlay helpers ---------- */
function overlay(html,opts){
  const o=document.createElement('div');o.className='ov';o.innerHTML='<div class="box">'+html+'</div>';document.body.appendChild(o);
  o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-x]')){o.remove();opts&&opts.close&&opts.close()}});
  return o;
}
const topOverlay=()=>[...document.querySelectorAll('.ov')].pop();

/* ---------- glossary ---------- */
function glToggle(on){
  const ex=document.querySelector('.ov.gl');if(ex){ex.remove();if(!on)return}
  if(!on)return;
  const o=overlay('<div class="panel"><h2>Glossary</h2><p class="mut sm">Every term and symbol in this course. Type to search. Esc closes.</p><input type="text" placeholder="search..." autocomplete="off"><div class="gl-list"></div><p style="margin-top:14px"><button class="btn ghost sm2" data-x>CLOSE</button></p></div>');
  o.classList.add('gl');const inp=$(o,'input'),list=$(o,'.gl-list');
  const G=D.glossary||[];
  const draw=()=>{const q=inp.value.trim().toLowerCase();const it=G.filter(g=>!q||(g.term+' '+g.meaning+' '+(g.where||'')).toLowerCase().includes(q));
    list.innerHTML=it.map(g=>'<div class="it"><div class="t">'+fmtF(g.term)+'</div><div>'+fmt(g.meaning)+'</div>'+(g.where?'<div class="w">'+esc(g.where)+'</div>':'')+'</div>').join('')||'<p class="mut">'+(G.length?'No match. Try a shorter word.':'This course has no glossary yet.')+'</p>'};
  inp.oninput=draw;draw();setTimeout(()=>inp.focus(),30);
}

/* ---------- focus timer ---------- */
let tLeft=S.tmin*60,timerRun=null;
const tFmt=()=>pad(Math.floor(tLeft/60))+':'+pad(tLeft%60);
function tToggle(){
  if(timerRun){clearInterval(timerRun);timerRun=null}
  else timerRun=setInterval(()=>{tLeft--;if(tLeft<=0){clearInterval(timerRun);timerRun=null;tLeft=S.tmin*60;breakScreen()}renderHud()},1000);
  renderHud();
}
function breakScreen(){
  SND.lvl();
  overlay('<div class="panel red"><h2>BREAK TIME</h2><p>Stand up for 60 seconds: walk, stretch, drink water. A short bout of movement gave small, short-lived attention boosts in some studies (the evidence is modest). Then come back for one more block.</p><button class="btn good" data-x>I MOVED. BACK TO WORK</button></div>',{close:()=>addXP(5,'took a break')});
}

/* ---------- menu / settings ---------- */
function menu(){
  const o=overlay('<div class="panel menu"><h2>Settings</h2>'+
   '<div class="row2"><span>Sound effects (8-bit beeps)</span><button class="btn sm2 ghost" data-m="sfx">'+(S.sfx?'ON':'OFF')+'</button></div>'+
   '<div class="row2"><span>Calm mode (no motion, no sound)</span><button class="btn sm2 ghost" data-m="calm">'+(S.calm?'ON':'OFF')+'</button></div>'+
   '<div class="row2"><span>Focus block length</span><span><button class="btn sm2 ghost" data-m="t10">10</button> <button class="btn sm2 ghost" data-m="t15">15</button> <button class="btn sm2 ghost" data-m="t25">25</button> min</span></div>'+
   '<div class="row2"><span>Unlock every quest (skips the one-direction path)</span><button class="btn sm2 ghost" data-m="unlock">'+(S.unlockAll?'ON':'OFF')+'</button></div>'+
   '<div class="row2"><span>Save file (progress lives in this browser)</span><span><button class="btn sm2 blue" data-m="exp">EXPORT</button> <button class="btn sm2 ghost" data-m="imp">IMPORT</button></span></div>'+
   '<div class="row2"><span>How this works + the research</span><button class="btn sm2 ghost" data-m="about">OPEN</button></div>'+
   '<div class="row2"><span>Start over</span><button class="btn sm2" data-m="reset">RESET</button></div>'+
   '<p style="margin-top:14px"><button class="btn" data-x>CLOSE</button></p></div>');
  o.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;const m=b.dataset.m;
    if(m==='sfx'){S.sfx=!S.sfx;save();b.textContent=S.sfx?'ON':'OFF';SND.ok()}
    else if(m==='calm'){S.calm=!S.calm;document.body.classList.toggle('calm',S.calm);save();b.textContent=S.calm?'ON':'OFF'}
    else if(/^t\d+$/.test(m)){S.tmin=+m.slice(1);tLeft=S.tmin*60;save();renderHud();toast('Focus block: '+S.tmin+' min')}
    else if(m==='exp'){const blob=new Blob([JSON.stringify({key:KEY,state:S},null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=SLUG+'-progress.json';a.click()}
    else if(m==='imp'){const f=document.createElement('input');f.type='file';f.accept='.json';f.onchange=()=>{const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);Object.assign(S,j.state||j);save();location.reload()}catch(err){toast('That file is not a progress file')}};r.readAsText(f.files[0])};f.click()}
    else if(m==='unlock'){S.unlockAll=!S.unlockAll;save();b.textContent=S.unlockAll?'ON':'OFF';if(V.v==='map')render()}
    else if(m==='about'){o.remove();about()}
    else if(m==='reset'){if(confirm('Delete all progress in this browser?')){try{localStorage.removeItem(KEY)}catch(err){}location.reload()}}
  });
}
function about(){
  overlay('<div class="panel"><h2>How this works</h2>'+
  '<ul class="lines"><li><b>One direction.</b> Quests unlock in order. Each idea is taught once, in the place where you are ready for it, and later quests reuse it.</li><li><b>Relearning on purpose.</b> Every quest opens with a warm-up from earlier quests, and your skill line shows each concept filling up as you get it right again and again.</li><li><b>Short quests.</b> One idea per screen, about '+(QUESTS[0]?QUESTS[0].minutes:12)+' minutes per quest. Press SPACE to reveal the next piece.</li>'+
  '<li><b>Predict, learn, test.</b> Guess first, read, then quiz yourself. Testing yourself is one of the best-supported study methods.</li>'+
  '<li><b>Wrong answers are data.</b> Misses go to a retry list and come back in boss raids.</li>'+
  '<li><b>Spaced review.</b> Flashcards return after 1, 2, 4, 7 and 14 days if you rate them honestly.</li>'+
  '<li><b>Games on top.</b> XP, levels, streaks and badges give instant feedback. Turn on Calm mode if they distract you.</li></ul>'+
  '<div class="co trap"><small>HONEST LIMITS</small>Many studies behind these choices are small or done with children, and results vary person to person. Gamification effects are mixed. This is a study tool, not a treatment. See references/evidence.md in the repo for sources.</div>'+
  (D.about?'<div class="co ana"><small>ABOUT THIS COURSE</small>'+fmt(D.about)+'</div>':'')+
  '<button class="btn" data-x>BACK</button></div>');
}

/* ---------- routing ---------- */
let V={v:'title'};
function go(v){if(v.v==='quest'&&isLocked(v.q)){toast('Locked: finish the previous quest first. One direction keeps the story clear.');v={v:'map'}}V=v;if(v.v==='quest'){S.seen=true}render();window.scrollTo(0,0);try{history.replaceState(null,'','#'+(v.v==='quest'?'q'+(v.q+1)+'/'+(v.i+1):v.v))}catch(e){}}
const qIdx=id=>QUESTS.findIndex(q=>q.id===id);
function questDone(q){return !!S.done[q.id]}
function qStats(q){const ids=q.quiz.map(x=>x.id);const tried=ids.filter(i=>S.ans[i]).length;const first=ids.filter(i=>S.ans[i]&&S.ans[i].first).length;return{tried,first,n:ids.length,pc:ids.length?Math.round(100*tried/ids.length):0,acc:tried?first/ids.length:0}}
const dueIds=()=>Object.keys(S.cards).filter(id=>CARDS[id]&&S.cards[id].due<=today());
const missIds=()=>Object.keys(S.ans).filter(id=>S.ans[id].last===false&&BANK[id]);

function render(){
  navEl.innerHTML='';document.title=D.title;
  const fn={title:rTitle,map:rMap,quest:rQuest,review:rReview,raid:rRaid,retry:rRetry}[V.v];
  if(V.v!=='quest')where=V.v==='map'?'MAP':V.v==='title'?'TITLE':V.v.toUpperCase();
  fn();renderHud();
}

/* ---------- title ---------- */
function rTitle(){
  const started=S.seen||S.xp>0;
  root.innerHTML='<div class="panel title"><div class="sprites">'+icon('hero',8)+icon('star',8)+icon('boss',6)+'</div>'+
   '<div class="logo">'+esc(D.title)+'</div><div class="sub">'+fmt(D.subtitle||'A game-style study run. Short quests, instant feedback, spaced review.')+'</div>'+
   '<div class="row" style="justify-content:center"><button class="btn big" data-a="start">'+(started?'CONTINUE':'START GAME')+'</button><button class="btn ghost" data-a="about">HOW IT WORKS</button></div>'+
   '<div class="press">'+(started?'WELCOME BACK':'PRESS START')+'</div></div>';
  root.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;SND.click();if(a.dataset.a==='start')go({v:'map'});else about()};
}

/* ---------- map ---------- */
function nextBest(){
  const due=dueIds().length;
  if(due)return{t:'REVIEW '+due+' CARD'+(due>1?'S':'')+' (3 MIN)',go:{v:'review'}};
  const nq=QUESTS.find(q=>!questDone(q));
  if(nq){const started=nq.steps.some(()=>false)||qStats(nq).tried>0;return{t:(started?'CONTINUE: ':'START: ')+nq.title,go:{v:'quest',q:qIdx(nq.id),i:0},q:nq}}
  return{t:'BOSS RAID: TEST EVERYTHING',go:{v:'raid'}};
}
function solveLoc(id){const x=SOLVE[id];return x?{v:'quest',q:qIdx(x.quest),i:x.step}:{v:'map'}}
function rMap(){
  const nb=nextBest(),m=missIds().length,due=dueIds().length;
  const tot=Object.keys(S.ans).length,right=Object.values(S.ans).filter(a=>a.last).length;
  const sids=Object.keys(SOLVE),sdone=sids.filter(id=>S.solves[id]&&S.solves[id].r!=='no').length,redo=sids.filter(id=>S.solves[id]&&S.solves[id].r==='no');
  const cards=QUESTS.map((q,i)=>{const st=qStats(q),lock=isLocked(i);const stars=questDone(q)?(st.n&&st.first===st.n?3:st.acc>=.7?2:1):0;
    return '<div class="qc'+(questDone(q)?' done':'')+(lock?' locked':'')+(nb.q&&nb.q.id===q.id?' rec':'')+'" data-q="'+i+'" tabindex="0" role="button"><span class="w">WORLD '+esc(q.world)+(lock?'  LOCKED':'')+'</span><h3>'+esc(q.title)+'</h3>'+(q.question?'<div class="qs">? '+fmt(q.question)+'</div>':'')+'<div class="stars">'+[1,2,3].map(k=>icon('star',3).replace('<svg','<svg style="opacity:'+(k<=stars?1:.2)+'"')).join('')+'</div><div class="m">'+q.minutes+' min  |  '+q.quiz.length+' quiz Qs</div><div class="pb"><i style="width:'+st.pc+'%"></i></div></div>'}).join('');
  const bd=Object.keys(BADGES).map(k=>'<div class="bd'+(S.badges[k]?'':' lock')+'">'+icon(BADGES[k][0],3)+'<span><b>'+BADGES[k][1]+'</b><br>'+BADGES[k][2]+'</span></div>').join('');
  const tree=CONLIST.length?'<div class="panel"><h2>Skill line</h2><p class="mut sm" style="margin-bottom:10px">Every concept, in the order you learn it. Pips fill when you answer questions about it correctly across different quests: that is the relearning.</p><div class="tree">'+CONLIST.map(c=>{const mp=mastery(c.id);return '<span class="cn m'+mp+'" title="Taught in quest '+(c.quest+1)+'"><b>'+esc(c.name)+'</b><span class="pips">'+[0,1,2].map(k=>'<i class="pp'+(k<mp?' on':'')+'"></i>').join('')+'</span></span>'}).join('')+'</div></div>':'';
  root.innerHTML='<div class="panel"><div class="chips"><span class="chip r">WORLD MAP</span></div><h1>'+esc(D.title)+'</h1><p class="mut" style="margin-top:8px">'+fmt(D.subtitle||'')+'</p>'+track(-1)+
   '<div class="stats"><span class="stat2">'+icon('bolt',2)+'LV <b>'+lvl()+'</b></span><span class="stat2">'+icon('coin',2)+'<b>'+S.xp+'</b> XP</span><span class="stat2">'+icon('flame',2)+'STREAK <b>'+S.streak+'</b></span><span class="stat2">ANSWERED <b>'+tot+'</b>  RIGHT LAST TIME <b>'+right+'</b></span>'+(sids.length?'<span class="stat2">SOLVED <b>'+sdone+'/'+sids.length+'</b></span>':'')+'</div>'+
   '<div class="row"><button class="btn big" data-a="nb">'+esc(nb.t)+'</button><button class="btn ghost sm2" data-a="review">DAILY REVIEW ('+due+')</button><button class="btn ghost sm2" data-a="retry">RETRY MISSES ('+m+')</button>'+(redo.length?'<button class="btn ghost sm2" data-a="redo">REDO SOLVES ('+redo.length+')</button>':'')+'<button class="btn blue sm2" data-a="raid">BOSS RAID</button></div>'+
   '<div class="todo"><span>Before you start (optional):</span><label><input type="checkbox">phone out of reach</label><label><input type="checkbox">water</label><label><input type="checkbox">60 s of movement</label><label><input type="checkbox">timer on (T)</label></div></div>'+
   '<div class="qgrid">'+cards+'</div>'+tree+
   '<div class="panel" style="margin-top:34px"><h2>Badges</h2><div class="badges">'+bd+'</div></div>';
  root.onclick=e=>{const q=e.target.closest('.qc');if(q){go({v:'quest',q:+q.dataset.q,i:0});return}
    const a=e.target.closest('[data-a]');if(!a)return;SND.click();const k=a.dataset.a;
    if(k==='nb')go(nb.go);else if(k==='redo')go(solveLoc(redo[0]));else go({v:k})};
  root.onkeydown=e=>{if(e.key==='Enter'&&e.target.classList.contains('qc'))e.target.click()};
}

/* ---------- quest runner ---------- */
let gated=false,reveals=[],shown=0;
function rQuest(){
  const q=QUESTS[V.q],s=q.steps[V.i];where='Q'+q.n+'  '+(V.i+1)+'/'+q.steps.length;
  gated=false;
  const chip=({mission:'MISSION',predict:'PREDICT',idea:'LEARN',decode:'DECODER',worked:'WORKED EXAMPLE',lab:'LAB',figure:'FIGURE',dump:'RECALL',question:'QUIZ',cards:'FLASHCARDS',recap:'RECAP',html:'LEARN',warmup:'WARM-UP',flow:'FLOW',compare:'COMPARE',solve:'YOUR TURN'})[s.t]||'STEP';
  const head='<div class="chips"><span class="chip r">'+chip+'</span><span class="chip">WORLD '+esc(q.world)+'  '+esc(q.title)+'</span></div>';
  const R={mission:sMission,predict:sPredict,idea:sIdea,decode:sDecode,worked:sWorked,lab:sLab,figure:sFigure,dump:sDump,question:sQuestion,cards:sCards,recap:sRecap,html:sHtml,warmup:sWarmup,flow:sFlow,compare:sCompare,solve:sSolve}[s.t];
  if(!R){root.innerHTML='<div class="panel">Unknown step type: '+esc(s.t)+'</div>';return}
  root.innerHTML='<div class="panel">'+head+'<div id="body"></div></div>';
  const body=$(root,'#body');R(body,q,s);
  reveals=$$(body,'.rv');shown=0;navDraw(q);
  if(/[?&]reveal/.test(location.search)){revealAll();navDraw(q);if(s.t==='question'&&body._pick)body._pick(body._correct)}  /* ?reveal: show everything (screenshots, printing) */
}
function navDraw(q){
  const q2=QUESTS[V.q],last=V.i===q2.steps.length-1;
  const rem=reveals.length-shown;
  const label=gated?'ANSWER FIRST':(rem>0?'REVEAL':(last?'MAP':'NEXT'));
  navEl.innerHTML='<button class="btn ghost sm2" data-n="back"'+(V.i===0?' disabled':'')+'>BACK</button>'+
   '<div class="dots">'+q2.steps.map((_,i)=>'<i class="'+(i<V.i?'done':i===V.i?'cur':'')+'"></i>').join('')+'</div><span class="pos">'+(V.i+1)+'/'+q2.steps.length+'</span>'+
   '<button class="btn" data-n="next"'+(gated?' disabled':'')+'>'+label+' &#9654;</button><span class="hint">SPACE = '+(rem>0?'reveal':'next')+'</span>';
}
navEl.addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;b.dataset.n==='next'?next():prev()});
function next(){
  if(V.v!=='quest'||gated)return;
  if(shown<reveals.length){reveals[shown++].classList.add('on');navDraw();SND.click();const r=reveals[shown-1];r.scrollIntoView({block:'nearest',behavior:S.calm?'auto':'smooth'});return}
  const q=QUESTS[V.q];if(V.i<q.steps.length-1)go({v:'quest',q:V.q,i:V.i+1});else go({v:'map'});
}
function prev(){if(V.v!=='quest')return;const q=QUESTS[V.q];if(V.i>0)go({v:'quest',q:V.q,i:V.i-1})}
function gate(on){gated=on;if(V.v==='quest')navDraw()}
function revealAll(){reveals.forEach(r=>r.classList.add('on'));shown=reveals.length}

const li=(arr,cls)=>'<ul class="lines">'+(arr||[]).map(l=>'<li class="rv">'+fmt(l)+'</li>').join('')+'</ul>';
const co=(cls,label,txt)=>txt?'<div class="co '+cls+' rv"><small>'+label+'</small>'+fmt(txt)+'</div>':'';
function vizHtml(v){
  if(!v)return '';
  if(typeof v==='string')return '<div class="vizbox rv">'+v+'</div>';
  return '';
}
function figHtml(s){
  if(!s.src)return '';
  return '<figure class="rv"><img src="'+s.src+'" alt="'+esc(s.caption||s.title||'figure')+'">'+(s.caption?'<figcaption>'+fmt(s.caption)+(s.credit?' <span class="mut">('+esc(s.credit)+')</span>':'')+'</figcaption>':'')+'</figure>';
}
function sMission(b,q){
  const i=q.n-1,prev=QUESTS[i-1];
  const taught=[];q.steps.forEach(st=>(st.teaches||[]).forEach(id=>taught.push(id)));
  const needed=conceptNeeds(q);
  b.innerHTML=track(i)+'<h1>'+esc(q.title)+'</h1><p class="mut" style="margin:8px 0 14px">'+q.minutes+' min  |  '+q.steps.length+' steps  |  '+q.quiz.length+' quiz questions  |  go at your own pace</p>'+
   (q.question?'<div class="co ana"><small>THE QUESTION THIS QUEST ANSWERS</small>'+fmt(q.question)+'</div>':'')+
   (prev?'<div class="co say"><small>LAST TIME</small>'+fmt(q.previously||('You finished <b>'+esc(prev.title)+'</b>. This quest builds directly on it.'))+'</div>':'')+
   (needed.length?'<div class="co eg"><small>YOU WILL USE (FROM EARLIER)</small>'+chips(needed)+'</div>':'')+
   (taught.length?'<div class="co keep"><small>NEW IN THIS QUEST</small>'+chips(taught)+'</div>':'')+
   '<h3>BY THE END YOU CAN...</h3><ul class="lines">'+(q.outcomes||[]).map(o=>'<li>'+fmt(o)+'</li>').join('')+'</ul>'+
   '<div class="co say"><small>TOO MUCH?</small>Do just the next 3 screens (2 minutes). Starting is the hard part; momentum is free after that.</div>';
}
function sWarmup(b,q){
  const qi=q.n-1,need=new Set(conceptNeeds(q)),pool=[];
  QUESTS.slice(0,qi).forEach(p=>p.quiz.forEach(x=>pool.push(x)));
  const wp=[];pool.forEach(x=>{const a=S.ans[x.id];let k=a?(a.last===false?4:1):2;if((x.concepts||[]).some(c=>need.has(c)))k+=3;for(let j=0;j<k;j++)wp.push(x.id)});
  const pick=[];shuffle(wp).forEach(id=>{if(pick.length<3&&!pick.includes(id))pick.push(id)});
  gate(true);
  b.innerHTML='<h2>Warm-up: pull it from memory</h2><p class="mut">Three quick questions from earlier quests, picked because this quest leans on them. Remembering before you learn keeps old ideas alive. Wrong answers are fine here.</p><div id="wu"></div>';
  let i=0,ok=0;
  (function draw(){
    const box=$(b,'#wu');
    if(i>=pick.length){box.innerHTML='<div class="co keep" style="display:block"><small>WARM-UP DONE</small>'+ok+' of '+pick.length+' right. The new idea builds on exactly these.</div>';addXP(3+ok,'warm-up');gate(false);return}
    box.innerHTML='<p class="chip" style="display:inline-block;margin-bottom:10px">'+(i+1)+' / '+pick.length+'</p><div id="wq"></div>';
    bindQuiz($(box,'#wq'),BANK[pick[i]],good=>{if(good)ok++;i++;draw()});
  })();
}
function sFlow(b,q,s){
  const N=s.nodes||[];
  b.innerHTML='<h2>'+fmt(s.title)+'</h2>'+(s.intro?'<p>'+fmt(s.intro)+'</p>':'')+'<div class="flow">'+N.map((n,i)=>'<div class="fstep rv">'+(i?'<span class="arr"></span>':'')+'<div class="node" style="--c:var(--k'+(i%6)+')"><div class="nl">'+fmt(n.label)+'</div>'+(n.sub?'<div class="ns">'+fmt(n.sub)+'</div>':'')+'</div></div>').join('')+'</div>'+li(s.lines)+vizHtml(s.viz)+co('keep','KEEP THIS',s.keep)+co('trap','TRAP',s.trap);
}
function sCompare(b,q,s){
  const H=s.headers||['A','B'];
  b.innerHTML='<h2>'+fmt(s.title)+'</h2>'+(s.intro?'<p>'+fmt(s.intro)+'</p>':'')+'<div class="cmp"><div class="crow chd"><span></span><span>'+fmt(H[0])+'</span><span>'+fmt(H[1])+'</span></div>'+(s.rows||[]).map(r=>'<div class="crow rv"><span class="cl">'+fmt(r[0])+'</span><span>'+fmt(r[1])+'</span><span>'+fmt(r[2])+'</span></div>').join('')+'</div>'+co('keep','KEEP THIS',s.keep)+co('trap','TRAP',s.trap);
}
function sSolve(b,q,s){
  const id=q.id+'-s'+V.i,Hs=s.hints||[];let used=0;gate(true);
  b.innerHTML='<h2>'+fmt(s.title||'Your turn')+'</h2><div class="prob">'+fmt(s.problem)+'</div><p class="mut">Work it out on paper first. Hints come one at a time and using them is fine: that is how the skill sticks.</p><div id="hs"></div><div class="row"><button class="btn ghost sm2" data-k="hint">HINT ('+Hs.length+' LEFT)</button><button class="btn blue sm2" data-k="show">SHOW SOLUTION</button></div><div id="sol" style="display:none"></div>';
  const hb=$(b,'[data-k=hint]');if(!Hs.length)hb.style.display='none';
  hb.onclick=()=>{if(used<Hs.length){$(b,'#hs').insertAdjacentHTML('beforeend','<div class="co say"><small>HINT '+(used+1)+'</small>'+fmt(Hs[used])+'</div>');used++;hb.textContent='HINT ('+(Hs.length-used)+' LEFT)';if(used>=Hs.length)hb.disabled=true}};
  $(b,'[data-k=show]').onclick=e=>{
    e.target.disabled=true;hb.disabled=true;const sol=$(b,'#sol');sol.style.display='block';
    sol.innerHTML='<ol class="steps">'+(s.steps||[]).map(x=>'<li><span class="sl">'+fmt(x.label)+'</span><span class="sw">'+fmt(x.work)+'</span></li>').join('')+'</ol><div class="final">'+fmt(s.answer)+'</div><h3 style="margin-top:14px">HOW DID IT GO? BE HONEST.</h3><div class="row"><button class="btn good sm2" data-r="got">I GOT IT</button><button class="btn blue sm2" data-r="hint">GOT IT WITH HINTS</button><button class="btn sm2" data-r="no">NOT YET</button></div>';
    $$(sol,'[data-r]').forEach(bt=>bt.onclick=()=>{const r=bt.dataset.r;S.solves[id]={r,h:used};save();addXP(r==='got'?(used?5:8):r==='hint'?4:1,r==='no'?'honest rating':'solved');if(r==='no')toast('Saved. Redo it from the map when ready.');gate(false);$$(sol,'[data-r]').forEach(x=>x.disabled=true)});
  };
}
function sPredict(b,q,s){
  const id=q.id+'-p'+V.i;
  b.innerHTML='<h2>'+fmt(s.prompt)+'</h2><p class="mut">Lock in a guess first (say it out loud or write it). A wrong guess still helps you remember the answer.</p><button class="btn" data-k="lock">LOCKED IN MY GUESS</button><div class="co keep" id="pa" style="display:none"><small>ANSWER</small>'+fmt(s.answer)+'</div>';
  $(b,'[data-k=lock]').onclick=e=>{e.target.style.display='none';$(b,'#pa').style.display='block';if(!S.hooks[id]){S.hooks[id]=1;addXP(3,'predicted first')}save()};
}
function sIdea(b,q,s){
  b.innerHTML='<h2>'+fmt(s.title)+'</h2>'+li(s.lines)+co('ana','THINK OF IT AS',s.analogy)+vizHtml(s.viz)+figHtml(s)+co('eg','EXAMPLE',s.example)+co('keep','KEEP THIS',s.keep)+co('trap','TRAP',s.trap);
}
function sHtml(b,q,s){b.innerHTML=(s.title?'<h2>'+fmt(s.title)+'</h2>':'')+'<div class="rv">'+s.html+'</div>'}
function sFigure(b,q,s){b.innerHTML='<h2>'+fmt(s.title||'')+'</h2>'+li(s.lines)+(s.svg?'<div class="vizbox rv">'+s.svg+'</div>':'')+figHtml(s)+co('keep','KEEP THIS',s.keep)}
function sDecode(b,q,s){
  b.innerHTML='<h2>'+fmt(s.title)+'</h2>'+(s.intro?'<p>'+fmt(s.intro)+'</p>':'')+'<div class="fbox">'+fmtF(s.formula)+'</div>'+(s.read?'<p class="mut">Read it aloud: '+fmt(s.read)+'</p>':'')+
   '<div class="syms">'+(s.parts||[]).map((p,i)=>'<div class="sy rv" style="--c:var(--k'+(i%6)+')"><div class="g">'+fmtF(p.sym)+'</div><div><div class="nm">'+fmt(p.name)+'</div><div>'+fmt(p.plain)+'</div>'+(p.effect?'<div class="ef">'+fmt(p.effect)+'</div>':'')+'</div></div>').join('')+'</div>'+
   vizHtml(s.viz)+figHtml(s)+co('keep','KEEP THIS',s.note||s.keep)+co('trap','TRAP',s.trap);
}
function sWorked(b,q,s){
  b.innerHTML='<h2>'+fmt(s.title)+'</h2><div class="prob">'+fmt(s.problem)+'</div><ol class="steps">'+(s.steps||[]).map(x=>'<li class="rv"><span class="sl">'+fmt(x.label)+'</span><span class="sw">'+fmtF(fmt(x.work))+'</span></li>').join('')+'</ol>'+
   '<div class="final rv">'+fmt(s.answer)+'</div>'+vizHtml(s.viz);
}
function sFigureLab(){}

/* ---------- lab (sliders + live outputs + plot/svg) ---------- */
const MATHN=Object.getOwnPropertyNames(Math);
function compile(expr,names){
  const extra=MATHN.filter(n=>!names.includes(n));
  try{const f=new Function(...names,...extra,'return ('+expr+')');return vals=>{try{return f(...names.map(n=>vals[n]),...extra.map(n=>Math[n]))}catch(e){return NaN}}}catch(e){return()=>NaN}
}
function fnum(v,f){
  if(typeof v!=='number'||!isFinite(v))return '-';
  const loc=(x,d)=>x.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
  switch(f){case 'int':case '0':return loc(Math.round(v),0);case '1':return loc(v,1);case '2':return loc(v,2);case '3':return loc(v,3);
    case '$':return '$'+loc(v,2);case '$0':return '$'+loc(Math.round(v),0);case '%':return loc(v*100,1)+'%';case '%0':return loc(v*100,0)+'%';case 'sci':return v.toExponential(2);}
  const a=Math.abs(v);return a>=1000?loc(v,0):a>=100?loc(v,1):a>=1?loc(v,2):a===0?'0':v.toPrecision(3);
}
function sLab(b,q,s){
  const C=s.controls||[],names=C.map(c=>c.id);const vals={};C.forEach(c=>vals[c.id]=c.value!=null?c.value:c.min);
  const O=(s.outputs||[]).map(o=>Object.assign({},o,{fn:compile(o.expr,names)}));
  b.innerHTML='<h2>'+fmt(s.title)+'</h2>'+(s.intro?'<p>'+fmt(s.intro)+'</p>':'')+
   '<div class="lab"><div class="ctls">'+C.map(c=>'<div class="ctl"><label><span>'+fmt(c.label||c.id)+'</span><b data-v="'+c.id+'"></b></label><input type="range" data-id="'+c.id+'" min="'+c.min+'" max="'+c.max+'" step="'+(c.step||1)+'" value="'+vals[c.id]+'"></div>').join('')+
   '<div class="outs">'+O.map((o,i)=>'<div class="out"><span>'+fmt(o.label)+'</span><b data-o="'+i+'"></b></div>').join('')+'</div></div><div class="vizbox" id="lv"></div></div>'+
   (s.tries&&s.tries.length?'<h3 style="margin-top:12px">TRY THIS</h3><ul class="tries">'+s.tries.map(t=>'<li>'+fmt(t)+'</li>').join('')+'</ul>':'')+co('keep','KEEP THIS',s.keep);
  const lv=$(b,'#lv');
  const tpl=s.svg?String(s.svg).replace(/\{\{([^}]+)\}\}/g,(m,e)=>'{{'+e+'}}'):null;
  const tplFns=tpl?[...tpl.matchAll(/\{\{([^}]+)\}\}/g)].map(m=>[m[0],compile(m[1],names)]):[];
  const series=(s.plot&&s.plot.series||[]).map((p,i)=>Object.assign({color:['#e63946','#1f7fd1','#12213f'][i%3]},p,{fn:compile(p.expr,names.concat('x'))}));
  function draw(){
    C.forEach(c=>{$(b,'[data-v='+c.id+']').textContent=fnum(+vals[c.id],c.fmt||'')+(c.unit?' '+c.unit:'')});
    O.forEach((o,i)=>{$(b,'[data-o="'+i+'"]').textContent=fnum(o.fn(vals),o.fmt||'')+(o.unit?' '+o.unit:'')});
    let html='';
    if(tpl){let t=tpl;tplFns.forEach(([k,f])=>{const v=f(vals);t=t.split(k).join(isFinite(v)?(+v.toFixed(2)):0)});html+=t}
    if(series.length)html+=plotSvg(s.plot,series,vals,names);
    lv.innerHTML=html||'<p class="mut">Move the sliders.</p>';
  }
  $$(b,'input[type=range]').forEach(r=>r.oninput=()=>{vals[r.dataset.id]=+r.value;draw()});
  b._lab={C,O,vals,draw};draw();
}
function niceStep(raw){if(!(raw>0))return 1;const e=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/e;return (f<=1?1:f<=2?2:f<=5?5:10)*e}
function axisFmt(v){const a=Math.abs(v);const t=x=>String(+x.toFixed(2));if(a>=1e6)return t(v/1e6)+'M';if(a>=1e4)return t(v/1e3)+'k';if(a>=1e3&&v%1000===0)return t(v/1e3)+'k';return t(v)}
function plotSvg(P,series,vals,names){
  const W=640,H=320,L=64,B=44,T=16,Rr=18,x0=P.x[0],x1=P.x[1],N=80;
  const pts=series.map(se=>{const a=[];for(let i=0;i<=N;i++){const x=x0+(x1-x0)*i/N;const v=Object.assign({},vals,{x});a.push([x,se.fn(v)])}return a});
  let ymin=P.ymin!=null?P.ymin:Math.min(...pts.flat().map(p=>p[1]).filter(isFinite)),ymax=P.ymax!=null?P.ymax:Math.max(...pts.flat().map(p=>p[1]).filter(isFinite));
  if(!isFinite(ymin)||!isFinite(ymax)||ymin===ymax){ymin=0;ymax=1}if(P.ymin==null&&ymin>0&&ymin<ymax*.3)ymin=0;
  const stp=niceStep((ymax-ymin)/4);if(P.ymin==null)ymin=Math.floor(ymin/stp)*stp;if(P.ymax==null)ymax=Math.ceil(ymax/stp)*stp;
  const sx=x=>L+(x-x0)/(x1-x0)*(W-L-Rr),sy=y=>H-B-(y-ymin)/(ymax-ymin)*(H-B-T);
  let g='';
  for(let yv=ymin;yv<=ymax+stp*.001;yv+=stp){const y=sy(yv);g+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-Rr)+'" y2="'+y+'" stroke="#c4e8ff" stroke-width="2"/><text x="'+(L-8)+'" y="'+(y+5)+'" text-anchor="end" font-size="15" font-family="monospace" fill="#40527a">'+axisFmt(yv)+'</text>'}
  for(let i=0;i<=4;i++){const xv=x0+(x1-x0)*i/4,x=sx(xv);g+='<text x="'+x+'" y="'+(H-B+22)+'" text-anchor="middle" font-size="15" font-family="monospace" fill="#40527a">'+axisFmt(xv)+'</text>'}
  g+='<rect x="'+L+'" y="'+T+'" width="'+(W-L-Rr)+'" height="'+(H-B-T)+'" fill="none" stroke="#12213f" stroke-width="3"/>';
  series.forEach((se,k)=>{g+='<polyline fill="none" stroke="'+se.color+'" stroke-width="4" stroke-linejoin="round" points="'+pts[k].filter(p=>isFinite(p[1])).map(p=>sx(p[0]).toFixed(1)+','+sy(p[1]).toFixed(1)).join(' ')+'"/>';
    if(P.at&&vals[P.at]!=null){const xv=Math.min(x1,Math.max(x0,vals[P.at])),yv=se.fn(Object.assign({},vals,{x:xv}));if(isFinite(yv))g+='<rect x="'+(sx(xv)-7)+'" y="'+(sy(yv)-7)+'" width="14" height="14" fill="'+se.color+'" stroke="#12213f" stroke-width="3"/>'}
    if(series.length>1&&se.label)g+='<rect x="'+(L+10)+'" y="'+(T+8+k*22)+'" width="14" height="14" fill="'+se.color+'"/><text x="'+(L+30)+'" y="'+(T+20+k*22)+'" font-size="15" font-family="monospace" fill="#12213f">'+esc(se.label)+'</text>'});
  if(P.at&&vals[P.at]!=null){const xx=sx(Math.min(x1,Math.max(x0,vals[P.at])));g+='<line x1="'+xx+'" y1="'+T+'" x2="'+xx+'" y2="'+(H-B)+'" stroke="#e63946" stroke-width="2" stroke-dasharray="6 5"/>'}
  g+=(P.xlabel?'<text x="'+((L+W-Rr)/2)+'" y="'+(H-6)+'" text-anchor="middle" font-size="16" font-family="monospace" fill="#12213f">'+esc(P.xlabel)+'</text>':'')+(P.ylabel?'<text transform="translate(14 '+((T+H-B)/2)+') rotate(-90)" text-anchor="middle" font-size="16" font-family="monospace" fill="#12213f">'+esc(P.ylabel)+'</text>':'');
  return '<svg class="plot" viewBox="0 0 '+W+' '+H+'" width="100%">'+g+'</svg>';
}

/* ---------- brain dump ---------- */
function sDump(b,q,s){
  const id=q.id+'-d'+V.i;let left=60,iv=null;
  b.innerHTML='<h2>Brain dump: 60 seconds</h2><p>'+fmt(s.prompt||'Write everything you remember from this quest. No peeking.')+'</p><div class="row"><button class="btn" data-k="go">START 60 S</button><span class="timer-big" id="dt"></span><button class="btn ghost sm2" data-k="skip">SKIP TO CHECK</button></div><textarea placeholder="Type it, say it out loud, or write on paper."></textarea><div id="pts" style="display:none"><h3>CHECK YOURSELF: TICK WHAT YOU REMEMBERED</h3>'+(s.points||[]).map(p=>'<label><input type="checkbox"><span>'+fmt(p)+'</span></label>').join('')+'<button class="btn good" data-k="fin">DONE</button></div>';
  const reveal=()=>{clearInterval(iv);$(b,'#pts').style.display='block'};
  $(b,'[data-k=go]').onclick=e=>{e.target.style.display='none';$(b,'#dt').textContent=left;iv=setInterval(()=>{left--;$(b,'#dt').textContent=left;if(left<=0)reveal()},1000)};
  $(b,'[data-k=skip]').onclick=reveal;
  $(b,'[data-k=fin]').onclick=()=>{const n=$$(b,'input:checked').length,p=S.dumps[id]||0;if(n>p)addXP((n-p)*3,'brain dump '+n+'/'+(s.points||[]).length);S.dumps[id]=Math.max(n,p);save();next()};
}

/* ---------- quiz ---------- */
function quizHtml(Qn){
  const opts=shuffle([Qn.answer].concat(Qn.wrong||[]));Qn._o=opts;
  return (Qn.tag?'<div class="chips"><span class="chip b">'+esc(Qn.tag)+'</span></div>':'')+'<h2 class="qq" style="font-family:var(--body)">'+fmt(Qn.q)+'</h2><div class="opts">'+opts.map((t,i)=>'<button class="opt" data-i="'+i+'"><span class="k">'+'ABCD'[i]+'</span><span>'+fmt(t)+'</span></button>').join('')+'</div><div class="fb"></div>';
}
function bindQuiz(box,Qn,onDone){
  box.innerHTML=quizHtml(Qn);const ai=Qn._o.indexOf(Qn.answer);let locked=false;
  box._correct=ai;box._pick=i=>{const b=$(box,'.opt[data-i="'+i+'"]');b&&b.click()};
  $$(box,'.opt').forEach(b=>b.onclick=()=>{
    if(locked)return;locked=true;const i=+b.dataset.i,ok=i===ai;
    $$(box,'.opt').forEach((x,k)=>{x.disabled=true;if(k===ai)x.classList.add('ok');else if(x===b)x.classList.add('bad')});
    const r=S.ans[Qn.id]||{n:0,c:0,first:false};r.n++;if(ok)r.c++;if(r.n===1)r.first=ok;const wasMiss=r.last===false;r.last=ok;S.ans[Qn.id]=r;
    if(ok){S.combo++;S.best=Math.max(S.best,S.combo);SND.ok();award('first');if(S.combo>=5)award('combo5');addXP(r.n===1?10:4,r.n===1?'first try'+(S.combo>=3?'  COMBO x'+S.combo:''):'got it this time')}
    else{S.combo=0;SND.bad()}
    save();renderHud();
    $(box,'.fb').innerHTML='<div class="verdict '+(ok?'ok':'bad')+'">'+(ok?'CORRECT!':'NOT QUITE. ANSWER: '+'ABCD'[ai])+'</div><div class="why">'+fmt(Qn.why||'')+'</div>'+(ok?'':'<p class="mut sm">Saved to your retry list. Wrong answers are where learning happens.</p>')+(onDone?'<button class="btn" data-k="nx">NEXT QUESTION</button>':'');
    if(onDone){$(box,'[data-k=nx]').onclick=()=>onDone(ok)}else gate(false);
  });
}
function sQuestion(b,q,s){const Qn=BANK[s.id];gate(true);bindQuiz(b,Qn,null)}

/* ---------- flashcards + spaced review ---------- */
const IV=[0,1,2,4,7,14];
function rate(id,ok){const c=S.cards[id]||{box:0,due:today(),n:0};c.n++;if(ok){c.box=Math.min(5,c.box+1);c.due=addDays(IV[c.box])}else{c.box=1;c.due=today()}S.cards[id]=c;save();if(ok)addXP(1,'card')}
function cardRunner(el,ids,opts){
  opts=opts||{};let i=0,hit=0;const list=ids.slice(),again=[];
  function draw(){
    if(i>=list.length){
      el.innerHTML='<div class="big2">'+hit+' / '+list.length+'</div><p>'+(opts.review?'Review done. Cards you got right come back later: gaps grow 1, 2, 4, 7, 14 days.':'Cards saved. They show up in your daily review when due.')+'</p><button class="btn" data-k="c">CONTINUE</button>';
      $(el,'[data-k=c]').onclick=()=>opts.review?go({v:'map'}):(gate(false),next());return;
    }
    const id=list[i],c=CARDS[id];
    el.innerHTML='<p class="mut sm">CARD '+(i+1)+' / '+list.length+'. Click the card to flip.</p><div class="fc"><div class="fcard"><div>'+fmt(c.f)+'</div><div class="a">'+fmt(c.b)+'</div><div class="tip">CLICK TO FLIP</div></div></div><div class="row" id="rt" style="visibility:hidden"><button class="btn" data-k="ag">AGAIN</button><button class="btn good" data-k="gt">GOT IT</button><span class="mut sm">Honest rating = better schedule.</span></div>';
    const fc=$(el,'.fcard');fc.onclick=()=>{fc.classList.add('open');$(el,'#rt').style.visibility='visible'};
    $(el,'[data-k=ag]').onclick=()=>{rate(id,false);if(opts.review&&!again.includes(id)){again.push(id);list.push(id)}i++;draw()};
    $(el,'[data-k=gt]').onclick=()=>{rate(id,true);hit++;i++;draw()};
  }
  draw();
}
function sCards(b,q){gate(true);b.innerHTML='<h2>Flip each card. Be honest.</h2><div id="cr"></div>';cardRunner($(b,'#cr'),q.cardsList)}
function rReview(){
  const d=dueIds(),total=Object.keys(S.cards).filter(id=>CARDS[id]).length;
  root.onclick=null;
  root.innerHTML='<div class="panel"><div class="chips"><span class="chip r">DAILY REVIEW</span></div><div id="rv"></div></div>';
  const el=$(root,'#rv');
  if(!d.length){const nx=Object.values(S.cards).map(c=>c.due).sort()[0];
    el.innerHTML='<h2>Nothing due right now</h2><p>'+(total?(nx?'Next cards due: <b>'+nx+'</b>.':''):'No cards yet. Finish a quest and flip its cards: they land here.')+'</p><button class="btn" data-k="m">BACK TO THE MAP</button>';$(el,'[data-k=m]').onclick=()=>go({v:'map'})}
  else{el.innerHTML='<h2>Spaced review: '+d.length+' due</h2><div id="cr"></div>';cardRunner($(el,'#cr'),shuffle(d),{review:true})}
}

/* ---------- recap / quest complete ---------- */
function sRecap(b,q){
  const R=q.recap||{},st=qStats(q),nx=QUESTS[q.n];
  const taught=[];q.steps.forEach(x=>(x.teaches||[]).forEach(id=>taught.push(id)));
  const hook=q.next_hook||(nx&&nx.question)||(nx&&('Next: '+nx.title));
  b.innerHTML=track(q.n-1)+'<h2>Quest '+q.n+' recap</h2><ul class="lines">'+(R.lines||(q.outcomes||[])).map(l=>'<li>'+fmt(l)+'</li>').join('')+'</ul>'+
   (taught.length?'<div class="co keep"><small>YOU NOW KNOW</small>'+chips(taught)+'</div>':'')+
   (R.teach?'<div class="co ana"><small>TEACH-BACK  30 SECONDS</small>'+fmt(R.teach)+'</div>':'<div class="co ana"><small>TEACH-BACK  30 SECONDS</small>Explain this quest out loud as if to a friend who has never heard of it. Where you get stuck is what to re-read.</div>')+
   '<div class="co eg"><small>QUEST RESULT</small>First-try score: <b>'+st.first+' / '+st.n+'</b> questions.</div>'+
   (hook?'<div class="co say"><small>NEXT UP</small>'+fmt(hook)+'</div>':'')+
   '<div class="sprites" style="justify-content:flex-start">'+icon('trophy',5)+icon('star',5)+'</div><button class="btn big" data-k="m">'+(nx?'BACK TO THE MAP':'BACK TO THE MAP')+'</button>';
  $(b,'[data-k=m]').onclick=()=>go({v:'map'});
  if(!S.done[q.id]){S.done[q.id]=true;save();SND.lvl();confetti(40);addXP(25,'quest '+q.n+' complete');award('clear1');if(st.n&&st.first===st.n)award('perfect');if(QUESTS.every(x=>S.done[x.id]))award('allclear')}
}

/* ---------- raid (boss) + retry ---------- */
function pickRaid(n){
  const ids=Object.keys(BANK);const pool=[];
  ids.forEach(id=>{const a=S.ans[id];const w=a?(a.last===false?4:1):2;for(let j=0;j<w;j++)pool.push(id)});
  const out=[],seen=new Set();
  for(const id of shuffle(pool)){if(seen.has(id))continue;seen.add(id);out.push(id);if(out.length>=n)break}
  for(let i=1;i<out.length;i++)if(BANK[out[i]].quest===BANK[out[i-1]].quest)for(let j=i+1;j<out.length;j++)if(BANK[out[j]].quest!==BANK[out[i-1]].quest){[out[i],out[j]]=[out[j],out[i]];break}
  return out;
}
function rRaid(){raidMenu('raid')}
function rRetry(){raidMenu('retry')}
function raidMenu(mode){
  root.onclick=null;
  const el=document.createElement('div');el.className='panel';root.innerHTML='';root.appendChild(el);
  const m=missIds(),total=Object.keys(BANK).length;
  if(mode==='retry'){
    el.innerHTML='<div class="chips"><span class="chip r">RETRY</span></div><h2>Retry your misses</h2><p>'+(m.length?'You have <b>'+m.length+'</b> missed question'+(m.length>1?'s':'')+'. Fixing these is the fastest way to turn weak spots into points.':'No missed questions right now.')+'</p><button class="btn">'+(m.length?'RETRY NOW':'BACK TO THE MAP')+'</button>';
    $(el,'button').onclick=()=>m.length?runQuiz(el,shuffle(m),'retry'):go({v:'map'});
  }else{
    el.innerHTML='<div class="chips"><span class="chip r">BOSS RAID</span></div><div class="sprites" style="justify-content:flex-start">'+icon('boss',7)+'</div><h2>Mixed questions from every quest</h2><p>Interleaved on purpose: mixing topics feels harder and sticks better. Your missed questions appear more often. Miss one and it comes back once before the boss falls.'+(Object.keys(S.ans).length<8?' <b>Tip:</b> finish a few quests first.':'')+'</p><div class="row"><button class="btn" data-n="20">FULL RAID: '+Math.min(20,total)+' Q</button><button class="btn ghost" data-n="8">QUICK RAID: '+Math.min(8,total)+' Q</button></div>';
    $$(el,'[data-n]').forEach(b=>b.onclick=()=>runQuiz(el,pickRaid(+b.dataset.n),'raid'));
  }
}
function runQuiz(el,ids,mode){
  const queue=ids.slice(),total=ids.length;let done=0,okFirst=0;const byQ={},seen=new Set();
  function draw(){
    if(!queue.length){
      const acc=Math.round(100*okFirst/total);S.raids+=mode==='raid'?1:0;
      const bonus=mode==='raid'?(acc>=80?30:10):5;addXP(bonus,mode==='raid'?'raid clear':'retry done');
      if(mode==='raid'&&acc>=80){award('boss');confetti(60)}
      if(mode==='retry'&&!missIds().length)award('comeback');
      const rows=Object.keys(byQ).map(k=>{const qq=QUESTS[qIdx(k)];return '<div class="out"><span>'+esc(qq.title)+'</span><b>'+byQ[k][0]+' / '+byQ[k][1]+'</b></div>'}).join('');
      el.innerHTML='<div class="sprites" style="justify-content:flex-start">'+icon('trophy',6)+'</div><div class="big2">'+acc+'%</div><p>'+okFirst+' of '+total+' right on the first try. '+(acc>=85?'Exam-ready on these.':acc>=65?'Solid. Retry the misses and you are there.':'Good data. Your retry list now shows exactly what to study.')+'</p><div class="outs" style="margin:12px 0">'+rows+'</div><div class="row"><button class="btn" data-k="a">'+(mode==='raid'?'RAID AGAIN':'BACK')+'</button><button class="btn ghost" data-k="m">BACK TO THE MAP</button></div>';
      $(el,'[data-k=a]').onclick=()=>mode==='raid'?raidMenu('raid'):go({v:'map'});$(el,'[data-k=m]').onclick=()=>go({v:'map'});return;
    }
    const id=queue.shift(),Qn=BANK[id];
    const hp=Array.from({length:total},(_,i)=>'<i class="'+(i<done?'lost':'')+'"></i>').join('');
    el.innerHTML='<div class="boss">'+(mode==='raid'?icon('boss',4):icon('flag',4))+'<div class="hp" title="Boss HP">'+hp+'</div><span class="chip">'+(done+1)+' / '+total+'</span></div><div id="rq"></div>';
    bindQuiz($(el,'#rq'),Qn,good=>{
      byQ[Qn.quest]=byQ[Qn.quest]||[0,0];
      if(!seen.has(id)){seen.add(id);byQ[Qn.quest][1]++;if(good){okFirst++;byQ[Qn.quest][0]++}}
      if(good){done++}else if(!queue.includes(id)&&mode==='raid'&&!Qn._requeued){Qn._requeued=true;queue.push(id)}else{done++}
      draw();
    });
  }
  draw();
}

/* ---------- keys + touch ---------- */
addEventListener('keydown',e=>{
  const tg=e.target;if(['TEXTAREA','INPUT'].includes(tg.tagName)&&tg.type!=='checkbox'&&tg.type!=='range'){if(e.key==='Escape'){const t=topOverlay();t&&t.remove()}return}
  const k=e.key;
  if(k==='Escape'){const t=topOverlay();if(t){t.remove();return}}
  if(topOverlay()){const t=topOverlay();if(t.classList.contains('lvlov')){t.remove();e.preventDefault()}return}
  if(k==='g'||k==='G'){glToggle(true);return}
  if(k==='h'||k==='H'){go({v:'map'});return}
  if(k==='r'||k==='R'){go({v:'review'});return}
  if(k==='t'||k==='T'){tToggle();return}
  if(k==='m'||k==='M'){S.sfx=!S.sfx;save();toast('Sound '+(S.sfx?'on':'off'));SND.ok();return}
  const qz=$(root,'.opts');
  if(qz&&!$(root,'.opt[disabled]')){const idx='abcd'.indexOf(k.toLowerCase()),n=/^[1-4]$/.test(k)?+k-1:idx;if(n>=0&&n<4){const box=qz.parentElement;box._pick&&box._pick(n);return}}
  if(V.v!=='quest')return;
  if(['ArrowRight','PageDown'].includes(k)||((k===' '||k==='Enter')&&!['BUTTON'].includes(tg.tagName))){e.preventDefault();next()}
  else if(['ArrowLeft','PageUp'].includes(k)){e.preventDefault();prev()}
});
let tx=null;addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});
addEventListener('touchend',e=>{if(tx===null||V.v!=='quest')return;const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>90&&!e.target.closest('input,textarea,.lab'))(d<0?next():prev());tx=null});

/* ---------- selftest: render every step, check for exceptions ---------- */
function selftest(){
  const errs=[];let n=0;
  QUESTS.forEach((q,qi)=>q.steps.forEach((s,i)=>{try{V={v:'quest',q:qi,i};rQuest();n++;
    if(s.t==='lab'){const L=$(root,'#body')._lab;L.O.forEach((o,k)=>{if(!isFinite(o.fn(L.vals)))errs.push('Q'+q.n+' step '+(i+1)+': output "'+o.label+'" is not a finite number at default values')})}
    if(!root.textContent.trim())errs.push('Q'+q.n+' step '+(i+1)+': empty')}catch(e){errs.push('Q'+q.n+' step '+(i+1)+' ('+s.t+'): '+e.message)}}));
  ['map','review'].forEach(v=>{try{go({v});n++}catch(e){errs.push(v+': '+e.message)}});
  const pre=document.createElement('pre');pre.id='selftest';pre.textContent=(errs.length?'FAIL '+errs.join(' | '):'OK '+n+' screens')+'';document.body.appendChild(pre);
}

/* ---------- start ---------- */
renderHud();
if(/[?&]reveal/.test(location.search))document.body.classList.add('static');
if(/[?&]selftest/.test(location.search)){selftest()}
else{
  const m=location.hash.match(/^#q(\d+)\/(\d+)$/);
  if(m&&QUESTS[+m[1]-1])go({v:'quest',q:+m[1]-1,i:Math.max(0,Math.min(QUESTS[+m[1]-1].steps.length-1,+m[2]-1))});
  else if(location.hash==='#map')go({v:'map'});
  else go({v:'title'});
}
})();
