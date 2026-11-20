// Castle, Seed and Neon Auto use the round-2 shared card behaviours: a Start gate before the
// first card and after a skill switch, the miss correction hold before the next card, a live
// card discarded (never recorded) on pause or idle with a fresh card on resume, and a flush
// of held timeouts before completion is posted. The widget double below models the API of
// dist/number-entry.js (tested itself in number-entry-round2.cjs).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.resolve(__dirname,'..');
const prefix=fs.readFileSync(path.join(__dirname,'shared-remaining-games.cjs'),'utf8').split('\nfunction realClient')[0];
const lib={require,__dirname};vm.createContext(lib);vm.runInContext(prefix.replace("const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),{Engine}=require('../dist/subway/engine.js');","const fs=require('fs'),vm=require('vm'),path=require('path');")+';this.dom=dom;this.context=context;',lib);
const real=require('../dist/number-entry.js');const flush=()=>new Promise(setImmediate);
function entryApi(){const api={motion:real.motion,wrong:real.wrong,gates:[],widgets:[],discarded:[],vertical(el,t){el.textContent=t||'Ready?'},freezeAppearance(){},
 startGate(host,o){const g={host,o,phase:o.auto?'count':'ready',start(){if(g.phase==='ready')g.phase='count'},finish(){if(g.phase==='done')return;g.phase='done';o.onStart()},cancel(){g.phase='done'}};api.gates.push(g);return g},
 mount(host){if(host.w)return host.w;let current=null,resolved=false,mash=0,waiters=[];const w={holdMs:0,holding:false,paused:false,resolves:[],buffer:{expected:null},
  set(q,cb,force){if(current===q&&!force)return;w.endHold();current=q;resolved=false;w.buffer.expected=q?.answer},setEnabled(){},showDemo(){},key(){},
  resolve(ok,{timeout=false}={}){if(resolved||!current)return false;resolved=true;w.resolves.push({ok,timeout});if(ok){mash=0;w.holdMs=0}else{if(!timeout)mash++;w.holdMs=mash>=3?2500:1500;w.holding=true}return true},
  afterHold(fn){if(!w.holding)fn();else waiters.push(fn)},endHold(){if(!w.holding)return;w.holding=false;const l=waiters;waiters=[];l.forEach(f=>f())},finishHold(){w.endHold()},
  discard(){if(!current||resolved)return null;const q=current;resolved=true;current=null;api.discarded.push(q);return q},
  setPaused(v){w.paused=!!v},reset(){current=null;resolved=false;mash=0;waiters=[];w.holding=false;w.holdMs=0;w.resets=(w.resets||0)+1}};
  host.w=w;api.widgets.push(w);return w}};return api}
function learning(messages){let count=0;return{active:true,pathwayName:'Addition',records:[],showns:[],flushes:[],begins:[],begin(d){this.begins.push(d)},next(){const i=count++;return{id:'f'+i,token:'t'+i,text:`${i%7} + 2`,answer:i%7+2,op:'add'}},
 shown(q){this.showns.push(q.token)},record(q,ok,ms,o){this.records.push({token:q.token,ok,timeout:!!o?.timeout})},flush(){this.flushes.push(messages.length)}}}
