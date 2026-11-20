// The reporting summary on hand-built records: what one student's stored record plus a
// roster row turns into, and how summaries aggregate for a class, grade or district.
const assert=require('node:assert/strict');
const practice=require('../dist/practice-pathways.js');
const R=require('../dist/reporting/summary.js');
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}

const TODAY='2027-02-01';
const bank=g=>R.gradeInfo(g).facts;
const confirmed=(day='2027-01-20')=>({stage:3,attempts:3,misses:0,first:'2027-01-10',lastSuccess:day,cleared:day,due:R.addDays(day,14),failedDay:null,refresh:0});
// A record with the first n facts of the grade confirmed and a daily log starting on firstDay.
function record(grade,n,firstDay,extra={}){
  const facts={};for(const f of bank(grade).slice(0,n))facts[f.id]=confirmed();
  return{version:2,grade,pathway:'mixed',facts,checks:[],trophies:{},days:firstDay?{[firstDay]:{cards:10,correct:8,ms:20000,steps:8,confirmed:0}}:{},...extra};
}
const sum=(rec,grade,options={})=>R.summarize(rec,{id:'s1',name:'Ada B.',grade,school:'Example Elementary',classId:'c1',className:'Class',teacher:'Ms. Alder'},{today:TODAY,graceDays:0,...options});
const check=(pathway,day,passed,missed=[])=>({id:pathway+day,source:'game',pathway,day,duration:90000,valid:true,official:true,correct:passed?40:20,attempts:passed?41:30,accuracy:passed?40/41:20/30,balanced:true,passed,byOperation:{},missed});

test('fact totals come from the engine: 61 in grade 1, 271 in grade 2, 469 from grade 3',()=>{
  for(const [grade,total,parts,trophies]of [[1,61,{add:16,sub:45},3],[2,271,{add:81,sub:190},3],[3,469,{add:81,sub:190,mul:66,div:132},5],[12,469,{add:81,sub:190,mul:66,div:132},5]]){
    const info=R.gradeInfo(grade),engine=practice.create(null);engine.setGrade(grade);
    assert.equal(info.total,total);assert.deepEqual(info.totals,parts);assert.equal(info.trophiesPossible,trophies);
    assert.deepEqual(info.facts.map(f=>f.id),engine.getBank().map(f=>f.id));assert.deepEqual(info.pathways,engine.pathways);
    for(const f of info.facts)assert(![0,1].includes(f.b)&&(f.op==='div'||![0,1].includes(f.a)),'no fact works with 0 or 1: '+f.id);
  }
  assert.equal(R.gradeInfo('7').total,469);assert.equal(R.gradeInfo(99).grade,3);
});

test('a fact is confirmed at stage 3 or more with no refresh flag, and only the grade’s facts count',()=>{
  const rec=record(1,10,'2027-01-10');const ids=bank(1).map(f=>f.id);
  rec.facts[ids[10]]={...confirmed(),stage:4};                      // older save
  rec.facts[ids[11]]={...confirmed(),refresh:2,misses:1,failedDay:'2027-01-25'}; // confirmed, then missed
  rec.facts[ids[12]]={...confirmed(),stage:2};
  rec.facts['mul:6:7']=confirmed();rec.facts['add:9:9']=confirmed(); // not grade 1 facts
  const s=sum(rec,1);
  assert.equal(s.facts.total,61);assert.equal(s.facts.confirmed,11);assert.equal(s.facts.steps,11*3+3+2);assert.equal(s.facts.started,13);assert.equal(s.facts.notStarted,48);assert.equal(s.notStarted.length,48);
  assert.deepEqual(s.operationList,['add','sub']);assert.equal(s.operations.add.total,16);assert.equal(s.operations.add.confirmed+s.operations.sub.confirmed,11);assert.equal(s.operations.mul,undefined);
  assert.equal(s.trophies.possible,3);assert.equal(sum(record(3,0,null),3).trophies.possible,5);
  assert.equal(sum({...rec,grade:1},3).facts.total,469,'the roster grade decides the fact set');
});

