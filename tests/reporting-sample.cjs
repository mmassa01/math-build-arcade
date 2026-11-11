// The fictional sample district behind the report pages: the checked-in data file is what
// the generator produces, every record is a real engine record, and nothing in it looks real.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const practice=require('../dist/practice-pathways.js');
const R=require('../dist/reporting/summary.js');
const sample=require('../dist/reporting/sample.js');
const raw=require('../dist/reporting/sample-data.js');
const generator=require('../tools/generate-report-sample.cjs');
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}
const file=path.join(__dirname,'../dist/reporting/sample-data.js'),data=sample.load();
const options={today:data.today,milestone:data.milestone,target:data.target};
const summaries=data.students.map(s=>R.summarize(s.record,s.roster,options));

test('the sample is a small, clearly fictional district with one school per grade band',()=>{
  assert.equal(raw.fictional,true);assert.match(raw.notice,/invented/);assert.equal(raw.today,generator.TODAY);assert.equal(raw.milestone,'2027-05-10');assert.equal(raw.target,'2027-04-26');
  assert(fs.statSync(file).size<1500000,'sample data stays well under 2 MB');
  assert(data.students.length>=250&&data.students.length<=400,'district size is reasonable: '+data.students.length);
  assert.deepEqual(data.schools.map(s=>[s.band,s.grades[0],s.grades[s.grades.length-1]]),[['Elementary',1,5],['Middle',6,8],['High',9,12]]);
  for(const s of data.schools)assert.match(s.name,/^Example /);assert.match(data.district,/^Example /);
  for(let g=1;g<=12;g++){const n=data.classes.filter(c=>c.grade===g).length;assert(n>=2&&n<=3,'grade '+g+' has 2 or 3 classes');}
  assert.equal(new Set(data.students.map(s=>s.roster.id)).size,data.students.length);
  for(const c of data.classes){const names=data.students.filter(s=>s.roster.classId===c.id).map(s=>s.roster.name);assert(names.length>=8&&names.length<=16);assert.equal(new Set(names).size,names.length,'names are unique within '+c.id);}
  for(const s of data.students){assert.match(s.roster.name,/^[A-Z][a-z]+ [A-Z]\.$/,'first name and initial only');assert.deepEqual(Object.keys(s.roster).sort(),['band','classId','className','grade','id','name','school','schoolId','teacher']);}
  const text=fs.readFileSync(file,'utf8');assert(!/Todd Grant|McIntosh/i.test(text),'no real-looking school or district names');
});

test('the generator is deterministic and the checked-in file is its output',()=>{
  const {classes,students}=generator.roster(),again=generator.roster();
  assert.deepEqual(students,again.students);assert.deepEqual(classes,raw.classes);
  assert.deepEqual(students.map(s=>[s.id,s.name,s.classId]),raw.students.map(s=>s.slice(0,3)));
  // Replay a few students through the real engine (a never-started one, grade 1, grade 2 and the lightest grade 3+ record).
  const size=id=>raw.students.find(s=>s[0]===id)[3][1].length,lightest=list=>list.sort((a,b)=>size(a.id)-size(b.id))[0];
  const picks=[students.find(s=>s.start===null),lightest(students.filter(s=>s.grade===1&&s.start!==null)),lightest(students.filter(s=>s.grade===2&&s.start!==null)),lightest(students.filter(s=>s.grade>=3&&s.start!==null&&size(s.id)>600))];
  for(const spec of picks){
    const first=generator.packed(spec),second=generator.packed(spec);
    assert.deepEqual(first,second,'same seed, same record: '+spec.id);
    assert.deepEqual(first,raw.students.find(s=>s[0]===spec.id),'checked-in record matches the generator for '+spec.id+' (run node tools/generate-report-sample.cjs)');
    const record=generator.simulate(spec);assert.deepEqual(sample.unpack(sample.pack(record,spec.grade,raw.base),spec.grade,raw.base,spec.id).facts,record.facts,'packing loses nothing');
  }
});

test('packing round-trips every student',()=>{
  for(const [id,,classId,packed]of raw.students){const grade=raw.classes.find(c=>c.id===classId).grade;assert.deepEqual(sample.pack(sample.unpack(packed,grade,raw.base,id),grade,raw.base),packed);}
});

