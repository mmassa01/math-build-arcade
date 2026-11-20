// Dragon wiring of the round-2 shared card behaviours: one press (Take flight / Fly again) runs the
// shared gate's 3-2-1 at once (auto, like Ping-Pong and Star Defenders; it used to wait for a second
// "Start" tap on the gate) before any card,
// the miss-correction hold keeps the next card (and its 3-second clock) waiting without costing a
// heart, pause/hidden/idle hide and discard the live card and deal a fresh one on resume, and the
// round end ends the hold, drops the unanswered card and flushes held timeouts before completion.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const {Flight}=require('../dist/dragon/encounters.js');
const {Buffer,wrong,motion}=require('../dist/number-entry.js');

// Engine: holdCard keeps the next card back; discardCard abandons the live card unrecorded.
{const f=new Flight({random:()=>.3,timed:true});const q=f.question;assert.equal(f.answer(q.answer+1),false);f.holdCard=true;
 const hearts=f.hearts;f.update(2.4);assert(f.ready,'the next card waits for the correction');assert.equal(f.question,q);assert.equal(f.elapsed,0,'no card clock runs during the hold');assert.equal(f.hearts,hearts,'the hold costs no heart');
 f.holdCard=false;f.update(.025);assert(!f.ready);assert.notEqual(f.question,q,'the next card comes as soon as the hold ends');assert.equal(f.elapsed,0);
 const c=new Flight({random:()=>.3});const before=c.question;assert(c.answer(before.answer));c.holdCard=false;let t=0;while(c.ready){c.update(1/60);t+=1/60;}assert(t<=.9,'correct answers are not slowed');}
{const records=[];global.ArcadeLearning={active:true,next:(()=>{let n=0;return()=>({text:'3 × '+(++n),answer:3*n,token:'t'+n})})(),record:(q,c,_,o)=>records.push({q,c,o})};
 const f=new Flight({timed:true});f.update(1.2);const live=f.question;assert.equal(f.discardCard(),live);assert(f.ready&&f.elapsed===0);
 f.update(.001);assert.notEqual(f.question,live,'a fresh card is dealt on the first update after resume');assert.equal(f.elapsed,0,'with its full three seconds');
 assert.equal(records.length,0,'the discarded card is never recorded');assert.equal(f.hearts,3);f.update(2.9);assert.equal(f.hearts,3);f.update(.2);assert.equal(f.hearts,2);assert.equal(records.length,1);assert.notEqual(records[0].q,live);
 assert.equal(f.discardCard(),null,'nothing to discard between cards');delete global.ArcadeLearning;}

