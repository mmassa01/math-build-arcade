// Round-2 card flow in Horse Race and Skyrail, driven through the real shared card
// (dist/number-entry.js), the real practice client and a real pathway service:
// one Start / 3-2-1 before the first card, the miss correction hold (the next card and the
// race clocks wait, correct answers do not), pause covers and abandons the card with a fresh
// one on resume, the idle "Still there?" pause, flush before completion, and demo pays nothing.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const factory=require('../dist/practice-pathways.js').create;

function world(){
 let T=1000,seq=0,nextId=1;const timers=[],rafs=[],log=[],messages=[],docListeners={},winListeners={},all=[];
 class Element{
  constructor(tag='div'){this.tagName=String(tag).toUpperCase();this.children=[];this.attrs={};this.listeners={};this.dataset={};this.hidden=false;this.disabled=false;this.value='';this.isConnected=true;this.className='';this._text='';this.id='';const values=new Set();this.style={setProperty(k,v){this[k]=v;}};this.classList={values,add:(...a)=>a.forEach(v=>values.add(v)),remove:(...a)=>a.forEach(v=>values.delete(v)),toggle:(v,on)=>{if(on===undefined)on=!values.has(v);if(on)values.add(v);else values.delete(v);return on;},contains:v=>values.has(v)};all.push(this);}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set innerHTML(v){this._text=String(v);this.children=[];}get innerHTML(){return this._text;}
  get parentElement(){return this.parentNode||null;}
  append(...a){for(const n of a){if(typeof n!=='object')continue;if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(c=>c!==n);this.children.push(n);n.parentNode=this;n.isConnected=true;}}
  prepend(...a){this.append(...a);}before(){}
  replaceChildren(...a){for(const n of this.children)n.parentNode=null;this.children=[];this._text='';this.append(...a);}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}removeAttribute(k){delete this.attrs[k];}addEventListener(k,f){this.listeners[k]=f;}
  getClientRects(){return this.hidden?[]:[{}];}getBoundingClientRect(){return{left:0,top:0,width:300,height:120};}focus(){doc.activeElement=this;}closest(){return null;}querySelector(){return null;}querySelectorAll(){return[];}
  cloneNode(){return new Element(this.tagName);}remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;this.isConnected=false;}
  animate(){let done;const a={finished:new Promise(r=>done=r),pause(){},play(){},cancel(){done();}};return a;}
  click(){this.onclick?.();}
 }
 const named={},own=new Set(['arcadeIdle','arcadeIdleResume','arcadeIdleTitle','practiceComplete','practiceSkill','range']);
 const body=new Element('body');
 const doc={hidden:false,readyState:'complete',activeElement:null,body,createElement:t=>new Element(t),
  getElementById(id){const found=all.find(n=>n.id===id&&n.isConnected);if(found||own.has(id))return found||null;return named['#'+id]??=Object.assign(new Element(),{value:id==='operation'?'mixed':''});},
  querySelector(sel){return named[sel]??=new Element();},querySelectorAll:()=>[],
  addEventListener:(t,f)=>{(docListeners[t]??=[]).push(f);},dispatchEvent(e){for(const f of docListeners[e.type]||[])f(e);}};
 const data=new Map(),api=factory({getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},()=>new Date(2026,10,19,9).getTime()+T,()=>.37);api.setGrade(3);api.setPathway('mixed');
 const svc=Object.create(api);svc.begin=o=>{const run=api.begin(o),record=run.record;run.record=(q,c,ms,opts={})=>{const r=record(q,c,ms,opts);if(r.accepted)log.push({seq:++seq,token:q.token,correct:!!c,timeout:!!opts.timeout,demo:!!o?.demo});return r;};return run;};
 const parent={location:{origin:'https://arcade.test'},ArcadePractice:svc,postMessage:m=>messages.push({...m,seq:++seq})};
 const s={console,Math,Map,Set,JSON,Number,String,Object,Array,Date,Promise,Error,Symbol,parent,document:doc,location:{origin:'https://arcade.test'},performance:{now:()=>T},crypto:{randomUUID:()=>'run-'+(++seq)},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},Event:class{constructor(type){this.type=type;}},matchMedia:()=>({matches:false}),Image:class{},devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  setTimeout(fn,ms=0){const t={id:nextId++,at:T+Math.max(0,ms),fn};timers.push(t);return t.id;},clearTimeout(id){const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);},setInterval(){return nextId++;},clearInterval(){},
  requestAnimationFrame(f){rafs.push(f);return rafs.length;},addEventListener:(t,f)=>{(winListeners[t]??=[]).push(f);}};
 s.window=s;s.globalThis=s;vm.createContext(s);
 const run=src=>vm.runInContext(src,s);
 function fire(){for(;;){timers.sort((a,b)=>a.at-b.at||a.id-b.id);const t=timers[0];if(!t||t.at>T)break;timers.shift();t.fn();}}
 function frame(){const list=rafs.splice(0);for(const f of list)f(T);}
 function advance(ms,step=16){const end=T+ms;while(T<end){T=Math.min(end,T+step);fire();frame();}}
 const message=data=>{for(const f of winListeners.message||[])f({origin:'https://arcade.test',source:parent,data});};
 const find=(node,cls)=>{if(String(node.className||'').split(' ').includes(cls))return node;for(const c of node.children||[]){const f=find(c,cls);if(f)return f;}return null;};
 const live=()=>all.filter(n=>n.isConnected);
 return{s,run,advance,fire,frame,message,find,doc,body,log,messages,data,api,named,get now(){return T;},Element,
  gateButton:host=>find(host,'start-gate-button'),idleButton:()=>live().find(n=>n.id==='arcadeIdleResume')||null,idleOverlay:()=>live().find(n=>n.id==='arcadeIdle')||null};
}
const load=(w,files)=>{for(const f of files)w.run(fs.readFileSync(f,'utf8'));};
const typeAnswer=(entry,value)=>{for(const d of String(value))entry.key(d);};
const wrongFor=answer=>require('../dist/number-entry.js').wrong(answer);

