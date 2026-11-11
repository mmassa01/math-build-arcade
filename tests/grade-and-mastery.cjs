// Grade-matched fact sets, three-attempt mastery, and the hooks a hosting
// platform uses to supply storage and the student's grade.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const factory=require('../dist/practice-pathways.js').create;
const BASE=new Date(2026,10,10,9).getTime(),DAY=86400000;
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}
function learner(grade,data=new Map()){
  let now=BASE;
  const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const api=factory(storage,()=>now,()=>.47);
  if(grade)api.setGrade(grade);
  return{api,data,storage,setDay:n=>{now=BASE+n*DAY;},advance:ms=>{now+=ms;},clock:()=>now};
}
function clearDay(l,pathway='mixed'){l.api.setPathway(pathway);const run=l.api.begin();let q,n=0;while((q=run.next())&&n++<700)run.record(q,true,1000);return n;}
function passCheck(l,pathway,day){l.setDay(day);l.api.setPathway(pathway);const run=l.api.begin({endless:true});let n=0;while(!l.api.checkStatus().official&&n++<200){const q=run.next();l.advance(1500);run.record(q,true,1500);}return l.api.checkStatus().official;}

test('grade 1 practises addition and subtraction within 10 only',()=>{
  const l=learner(1);
  assert.deepEqual(l.api.pathways,['add','sub','mixed']);
  const bank=l.api.getBank('mixed');
  assert(bank.length>0&&bank.every(q=>['add','sub'].includes(q.op)));
  assert(bank.every(q=>q.op==='add'?q.a+q.b<=10:q.a<=10),'nothing above 10');
  assert(bank.every(q=>q.b>=2&&(q.op==='sub'||q.a>=2)),'still no 0 or 1 cards');
  assert.equal(l.api.progress().length,3);
});

test('grade 2 practises addition and subtraction within 20; grade 3 and up get all four through 12',()=>{
  const two=learner(2).api.getBank('mixed');
  assert(two.every(q=>['add','sub'].includes(q.op))&&two.some(q=>q.op==='add'&&q.a+q.b===20)&&two.some(q=>q.op==='sub'&&q.a===20));
  for(const grade of [3,7,12]){
    const l=learner(grade);
    assert.deepEqual(l.api.pathways,['add','sub','mul','div','mixed']);
    assert.equal(l.api.getBank('mixed').length,469);
    assert(l.api.getBank('mul').some(q=>q.text==='12 × 12'),'11s and 12s start in grade 3');
  }
  assert.equal(learner().api.getGrade(),3,'with no grade set, all four operations are open');
});

test('a grade 1 or 2 student only ever sees their grade’s cards, in games and in mixed',()=>{
  for(const grade of [1,2]){
    const l=learner(grade);
    for(const pathway of l.api.pathways){
      l.api.setPathway(pathway);const run=l.api.begin({endless:true});
      for(let i=0;i<150;i++){const q=run.next();assert(q);assert(['add','sub'].includes(q.op));if(grade===1)assert(q.op==='add'?q.a+q.b<=10:q.a<=10,q.text);run.record(q,true,900);}
    }
    assert.throws(()=>l.api.setPathway('mul'),RangeError);
  }
});

test('changing grade keeps earlier progress and an out-of-grade pathway falls back to mixed',()=>{
  const l=learner(3);l.api.setPathway('mul');clearDay(l,'mul');
  const record=l.api.exportRecord();
  l.api.setGrade(1);
  assert.equal(l.api.getPathway(),'mixed');
  assert.deepEqual(l.api.exportRecord().facts,record.facts,'nothing is deleted');
  l.api.setGrade(4);assert.equal(l.api.progress().find(p=>p.id==='mul').practicePercent,33);
  assert.equal(learner(null,l.data).api.getGrade(),4,'the grade is remembered');
  for(const bad of [0,13,2.5,'x',null])l.api.setGrade(bad);
  assert.equal(l.api.getGrade(),4,'invalid grades are ignored');
});

test('three right answers on three different days confirm a fact',()=>{
  const l=learner(3);
  for(const [day,percent]of [[0,33],[1,66],[2,100]]){l.setDay(day);clearDay(l);assert(l.api.progress().every(p=>p.practicePercent===percent),'day '+day);}
  assert(l.api.progress().every(p=>p.mastered===p.total));
  const again=learner(3);again.setDay(0);clearDay(again);clearDay(again);clearDay(again);
  assert(again.api.progress().every(p=>p.mastered===0),'three answers in one day confirm nothing');
  assert.deepEqual(l.api.rules.intervals,[1,1,14]);assert.equal(l.api.rules.confirmations,3);
});