function game(name,shared){const d=lib.dom(),L=shared?learning(d.messages):{active:false,begin(){},next(){},record(){},flush(){}};
 const E=entryApi(),c=lib.context(d,L,{ArcadeNumberEntry:E});d.window.ArcadeNumberEntry=E;
 const src=fs.readFileSync(path.join(root,'dist',name,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('const delay=ms=>new Promise(r=>setTimeout(r,ms));','const delay=async()=>{};');
 vm.runInContext(src+'\nfunction celebrate(){}',c);const run=x=>vm.runInContext(x,c);const w=()=>d.el('answerChoices').w;const fire=t=>{for(const f of d.listeners['doc:'+t]||[])f()};
 return{d,L,E,run,w,fire,gate:()=>E.gates.at(-1)}}
(async()=>{
 for(const name of ['castle','seed','hangar']){
  // 1. Hub Play: the Start gate is up and no card or clock runs until Start.
  {const {d,L,E,run,gate}=game(name,true);run('begin(false)');await flush();
   assert(gate(),name+': a Start gate opens');assert.equal(gate().phase,'ready','hub Play waits for a tap on Start');assert.equal(gate().host,d.el('answerChoices'),'the gate sits over the answer pad');assert.equal(d.el('answerChoices').hidden,false,'the pad host is shown so the gate covers the pad, not the page');
   assert.match(gate().o.title,/Ready\? Addition/);assert.equal(run('current'),null,'no card before Start');assert.equal(run('busy'),true);assert.equal(L.showns.length,0,'no card is reported shown before Start');
   run('paused=true');assert.equal(gate().o.isPaused(),true,'the count stops while the game is paused');run('paused=false');
   gate().finish();await flush();assert(run('current'),'Start deals the first card');assert.equal(run('busy'),false);assert.equal(L.showns.length,1);
   // A tap on the game's own Start, Restart or Build again, or a demo, counts straight down.
   d.el('start').onclick();await flush();assert.equal(gate().phase,'count','the in-game Start tap was the start');assert.equal(E.gates.at(-2).phase,'done','restart replaces the old gate');assert.equal(run('current'),null);
   run('begin(true)');await flush();assert.equal(gate().phase,'count','demo counts itself in');}
  // 2. Answers: correct goes straight on; a miss waits for the correction hold.
  for(const shared of [true,false]){const {d,L,run,w,gate}=game(name,shared);run('begin(false)');await flush();gate().finish();await flush();
   const first=run('current');run('resolve(true,false)');await flush();assert.deepEqual(w().resolves.at(-1),{ok:true,timeout:false});assert.notEqual(run('current'),first,'a correct answer is not slowed');assert.equal(run('mastered'),1);
   const missed=run('current');run('resolve(false,false)');await flush();assert(w().holding);assert.equal(w().holdMs,1500);assert.equal(run('current'),missed,'the next card waits for the correction');assert.notEqual(d.el('answerChoices').style.visibility,'hidden','the pad stays in view, greyed out, during the correction');assert.equal(d.el('reveal').textContent,'','the card itself shows the correction, not a second answer line');assert.equal(d.el('practice').textContent,'0');
   w().endHold();await flush();assert.notEqual(run('current'),missed,'then the next card comes');assert.notEqual(d.el('answerChoices').style.visibility,'hidden','the pad never leaves between cards');assert.equal(d.el('practice').textContent,'1');
   const late=run('current');run('resolve(false,true)');await flush();assert.deepEqual(w().resolves.at(-1),{ok:false,timeout:true},'a timeout resolves as a timeout');assert.equal(run('current'),late);w().finishHold();await flush();
   if(shared)assert.deepEqual(L.records.map(r=>r.ok),[true,false,false],'each first response is recorded once');}
  // 3. Pause discards the live card without recording it; resume deals a fresh card.
  for(const shared of [true,false]){const {d,L,E,run,w,gate}=game(name,shared);run('begin(false)');await flush();gate().finish();await flush();
   const live=run('current'),deckBefore=run('deck.length');d.el('pause').onclick();assert(w().paused,'the widget is paused');assert.deepEqual(E.discarded,[live],'the live card is discarded');assert.equal(run('current'),null);
   if(shared){assert.equal(L.records.length,0,'a paused card is never recorded');assert(live.practiceRecorded);assert.equal(run('deck.length'),deckBefore,'the service, not the game deck, deals the abandoned fact again')}else assert.equal(run('deck.length'),deckBefore+1,'the abandoned card goes back into the deck');
   d.el('pause').onclick();await flush();assert(!w().paused);const fresh=run('current');assert(fresh&&fresh!==live,'resume deals a fresh card');assert.equal(run('busy'),false);
   if(shared){assert.notEqual(fresh.question.token,live.question.token);run('resolve(true,false)');await flush();assert.deepEqual(L.records.map(r=>r.token),[fresh.question.token]);
    // The abandoned card comes back as a fresh question, never as the voided one.
    let guard=0;while(guard++<6){assert.notEqual(run('current.question.token'),live.question.token);run('resolve(true,false)');await flush()}assert.equal(L.records.filter(r=>r.token===live.question.token).length,0);assert.equal(run('total'),36,'the round keeps its size')}
   else{let seen=false;for(let i=0;i<6;i++){if(run('current')===live)seen=true;run('resolve(true,false)');await flush()}assert(seen,'a local abandoned card returns a few cards later, so the build still completes')}
   // Pause during a correction keeps the hold (nothing to discard) and resume deals exactly one next card.
   run('resolve(false,false)');await flush();const held=run('current'),shown=L.showns?.length;d.el('pause').onclick();assert.equal(E.discarded.length,1,'a resolved card is not discarded');d.el('pause').onclick();await flush();assert.equal(run('current'),held,'the hold still runs');w().endHold();await flush();assert.notEqual(run('current'),held);if(shared)assert.equal(L.showns.length,shown+1,'one card dealt after the hold');}
  // 4. Idle: Still there? pauses and discards; resume brings fresh questions for the voided deck.
  {const {d,L,E,run,w,fire,gate}=game(name,true);run('begin(false)');await flush();gate().finish();await flush();const live=run('current');
   fire('arcade-idle-pause');assert.equal(run('paused'),true);assert.deepEqual(E.discarded,[live]);assert(run('deck.every(c=>c.stale||c.practiceRecorded)'),'every unanswered card in the deck was voided by the idle guard');
   const issued=L.showns.length;fire('arcade-idle-resume');await flush();assert.equal(run('paused'),false);const fresh=run('current');assert(fresh&&fresh!==live);assert(!fresh.stale);assert.equal(L.records.length,0,'nothing from the idle stretch is recorded');
   run('resolve(true,false)');await flush();assert.deepEqual(L.records.map(r=>r.token),[fresh.question.token],'the first answer after resume counts');
   // A manual pause is not undone by an idle resume event.
   d.el('pause').onclick();fire('arcade-idle-resume');assert.equal(run('paused'),true);}
  // 5. Skill switch inside a local round: the next district counts 3-2-1 before its first card.
  {const {run,gate}=game(name,false);run('begin(false)');await flush();gate().finish();await flush();let guard=0;while(run('stage')===0&&!run('busy&&!current&&cardGate')&&guard++<100){run('resolve(true,false)');await flush()}
   assert.equal(gate().phase,'count','the new district starts with an automatic 3-2-1');assert.match(gate().o.title,/Subtraction/);assert.equal(run('current'),null,'no card or clock during the count');gate().finish();await flush();assert.equal(run('stage'),1);assert(run('current'));}
  // 6. Round end: held timeouts are flushed before completion is posted.
  {const {d,L,run,gate}=game(name,true);run('begin(false)');await flush();gate().finish();await flush();let guard=0;while(run('active')&&guard++<80){run('resolve(true,false)');await flush()}
   const done=d.messages.findIndex(m=>m.type==='arcade-complete');assert(done>=0,name+' posts completion');assert.equal(L.flushes.length,1);assert(L.flushes[0]<=done,'ArcadeLearning.flush() runs before arcade-complete');}
  // 7. Demo: Stop demo cancels its gate.
  {const {d,run,gate}=game(name,false);run('begin(true)');await flush();const g=gate();d.el('demo').onclick();assert.equal(g.phase,'done');assert.equal(run('active'),false);}
  console.log('PASS '+name+': Start gate, correction hold, discard on pause and idle with a fresh card, district gate, flush before completion');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