// ---------------------------------------------------------------- Horse Race
{
 const w=world(),s=w.s;
 Object.assign(s,{HorseArt:{ready:Promise.resolve()},PR:{},DB:{},K:{},S:{},API:{},defaultStable:()=>({}),ri:(_r,a,b)=>a+Math.floor(Math.random()*(b-a+1)),shuffle:(_r,a)=>a,wallet(){},racedThisWeek(){},selectChoice(){},renderRace(){},updateRaceBar(){},showItem(){},finishRace(){},
  // The shape of the rosenbaum engine the horse wrapper sits on.
  nextItem(){const R=s.K.R;R.waiting=false;if(R.i>=R.items.length)return s.finishRace();R.start=s.performance.now();if(!R.mounted){s.renderRace();R.mounted=true;}s.showItem(R.items[R.i],R.p,3);},
  answer(v){const R=s.K.R;if(!R||s.K.stage!=='race'||R.locked||R.waiting||R.i>=R.items.length)return;const it=R.items[R.i];R.res.push({status:v==null?'noResponse':String(v)===String(it.answer)?'correct':'incorrect'});R.i++;R.waiting=true;s.setTimeout(()=>s.nextItem(),240);},
  startRace(){const p=s.PR['arcade.mul'];s.K.R={p,items:p.gen(),i:0,res:[],waiting:false};s.K.stage='race';s.K.R.mounted=false;s.nextItem();}});
 load(w,['dist/number-entry.js','dist/round-timer.js','dist/practice-client.js']);let round;const mountRound=s.ArcadeRound.mount;s.ArcadeRound.mount=o=>(round=mountRound(o));w.run(fs.readFileSync('dist/races/horse-standalone.js','utf8'));
 (async()=>{
  await new Promise(setImmediate);
  const host=w.doc.getElementById('ans'),entry=()=>s.ArcadeNumberEntry.mount(host),R=()=>s.K.R,status=()=>s.HorseRaceStatus(),item=()=>R().items[R().i];
  const rewards=()=>w.messages.filter(m=>m.type==='arcade-reward').length;
  w.message({type:'arcade-command',action:'play'});
  // 1. Start gate: the course is up, no card, no clocks, until Start and the 3-2-1.
  assert.equal(status().waiting,true,'a play race opens on the Start gate');const btn=w.gateButton(host);assert(btn,'the Start button is on the card');
  w.advance(8000);assert.equal(R().res.length,0,'no card can time out behind the gate');assert.equal(w.log.length,0);assert.equal(s.RacePaceSnapshot().opponent,0,'the pace horse waits for the start');assert.equal(round.elapsed,0,'the round clock waits for the start');
  assert.equal(entry().buffer.length,0,'no fact is on the card before Start');
  btn.onclick();w.advance(2900);assert.equal(status().waiting,true,'3-2-1 still counting');w.advance(200);assert.equal(status().waiting,false,'the race starts after the count');
  assert.equal(R().waiting,false);assert(entry().buffer.length>0,'the first card is dealt after the count');const firstShown=w.now;
  // Full three seconds on the first card.
  w.advance(2900);assert.equal(R().res.length,0,'the first card keeps its full window');typeAnswer(entry(),item().answer);assert.equal(R().res.at(-1).status,'correct');assert.equal(rewards(),1,'a correct card pays');
  assert.equal(entry().holdMs,0,'correct answers are not held');const afterCorrect=w.now;w.advance(260);assert.equal(R().waiting,false,'a correct answer brings the next card after the usual gap');assert(w.now-afterCorrect<300);
  // 2. Miss: the correction holds the next card for 1.5 s; the pace horse and round clock stand still.
  const pace0=s.RacePaceSnapshot().opponent,clock0=round.elapsed;typeAnswer(entry(),wrongFor(item().answer));assert.equal(entry().holdMs,1500);assert(entry().holding);
  w.advance(1400);assert.equal(R().waiting,true,'the next card waits for the correction');assert(Math.abs(s.RacePaceSnapshot().opponent-pace0)<0.02,'the pace horse does not gain during the hold');assert(round.elapsed-clock0<0.05,'the round clock stands still during the hold');
  w.advance(200);assert.equal(R().waiting,false,'the next card comes after the hold');assert(!entry().holding);
  // ...and that card has its full three seconds.
  w.advance(2900);assert.equal(R().res.length,2,'a card dealt after a hold keeps its full window');
  // 3. Three wrong answers in a row: the long 2.5 s hold.
  typeAnswer(entry(),wrongFor(item().answer));w.advance(1600);typeAnswer(entry(),wrongFor(item().answer));assert.equal(entry().holdMs,2500,'third wrong in a row holds for 2.5 s');w.advance(2400);assert.equal(R().waiting,true);w.advance(200);assert.equal(R().waiting,false);
  typeAnswer(entry(),item().answer);w.advance(300);
  // 4. Pause covers and abandons the live card; resume deals a fresh one with a full window.
  const before=item(),recorded=w.log.length;w.advance(1000);w.doc.getElementById('horsePause').onclick();assert.equal(status().paused,true);assert(entry().root.classList.contains('is-paused'));assert.equal(entry().buffer.length,0,'the paused card is blanked');
  w.advance(10000);assert.equal(w.log.length,recorded,'a paused card is never recorded');w.doc.getElementById('horsePause').onclick();w.advance(20);
  assert.notEqual(item(),before,'resume deals a fresh card');assert.notEqual(item().question.token,before.question.token);assert.equal(R().waiting,false);w.advance(2900);assert.equal(R().res.length,5,'the fresh card has a full window');
  // 5. Idle: three timeouts in a row pause the race behind "Still there?"; none of them count.
  const beforeIdle=w.log.length;for(let i=0;i<3;i++){w.advance(3100);if(R().waiting)w.advance(1600);}
  assert(w.idleOverlay(),'the Still there? overlay is up');assert.equal(status().paused,true,'idle pauses the race');assert.equal(w.log.length,beforeIdle,'idle timeouts are not recorded');
  const ticks=s.RacePaceSnapshot().opponent;w.advance(20000);assert.equal(s.RacePaceSnapshot().opponent,ticks,'the race stands still while idle');assert.equal(w.log.length,beforeIdle);
  w.idleButton().onclick();w.advance(20);assert.equal(status().paused,false);assert.equal(R().waiting,false,'a fresh card right after "I’m here"');assert(!entry().holding);
  typeAnswer(entry(),item().answer);assert.equal(w.log.length,beforeIdle+1,'the first card after idle counts');assert.equal(w.log.at(-1).correct,true);
  assert.equal(w.api.stats().clearedToday>=0,true);
  // 6. Race end: a held timeout is flushed before completion is posted.
  for(let n=0;n<2000&&round.remaining>4.5;n++){if(!R().waiting&&!status().paused)typeAnswer(entry(),item().answer);w.advance(100);}
  const recordsBeforeEnd=w.log.length;w.advance(8000);
  const complete=w.messages.find(m=>m.type==='arcade-complete');assert(complete,'the race completes');const last=w.log.at(-1);assert(w.log.length>recordsBeforeEnd&&last.timeout,'the final held timeout is recorded');assert(last.seq<complete.seq,'held timeouts are recorded before completion is posted');
  assert.equal(w.messages.filter(m=>m.type==='arcade-complete').length,1);
  // 7. Race again from the results counts straight down (that click is the Start press).
  w.doc.getElementById('raceAgain').onclick();assert.equal(status().waiting,true);w.advance(3100);assert.equal(status().waiting,false,'Race again counts 3-2-1 without a second press');
  // 8. A new race length (like a skill switch, which reloads the page) opens a fresh gate: no card until Start.
  const cardsBefore=w.log.length;round.select.value='180';round.select.onchange();assert.equal(status().waiting,true,'a new race length waits on Start');w.advance(6000);assert.equal(w.log.length,cardsBefore,'nothing is timed behind the new gate');assert(w.gateButton(host));
  // 9. Demo: no gate, no rewards, nothing saved.
  const savedBefore=JSON.stringify([...w.data]),rewardsBefore=rewards();w.message({type:'arcade-command',action:'demo'});assert.equal(status().waiting,false,'demos start at once');
  const realBefore=w.log.filter(r=>!r.demo).length;w.advance(20000);assert.equal(rewards(),rewardsBefore,'demo pays nothing');assert.equal(w.log.filter(r=>!r.demo).length,realBefore,'demo answers stay in the demo run');
  assert.equal(JSON.stringify([...w.data]),savedBefore,'demo saves nothing');
  console.log('PASS horse card flow: Start gate before the first card, correction hold freezes pace and round clock, pause/idle abandon the card and deal a fresh one, flush before completion, demo pays nothing');
 })().catch(e=>{console.error(e);process.exitCode=1;});
}