test('a fact saved under the old four-attempt rule is never moved backwards',()=>{
  const key='mathArcadePathways.v2';
  const data=new Map([[key,JSON.stringify({version:2,pathway:'add',facts:{'add:2:5':{stage:4,lastSuccess:'2026-10-01',due:'2026-10-15',attempts:9},'add:3:5':{stage:3,lastSuccess:'2026-11-01',due:'2026-11-08',attempts:5}},checks:[],trophies:{}})]]);
  const l=learner(3,data);
  assert.equal(l.api.progress().find(p=>p.id==='add').mastered,2,'three or more attempts count as confirmed');
  l.api.setPathway('add');const run=l.api.begin({endless:true});
  for(let i=0;i<120;i++){const q=run.next();run.record(q,true,900);}
  const facts=l.api.exportRecord().facts;
  assert.equal(facts['add:2:5'].stage,4);assert.equal(facts['add:3:5'].stage,3);
});

test('a grade 2 student wins with addition, subtraction and the mixed final step',()=>{
  const l=learner(2);
  for(const day of [0,1,2]){l.setDay(day);clearDay(l);}
  for(const day of [3,4,10])for(const pathway of ['add','sub'])assert(passCheck(l,pathway,day).passed);
  let earned=l.api.progress().filter(p=>p.earned).map(p=>p.id);
  assert.deepEqual(earned,['add','sub']);
  const mixed=l.api.progress().find(p=>p.id==='mixed');assert.equal(mixed.operationTrophies,2);assert.equal(mixed.operationCount,2);
  for(const day of [11,12,18]){const check=passCheck(l,'mixed',day);assert(check.passed&&check.balanced);assert.deepEqual(Object.keys(check.byOperation),['add','sub']);}
  assert.deepEqual(l.api.progress().filter(p=>p.earned).map(p=>p.id),['add','sub','mixed'],'every trophy for the grade: the game is won');
});

test('in-game check answers carry the value a server needs to re-score them',()=>{
  const l=learner(3);l.api.setPathway('add');const run=l.api.begin({endless:true});
  for(let i=0;i<70&&!l.api.checkStatus().official;i++){const q=run.next();l.advance(1400);const miss=i===4,late=i===9;run.record(q,!miss&&!late,late?3000:1400,{timeout:late});}
  const check=l.api.checkStatus().official;assert(check);
  const bank=new Map(l.api.getBank('add').map(q=>[q.id,q]));
  for(const r of check.responses){
    assert(r.value===null||Number.isInteger(r.value));
    assert.equal(r.correct,r.value===bank.get(r.id).answer,'correct exactly when the stored value is the answer');
  }
  assert.equal(check.duration,90000);assert.equal(check.rulesVersion,'pilot-1');
});

test('a hosting platform can supply storage and a locked grade; standalone uses the browser',()=>{
  const source=fs.readFileSync('dist/practice-pathways.js','utf8');
  const run=(globals)=>{const window={...globals};vm.runInNewContext(source,{window,Date,Math,JSON,Number,String,Object,Map,Set,Array,RangeError,module:undefined});return window;};
  const platformData=new Map(),browserData=new Map();
  const store=data=>({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)});
  const hosted=run({ArcadeStorage:store(platformData),localStorage:store(browserData),ArcadeGrade:1});
  assert.equal(hosted.ArcadePractice.getGrade(),1);assert.equal(hosted.ArcadePractice.gradeLocked,true);
  hosted.ArcadePractice.setGrade(9);assert.equal(hosted.ArcadePractice.getGrade(),1,'a student cannot change a platform grade');
  hosted.ArcadePractice.setPathway('sub');
  assert(platformData.has('mathArcadePathways.v2')&&!browserData.has('mathArcadePathways.v2'),'saved to the platform, not the browser');
  assert.equal(run({localStorage:store(new Map()),ArcadeGrade:'2'}).ArcadePractice.getGrade(),2,'a grade passed as text is accepted');
  const alone=run({localStorage:store(browserData)});
  assert.equal(alone.ArcadePractice.gradeLocked,false);alone.ArcadePractice.setGrade(5);
  assert(browserData.has('mathArcadePathways.v2'),'standalone saves in the browser');
  assert(fs.readFileSync('dist/economy.js','utf8').includes('root.ArcadeStorage || root.localStorage'));
  assert(fs.readFileSync('dist/round-timer.js','utf8').includes('window.ArcadeStorage||parent.ArcadeStorage||localStorage'));
});

test('the landing page offers a grade picker that hides when the platform sets the grade',()=>{
  const page=fs.readFileSync('dist/index.html','utf8'),ui=fs.readFileSync('dist/pathway-ui.js','utf8');
  assert(page.includes('id="gradeSelect"'));
  assert(!/[Ff]ive (pathways|trophies|fluency)/.test(page),'no fixed count of pathways in the page copy');
  assert(ui.includes("$('gradePick').hidden=P.gradeLocked")&&ui.includes('P.setGrade(Number(pick.value))'));
  assert(ui.includes("' of '+paths.length+' trophies earned'"));
});

console.log('PASS grade and mastery: '+tests+' checks');
