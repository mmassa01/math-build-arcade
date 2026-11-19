// A card dealt but abandoned (pause, "Still there?") is released back to the run, not lost.
// Without this, grade 1 addition (few facts) could run dry after repeated pauses.
const assert=require('node:assert/strict');
const factory=require('../dist/practice-pathways.js').create;
const data=new Map(),api=factory({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},()=>new Date(2026,10,19,9).getTime(),()=>.31);
api.setGrade(1);api.setPathway('add');
const run=api.begin({endless:true});
const first=run.next();
assert.equal(typeof run.release,'function','run exposes release(q)');
assert.equal(run.release({...first,token:'stale'}),false,'a stale token is refused');
assert.equal(run.release(first),true,'a live card is released');
assert.equal(run.release(first),false,'releasing twice does nothing');
assert.equal(run.record(first,true,800).accepted,false,'a released card cannot be recorded');
const seen=[];for(let i=0;i<4;i++){const q=run.next();seen.push(q.id);run.record(q,true,800);}
assert(seen.includes(first.id),'the released fact is dealt again within a few cards');
// Releasing many cards never empties the deck.
for(let i=0;i<200;i++){const q=run.next();assert(q&&!q.completed,'deck never runs dry after repeated releases');run.release(q);}
const before=JSON.stringify(api.stats());run.release(run.next());assert.equal(JSON.stringify(api.stats()),before,'releasing changes no stats');
console.log('released-cards-return: ok');
