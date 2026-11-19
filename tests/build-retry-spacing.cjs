// Castle, Seed and Neon Auto bring a missed card back about three cards later (like the other games), not at the end of the deck.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.resolve(__dirname,'..');
const prefix=fs.readFileSync(path.join(__dirname,'shared-remaining-games.cjs'),'utf8').split('\nfunction realClient')[0];
const lib={require,__dirname};vm.createContext(lib);vm.runInContext(prefix.replace("const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),{Engine}=require('../dist/subway/engine.js');","const fs=require('fs'),vm=require('vm'),path=require('path');")+';this.dom=dom;this.context=context;this.learning=learning;',lib);
const flush=()=>new Promise(setImmediate);
(async()=>{
 for(const game of ['castle','seed','hangar']){
  for(const shared of [false,true]){
   const d=lib.dom(),c=lib.context(d,shared?lib.learning():{active:false,begin(){},next(){},record(){}});
   const src=fs.readFileSync(path.join(root,'dist',game,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('const delay=ms=>new Promise(r=>setTimeout(r,ms));','const delay=async()=>{};');
   vm.runInContext(src+'\nfunction celebrate(){}',c);const run=x=>vm.runInContext(x,c);
   run('begin(false)');await flush();
   const total=run('total'),perDeck=run('perDeck'),seen=[];const missedCard=run('current');
   run('resolve(false,false)');await flush();
   assert.equal(d.el('practice').textContent,'1','the missed card sits on the practice pile');
   for(let i=0;i<4;i++){seen.push(run('current'));run('resolve(true,false)');await flush()}
   assert.equal(seen.indexOf(missedCard),3,game+(shared?' shared':'')+': the missed card returns after three other cards');
   assert.equal(d.el('practice').textContent,'0','the pile empties once the card is back in play');
   // Finish the first deck: build progress still counts each card once.
   let guard=0;while(run('active')&&run('stage')===0&&guard++<200){run('resolve(true,false)');await flush()}
   if(!shared){assert.equal(run('mastered'),perDeck,'one deck of cards cleared, the retried card counted once');assert.equal(run('stage'),1,'the next district starts after the deck')}
   else assert.equal(run('mastered'),total,'shared round clears every card once');
   assert.equal(run('total'),total,'deck totals unchanged');
  }
  console.log('PASS '+game+': a missed card returns three cards later and build progress counts it once');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