test('stuck facts are the ones missed last time or needing re-confirmation, most-missed first',()=>{
  const rec=record(3,0,'2027-01-10');
  rec.facts['mul:7:8']={stage:1,attempts:9,misses:6,first:'2027-01-11',lastSuccess:'2027-01-12',failedDay:'2027-01-28',refresh:0};
  rec.facts['mul:6:7']={stage:0,attempts:2,misses:2,first:'2027-01-28',lastSuccess:null,failedDay:'2027-01-28',refresh:0};
  rec.facts['add:8:9']={stage:3,attempts:8,misses:3,first:'2027-01-11',lastSuccess:'2027-01-20',failedDay:'2027-01-27',refresh:2};
  rec.facts['add:7:8']={stage:2,attempts:5,misses:1,first:'2027-01-11',lastSuccess:'2027-01-29',failedDay:'2027-01-20',refresh:0}; // recovered
  const s=sum(rec,3);
  assert.deepEqual(s.stuck.map(f=>[f.id,f.misses,f.reason]),[['mul:7:8',6,'missed'],['add:8:9',3,'refresh'],['mul:6:7',2,'missed']]);
  assert.equal(s.stuck[0].text,'7 × 8');assert.equal(s.stuck[0].answer,56);assert.equal(s.operations.mul.stuck,2);assert.equal(s.operations.add.stuck,1);assert.equal(s.facts.confirmed,0);
});

test('checks count distinct passing days per pathway and need a seven-day span',()=>{
  const rec=record(3,0,'2027-01-04',{checks:[check('add','2027-01-11',true),check('add','2027-01-12',true),check('add','2027-01-12',true),check('add','2027-01-13',false,['add:8:9','nope']),
    check('mul','2027-01-11',true),check('mul','2027-01-14',true),check('mul','2027-01-18',true),
    {...check('sub','2027-01-11',true),official:false},{...check('sub','2027-01-12',true),valid:false},check('sub','2027-03-01',true)]});
  const s=sum(rec,3),c=s.checks.byPathway;
  assert.equal(c.add.passes,2);assert.equal(c.add.taken,4);assert.equal(c.add.complete,false);assert.equal(c.add.last.passed,false);assert.deepEqual(c.add.last.missed,[{id:'add:8:9',text:'8 + 9'}]);
  assert.equal(c.mul.passes,3);assert.equal(c.mul.spanMet,true);assert.equal(c.mul.spanDays,7);
  assert.equal(c.sub.passes,0,'unofficial, invalid and future checks are ignored');assert.equal(c.div.last,null);
  assert.equal(s.checks.passedDays,5);assert.equal(s.checks.neededDays,15);assert.equal(s.checks.history[0].day,'2027-01-18');assert.equal(s.checks.history.length,7);
  rec.checks=[check('add','2027-01-11',true),check('add','2027-01-12',true),check('add','2027-01-13',true)];
  const short=sum(rec,3).checks.byPathway.add;assert.equal(short.passes,3);assert.equal(short.spanMet,false);assert.equal(short.nextEligible,'2027-01-18');
});

test('trophies: three possible in grades 1–2, five from grade 3; all of them means Finished',()=>{
  const g1=sum(record(1,61,'2027-01-04',{trophies:{add:'2027-01-20',sub:'2027-01-22',mixed:'2027-01-25',mul:'2027-01-25'}}),1);
  assert.equal(g1.trophies.count,3);assert.equal(g1.trophies.possible,3);assert.equal(g1.trophies.won,true);assert.equal(g1.trophies.wonDay,'2027-01-25');assert.equal(g1.pace.status,'finished');assert.equal(g1.pace.label,'Finished');
  const g3=sum(record(3,469,'2027-01-04',{trophies:{add:'2027-01-20',sub:'2027-01-22',mixed:'bad'}}),3);
  assert.equal(g3.trophies.count,2);assert.equal(g3.trophies.possible,5);assert.equal(g3.trophies.won,false);assert.equal(g3.pace.status,'onPace','every fact confirmed but trophies outstanding is on pace, not finished');
});

