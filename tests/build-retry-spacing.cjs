// Castle, Seed and Neon Auto bring a missed card back about three cards later (like the other games), not at the end of the deck.
// Standalone the game re-inserts the card itself. In the shared pathway the practice service deals the
// missed fact again under a fresh token, so both the miss and the correction reach the teacher's record.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.resolve(__dirname,'..');
const prefix=fs.readFileSync(path.join(__dirname,'shared-remaining-games.cjs'),'utf8').split('\nfunction realClient')[0];
const lib={require,__dirname};vm.createContext(lib);vm.runInContext(prefix.replace("const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),{Engine}=require('../dist/subway/engine.js');","const fs=require('fs'),vm=require('vm'),path=require('path');")+';this.dom=dom;this.context=context;',lib);
const flush=()=>new Promise(setImmediate);
function sharedContext(d,pathway){let t=Date.UTC(2026,10,19,15);const service=require('../dist/practice-pathways.js').create({getItem(){return null},setItem(){}},()=>t+=1,()=>.37);service.setGrade(3);service.setPathway(pathway);
 const records=[],begin=service.begin.bind(service);service.begin=o=>{const run=begin(o),rec=run.record.bind(run);run.record=(q,ok,ms,opts)=>{const r=rec(q,ok,ms,opts);records.push({id:q.id,token:q.token,ok,acc:r.accepted});return r};return run};
 d.parent.location={origin:'https://test'};d.parent.ArcadePractice=service;const c=lib.context(d,null);vm.runInContext(fs.readFileSync(path.join(root,'dist/practice-client.js'),'utf8'),c);return{c,records}}
(async()=>{
 for(const game of ['castle','seed','hangar']){
  for(const shared of [false,'add','mixed']){
   const d=lib.dom(),{c,records}=shared?sharedContext(d,shared):{c:lib.context(d,{active:false,begin(){},next(){},record(){}}),records:[]};
   const src=fs.readFileSync(path.join(root,'dist',game,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('const delay=ms=>new Promise(r=>setTimeout(r,ms));','const delay=async()=>{};');
   vm.runInContext(src+'\nfunction celebrate(){}',c);const run=x=>vm.runInContext(x,c);const label=game+(shared?' shared '+shared:'');
   run('begin(false)');await flush();
   const total=run('total'),perDeck=run('perDeck'),seen=[];const missedCard=run('current');
   run('resolve(false,false)');await flush();
   assert.equal(d.el('practice').textContent,'1','the missed card sits on the practice pile');
   for(let i=0;i<4;i++){seen.push(run('current'));run('resolve(true,false)');await flush()}
   if(!shared)assert.equal(seen.indexOf(missedCard),3,label+': the missed card returns after three other cards');
   else{const back=seen.findIndex(card=>card.question.id===missedCard.question.id);assert.equal(back,3,label+': the missed fact returns after three other cards');
    assert.notEqual(seen[back],missedCard,'the returning fact is a new card');assert.notEqual(seen[back].question.token,missedCard.question.token,'with a fresh service token');
    assert.deepEqual(records.filter(r=>r.id===missedCard.question.id).map(r=>[r.ok,r.acc]),[[false,true],[true,true]],label+': the miss and then the correction are recorded')}
   assert.equal(d.el('practice').textContent,'0','the pile empties once the card is back in play');
   // Finish the first deck: build progress still counts each card once.
   let guard=0;while(run('active')&&run('stage')===0&&guard++<200){run('resolve(true,false)');await flush()}
   if(!shared){assert.equal(run('mastered'),perDeck,'one deck of cards cleared, the retried card counted once');assert.equal(run('stage'),1,'the next district starts after the deck')}
   else{assert.equal(run('mastered'),total,'shared round clears 36 cards');assert.equal(records.length,37,'37 answers, 37 records');assert.equal(new Set(records.map(r=>r.token)).size,37)}
   assert.equal(run('total'),total,'deck totals unchanged');
  }
  console.log('PASS '+game+': a missed card returns three cards later and build progress counts it once');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
