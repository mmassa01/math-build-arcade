// Skyrail pays 10 coins for every correct card, even when the same fact is dealt again in one run.
const assert=require('assert'),{Engine}=require('../dist/subway/engine.js');
function advance(e,seconds){for(let t=0;t<seconds;t+=.05)e.tick(.05)}
function learning(){let n=0;return{active:true,begin(){},record(){return{accepted:true}},next(){n++;const a=n%2?1:2;return{id:'add:1+'+a,text:'1 + '+a,answer:1+a,choices:[1+a,9,10,11],token:'add:1+'+a+':'+n}}}}
for(const timed of [false,true]){
  const events=[];const e=new Engine({random:()=>.45,emit:(type,data)=>events.push({type,...data}),learning:learning()});
  e.start('play','add',7,timed);let correct=0;
  for(let i=0;i<20&&e.card;i++){if(e.phase!=='thinking')advance(e,1);if(!e.card)break;e.answer(e.card.answer);correct++;advance(e,2.6)}
  const rewards=events.filter(x=>x.type==='reward');
  assert.equal(rewards.length,correct,'every correct card pays ('+(timed?'timed':'deck')+')');
  assert(rewards.every(r=>r.amount===10));
  assert.equal(new Set(rewards.map(r=>r.id)).size,rewards.length,'each card has its own idempotency id');
  assert(new Set(events.filter(x=>x.type==='question').map(q=>q.id)).size<=2,'facts really repeated');
}
{const events=[];const e=new Engine({random:()=>.45,emit:(type,data)=>events.push({type,...data})});
 e.start('play','add');const first=e.card;e.answer(first.answer+1);advance(e,1);
 while(e.card&&e.card!==first){e.answer(e.card.answer);advance(e,2.6)}
 const before=events.filter(x=>x.type==='reward').length;e.answer(e.card.answer);advance(e,2.6);
 assert.equal(events.filter(x=>x.type==='reward').length,before+1,'a missed card retried later still pays');
 const ids=events.filter(x=>x.type==='reward').map(r=>r.id);assert.equal(new Set(ids).size,ids.length)}
{const events=[];const e=new Engine({random:()=>.45,emit:(type,data)=>events.push({type,...data}),learning:learning()});e.start('demo','add');advance(e,60);assert.equal(events.filter(x=>x.type==='reward').length,0,'demo never pays')}
console.log('PASS skyrail: repeated facts pay 10 per correct card with per-attempt reward ids; demo pays nothing');