// Game page with a widget double that models the shared API's hold, discard and start gate.
function page(){const nodes={},listeners={},docListeners={},messages=[],log=[],gates=[];let now=0;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 function node(id){return nodes[id]||(nodes[id]={id,children:[],open:false,hidden:false,classList:{toggle(){},add(){}},style:{},dataset:{},value:({operation:'add',range:'10'})[id]||'',getContext:()=>ctx,getBoundingClientRect:()=>({width:390,height:430}),setAttribute(){},addEventListener(t,f){(this.l=this.l||{})[t]=f},replaceChildren(...v){this.children=v},showModal(){this.open=true},close(){this.open=false}})}
 const widget={buffer:new Buffer(),paused:false,holdTimer:0,current:null,resolved:false,get holding(){return this.holdTimer>0},
  set(q,cb){this.current=q;this.resolved=false;this.buffer.reset(q?.answer??null);this.cb=cb;log.push(['set',q.text])},setEnabled(on){this.enabled=!!on},setRemaining(){},setPaused(v){this.paused=!!v},
  resolve(ok,o={}){if(this.resolved||!this.current)return false;this.resolved=true;this.holdTimer=ok?0:1500;log.push(['resolve',ok,!!o.timeout]);return true},
  discard(){const q=this.current;if(!q||this.resolved)return null;this.current=null;this.resolved=true;log.push(['discard',q.text]);learning.discard(q);return q},
  finishHold(){this.holdTimer=0;log.push(['finishHold'])},reset(){this.current=null;this.holdTimer=0},showDemo(){},
  tick(ms){if(!this.paused&&this.holdTimer>0)this.holdTimer=Math.max(0,this.holdTimer-ms)}};
 const learning={active:false,begin(){},shown(){},discard(q){log.push(['learning.discard',q.text])},flush(){log.push(['flush'])}};
 const E={Buffer,wrong,motion,mount:()=>widget,startGate(host,o){const g={o,cancelled:false,cancel(){this.cancelled=true}};gates.push(g);log.push(['gate']);return g}};
 const s={parent:{postMessage:m=>{messages.push(m);log.push(['post',m.type])}},window:{addEventListener(t,f){listeners[t]=f}},location:{origin:'https://arcade.test'},
  document:{hidden:false,body:{classList:{toggle(){}}},getElementById:node,querySelector:node,createElement:()=>node('n'+Math.random()),addEventListener(t,f){(docListeners[t]=docListeners[t]||[]).push(f)}},
  Image:function(){this.complete=false;this.naturalWidth=0},ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame(){},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout(f){f()},localStorage:{getItem:()=>null,setItem(){}},Math,console,
  DragonEngine:{Flight},ArcadeNumberEntry:E,ArcadeLearning:learning};
 s.window.ArcadeNumberEntry=E;vm.createContext(s);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/dragon/game.js'),'utf8'),s);
 const run=t=>vm.runInContext(t,s);
 return{run,node,widget,log,gates,messages,emit:t=>(docListeners[t]||[]).forEach(f=>f({type:t})),step(ms){now+=ms;widget.tick(ms);run('loop('+now+')')},get now(){return now}};}

// 1. Start gate: Take flight is the only press; the 3-2-1 runs straight away (auto) and there is
// no engine, no card and no clock until it ends.
const p=page();p.node('start').onclick();assert.equal(p.gates.length,1,'Take flight opens the shared start gate');assert.equal(p.gates[0].o.auto,true,'one press: the gate counts down without a second Start tap');assert.equal(p.node('setup').open,false,'the setup dialog is closed for the count');assert.equal(p.run('game'),null,'no card is live under the gate');
for(let i=0;i<50;i++)p.step(100);assert.equal(p.run('game'),null);assert.equal(p.log.filter(l=>l[0]==='set').length,0);
assert.equal(p.gates[0].o.isPaused(),false);p.node('pause').onclick();assert.equal(p.gates[0].o.isPaused(),true,'the count stops while the game is paused');p.node('pause').onclick();
p.node('start').onclick();assert(p.gates[0].cancelled&&p.gates.length===2,'starting again replaces the gate, never stacks two flows');
assert.equal(p.gates[1].o.auto,true);p.gates[1].o.onStart();p.step(16);assert(p.run('game.active'));assert.equal(p.log.filter(l=>l[0]==='set').length,1,'the first card is dealt when the count ends');assert(p.run('game.elapsed')<.02);

// 2. Miss: the correction holds the next card and its clock; nothing else is lost.
let card=p.run('game.question');p.run('answer(game.question.answer+1)');assert.deepEqual(p.log.at(-1),['resolve',false,false]);assert(p.widget.holding);
const hearts=p.run('game.hearts'),frozen=p.run('game.elapsed');for(let i=0;i<14;i++)p.step(100);assert(p.widget.holding);assert.equal(p.run('game.question'),card,'no new card while the correction is on screen');assert.equal(p.run('game.elapsed'),frozen,'the 3-second clock does not run');assert.equal(p.run('game.hearts'),hearts);
for(let i=0;i<2;i++)p.step(100);assert(!p.widget.holding);assert.notEqual(p.run('game.question'),card,'next card right after the 1.5 s hold');
// a correct answer is not slowed
card=p.run('game.question');p.run('answer(game.question.answer)');assert.equal(p.widget.holdTimer,0);let ms=0;while(p.run('game.question')===card){p.step(50);ms+=50;}assert(ms<=900,'correct answer reaches the next card as before ('+ms+' ms)');