// ---------------------------------------------------------------- Skyrail
{
 const w=world(),s=w.s;s.Skyrail3D={create:()=>({resize(){},event(){},update(){}})};
 load(w,['dist/number-entry.js','dist/round-timer.js','dist/practice-client.js','dist/subway/engine.js']);let round;const mountRound=s.ArcadeRound.mount;s.ArcadeRound.mount=o=>(round=mountRound(o));
 w.run(fs.readFileSync('dist/subway/game.js','utf8').replace('const engine=new SubwayEngine.Engine','const engine=window.testEngine=new SubwayEngine.Engine'));
 const e=s.testEngine,host=w.doc.getElementById('choices'),entry=()=>s.ArcadeNumberEntry.mount(host),rewards=()=>w.messages.filter(m=>m.type==='arcade-reward').length;
 const untilThinking=(limit=6000)=>{for(let t=0;t<limit&&e.phase!=='thinking';t+=16)w.advance(16);assert.equal(e.phase,'thinking');};
 w.message({type:'arcade-command',action:'play'});
 // 1. Start gate.
 assert.equal(e.phase,'waiting','a play run opens on the Start gate');assert.equal(e.card,null,'no card before Start');const btn=w.gateButton(host);assert(btn,'Start button on the card');
 w.advance(8000);assert.equal(w.log.length,0);assert.equal(round.elapsed,0,'the round clock waits');assert.equal(e.world,0,'the run waits on the platform');
 btn.onclick();w.advance(2900);assert.equal(e.phase,'waiting');w.advance(200);assert.equal(e.phase,'thinking','first card after the 3-2-1');assert(e.elapsed<0.1);
 w.advance(2800);assert.equal(e.phase,'thinking','the first card keeps its full window');typeAnswer(entry(),e.card.answer);assert.equal(e.phase,'moving');assert.equal(entry().holdMs,0);
 untilThinking();assert.equal(rewards(),1,'a correct card pays');
 // 2. Miss: the next card waits for the 1.5 s correction; the round clock counts only the usual miss time.
 typeAnswer(entry(),wrongFor(e.card.answer));assert.equal(e.phase,'miss');assert.equal(entry().holdMs,1500);const c0=round.elapsed;
 w.advance(1400);assert.equal(e.phase,'miss','the next card waits for the correction');assert(round.elapsed-c0<0.95,'the round clock stops once the usual miss time is over');
 w.advance(150);assert.equal(e.phase,'thinking','the next card comes after the hold');assert(e.elapsed<0.05,'with a full window');
 // 3. Three wrong in a row: 2.5 s.
 typeAnswer(entry(),wrongFor(e.card.answer));w.advance(1600);untilThinking();typeAnswer(entry(),wrongFor(e.card.answer));assert.equal(entry().holdMs,2500,'third wrong in a row holds 2.5 s');w.advance(2400);assert.equal(e.phase,'miss');w.advance(150);assert.equal(e.phase,'thinking');
 typeAnswer(entry(),e.card.answer);untilThinking();
 // 4. Pause hides and abandons the card; resume deals a fresh card with a full window.
 w.advance(1000);const before=e.card,recorded=w.log.length;w.doc.getElementById('pause').onclick();assert.equal(e.paused,true);assert.equal(e.card,null,'the engine drops the paused card');assert.equal(entry().buffer.length,0,'the card face is blanked');
 w.advance(10000);assert.equal(w.log.length,recorded,'a paused card is never recorded');w.doc.getElementById('pause').onclick();w.advance(20);
 assert.equal(e.phase,'thinking');assert.notEqual(e.card,before,'a fresh card');assert.notEqual(e.card.question.token,before.question.token);assert(e.elapsed<0.05,'with a full window');
 // 5. Idle.
 const beforeIdle=w.log.length,hearts=e.hearts;for(let i=0;i<3&&!w.idleOverlay();i++){w.advance(3050);for(let t=0;t<5000&&e.phase!=='thinking'&&!w.idleOverlay();t+=16)w.advance(16);}
 assert(w.idleOverlay(),'Still there? is up');assert.equal(e.paused,true,'idle pauses the run');assert.equal(w.log.length,beforeIdle,'idle timeouts are not recorded');assert.equal(e.card,null,'the idle card is dropped');
 const clock=round.elapsed;w.advance(20000);assert.equal(round.elapsed,clock,'the run stands still while idle');
 w.idleButton().onclick();w.advance(20);assert.equal(e.paused,false);assert.equal(e.phase,'thinking','a fresh card after "I’m here"');typeAnswer(entry(),e.card.answer);assert.equal(w.log.length,beforeIdle+1,'the first card after idle counts');assert.equal(w.log.at(-1).correct,true);void hearts;
 // 6. End of the round: the last held timeout is flushed before completion is posted.
 untilThinking();for(let n=0;n<4000&&round.remaining>4.2;n++){if(e.phase==='thinking')typeAnswer(entry(),e.card.answer);w.advance(50);}
 for(let t=0;t<3000&&e.phase!=='thinking';t+=16)w.advance(16);const recordsBeforeEnd=w.log.length;w.advance(8000);
 const complete=w.messages.find(m=>m.type==='arcade-complete');assert(complete,'the run completes');const last=w.log.at(-1);assert(w.log.length>recordsBeforeEnd&&last.timeout,'the final held timeout is recorded');assert(last.seq<complete.seq,'flushed before completion');
 // 7. "Play again" is the press: it counts straight down.
 w.doc.getElementById('again').onclick();assert.equal(e.phase,'waiting');w.advance(3100);assert.equal(e.phase,'thinking','Play again counts 3-2-1 without a second press');
 // 8. A new run length opens a fresh gate.
 const cardsBefore=w.log.length;round.select.value='180';round.select.onchange();assert.equal(e.phase,'waiting');w.advance(6000);assert.equal(w.log.length,cardsBefore);assert(w.gateButton(host));
 // 9. Demo: no gate, no rewards, nothing saved.
 const saved=JSON.stringify([...w.data]),rewardsBefore=rewards(),realBefore=w.log.filter(r=>!r.demo).length;w.doc.getElementById('demo').onclick();assert.equal(e.mode,'demo');assert.notEqual(e.phase,'waiting','demos start at once');
 w.advance(20000);assert.equal(rewards(),rewardsBefore,'demo pays nothing');assert.equal(w.log.filter(r=>!r.demo).length,realBefore);assert.equal(JSON.stringify([...w.data]),saved,'demo saves nothing');
 console.log('PASS skyrail card flow: Start gate before the first card, correction hold (round clock counts only the usual miss), pause/idle abandon the card and deal a fresh one, flush before completion, demo pays nothing');
}
