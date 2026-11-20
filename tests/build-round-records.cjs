// Castle, Seed and Neon Auto: a whole round with misses, a pause and an idle stretch keeps the
// teacher's record, the coins and the end screen in agreement. In the shared pathway every
// answered card (a returning missed fact included) is recorded once under its own service token,
// so the check sees the miss and then the correction; a card dropped by pause or idle is never
// recorded. Coins are 10 per correct card, paid once, and match the recorded correct count.
// Runs the real practice service (dist/practice-pathways.js) and client (dist/practice-client.js).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.resolve(__dirname,'..');
const prefix=fs.readFileSync(path.join(__dirname,'shared-remaining-games.cjs'),'utf8').split('\nfunction realClient')[0];
const lib={require,__dirname};vm.createContext(lib);vm.runInContext(prefix.replace("const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),{Engine}=require('../dist/subway/engine.js');","const fs=require('fs'),vm=require('vm'),path=require('path');")+';this.dom=dom;this.context=context;',lib);
const real=require('../dist/number-entry.js');const flush=()=>new Promise(setImmediate);
// Widget double with the dist/number-entry.js API; discard() hands the question back to the
// practice client like the real widget does.
function entryApi(){const api={motion:real.motion,wrong:real.wrong,gates:[],vertical(el,t){el.textContent=t||'Ready?'},freezeAppearance(){},
 startGate(host,o){const g={o,phase:o.auto?'count':'ready',finish(){if(g.phase==='done')return;g.phase='done';o.onStart()},cancel(){g.phase='done'}};api.gates.push(g);return g},
 mount(host){if(host.w)return host.w;let current=null,resolved=false,waiters=[];const w={holdMs:0,holding:false,enabled:false,
  set(q,cb,force){if(current===q&&!force)return;w.endHold();current=q;resolved=false},setEnabled(on){w.enabled=!!on},showDemo(){},
  resolve(ok){if(resolved||!current)return false;resolved=true;w.holdMs=ok?0:1500;w.holding=!ok;return true},
  afterHold(fn){if(!w.holding)fn();else waiters.push(fn)},endHold(){if(!w.holding)return;w.holding=false;const l=waiters;waiters=[];l.forEach(f=>f())},finishHold(){w.endHold()},
  discard(){if(!current||resolved)return null;const q=current;resolved=true;current=null;try{globalThis.__learning?.discard?.(q.question||q)}catch{}return q},
  setPaused(){},reset(){current=null;resolved=false;waiters=[];w.holding=false}};host.w=w;return w}};return api}
