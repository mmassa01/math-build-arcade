// A student who takes all five daily checks and plays every day for 400 days keeps a bounded
// save: answer detail and practice checks age out after 7 days, while official check
// summaries, facts and trophies (what reports and mastery read) are all kept.
const assert=require('node:assert/strict');
const factory=require('../dist/practice-pathways.js').create,R=require('../dist/reporting/summary.js');
const KEY='mathArcadePathways.v2',DAY=86400000,START=new Date(2026,0,5,9).getTime();
const data=new Map();let now=START,writes=0,largest=0;
const storage={getItem:k=>data.has(k)?data.get(k):null,setItem(k,v){v=String(v);writes++;largest=Math.max(largest,v.length);data.set(k,v)}};
let seed=7;const random=()=>(seed=seed*16807%2147483647)/2147483647;
const PATHS=['add','sub','mul','div','mixed'];let officialTaken=0,officialPassed=new Set();
const sizes=[];
for(let d=0;d<400;d++){
  now=START+d*DAY;const api=factory(storage,()=>now,random);api.setGrade(3);
  for(const p of PATHS){api.setPathway(p);
    for(let round=0;round<(d%3===0?2:1);round++){const check=api.startCheck();let q;
      while((q=check.next())){now+=1500;check.answer(q.token,random()<.94?q.answer:q.answer+1)}
      now+=1000;const r=check.finish();if(r.official){officialTaken++;if(r.passed)officialPassed.add(p+r.day)}}
    const run=api.begin({endless:true});const q=run.next();now+=1500;run.record(q,true,1400);
  }
  api.addActivity(45000);
  sizes.push(data.get(KEY).length);
}
const rec=JSON.parse(data.get(KEY)),kb=n=>Math.round(n/1024);
// Bounded: well under the ~5 MB browser limit, and flat once the detail window is full.
assert(largest<1.5*1024*1024,'save stays small after 400 days: '+kb(largest)+' KB');
const growthPerDay=(sizes[399]-sizes[99])/300;assert(growthPerDay<3000,'late growth is only official summaries: '+Math.round(growthPerDay)+' bytes/day');
const today=new Date(now).toISOString().slice(0,10),cutoff=(()=>{const t=new Date(now);t.setDate(t.getDate()-7);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')})();
assert(rec.checks.filter(c=>c.day<cutoff).every(c=>c.official&&c.responses.length===0),'old checks keep only official summaries');
assert(rec.checks.some(c=>c.day>=cutoff&&c.responses.length>0),'recent checks keep their answer detail');
assert(rec.checks.some(c=>c.day>=cutoff&&!c.official),'recent practice checks are kept');
assert.equal(rec.checks.filter(c=>c.official).length,officialTaken,'every official check summary is kept');
assert(rec.checks.filter(c=>c.official).every(c=>Number.isFinite(c.correct)&&Number.isFinite(c.attempts)&&c.byOperation&&c.passed!==undefined&&c.day),'summaries keep what reports read');
assert(Object.keys(rec.days).length<=400&&Object.keys(rec.activity).length<=400,'daily logs are capped');
// Mastery and reports are unchanged by the trimming.
const api=factory(storage,()=>now,random);api.setGrade(3);
for(const p of PATHS){const passes=new Set([...officialPassed].filter(k=>k.startsWith(p))).size;assert.equal(api.progress().find(x=>x.id===p).checks.passes,passes,p+' check passes intact')}
const s=R.summarize(rec,{id:'s',name:'Ada B.',grade:3,classId:'c'},{today:rec.checks.at(-1).day});
assert.equal(s.checks.history.length,officialTaken,'the report history lists every official check');
assert.equal(s.checks.passedDays,[...officialPassed].length,'the report counts every passing check day');
console.log('PASS save growth: 400 days x 5 checks a day peaks at '+kb(largest)+' KB ('+Math.round(growthPerDay)+' bytes/day late), detail trimmed after 7 days, reports and mastery intact ('+writes+' saves)');
