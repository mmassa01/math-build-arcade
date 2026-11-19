// Round-2 shared card behaviours wired into Ping-Pong Rally and Star Defenders, run on the real
// number-entry widget, the real practice client and the real pathway service in a fake DOM:
// the setup button starts a 3-2-1 before the first card (clocks stopped), a miss holds the next
// card for 1.5 s (2.5 s after three wrong in a row) with the round clock and the scene's danger
// stopped, correct answers are not slowed, pause covers and abandons the card and resume deals a
// fresh one, the idle "Still there?" pause works, and game over flushes before completion.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const factory=require('../dist/practice-pathways.js').create;

function harness(name){
 let T=1000,nextId=1;const timers=[],log=[],messages=[],order=[];
 const s={console,Math,Date,JSON,Promise,Number,String,Array,Object,Set,Map,WeakMap,Error,Symbol,Boolean,RegExp,Proxy,Infinity,NaN,isFinite,parseInt,parseFloat};
 s.setTimeout=(fn,ms=0)=>{const t={id:nextId++,at:T+Math.max(0,ms),fn};timers.push(t);return t.id;};
 s.clearTimeout=id=>{const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);};
 s.performance={now:()=>T};
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:10})},{get:(o,k)=>k in o?o[k]:()=>{},set:()=>true});
 class Element{
  constructor(tag='div',id=''){this.tagName=String(tag).toUpperCase();this.id=id;this.children=[];this.attrs={};this.listeners={};this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.hidden=false;this.disabled=false;this.value=({operation:'add',range:'10',seconds:'3'})[id]||'';this.isConnected=true;this.className='';this._text='';this.open=false;const values=new Set();this.classList={values,add:(...a)=>a.forEach(v=>values.add(v)),remove:(...a)=>a.forEach(v=>values.delete(v)),toggle:(v,on)=>{if(on===undefined)on=!values.has(v);if(on)values.add(v);else values.delete(v);return on;},contains:v=>values.has(v)};}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  get lastChild(){return this.children.at(-1)||(this._last||(this._last={textContent:''}));}
  append(...a){for(const n of a){if(n.parentNode){const p=n.parentNode;p.children=p.children.filter(c=>c!==n);}this.children.push(n);n.parentNode=this;n.isConnected=true;}}
  before(){}
  replaceChildren(...a){for(const n of this.children)n.parentNode=null;this.children=[];this._text='';this.append(...a);}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}removeAttribute(k){delete this.attrs[k];}addEventListener(k,f){this.listeners[k]=f;}
  getClientRects(){return this.hidden?[]:[{}];}getBoundingClientRect(){return{left:0,top:0,width:390,height:300};}focus(){s.document.activeElement=this;}closest(){return null;}
  querySelectorAll(){return[];}cloneNode(deep){const c=new Element(this.tagName);c.className=this.className;c._text=this._text;if(deep)c.append(...this.children.map(n=>n.cloneNode(true)));return c;}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;this.isConnected=false;}
  animate(){let done;const a={finished:new Promise(r=>done=r),pause(){},play(){},cancel(){done();}};s.setTimeout(()=>done(),220);return a;}
  getContext(){return ctx;}showModal(){this.open=true;}close(){this.open=false;}
 }
 const nodes={},docListeners={};const node=id=>nodes[id]||(nodes[id]=new Element('div',id));const body=new Element('body');
 const find=(root,pred)=>{if(pred(root))return root;for(const c of root.children||[]){const f=find(c,pred);if(f)return f;}return null;};
 s.Element=Element;s.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
 s.document={hidden:false,readyState:'complete',body,activeElement:null,
  getElementById:id=>id==='arcadeIdle'||id==='arcadeIdleResume'||id==='practiceComplete'?find(body,n=>n.id===id):node(id),
  querySelector:sel=>sel==='dialog[open]'?null:node(sel),querySelectorAll:()=>[],createElement:t=>new Element(t),
  addEventListener:(t,f)=>(docListeners[t]=docListeners[t]||[]).push(f),dispatchEvent:e=>{for(const f of docListeners[e.type]||[])f(e);}};
 const winListeners={};s.addEventListener=(t,f)=>winListeners[t]=f;s.window=s;s.location={origin:'https://arcade.test'};
 const data=new Map(),api=factory({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},()=>new Date(2026,10,19,9).getTime()+T,()=>.37);api.setGrade(3);api.setPathway('add');
 const svc=Object.create(api);svc.begin=o=>{const run=api.begin(o),record=run.record;run.record=(q,c,ms,opts={})=>{const r=record(q,c,ms,opts);if(r.accepted){log.push({id:q.id,token:q.token,correct:!!c,timeout:!!opts.timeout});order.push('record');}return r;};return run;};
 s.parent={location:{origin:'https://arcade.test'},ArcadePractice:svc,postMessage:m=>{messages.push(m);order.push(m.type);}};
 s.Image=function(){this.complete=false;this.naturalWidth=0;};s.ResizeObserver=class{observe(){}};s.requestAnimationFrame=()=>0;s.matchMedia=()=>({matches:false});s.devicePixelRatio=1;
 s.localStorage={getItem:()=>null,setItem(){}};
 vm.createContext(s);
 for(const f of ['dist/number-entry.js','dist/round-timer.js','dist/practice-client.js',`dist/${name}/engine.js`,`dist/${name}/game.js`])vm.runInContext(read(f),s,{filename:f});
 const run=code=>vm.runInContext(code,s);
 // Real time passes in 16 ms frames; timers (hold, gate) fire in order as the clock reaches them.
 function frames(ms,step=16){const end=T+ms;while(T<end){const to=Math.min(end,T+step);for(;;){timers.sort((a,b)=>a.at-b.at||a.id-b.id);const t=timers[0];if(!t||t.at>to)break;timers.shift();T=Math.max(T,t.at);t.fn();}T=to;run('loop('+T+')');}}
 const widget=()=>run('numberEntry');
 const type=value=>{for(const d of String(value))widget().key(d);};
 const face=()=>widget().card.children[1];
 return{s,run,frames,widget,type,face,log,messages,order,node,body,find,api,get T(){return T;}};
}
const engineOf={pong:'match',invaders:'game'};
const answerOf=(h,name)=>h.run(engineOf[name]+'.question.answer');
const wrongOf=(h,name)=>{const a=answerOf(h,name);return String((a+1)%Math.pow(10,String(a).length)).padStart(String(a).length,'0');};
// Wait until the student has a fresh, answerable card.
function ready(h,name,limit=6000){const check=name==='pong'?"match&&match.turn===0&&['serve','flight'].includes(match.phase)&&!match.reply&&match.elapsed<40":"game&&game.running&&!game.pending&&game.cooldown===0&&game.questionElapsed<.04";let waited=0;while(!h.run(check)){h.frames(16);waited+=16;if(waited>limit)throw new Error(name+': no fresh card');}return waited;}
const card=(h,name)=>h.run(engineOf[name]+'.question');

