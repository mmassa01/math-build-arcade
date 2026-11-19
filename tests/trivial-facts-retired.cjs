// n − n and n ÷ n cards are never dealt; saves that already hold them keep loading and other facts keep their mastery.
const assert=require('node:assert/strict');
const factory=require('../dist/practice-pathways.js').create;
const R=require('../dist/reporting/summary.js');
const BASE=new Date(2026,10,10,9).getTime();
const store=map=>({getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)});
const trivial=q=>(q.op==='sub'||q.op==='div')&&q.a===q.b;
for(const grade of [1,2,3]){const e=factory(null,()=>BASE,()=>.3);e.setGrade(grade);
  const bank=e.getBank('mixed');assert(!bank.some(trivial),'grade '+grade+' bank has no n − n or n ÷ n');
  assert(bank.some(q=>q.text==='17 − 8'||q.text==='9 − 2'),'ordinary subtraction stays');
  const run=e.begin({endless:true}),seen=new Set();for(let i=0;i<bank.length*2;i++){const q=run.next();if(!q||q.completed)break;assert(!trivial(q),'never dealt: '+q.text);seen.add(q.id);run.record(q,true,900)}
}
{const e=factory(null,()=>BASE,()=>.3);e.setGrade(3);const ids=new Set(e.getBank('mixed').map(q=>q.id));
 for(const id of ['sub:17:17','sub:2:2','div:12:12','div:2:2'])assert(!ids.has(id),id+' retired');
 assert.equal(e.getBank('sub').length,171);assert.equal(e.getBank('div').length,121);assert.equal(e.getBank('mixed').length,439);}
// An existing save that holds retired facts, a confirmed ordinary fact and a partial check still loads.
const day='2026-11-10',confirmed={stage:3,lastSuccess:'2026-11-01',cleared:'2026-11-01',due:'2026-11-15',attempts:4,refresh:0,misses:0,first:'2026-10-20'};
const saved={version:2,pathway:'sub',facts:{'sub:17:17':{...confirmed},'div:12:12':{...confirmed},'sub:17:8':{...confirmed},'add:2:3':{...confirmed}},checks:[],trophies:{},activity:{},
 gameChecks:{sub:{day,elapsed:3000,started:1,responses:[{id:'sub:17:17',correct:true,ms:900},{id:'sub:17:8',correct:true,ms:900}]}},days:{'2026-11-09':{cards:20,correct:18,ms:40000,steps:3,confirmed:2}}};
const data=new Map([['mathArcadePathways.v2',JSON.stringify(saved)]]);const e=factory(store(data),()=>BASE,()=>.3);e.setGrade(3);
assert.equal(e.getPathway(),'sub');
const sub=e.progress().find(p=>p.id==='sub'),add=e.progress().find(p=>p.id==='add');
assert.equal(sub.mastered,1,'the confirmed ordinary fact still counts; the retired one is not counted');assert.equal(sub.total,171);assert.equal(add.mastered,1);
assert.equal(e.checkStatus().attempts,2,'a saved partial check keeps its answered cards');
const run=e.begin({endless:true});const q=run.next();assert(!trivial(q));run.record(q,true,900);
const after=JSON.parse(data.get('mathArcadePathways.v2'));assert.deepEqual(after.facts['sub:17:17'],saved.facts['sub:17:17'],'retired fact history is kept, not erased');
// Reports read the same record without the retired facts.
const s=R.summarize(after,{id:'s',name:'Ada B.',grade:3,classId:'c'},{today:'2026-11-10'});
assert.equal(s.facts.total,439);assert.equal(s.operations.sub.total,171);assert(s.facts.confirmed>=2&&s.facts.confirmed<=3);
assert(!s.notStarted.some(f=>f.id==='sub:17:17'||f.id==='div:12:12'),'reports never list a retired fact as not started');
console.log('PASS trivial facts retired: no n − n or n ÷ n dealt in any grade, old saves keep loading, other mastery unchanged, reports agree');