test('pace: a straight line from the first day to every fact by the target, with bands at 90% and 60%',()=>{
  const first='2026-12-13',target='2027-03-23';                 // 100 days; today is day 50, so half of 469 = 234.5 expected
  assert.equal(R.dayDiff(first,TODAY),50);assert.equal(R.dayDiff(first,target),100);
  const at=n=>sum(record(3,n,first),3,{target}).pace;
  assert.equal(at(212).expected,234.5);assert.equal(at(212).expectedPercent,50);
  assert.equal(at(212).status,'onPace');assert.equal(at(211).status,'behind');   // 90% of 234.5 = 211.05
  assert.equal(at(141).status,'behind');assert.equal(at(140).status,'atRisk');   // 60% of 234.5 = 140.7
  assert.equal(at(0).status,'atRisk');assert.equal(at(469).status,'onPace');
  assert.equal(at(141).label,'Behind');assert.equal(at(140).label,'At risk');assert.equal(at(212).label,'On pace');
  const usual=sum(record(3,0,first),3).pace;assert.equal(usual.target,'2027-04-26');assert.equal(usual.milestone,'2027-05-10');assert.equal(usual.daysToMilestone,98);
  assert.equal(sum(record(3,400,'2026-11-01'),3,{today:'2027-06-01'}).pace.expected,469,'after the target the line stays at every fact');
  assert.equal(sum(record(3,400,'2026-11-01'),3,{today:'2027-06-01'}).pace.status,'behind');
  assert.equal(sum(record(3,0,first),3,{target,onPaceRatio:0}).pace.status,'onPace','the band edges are parameters');
});

test('pace: the first days actually played are on pace, no days logged is Not started',()=>{
  for(const [first,status,grace]of [['2027-02-01','onPace',true],['2027-01-31','onPace',true],['2027-01-30','onPace',true],['2027-01-29','onPace',true]]){
    const p=sum(record(3,0,first),3,{graceDays:3}).pace;assert.equal(p.status,status,first);assert.equal(p.grace,grace);}
  const three=record(3,0,'2027-01-22');for(const d of ['2027-01-25','2027-01-26'])three.days[d]={cards:10,correct:8,ms:20000,steps:8,confirmed:0};
  const out=sum(three,3,{graceDays:3}).pace;assert.equal(out.grace,false);assert.equal(out.status,'atRisk','after three days played with nothing confirmed, grace is over');
  const weekend=record(3,0,'2027-01-22');weekend.days={'2027-01-22':{cards:10,correct:8,ms:20000,steps:8,confirmed:0}};
  assert.equal(sum(weekend,3,{graceDays:3}).pace.grace,true,'ten calendar days but one day played is still in grace');
  const none=sum(record(3,0,null),3);assert.equal(none.pace.status,'notStarted');assert.equal(none.pace.label,'Not started');assert.equal(none.pace.projection,null);assert.equal(none.activity.lastDay,null);assert.equal(none.activity.playedLast7,false);
  for(const junk of [null,undefined,{},{facts:'x',checks:'y',days:[],trophies:7},'text',42]){const s=sum(junk,3);assert.equal(s.pace.status,'notStarted');assert.equal(s.facts.confirmed,0);assert.equal(s.facts.total,469);}
  const future=sum(record(3,0,'2027-02-09'),3);assert.equal(future.pace.status,'notStarted','days after today are ignored');
  const legacy=record(3,5,null);assert.equal(sum(legacy,3).pace.firstDay,'2027-01-10','a record without a daily log falls back to the first day a fact was seen');
});

test('time on task, cards and accuracy use rolling seven-day weeks ending today',()=>{
  const day=(n,ms,cards,correct,done)=>[R.addDays(TODAY,-n),{cards,correct,ms,steps:1,confirmed:done}];
  const rec=record(3,0,null,{days:Object.fromEntries([day(0,120000,40,30,9),day(6,60000,20,20,8),day(7,300000,100,50,6),day(13,30000,10,5,4),day(14,600000,200,100,2),day(40,60000,20,10,1)])});
  const a=sum(rec,3).activity;
  assert.equal(a.minutesThisWeek,3);assert.equal(a.minutesLastWeek,5.5);assert.equal(a.cardsThisWeek,60);assert.equal(a.correctThisWeek,50);assert.equal(a.accuracyThisWeek,50/60);
  assert.equal(a.daysThisWeek,2);assert.equal(a.daysLastWeek,2);assert.equal(a.daysPlayed,6);assert.equal(a.firstDay,R.addDays(TODAY,-40));assert.equal(a.lastDay,TODAY);assert.equal(a.daysSinceLast,0);assert.equal(a.playedLast7,true);
  assert.equal(a.totalMinutes,19.5);assert.equal(a.totalCards,390);
  const s=sum(rec,3);assert.deepEqual(s.series.map(d=>d.confirmed),[1,2,4,6,8,9]);assert.equal(s.series[0].minutes,1);
  const idle=sum(record(3,0,R.addDays(TODAY,-10)),3).activity;assert.equal(idle.playedLast7,false);assert.equal(idle.daysSinceLast,10);assert.equal(idle.accuracyThisWeek,null);
});