for(const name of ['pong','invaders']){
 const h=harness(name),E=engineOf[name];
 // 1. Start gate: the setup button starts a 3-2-1 on the card; nothing is dealt or timed before it ends.
 h.run('start(false)');const host=h.node(name==='pong'?'answers0':'choices');
 assert(host.classList.contains('has-start-gate'),name+': the 3-2-1 sits on the card');const gate=h.find(host,n=>n.className==='number-start-gate');assert(gate,name+': gate is shown');
 assert(h.find(gate,n=>n.className==='start-gate-button').hidden,name+': the setup button already started the count (one start flow)');
 h.frames(2900);assert.equal(h.run(E),null,name+': no card before the count ends');assert.equal(h.log.length,0);assert.equal(h.run('round.elapsed'),0,name+': the round clock waits for the count');
 h.frames(300);assert(h.run(E),name+': first card dealt when the count ends');assert(!host.classList.contains('has-start-gate'));assert.equal(h.widget().buffer.expected,answerOf(h,name),name+': the card shows the dealt fact');
 ready(h,name);

 // 2. A correct answer is not slowed down.
 let q=card(h,name);h.type(answerOf(h,name));assert.equal(h.widget().holdMs,0);assert(!h.widget().holding);const gap=ready(h,name);assert.notEqual(card(h,name),q);assert(gap<=1000,name+': correct answer reaches the next card within 1 s (got '+gap+')');h.type(answerOf(h,name));assert.equal(h.widget().holdMs,0);const gap2=ready(h,name);assert(gap2<=1000,name+': a second correct answer (a Pong return) is not slowed either (got '+gap2+')');

 // 3. A miss holds the next card 1.5 s: card timer, round clock and danger stop; then play goes on.
 q=card(h,name);const clock=h.run('round.elapsed');const aliensY=name==='invaders'?h.run('game.aliens.map(a=>a.y).join()'):null;h.type(wrongOf(h,name));
 assert.equal(h.widget().holdMs,1500,name+': one miss holds 1.5 s');assert(h.widget().holding);assert(h.face().classList.contains('number-correction'),name+': the whole fact shows large');
 h.frames(1400);assert(h.widget().holding);assert.equal(card(h,name),q,name+': no new card during the correction');if(name==='pong')assert(['card-feedback','point'].includes(h.run('match.phase')),'pong waits between rallies');
 assert(Math.abs(h.run('round.elapsed')-clock)<.05,name+': the round clock stands still during the correction');
 if(name==='invaders')assert.equal(h.run('game.aliens.map(a=>a.y).join()'),aliensY,'invaders: aliens hold their rows during the correction');
 const after=ready(h,name);assert(!h.widget().holding);assert.notEqual(card(h,name),q);assert(after<=700,name+': next card comes promptly after the hold (+'+after+' ms)');
 assert(h.run('round.elapsed')>clock,name+': the round clock runs again');

 // 4. Three wrong answers in a row: the third holds 2.5 s.
 h.type(wrongOf(h,name));assert.equal(h.widget().holdMs,1500);ready(h,name);h.type(wrongOf(h,name));assert.equal(h.widget().holdMs,2500,name+': third wrong in a row holds 2.5 s');assert(h.find(h.face(),n=>n.className==='correction-note'),name+': "Look at the answer"');
 h.frames(2400);assert(h.widget().holding);ready(h,name);

 // 5. Pause covers and abandons the live card; resume deals a fresh card with a full window.
 h.frames(800);const live=card(h,name),before=h.log.length;h.node('pause').onclick();assert(h.run('paused'));assert(h.face().classList.contains('number-covered'),name+': the paused card is covered');
 h.frames(10000);assert.equal(h.log.length,before,name+': nothing is recorded while paused');h.node('pause').onclick();assert(!h.run('paused'));
 assert.notEqual(card(h,name),live,name+': a fresh card after resume');assert.equal(h.widget().buffer.expected,answerOf(h,name),name+': the widget shows the fresh card');
 assert.equal(h.run(name==='pong'?'match.elapsed':'game.questionElapsed'),0,name+': the fresh card gets a full window');assert(!h.face().classList.contains('number-covered'));
 assert.equal(h.s.ArcadeLearning.record(live,true,500).reason,'discarded',name+': the abandoned card can never be recorded');
 h.type(answerOf(h,name));assert.equal(h.log.at(-1).correct,true,name+': the fresh card counts');ready(h,name);

 // 6. Idle: a timeout shows the correction too; three timeouts in a row pause with "Still there?".
 const counted=h.log.length;h.frames(3100);assert(h.widget().holding,name+': a timeout shows the correction');assert.equal(h.widget().holdMs,1500);
 ready(h,name);h.frames(3100);ready(h,name);h.frames(3100);
 assert(h.s.ArcadeLearning.idle,name+': three timeouts go idle');assert(h.run('paused'),name+': the game pauses on arcade-idle-pause');assert(h.find(h.body,n=>n.id==='arcadeIdle'),name+': Still there? overlay');
 h.frames(20000);assert.equal(h.log.length,counted,name+': idle timeouts are never counted');assert(h.widget().paused);
 h.find(h.body,n=>n.id==='arcadeIdleResume').onclick();assert(!h.run('paused'),name+': arcade-idle-resume unpauses');ready(h,name);h.type(answerOf(h,name));assert.equal(h.log.length,counted+1,name+': play counts again after resume');assert.equal(h.log.at(-1).correct,true);ready(h,name);

 // 7. Game over (round clock or shields) ends any hold and flushes held timeouts before completion is posted.
 h.frames(3100);assert.equal(h.s.ArcadeLearning.held,1,name+': one timeout is held back');assert(h.widget().holding);h.run('round.clock.elapsed=round.clock.duration-.05');h.frames(400);assert(h.run('round.running')&&!h.messages.some(m=>m.type==='arcade-complete'),name+': the round cannot run out during the correction');h.run(name==='pong'?'match.finish();handleEvents()':"game.running=false;game.events.push({type:'over'});events()");
 assert(!h.widget().holding,name+': game over ends the correction');assert(h.messages.some(m=>m.type==='arcade-complete'),name+': completion posted');
 assert.equal(h.s.ArcadeLearning.held,0);const last=h.order.lastIndexOf('record'),done=h.order.indexOf('arcade-complete');assert(last>=0&&last<done,name+': the held timeout is recorded before completion');
 assert(h.log.at(-1).timeout);
 // Rewards stayed one per correct card.
 const rewards=h.messages.filter(m=>m.type==='arcade-reward');assert.equal(new Set(rewards.map(m=>m.id)).size,rewards.length);
 console.log('PASS '+name+' round-2 card: start 3-2-1, '+gap+' ms correct gap, 1.5/2.5 s miss holds with clocks stopped, pause discards and deals fresh, idle pause/resume, flush before completion');

 // Demo: no gate, no rewards, still self-plays through misses.
 const d=harness(name);d.run('start(true)');assert(d.run(E),name+' demo starts at once');d.frames(20000,50);assert.equal(d.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,name+' demo pays nothing');
}

// Engines: with no hold function the timing is unchanged; with one, the next card waits.
{const {Match}=require('../dist/pong/engine.js');let held=true;const m=new Match({random:()=>.4,hold:()=>held});const q=m.question;m.answer(0,q.answer+1);for(let i=0;i<300;i++)m.update(16);assert.equal(m.phase,'card-feedback');assert.equal(m.question,q);held=false;m.update(16);assert.equal(m.phase,'serve');assert.notEqual(m.question,q);}
{const {Game}=require('../dist/invaders/engine.js');let held=true;const g=new Game({random:()=>.4,hold:()=>held});const q=g.question,y=g.aliens[0].y;g.answer(q.answer+1);for(let i=0;i<300;i++)g.update(.016);assert.equal(g.question,q);assert.equal(g.aliens[0].y,y,'aliens hold during the correction');assert.equal(g.answer(q.answer),false,'the missed card cannot be answered again while held');held=false;g.update(.016);assert.notEqual(g.question,q);}
console.log('PASS Pong/Invaders engines: next card and alien descent wait on the hold; no hold means unchanged pacing');
