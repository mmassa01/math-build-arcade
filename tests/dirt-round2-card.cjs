// Round-2 shared card wiring in Dirt Track and Wave Riders (one game.js, one engine):
// the miss correction hold freezes the race clock, pace car, round timer and next card; correct
// answers keep the quarter-second gap; pause discards the live card (never recorded) and resume
// deals a fresh one from ArcadeLearning.next(); the idle events pause/resume the race; the race
// end flushes held timeouts before completion is posted; the Start + 3-2-1 countdown never runs
// while paused.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const {Buffer,wrong,motion}=require('../dist/number-entry.js');

function learning(){let n=0;const log={records:[],discards:[],flushes:0,dealt:[]};
 return{log,active:true,begin(){},shown(){},next(){const a=2+(n%7),b=3+(n%5);n++;const q={id:'mul:'+a+':'+b+':'+n,text:a+' × '+b,answer:a*b,token:'t'+n};log.dealt.push(q);return q;},
  record(q,correct,ms,opts={}){if(log.discards.includes(q))return{accepted:false,reason:'discarded'};q.completed=true;log.records.push({q,correct,timeout:!!opts.timeout});return{accepted:true,correct};},
  discard(q){if(!q||log.discards.includes(q))return false;log.discards.push(q);return true;},flush(){log.flushes++;}};}

// A widget double with the round-2 surface: holdMs/holding/finishHold/discard/setPaused.
function widget(){const w={buffer:new Buffer(),holdMs:0,holdLeft:0,paused:false,discards:0,finishes:0,remaining:3,
 get holding(){return this.holdLeft>0},
 set(q,cb){this.question=q;this.resolved=false;this.buffer.reset(q?.answer??null);this.callback=cb;this.holdLeft=0;},
 setEnabled(on){this.enabled=!!on},setRemaining(s){if(!this.holding)this.remaining=s},setPaused(v){this.paused=!!v},
 resolve(ok,{timeout=false}={}){if(this.resolved||!this.question)return false;this.resolved=true;this.holdMs=ok?0:1500;this.holdLeft=this.holdMs;this.lastTimeout=timeout;return true;},
 finishHold(){if(this.holdLeft>0)this.finishes++;this.holdLeft=0;},
 discard(){if(!this.question||this.resolved)return null;const q=this.question;this.resolved=true;this.question=null;this.discards++;globalThis.ArcadeLearning.discard(q);return q;},
 reset(){this.holdLeft=0;this.question=null;this.resolved=false;},showDemo(){}};return w;}

function harness(name){
 const nodes={},messages=[],listeners={},docListeners={};let now=0;const L=learning(),W=widget();globalThis.ArcadeLearning=L;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const node=id=>nodes[id]||(nodes[id]={children:[],classList:{toggle(){},add(){}},style:{},dataset:{},lastChild:{textContent:''},value:({operation:'mul',range:'10',laps:'3',pace:'20'})[id]||'',getContext:()=>ctx,getBoundingClientRect:()=>({width:390,height:430}),setAttribute(){},addEventListener(){},replaceChildren(...v){this.children=v},showModal(){this.open=true},close(){this.open=false}});
 const parent={postMessage(m){messages.push({...m,flushesBefore:L.log.flushes})}};
 const document={hidden:false,body:{dataset:{game:name==='wave'?'jetski':'sprint'},classList:{toggle(){}}},getElementById:node,querySelector:node,createElement:()=>node('b'+Math.random()),
  addEventListener(t,f){(docListeners[t]=docListeners[t]||[]).push(f)},dispatchEvent(e){for(const f of docListeners[e.type]||[])f(e)}};
 const s={parent,window:{addEventListener(t,f){listeners[t]=f}},location:{origin:'https://arcade.test'},document,ArcadeLearning:L,Image:function(){this.complete=true;this.naturalWidth=1254;this.naturalHeight=1254},ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame(){},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout(f){f()},localStorage:{getItem:()=>null,setItem(){}},Math,console};
 s.DirtEngine=require('../dist/dirt/engine.js');s.ArcadeNumberEntry=s.window.ArcadeNumberEntry={wrong,motion,mount:()=>W};vm.createContext(s);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/dirt/game.js'),'utf8'),s);
 const run=t=>vm.runInContext(t,s);
 // One 50 ms frame; the correction hold (a real-time timer in the shared card) runs only while not paused.
 const step=(ms=50)=>{globalThis.ArcadeLearning=L;if(!W.paused&&W.holdLeft>0)W.holdLeft=Math.max(0,W.holdLeft-ms);now+=ms;run('loop('+now+')');};
 const until=(fn,limit=400)=>{for(let i=0;i<limit;i++){if(fn())return i*50;step();}throw new Error('condition never met');};
 const emit=type=>document.dispatchEvent({type});
 return{run,step,until,emit,L,W,messages,document};
}