test('projection: the day every fact is confirmed at the rate of the last 14 days',()=>{
  const rec=record(3,170,'2026-12-01');rec.days={'2026-12-01':{cards:1,correct:1,ms:1,steps:1,confirmed:0},'2027-01-15':{cards:1,correct:1,ms:1,steps:1,confirmed:100},'2027-01-30':{cards:1,correct:1,ms:1,steps:1,confirmed:170}};
  const p=sum(rec,3).pace.projection;                           // 100 on Jan 18 (14 days ago), 170 now: 5 a day, 299 to go
  assert.equal(p.perDay,5);assert.equal(p.perWeek,35);assert.equal(p.remaining,299);assert.equal(p.date,R.addDays(TODAY,60));assert.equal(p.byTarget,true);assert.equal(p.byMilestone,true);
  rec.days['2027-01-15'].confirmed=163;const slow=sum(rec,3).pace.projection;assert.equal(slow.perDay,.5);assert.equal(slow.date,R.addDays(TODAY,598));assert.equal(slow.byMilestone,false);
  rec.days['2027-01-15'].confirmed=170;assert.equal(sum(rec,3).pace.projection,null,'no growth, no projection');
  const done=sum(record(1,61,'2027-01-04'),1).pace.projection;assert.equal(done.date,TODAY);assert.equal(done.remaining,0);
});

// ---- groups
const student=(id,name,grade,classId,rec)=>R.summarize(rec,{id,name,grade,classId},{today:TODAY,target:'2027-03-23',graceDays:0});
const stuckOn=(rec,id,misses)=>{rec.facts[id]={stage:1,attempts:misses+1,misses,first:'2027-01-11',lastSuccess:null,failedDay:'2027-01-28',refresh:0};return rec;};
const group=[
  student('a','Ada B.',3,'c1',stuckOn(stuckOn(record(3,300,'2026-12-13'),'mul:7:8',5),'mul:6:7',1)),          // on pace
  student('b','Ben C.',3,'c1',stuckOn(record(3,200,'2026-12-13'),'mul:7:8',2)),                                 // behind
  student('c','Cora D.',3,'c1',stuckOn(stuckOn(record(3,20,'2026-12-13'),'mul:6:7',9),'div:56:7',4)),           // at risk
  student('d','Dev E.',3,'c2',record(3,0,null)),                                                               // not started
  student('e','Elle F.',1,'c3',record(1,61,'2026-12-13',{trophies:{add:'2027-01-20',sub:'2027-01-22',mixed:'2027-01-25'}})) // finished
];