function game(name,shared){const d=lib.dom(),E=entryApi();let service=null,c,records=[];
 d.document.dispatchEvent=e=>{for(const f of d.listeners['doc:'+e.type]||[])f(e)};
 class CustomEvent{constructor(type,o){this.type=type;this.detail=o?.detail}}
 if(shared){let t=Date.UTC(2026,10,19,15);service=require('../dist/practice-pathways.js').create({getItem(){return null},setItem(){}},()=>t+=1,()=>.37);service.setGrade(3);service.setPathway('mixed');
  const begin=service.begin.bind(service);service.begin=o=>{const run=begin(o);const rec=run.record.bind(run);run.record=(q,ok,ms,opts)=>{const r=rec(q,ok,ms,opts);records.push({id:q.id,token:q.token,ok,acc:r.accepted});return r};return run};
  d.parent.location={origin:'https://test'};d.parent.ArcadePractice=service;c=lib.context(d,null,{ArcadeNumberEntry:E,CustomEvent});d.window.ArcadeNumberEntry=E;
  vm.runInContext(fs.readFileSync(path.join(root,'dist/practice-client.js'),'utf8'),c);c.__learning=d.window.ArcadeLearning}
 else{c=lib.context(d,{active:false,begin(){},next(){},record(){},flush(){}},{ArcadeNumberEntry:E,CustomEvent});d.window.ArcadeNumberEntry=E}
 const src=fs.readFileSync(path.join(root,'dist',name,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('const delay=ms=>new Promise(r=>setTimeout(r,ms));','const delay=async()=>{};');
 vm.runInContext(src+'\nfunction celebrate(){}',c);const run=x=>vm.runInContext(x,c);if(!shared)run('arcadeEmbedded=false');
 return{d,E,run,service,records,w:()=>d.el('answerChoices').w,gate:()=>E.gates.at(-1)}}
// Plays until the round ends: misses on the listed card numbers, a pause on one card, and
// three unanswered cards in a row (the idle guard) starting at another.
async function play(t,{miss,pause,idle}){const {d,run,w,gate}=t;let cards=0,correct=0,wrong=0,timeouts=0,idleLeft=0,guard=0;const missedFacts=[];
 while(run('active')&&guard++<400){
  if(gate()&&gate().phase!=='done'){gate().finish();await flush();continue}
  if(w()?.holding){w().endHold();await flush();continue}
  if(run('paused')){const L=d.window.ArcadeLearning;if(L?.idle)L.resumeIdle();else d.el('pause').onclick();await flush();continue}
  if(!run('current&&!busy')){await flush();continue}
  cards++;if(cards===idle)idleLeft=3;
  if(cards===pause){d.el('pause').onclick();await flush();continue}
  if(idleLeft>0){idleLeft--;timeouts++;run('resolve(false,true)');await flush();continue}
  if(miss.includes(cards)){wrong++;if(run('current.question'))missedFacts.push(run('current.question.id'));run('resolve(false,false)')}else{correct++;run('resolve(true,false)')}
  await flush()}
 assert(!run('active'),'the round finishes');return{cards,correct,wrong,timeouts,missedFacts}}
(async()=>{
 for(const name of ['castle','seed','hangar']){
  // Shared pathway inside the hub.
  {const t=game(name,true),{d,run,service,records}=t;run('begin(false)');await flush();
   const r=await play(t,{miss:[3,10,22,35,44],pause:6,idle:14});
   const rewards=d.messages.filter(m=>m.type==='arcade-reward'),done=d.messages.filter(m=>m.type==='arcade-complete');
   const accepted=records.filter(x=>x.acc),tokens=new Set(accepted.map(x=>x.token));
   assert.equal(tokens.size,accepted.length,name+': every recorded card has its own token');
   assert.equal(accepted.length,r.correct+r.wrong,name+': every answered card is recorded once; the idle stretch and the paused card are not');
   assert.equal(accepted.filter(x=>x.ok).length,r.correct,name+': the record has every correct answer, returning facts included');
   for(const id of r.missedFacts){const i=accepted.findIndex(x=>x.id===id&&!x.ok);assert(i>=0,'the miss is recorded');assert(accepted.slice(i+1).some(x=>x.id===id&&x.ok),name+': the correction of '+id+' is recorded after the miss')}
   assert.equal(new Set(rewards.map(m=>m.id)).size,rewards.length,'each reward has its own id');
   assert(rewards.every(m=>m.amount===10));assert.equal(rewards.length,r.correct,name+': 10 coins for each correct card, paid once');
   const earned=rewards.length*10;assert.equal(done.length,1,'one completion');assert.equal(done[0].earned,earned);assert.equal(done[0].mastered,36);assert.equal(done[0].total,36);
   assert(d.el('summary').textContent.includes(earned+' coins earned'),name+' end screen shows the coins paid: '+d.el('summary').textContent);
   const sum=service.roundSummary(),check=service.checkStatus();assert.equal(sum.answered,accepted.length,'hub results count the recorded cards');assert.equal(sum.correct,earned/10,name+': hub results correct count matches the coins');
   assert.equal(check.attempts,accepted.length,'the check saw every recorded card');assert.equal(check.correct,earned/10,name+': the check correct count matches the coins');
   assert.equal(run('mastered'),36);assert.equal(d.el('practice').textContent,'0','no missed fact is left waiting');
   console.log('PASS '+name+' shared: '+r.cards+' cards, '+accepted.length+' recorded / '+sum.correct+' correct, '+earned+' coins, check '+check.attempts+'/'+check.correct)}
  // Standalone: four local decks, retries come back, coins agree with the wallet and end screen.
  {const t=game(name,false),{d,run}=t;const before=run('tokens');run('begin(false)');await flush();
   const r=await play(t,{miss:[2,9,30],pause:5,idle:0});const earned=run('earned');
   assert.equal(run('mastered'),60);assert.equal(r.correct,60,'each local card is cleared once');assert.equal(earned,600,name+': 10 coins for each cleared card');
   assert.equal(run('tokens')-before,earned,'the wallet moves by the coins earned');assert(d.el('summary').textContent.includes(earned+' coins earned'));
   console.log('PASS '+name+' standalone: '+r.cards+' cards, '+r.wrong+' misses retried, '+earned+' coins = wallet change')}
  // Demo pays nothing and records nothing.
  {const t=game(name,true),{d,run,service,records}=t;run('begin(true)');await flush();await play(t,{miss:[4],pause:0,idle:0});
   assert.equal(d.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,'demo posts no coins or completion');assert.equal(service.checkStatus().attempts,0,'demo never reaches the check')}
  // The faded "Awesome! +10" of the last card is cleared when the next result shows.
  {const t=game(name,false),{d,run,gate}=t;let removed=0;d.document.querySelectorAll=sel=>sel==='.winbadge'?[{remove(){removed++}}]:[];
   run('begin(false)');await flush();gate().finish();await flush();run('resolve(false,false)');assert.equal(removed,1,name+': the previous badge is removed with the next result')}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