test('every record loads cleanly into the real engine and agrees with it',()=>{
  const [y,m,d]=data.today.split('-').map(Number),now=new Date(y,m-1,d,23,0,0).getTime();
  data.students.forEach((s,i)=>{
    const record=s.record,info=R.gradeInfo(s.roster.grade),summary=summaries[i],who=s.roster.id;
    assert.equal(record.version,2);assert.equal(record.grade,s.roster.grade);assert(info.pathways.includes(record.pathway));
    // The hosting server drops per-answer responses; the engine expects the (empty) list when a record comes back.
    const stored=JSON.stringify({...record,checks:record.checks.map(c=>({...c,responses:[]}))});
    const engine=practice.create({getItem:k=>k==='mathArcadePathways.v2'?stored:null,setItem(){}},()=>now);
    assert.equal(engine.getGrade(),s.roster.grade);
    const progress=engine.progress(),after=engine.exportRecord();
    assert.deepEqual(after.facts,record.facts,who);assert.deepEqual(after.days,record.days,who);assert.equal(after.checks.length,record.checks.length,who);
    assert.deepEqual(after.trophies,record.trophies,'loading awards nothing new: '+who);
    for(const p of progress){
      if(p.id!=='mixed'){assert.equal(summary.operations[p.id].confirmed,p.mastered,who+' '+p.id);assert.equal(summary.operations[p.id].total,p.total);assert.equal(summary.operations[p.id].steps,p.milestones);}
      else{assert.equal(summary.facts.confirmed,p.mastered,who);assert.equal(summary.facts.total,p.total);}
      assert.equal(summary.checks.byPathway[p.id].passes,p.checks.passes,who+' '+p.id);assert.equal(summary.checks.byPathway[p.id].complete,p.checks.complete);
      assert.equal(!!summary.trophies.earned.find(t=>t.pathway===p.id),!!p.earned);
    }
    // the record's own invariants
    const days=Object.keys(record.days).sort();
    for(const id of Object.keys(record.facts)){const f=record.facts[id];assert(info.index.has(id),who+' has only its grade’s facts');assert(f.attempts>=1&&f.misses<=f.attempts&&f.stage>=0&&f.stage<=3);assert(days.includes(f.first));if(f.lastSuccess)assert(f.first<=f.lastSuccess);if(f.refresh)assert.equal(f.stage,3);}
    let cards=0;for(const day of days){const v=record.days[day];assert(day>=raw.base&&day<=data.today&&generator.schoolDay(day),who+' plays on school days only');assert(v.correct<=v.cards&&v.steps<=v.correct&&v.ms<=v.cards*3000&&v.confirmed<=info.total);cards+=v.cards;}
    assert.equal(cards,Object.values(record.facts).reduce((n,f)=>n+f.attempts,0),'every card is in the daily log: '+who);
    if(days.length)assert.equal(record.days[days[days.length-1]].confirmed,summary.facts.confirmed,'the last daily line carries the confirmed total: '+who);
    const seen=new Set();for(const c of record.checks){assert(days.includes(c.day)&&info.pathways.includes(c.pathway)&&!seen.has(c.pathway+c.day),'one official check per pathway per day: '+who);seen.add(c.pathway+c.day);
      assert.equal(c.passed,c.correct>=30&&c.accuracy>=.95&&c.balanced);assert(!('responses' in c));for(const id of c.missed)assert(info.index.has(id));}
    for(const [p,day]of Object.entries(record.trophies))assert(info.pathways.includes(p)&&days.includes(day));
  });
});

test('the sample gives every report something to show',()=>{
  const all=R.aggregate(summaries);
  for(const p of R.PACE)assert(all.pace[p.key]>=3,'some students are '+p.label+': '+all.pace[p.key]);
  assert(all.won>=3&&all.won===all.pace.finished);assert(all.playedLast7Percent>50&&all.playedLast7Percent<100);
  assert(summaries.some(s=>s.pace.grace),'someone is in their first three days');assert(summaries.some(s=>s.activity.daysSinceLast>7),'someone has stopped playing');
  assert(summaries.some(s=>s.grade<=2&&s.trophies.won&&s.trophies.possible===3)&&summaries.some(s=>s.grade>=3&&s.trophies.won&&s.trophies.possible===5));
  for(const g of R.groupBy(summaries,s=>s.student.classId)){
    const top=R.mostMissed(g.items,{limit:1})[0];assert(top&&top.count>=2,'class '+g.key+' has a shared fact to teach next');
    if(g.items[0].grade<=2)for(const s of g.items)assert.deepEqual(s.operationList,['add','sub']);
  }
  const weeks=R.weeklySeries(summaries,{today:data.today,weeks:10});assert(weeks[9].confirmedPercent>weeks[4].confirmedPercent&&weeks[4].confirmedPercent>weeks[0].confirmedPercent,'growth over time');
});

console.log('PASS reporting sample: '+tests+' checks over '+data.students.length+' invented students in '+data.classes.length+' classes (deterministic generator, lossless packing, engine-valid records, varied outcomes)');