for(const name of ['dirt','wave']){
 const g=harness(name),{L,W}=g;
 // Start + 3-2-1: one countdown, frozen while paused.
 g.run('start(false)');assert.equal(g.run('mode'),'countdown');g.run('setRacePaused(true)');for(let i=0;i<40;i++)g.step();assert.equal(g.run('count'),3,'the countdown waits while paused');assert.equal(g.run('race.question'),null,'no card before GO');
 g.run('setRacePaused(false)');g.until(()=>g.run('mode')==='racing');assert(g.run('race.question'),'the first card arrives at GO');assert.equal(L.log.dealt.length,1);

 // Correct: no hold, the same quarter second to the next card.
 let card=g.run('race.question');g.step();g.run('answer(race.question.answer)');assert.equal(W.holdMs,0);assert.equal(W.holding,false);
 const gapCorrect=g.until(()=>g.run('race.ready')&&g.run('race.question')!==card);assert(gapCorrect<=300,'correct answer reaches the next card within 0.3 s (got '+gapCorrect+' ms)');

 // Miss: the race stands still for the 1.5 s correction, then the next card comes 0.25 s later.
 card=g.run('race.question');g.step();const pace0=g.run('race.paceDistance'),el0=()=>g.run('race.elapsed');g.run('answer(race.question.answer+1)');const at=el0();
 assert.equal(W.holdMs,1500);assert(W.holding);
 for(let i=0;i<29;i++)g.step();assert(W.holding);assert.equal(el0(),at,'race clock stops during the correction');assert.equal(g.run('race.paceDistance'),pace0,'the gold pace rider waits too');assert.equal(g.run('race.question'),card,'no new card during the hold');assert.equal(g.run('race.ready'),false);
 g.run('setRacePaused(true)');for(let i=0;i<40;i++)g.step();assert.equal(W.holdLeft,50,'pause freezes the hold');assert.equal(W.discards,0,'an answered card is not discarded');g.run('setRacePaused(false)');
 const gapWrong=g.until(()=>g.run('race.ready')&&g.run('race.question')!==card);assert(gapWrong>=200&&gapWrong<=400,'next card 0.25 s after the hold ends (got '+gapWrong+' ms)');assert(gapWrong>=gapCorrect,'a correct answer never waits longer than a miss');
 assert.equal(g.run('race.questionRemaining'),3,'the fresh card has its full three seconds');
 assert.equal(L.log.records.length,2,'one record per answered card');

 // Pause: the live card is hidden and discarded, never recorded; resume deals a fresh one.
 card=g.run('race.question');for(let i=0;i<20;i++)g.step();g.run('setRacePaused(true)');assert(W.paused);assert.equal(W.discards,1);assert.deepEqual(L.log.discards,[card]);assert.equal(g.run('race.question'),null);
 const records=L.log.records.length,el1=el0();for(let i=0;i<200;i++)g.step();assert.equal(el0(),el1,'pause freezes the race');assert.equal(L.log.records.length,records,'a 10 s pause records nothing (no timeout)');
 g.run('setRacePaused(false)');const fresh=g.run('race.question');assert(fresh&&fresh!==card,'resume deals a fresh card');assert.equal(L.log.dealt.at(-1),fresh,'from ArcadeLearning.next()');assert.equal(W.question,fresh,'and shows it');assert.equal(g.run('race.questionRemaining'),3);
 assert.equal(g.run('answer(race.question.answer),race.correct'),2);

 // Hidden page pauses (and discards) too.
 g.until(()=>g.run('race.ready'));g.document.hidden=true;g.run("document.dispatchEvent({type:'visibilitychange'})");assert.equal(g.run('paused'),true);assert.equal(W.discards,2);g.document.hidden=false;g.run('setRacePaused(false)');

 // Idle: third timeout raises arcade-idle-pause from inside record(); resume ends the hold and deals fresh.
 g.until(()=>g.run('race.ready'));card=g.run('race.question');const attempts=g.run('race.attempts');const orig=L.record;L.record=function(q,c,ms,o){const r=orig.call(this,q,c,ms,o);g.emit('arcade-idle-pause');return r;};
 g.until(()=>g.run('paused'),80);L.record=orig;assert(W.lastTimeout,'the card timed out at three seconds');assert.equal(W.discards,2,'the timed-out card was answered, not discarded');assert.equal(g.run('race.attempts'),attempts,'the idle card is not counted in the race accuracy');const el2=el0();for(let i=0;i<100;i++)g.step();assert.equal(el0(),el2,'idle freezes the race');
 g.emit('arcade-idle-resume');assert.equal(g.run('paused'),false);assert.equal(W.holding,false,'resume skips the stale correction');const gapIdle=g.until(()=>g.run('race.ready')&&g.run('race.question')!==card);assert(gapIdle<=300,'a fresh card follows at once');

 // Race end: correction hold finished, held timeouts flushed before completion is posted.
 g.run('race.answer(race.question.answer+1);events()');assert(W.holding);g.run('race.finish(true);events()');assert.equal(W.holding,false,'race end finishes the hold');
 g.until(()=>g.run('mode')==='results');const done=g.messages.filter(m=>m.type==='arcade-complete');assert.equal(done.length,1);assert(done[0].flushesBefore>=1,'ArcadeLearning.flush() runs before arcade-complete');
 console.log('PASS '+name+' round-2 card: countdown frozen while paused, 1.5 s hold stops race clock/pace/next card, correct gap unchanged, pause discards and deals fresh, hidden pauses, idle pause/resume, flush before completion');
}
delete globalThis.ArcadeLearning;