test('aggregate: counts by pace status, median confirmed, participation, trophies and minutes',()=>{
  const a=R.aggregate(group);
  assert.deepEqual(a.pace,{finished:1,onPace:1,behind:1,atRisk:1,notStarted:1});assert.equal(a.students,5);assert.equal(a.started,4);assert.equal(a.onPace,2);assert.equal(a.onPacePercent,40);assert.equal(a.needSupport,2);
  assert.equal(a.medianPercent,R.median(group.map(s=>s.facts.percent)));assert.equal(a.medianPercent,42.6);
  assert.deepEqual(a.trophies,{earned:3,possible:23,percent:13});assert.equal(a.won,1);assert.equal(a.playedLast7,0);assert.equal(a.playedLast7Percent,0);
  assert.equal(a.confirmed,581);assert.equal(a.total,469*4+61);assert.equal(a.operations.mul.students,4);assert.equal(a.operations.add.students,5);
  const played=[student('x','X',3,'c',record(3,0,TODAY)),student('y','Y',3,'c',record(3,0,R.addDays(TODAY,-8))),student('z','Z',3,'c',record(3,0,null))];
  const p=R.aggregate(played);assert.equal(p.playedLast7,1);assert.equal(p.playedLast7Percent,33.3);assert.equal(p.minutesThisWeek,.3);assert.equal(p.avgMinutesThisWeek,.1,'averaged over every rostered student');assert.equal(p.avgMinutesLastWeek,.1);
  const empty=R.aggregate([]);assert.equal(empty.students,0);assert.equal(empty.medianPercent,null);assert.equal(empty.onPacePercent,0);assert.equal(empty.accuracyThisWeek,null);
  assert.deepEqual(R.groupBy(group,s=>s.student.classId).map(g=>[g.key,g.items.length]),[['c1',3],['c2',1],['c3',1]]);
  assert.deepEqual([...group].sort(R.byAttention).map(s=>s.student.id),['c','b','d','a','e'],'needs attention first');
});

test('most-missed facts: ordered by students stuck, then misses, with the small group for each',()=>{
  const facts=R.mostMissed(group,{limit:5});
  assert.deepEqual(facts.map(f=>[f.id,f.count,f.misses]),[['mul:6:7',2,10],['mul:7:8',2,7],['div:56:7',1,4]]);
  assert.deepEqual(facts[0].students.map(s=>[s.name,s.misses]),[['Cora D.',9],['Ada B.',1]]);
  assert.equal(facts[0].eligible,4,'grade 1 has no multiplication, so it is not counted');assert.equal(facts[0].share,.5);
  assert.deepEqual(facts[1].related,[{id:'div:56:7',text:'56 ÷ 7',count:1}]);
  assert.deepEqual(R.mostMissed(group,{minStudents:2}).map(f=>f.id),['mul:6:7','mul:7:8']);assert.deepEqual(R.mostMissed(group,{limit:1}).map(f=>f.id),['mul:6:7']);assert.deepEqual(R.mostMissed([]),[]);
  assert.deepEqual(R.relatedFacts('add:8:9'),['sub:17:8','sub:17:9']);assert.deepEqual(R.relatedFacts('sub:17:9'),['add:8:9','sub:17:8']);assert.deepEqual(R.relatedFacts('mul:6:6'),['div:36:6']);assert.equal(R.factLabel('div:56:7'),'56 ÷ 7');assert.equal(R.factAnswer('div:56:7'),8);
});

test('weekly series: confirmed total and practice per rolling week',()=>{
  const day=(n,ms,done)=>[R.addDays(TODAY,-n),{cards:10,correct:9,ms,steps:1,confirmed:done}];
  const one=student('a','A',1,'c',record(1,0,null,{days:Object.fromEntries([day(15,60000,10),day(8,120000,30),day(1,180000,61)])}));
  const two=student('b','B',1,'c',record(1,0,null));
  const weeks=R.weeklySeries([one,two],{today:TODAY,weeks:3});
  assert.deepEqual(weeks.map(w=>w.end),[R.addDays(TODAY,-14),R.addDays(TODAY,-7),TODAY]);assert.equal(weeks[2].start,R.addDays(TODAY,-6));
  assert.deepEqual(weeks.map(w=>w.minutes),[1,2,3]);assert.deepEqual(weeks.map(w=>w.minutesPerStudent),[.5,1,1.5]);assert.deepEqual(weeks.map(w=>w.activeStudents),[1,1,1]);
  assert.deepEqual(weeks.map(w=>w.confirmed),[10,30,61]);assert.deepEqual(weeks.map(w=>w.confirmedPercent),[8.2,24.6,50]);assert.equal(weeks[2].activePercent,50);
});

test('CSV export is spreadsheet-safe',()=>{
  assert.equal(R.csv([['=2+2','a"b','line\nb'],[-5,'12%','+cmd','@x']]),'"\'=2+2","a""b","line\nb"\r\n"-5","12%","\'+cmd","\'@x"');
});

console.log('PASS reporting summary: '+tests+' checks of fact totals, confirmation, stuck facts, checks, trophies, pace bands, grace, projection, time on task, aggregation, most-missed facts, weekly series and CSV');
