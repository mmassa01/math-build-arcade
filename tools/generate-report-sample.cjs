// Generates the FICTIONAL district behind the report pages (dist/reporting/sample-data.js).
//
//   node tools/generate-report-sample.cjs          rewrite dist/reporting/sample-data.js
//   node tools/generate-report-sample.cjs --check  exit 1 if the checked-in file is stale
//
// Every student is invented. Each record is produced by actually playing the real practice
// engine (dist/practice-pathways.js) day by day on a simulated calendar with a seeded
// random source, so the reports are exercised by exactly what the game records. The same
// seed always gives the same file. tests/reporting-sample.cjs replays a few students and
// compares them with the checked-in file.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const practice=require('../dist/practice-pathways.js');
const reporting=require('../dist/reporting/summary.js');
const codec=require('../dist/reporting/sample.js');

const VERSION=1,SEED=20270201;
const BASE='2026-11-23';          // first possible day of practice (day 0 of the packed dates)
const TODAY='2027-02-01';         // the fixed "today" of the sample
const OUT=path.join(__dirname,'..','dist','reporting','sample-data.js');
const NO_SCHOOL=[['2026-11-26','2026-11-27'],['2026-12-21','2027-01-01'],['2027-01-18','2027-01-18']];

// ---- deterministic randomness
function mulberry(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const between=(r,lo,hi)=>lo+(hi-lo)*r();
const chance=(r,p)=>r()<p;
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
function sample(r,list,n){const pool=[...list],out=[];while(out.length<n&&pool.length)out.push(pool.splice(Math.floor(r()*pool.length),1)[0]);return out;}

// ---- the fictional district
const DISTRICT='Example School District';
const SCHOOLS=[
  {id:'elem',name:'Example Elementary',band:'Elementary',grades:[1,2,3,4,5]},
  {id:'mid',name:'Example Middle School',band:'Middle',grades:[6,7,8]},
  {id:'high',name:'Example High School',band:'High',grades:[9,10,11,12]}
];
const TEACHERS=['Ms. Alder','Mr. Birch','Ms. Cedar','Mr. Dune','Ms. Ember','Mr. Fern','Ms. Grove','Mr. Harbor','Ms. Iris','Mr. Juniper','Ms. Kestrel','Mr. Lark','Ms. Maple','Mr. North','Ms. Opal','Mr. Pine','Ms. Quill','Mr. Reed','Ms. Sage','Mr. Tide','Ms. Umber','Mr. Vale','Ms. Wren','Mr. Yarrow','Ms. Zinnia','Mr. Aspen'];
const FIRST=['Ada','Ben','Cora','Dev','Elle','Finn','Gia','Hugo','Ines','Jude','Kai','Lena','Milo','Nia','Omar','Pia','Quin','Rae','Sam','Tess','Uri','Vera','Wes','Xena','Yuri','Zoe','Abel','Bree','Cruz','Dara','Eli','Faye','Gus','Hana','Ivo','Jade','Kit','Lux','Mara','Ned','Oona','Paz','Remy','Suri','Theo','Uma','Vik','Wynn','Yara','Zane','Arlo','Bea','Cy','Dot','Ezra','Flo','Gray','Hope','Ike','Joss'];
const INITIALS='ABCDEFGHJKLMNPRSTVW';
// How each class is doing overall (so class-by-class comparison has something to show) and when it began.
const CLASS_SHAPES=[{lift:.08,start:0},{lift:0,start:5},{lift:-.1,start:10},{lift:.04,start:0},{lift:-.04,start:15},{lift:.1,start:5},{lift:-.14,start:30},{lift:0,start:0}];
// Facts a class tends to trip on: drawn from the harder end of the grade's bank.
function hardFacts(grade,r){
  const facts=reporting.gradeInfo(grade).facts;
  const tough=facts.filter(f=>grade===1?(f.op==='add'?f.answer>=8:f.a>=8&&f.b>=3):grade===2?(f.op==='add'?f.answer>=13&&f.a>=5:f.a>=13&&f.b>=5&&f.answer>=4):(f.op==='mul'?f.a>=6&&f.b<=(grade<=5?9:12):f.op==='div'?f.b>=6&&f.answer>=6&&(grade>5||f.b<=9&&f.answer<=9):f.op==='sub'?f.a>=13&&f.b>=6&&f.answer>=5:f.answer>=14&&f.a>=6));
  // Addition first (every student meets it), then subtraction, then multiplication and division when the grade has them.
  const of=(...ops)=>tough.filter(f=>ops.includes(f.op)),late=of('mul','div');
  return[...sample(r,of('add'),2),...sample(r,of('sub'),late.length?2:3),...sample(r,late,2)].map(f=>f.id);
}
function roster(){
  const r=mulberry(SEED),classes=[],students=[];let teacher=0,shape=0;
  for(const school of SCHOOLS)for(const grade of school.grades){
    const sections=grade===3||grade===4?3:2;
    for(let s=0;s<sections;s++){
      const id='g'+grade+String.fromCharCode(97+s),form=CLASS_SHAPES[shape++%CLASS_SHAPES.length],size=10+Math.floor(r()*4),hard=hardFacts(grade,r);
      const cls={id,school:school.id,grade,name:'Grade '+grade+' · Section '+String.fromCharCode(65+s),teacher:TEACHERS[teacher++%TEACHERS.length]};
      classes.push(cls);
      const names=new Set();
      for(let n=0;n<size;n++){
        let name;do{name=FIRST[Math.floor(r()*FIRST.length)]+' '+INITIALS[Math.floor(r()*INITIALS.length)]+'.';}while(names.has(name));names.add(name);
        const sid='s'+String(students.length+1).padStart(4,'0'),roll=r(),star=chance(r,.07);   // a star practises daily and rarely slips
        const kind=star||roll<.24?'strong':roll<.72?'typical':'struggling';
        const skill=star?.97:clamp((kind==='strong'?between(r,.82,.95):kind==='typical'?between(r,.6,.8):between(r,.5,.68))+form.lift,.3,.97);
        const fate=r();
        students.push({id:sid,name,classId:id,grade,seed:hash(SEED+':'+sid),kind,star,skill,
          speed:kind==='strong'?between(r,1000,1400):kind==='typical'?between(r,1300,1800):between(r,1700,2300),
          minutes:star?between(r,5,6.5):kind==='strong'?between(r,2.6,4.6):kind==='typical'?between(r,1.8,3.4):between(r,2.2,3.8),   // answer time per day played
          attendance:star?.96:kind==='strong'?between(r,.6,.92):kind==='typical'?between(r,.42,.82):between(r,.3,.65),
          start:star?form.start:fate<.05?null:fate<.1?reporting.dayDiff(BASE,TODAY)-[0,0,0,3][Math.floor(r()*4)]:form.start+Math.floor(r()*8), // never started · started this week · the class's start
          lapsed:!star&&fate>.93?8+Math.floor(r()*14):0,                                                                    // stopped playing this many days ago
          mixedOnly:chance(r,.12)&&!star,
          blocked:hard.filter(()=>chance(r,.7)&&!star)});
      }
    }
  }
  return{classes,students};
}

// ---- one invented student, played day by day through the real engine
function difficulty(q){
  if(q.op==='add')return clamp((q.answer-4)/16,0,1);
  if(q.op==='sub')return clamp((q.a-4)/16,0,1);
  const x=q.op==='mul'?q.a:q.b,y=q.op==='mul'?q.b:q.answer;
  return clamp((x+y)/26+(x>=6&&x<=9&&y>=6&&y<=9?.25:0)+(q.op==='div'?.08:0),0,1);
}
function schoolDay(day){const dow=new Date(day+'T00:00:00Z').getUTCDay();return dow>=1&&dow<=5&&!NO_SCHOOL.some(([a,b])=>day>=a&&day<=b);}
function simulate(spec){
  const r=mulberry(spec.seed);let now=0;
  const engine=practice.create(null,()=>now,r);engine.setGrade(spec.grade);
  const ops=engine.operations,blocked=new Set(spec.blocked),seenDays=new Map(),last=reporting.dayDiff(BASE,TODAY)-spec.lapsed;
  const slip=spec.star?.0012:spec.kind==='strong'?.004:spec.kind==='typical'?.012:.035;   // chance of fumbling a fact the student knows well
  if(spec.start!==null)for(let offset=spec.start;offset<=last;offset++){
    const day=reporting.addDays(BASE,offset);
    if(!schoolDay(day)||!chance(r,offset===spec.start?1:day===TODAY?spec.attendance*.6:spec.attendance))continue;
    const [y,m,d]=day.split('-').map(Number);now=new Date(y,m-1,d,9,0,0).getTime();
    // Today's plan: a quick check in any operation that only needs check days, then work through
    // what is due in each operation still being learned; some students only ever play Mixed.
    const progress=Object.fromEntries(engine.progress().map(p=>[p.id,p])),open=ops.filter(op=>!progress[op].earned),plan=[];
    if(spec.mixedOnly||!open.length)plan.push({pathway:'mixed',cap:Infinity});
    else{
      const waiting=open.filter(op=>progress[op].mastered===progress[op].total);
      if(waiting.length&&chance(r,spec.star?1:spec.kind==='strong'?.8:spec.kind==='typical'?.45:.15))for(const op of sample(r,waiting,spec.star?3:spec.kind==='strong'?2:1))plan.push({pathway:op,cap:100000});
      if(progress.mixed.mastered>=progress.mixed.total/2&&!progress.mixed.checks.complete&&chance(r,spec.star?.9:.4))plan.push({pathway:'mixed',cap:100000});
      for(const op of open)if(progress[op].mastered<progress[op].total)plan.push({pathway:op,cap:Infinity,untilClear:true});
    }
    let left=spec.minutes*between(r,.6,1.4)*60000;const repeats=new Map(),today=new Set();
    for(const step of plan){
      if(left<=0)break;
      engine.setPathway(step.pathway);const run=engine.begin({endless:true});let used=0;
      while(left>0&&used<step.cap){
        const q=run.next();if(!q)break;
        if(!today.has(q.id)){today.add(q.id);seenDays.set(q.id,(seenDays.get(q.id)||0)+1);}
        const days=seenDays.get(q.id)-1,again=repeats.get(q.id)||0;repeats.set(q.id,again+1);
        const p=blocked.has(q.id)?clamp(.05+.04*days+.3*again,.03,.9):clamp(.22+spec.skill*.78-(1-spec.skill)*.6*difficulty(q)+.08*days+.3*again,.05,1-slip*(days>=4?1:3));
        let ms,correct=true,opts={};
        if(chance(r,p))ms=Math.round(clamp(spec.speed*between(r,.6,1.4),500,2950));
        else if(chance(r,.55)){correct=false;ms=Math.round(clamp(spec.speed*between(r,.8,1.7),600,2990));}
        else{correct=false;ms=3000;opts={timeout:true};}
        run.shown(q);now+=ms;const result=run.record(q,correct,ms,opts);now+=450;left-=ms;used+=ms;
        if(step.untilClear&&result.summary.remaining===0)break;
      }
    }
  }
  const record=engine.exportRecord();
  return{version:2,grade:record.grade,pathway:record.pathway,facts:record.facts,checks:record.checks.map(({responses,...check})=>check),trophies:record.trophies,activity:{},gameChecks:{},days:record.days};
}

const packed=spec=>[spec.id,spec.name,spec.classId,codec.pack(simulate(spec),spec.grade,BASE)];
// Students are independent, so they are simulated on every core; the result does not depend on how many.
async function generate(){
  const {classes,students}=roster(),{Worker}=require('node:worker_threads'),count=Math.max(1,Math.min(students.length,require('node:os').cpus().length-1||1)),rows=new Array(students.length);
  await Promise.all(Array.from({length:count},(_,w)=>new Promise((resolve,reject)=>{
    const worker=new Worker(__filename,{workerData:{indexes:students.map((_,i)=>i).filter(i=>i%count===w)}});
    worker.on('message',([i,row])=>{rows[i]=row;});worker.on('error',reject);worker.on('exit',code=>code?reject(new Error('Worker stopped with code '+code)):resolve());
  })));
  return{version:VERSION,fictional:true,notice:'Sample data. Every school, class, teacher and student here is invented.',seed:SEED,base:BASE,today:TODAY,milestone:reporting.DEFAULTS.milestone,target:reporting.DEFAULTS.target,district:DISTRICT,schools:SCHOOLS,classes,students:rows};
}
function render(data){
  const body=JSON.stringify(data).replace(/\],\["s/g,'],\n["s');
  return'// GENERATED by tools/generate-report-sample.cjs — do not edit by hand.\n// FICTIONAL sample data: every school, class, teacher and student is invented.\n(function(root,data){if(typeof module===\'object\'&&module.exports)module.exports=data;else root.ArcadeReportingSampleData=data;})(typeof window!==\'undefined\'?window:this,\n'+body+'\n);\n';
}
module.exports={VERSION,SEED,BASE,TODAY,roster,simulate,packed,generate,render,schoolDay};

const threads=require('node:worker_threads');
if(!threads.isMainThread&&threads.workerData&&threads.workerData.indexes){
  const {students}=roster();for(const i of threads.workerData.indexes)threads.parentPort.postMessage([i,packed(students[i])]);
}else if(require.main===module){
  const started=Date.now();
  generate().then(data=>{
    const text=render(data);
    if(process.argv.includes('--check')){const same=fs.existsSync(OUT)&&fs.readFileSync(OUT,'utf8').split(String.fromCharCode(13)).join(String())===text;console.log(same?'Sample data is up to date':'Sample data is STALE: run node tools/generate-report-sample.cjs');process.exitCode=same?0:1;}
    else{fs.writeFileSync(OUT,text);console.log('Wrote '+path.relative(process.cwd(),OUT)+' ('+Math.round(text.length/1024)+' KB, '+data.students.length+' students) in '+((Date.now()-started)/1000).toFixed(1)+' s');}
  });
}