// 3. Pause hides the card: discarded unrecorded, fresh card with a full window on resume.
p.step(1200);card=p.run('game.question');p.node('pause').onclick();assert(p.widget.paused);assert.deepEqual(p.log.slice(-2),[['discard',card.text],['learning.discard',card.text]]);
assert.equal(p.run('game.ready'),true);for(let i=0;i<30;i++)p.step(100);assert.equal(p.run('game.question'),card,'nothing moves while paused');
p.node('pause').onclick();assert(!p.widget.paused);p.step(16);assert.notEqual(p.run('game.question'),card,'resume deals a fresh card');assert(p.run('game.elapsed')<.02,'with a fresh three seconds');assert.equal(p.run('game.hearts'),hearts);
// a pause during the correction leaves the hold paused, then it finishes after resume
p.run('answer(game.question.answer+1)');p.step(500);p.node('pause').onclick();assert.equal(p.log.at(-1)[0],'resolve','nothing to discard during a correction');for(let i=0;i<30;i++)p.step(100);assert(p.widget.holding,'the hold does not run while paused');
p.node('pause').onclick();for(let i=0;i<11;i++)p.step(100);assert(!p.widget.holding);p.step(16);assert(!p.run('game.ready'));
// a hidden page, the hub's arcade-pause and settings all discard the same way
p.step(300);card=p.run('game.question');p.run('document.hidden=true');p.emit('visibilitychange');assert.deepEqual(p.log.at(-2),['discard',card.text]);p.run('document.hidden=false');p.node('resume').onclick();p.step(16);assert.notEqual(p.run('game.question'),card);

// 4. Idle: arcade-idle-pause discards like a pause, arcade-idle-resume unpauses with a fresh card.
p.step(300);card=p.run('game.question');p.emit('arcade-idle-pause');assert(p.widget.paused);assert.deepEqual(p.log.at(-2),['discard',card.text]);
for(let i=0;i<30;i++)p.step(100);p.emit('arcade-idle-resume');assert(!p.widget.paused);p.step(16);assert.notEqual(p.run('game.question'),card);assert(p.run('game.elapsed')<.02);
// round end: hold ended, held timeouts flushed before completion is posted
p.run('answer(game.question.answer+1)');assert(p.widget.holding);p.run("game.active=false;game.events.push({type:'win',timed:true});events()");
const tail=p.log.slice(p.log.findIndex(l=>l[0]==='finishHold'));assert.equal(tail[0][0],'finishHold');const flushAt=tail.findIndex(l=>l[0]==='flush'),postAt=tail.findIndex(l=>l[1]==='arcade-complete');
assert(flushAt>0&&postAt>flushAt,'ArcadeLearning.flush() runs before arcade-complete');assert(!p.widget.holding);

// Fly again after the round end is also one press straight into the 3-2-1.
p.node('again').onclick();assert.equal(p.gates.length,3);assert.equal(p.gates[2].o.auto,true,'Fly again needs no second Start');assert.equal(p.run('game'),null);
// A skill switch reloads the page: setup is shown first, then Take flight is the one press.
{const r=page();assert.equal(r.node('setup').open,true,'a fresh load (skill switch) shows setup first');assert.equal(r.gates.length,0);r.node('start').onclick();assert.equal(r.gates.length,1);assert.equal(r.gates[0].o.auto,true);assert.equal(r.run('game'),null);}

// Demo: no gate, and the demo still pays nothing.
const d=page();d.node('demo').onclick();assert.equal(d.gates.length,0,'the demo starts at once');for(let i=0;i<600;i++)d.step(100);assert.equal(d.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0);
console.log('PASS dragon round-2 cards: one press then the 3-2-1 before any card, miss hold keeps the next card and clock waiting at no cost, pause/hidden/idle discard and redeal, round end flushes before completion, demo pays nothing');
