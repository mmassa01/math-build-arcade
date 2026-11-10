const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Reuse the established browser-light building-game harness. The actual motion
// promises below are controlled so reset/pause can be tested during a flight.
const fixtureSource=fs.readFileSync('tests/shared-remaining-games.cjs','utf8').split('(async()=>{')[0];
const fixtureScope={require,console,__dirname};vm.createContext(fixtureScope);vm.runInContext(fixtureSource+';this.fixture={dom,context};',fixtureScope);
const {dom,context}=fixtureScope.fixture,flush=()=>new Promise(setImmediate);
(async()=>{for(const name of ['seed','castle','hangar']){
 const html=fs.readFileSync('dist/'+name+'/index.html','utf8');assert(!html.includes('type="range"'),'no adjustable response-time slider');assert(html.includes('CARD_LIMIT_MS=3000'));assert(html.includes('<b id="seconds">3</b>'));assert(!html.includes('translateY(8px)'),'center deck does not hop');assert(!html.includes('revealWatch'),'no geometry-poll race');assert(html.includes("$('answerChoices').style.visibility='hidden'"),'input area keeps layout space during movement');
 const d=dom(),motions=[];let now=1000;const c=context(d,{active:false,begin(){}},{performance:{now:()=>now}});
 const rects={card:{x:300,y:100,width:240,height:150},left:{x:20,y:100,width:230,height:145},right:{x:580,y:100,width:250,height:155}};
 for(const id of ['card','left','right'])d.el(id).getBoundingClientRect=()=>rects[id];
 function animation(frames,options){let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});const motion={frames,options,finished,paused:false,play(){this.paused=false},pause(){this.paused=true},cancel(){this.cancelled=true;reject(new Error('cancelled'))},finish(){resolve()}};motions.push(motion);return motion;}
 d.el('card').animate=animation;for(const id of ['card','left','right'])d.el(id).cloneNode=()=>{const el=d.el('clone'+motions.length);el.animate=animation;return el;};
 const src=html.match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInContext(src+'\nfunction celebrate(){}',c);const run=x=>vm.runInContext(x,c);
 run('begin(false)');await flush();assert.equal(motions.length,1);assert.equal(run('busy'),true);now=1900;motions[0].finish();await flush();assert.equal(run('limit'),3000);assert.equal(run('deadline'),4900,'full three seconds starts after initial reveal');
 run('resolve(true,false)');await flush();assert.equal(run('mastered'),0);const feedback=motions.at(-1);feedback.finish();await flush();const flight=motions.at(-1);assert(flight.frames[1].transform.includes('scale(0.9583333333333334,0.9666666666666667)'),'FLIP includes destination width and height');assert.equal(flight.options.duration,220);assert.equal(flight.options.easing,'cubic-bezier(.22,.7,.3,1)');assert.equal(run('CARD_MOTION.card.duration'),220,'building game reads shared motion tokens');assert.equal(run('busy'),true);d.el('pause').onclick();assert(flight.paused,'pause freezes the in-flight card');d.el('pause').onclick();assert(!flight.paused);now=2400;flight.finish();await flush();assert.equal(run('mastered'),1);assert.equal(run('deadline'),5400,'next card receives its own full 3000 ms');assert.equal(run('busy'),false);
 // Restarting during outgoing feedback cancels the old continuation. Completing
 // its cancelled promise cannot award another card or replace the fresh deck.
 run('resolve(true,false)');await flush();const stale=motions.at(-1);run('begin(false)');await flush();assert(stale.cancelled);const generation=run('generation');motions.at(-1).finish();await flush();assert.equal(run('generation'),generation);assert.equal(run('mastered'),0,'reset cancels stale reward');assert.equal(run('limit'),3000);
 const shapes=run('cardFlight({x:10,y:20,width:200,height:100},{x:210,y:40,width:300,height:150})');assert.equal(shapes[1].transform,'translate3d(200px,20px,0) scale(1.5,1.5)');
 console.log('PASS '+name+': fixed 3s, no slider, full readable-card deadline, stable layout, exact FLIP scaling, motion pause and restart safety');
}})().catch(e=>{console.error(e);process.exitCode=1;});
