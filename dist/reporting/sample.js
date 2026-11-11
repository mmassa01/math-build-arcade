// FICTIONAL sample district for the report pages.
//
// sample-data.js holds invented students whose records were produced by driving the real
// practice engine (tools/generate-report-sample.cjs). To keep that file small, each record
// is packed into short strings; this module packs and unpacks them without loss. Unpacked,
// a record has exactly the shape of ArcadePractice.exportRecord() as a hosting server
// would keep it (no per-answer `responses`). Nothing here reads or writes browser storage.
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./summary.js'),()=>require('./sample-data.js'));
  else root.ArcadeReportingSample=factory(root.ArcadeReporting,()=>root.ArcadeReportingSampleData);
})(typeof window!=='undefined'?window:this,function(reporting,source){
  'use strict';
  // 91 printable characters (no quote, no backslash): one character holds 0–90.
  const ALPHABET=Array.from({length:92},(_,i)=>String.fromCharCode(35+i)).filter(c=>c!=='\\').join(''),BASE=ALPHABET.length,VALUE=new Map([...ALPHABET].map((c,i)=>[c,i])),UNTOUCHED='!';
  function put(value,width){let v=Math.round(Number(value)||0),out='';if(v<0||v>=Math.pow(BASE,width))throw new RangeError('Value '+value+' does not fit '+width+' characters');for(let i=0;i<width;i++){out=ALPHABET[v%BASE]+out;v=Math.floor(v/BASE);}return out;}
  function reader(text){let i=0;return{get more(){return i<text.length;},peek:()=>text[i],skip(){i++;},take(width){let v=0;for(let k=0;k<width;k++){const d=VALUE.get(text[i++]);if(d===undefined)throw new RangeError('Bad sample data');v=v*BASE+d;}return v;}};}
  const putDay=(day,base)=>{if(!day)return put(0,1);const n=reporting.dayDiff(base,day)+1;if(n<1)throw new RangeError('Day '+day+' is before the sample base day');return put(n,1);};
  const takeDay=(r,base)=>{const n=r.take(1);return n?reporting.addDays(base,n-1):null;};

  function pack(record,grade,base){
    const info=reporting.gradeInfo(grade),facts=record.facts||{};let f='',c='',d='',t='';
    for(const fact of info.facts){const v=facts[fact.id];if(!v){f+=UNTOUCHED;continue;}
      f+=put(v.stage*3+(v.refresh||0),1)+put(v.attempts,2)+put(v.misses,2)+putDay(v.first,base)+putDay(v.lastSuccess,base)+putDay(v.failedDay,base)+putDay(v.cleared,base)+putDay(v.due,base);}
    for(const check of record.checks||[]){
      c+=putDay(check.day,base)+put(info.pathways.indexOf(check.pathway),1)+put((check.passed?1:0)+(check.balanced?2:0),1);
      for(const op of info.operations)c+=put(check.byOperation[op].attempts,2)+put(check.byOperation[op].correct,2);
      c+=put(check.missed.length,1);for(const id of check.missed)c+=put(info.index.get(id),2);}
    for(const day of Object.keys(record.days||{}).sort()){const v=record.days[day];d+=putDay(day,base)+put(v.cards,2)+put(v.correct,2)+put(v.ms,4)+put(v.steps,2)+put(v.confirmed,2);}
    for(const p of info.pathways)t+=putDay((record.trophies||{})[p]||null,base);
    return[info.pathways.indexOf(record.pathway),f,c,d,t];
  }
  function unpack(packed,grade,base,owner){
    const info=reporting.gradeInfo(grade),[pathway,f,c,d,t]=packed,record={version:2,grade:info.grade,pathway:info.pathways[pathway]||'mixed',facts:{},checks:[],trophies:{},activity:{},gameChecks:{},days:{}};
    let r=reader(f||'');
    for(const fact of info.facts){if(!r.more)break;if(r.peek()===UNTOUCHED){r.skip();continue;}
      const state=r.take(1),attempts=r.take(2),misses=r.take(2),first=takeDay(r,base),lastSuccess=takeDay(r,base),failedDay=takeDay(r,base),cleared=takeDay(r,base),due=takeDay(r,base);
      record.facts[fact.id]={stage:Math.floor(state/3),lastSuccess,cleared,due,failedDay,refresh:state%3,attempts,misses,first};}
    r=reader(c||'');
    while(r.more){
      const day=takeDay(r,base),p=info.pathways[r.take(1)],flags=r.take(1),byOperation={};let correct=0,attempts=0;
      for(const op of info.operations){const n=r.take(2),ok=r.take(2);byOperation[op]={attempts:n,correct:ok,accuracy:n?ok/n:0};attempts+=n;correct+=ok;}
      const missed=[];for(let n=r.take(1);n>0;n--)missed.push(info.facts[r.take(2)].id);
      record.checks.push({id:'check:sample:'+(owner||'student')+':'+p+':'+day,rulesVersion:info.rules.version,source:'game',pathway:p,day,duration:info.rules.seconds*1000,valid:true,official:true,demo:false,correct,attempts,accuracy:attempts?correct/attempts:0,balanced:!!(flags&2),passed:!!(flags&1),byOperation,missed});}
    r=reader(d||'');
    while(r.more){const day=takeDay(r,base);record.days[day]={cards:r.take(2),correct:r.take(2),ms:r.take(4),steps:r.take(2),confirmed:r.take(2)};}
    r=reader(t||'');
    for(const p of info.pathways){if(!r.more)break;const day=takeDay(r,base);if(day)record.trophies[p]=day;}
    return record;
  }

  // The whole fictional district: roster rows joined to unpacked records.
  let cached=null;
  function load(data){
    const raw=data||source();if(!raw)throw new Error('Sample data file is missing');
    if(!data&&cached)return cached;
    const schools=new Map(raw.schools.map(s=>[s.id,s])),classes=raw.classes.map(c=>({...c,schoolName:schools.get(c.school).name,band:schools.get(c.school).band})),byClass=new Map(classes.map(c=>[c.id,c]));
    const students=raw.students.map(([id,name,classId,packed])=>{const cls=byClass.get(classId);
      return{roster:{id,name,grade:cls.grade,school:cls.schoolName,schoolId:cls.school,band:cls.band,classId,className:cls.name,teacher:cls.teacher},record:unpack(packed,cls.grade,raw.base,id)};});
    const out={fictional:true,notice:raw.notice,version:raw.version,today:raw.today,milestone:raw.milestone,target:raw.target,district:raw.district,schools:raw.schools,classes,students};
    if(!data)cached=out;return out;
  }
  return{pack,unpack,load};
});
