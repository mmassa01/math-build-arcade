// Reporting summary for Math Build Arcade.
//
// Turns ONE student's stored practice record (the JSON that ArcadePractice.exportRecord()
// returns and a hosting server keeps) plus the platform's roster row into the summary
// the teacher and district report pages render, and aggregates summaries for a class,
// grade, school or district. It has no dependencies other than the practice engine,
// which it asks for each grade's fact bank and rules so the two can never disagree.
// It never touches browser storage. See dist/educators/integration.md.
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../practice-pathways.js'));
  else root.ArcadeReporting=factory(root.ArcadePractice);
})(typeof window!=='undefined'?window:this,function(practice){
  'use strict';
  if(!practice||typeof practice.create!=='function')throw new Error('ArcadeReporting needs the practice engine (practice-pathways.js) to be loaded first');

  const DEFAULTS=Object.freeze({milestone:'2027-05-10',target:'2027-04-26',onPaceRatio:.9,behindRatio:.6,graceDays:3,projectionDays:14,weeks:10});
  const PACE=Object.freeze([
    Object.freeze({key:'finished',label:'Finished',meaning:'Won the game: every trophy for the grade is earned.'}),
    Object.freeze({key:'onPace',label:'On pace',meaning:'Confirmed at least 90% of the facts expected by today.'}),
    Object.freeze({key:'behind',label:'Behind',meaning:'Confirmed 60–90% of the facts expected by today.'}),
    Object.freeze({key:'atRisk',label:'At risk',meaning:'Confirmed less than 60% of the facts expected by today.'}),
    Object.freeze({key:'notStarted',label:'Not started',meaning:'No day of practice has been recorded.'})
  ]);
  const PACE_LABEL=Object.freeze(Object.fromEntries(PACE.map(p=>[p.key,p.label])));
  // Needs attention first.
  const ATTENTION=Object.freeze({atRisk:0,behind:1,notStarted:2,onPace:3,finished:4});
  const DAY=86400000;

  // ---- calendar days (plain YYYY-MM-DD strings; arithmetic in UTC so no timezone or DST drift)
  const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'));
  const stamp=s=>Date.parse(s+'T00:00:00Z');
  const fromStamp=t=>new Date(t).toISOString().slice(0,10);
  const dayDiff=(from,to)=>Math.round((stamp(to)-stamp(from))/DAY);
  const addDays=(s,n)=>fromStamp(stamp(s)+n*DAY);
  function localToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  const int=(v,lo,hi)=>clamp(Math.round(Number(v)||0),lo,hi);
  const round1=v=>Math.round(v*10)/10;
  const percent=(n,d)=>d?round1(n/d*100):0;
  function median(values){const v=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!v.length)return null;const m=v.length>>1;return v.length%2?v[m]:(v[m-1]+v[m])/2;}

  // ---- the grade's fact set, straight from the engine
  const bands=new Map();
  function gradeInfo(grade){
    let g=Math.round(Number(grade));if(!Number.isFinite(g)||g<1||g>12)g=3;
    const band=g>=3?3:g;
    if(!bands.has(band)){
      const engine=practice.create(null);engine.setGrade(band);
      const operations=engine.operations,pathways=engine.pathways,facts=engine.getBank('mixed').map(q=>Object.freeze({id:q.id,op:q.op,a:q.a,b:q.b,answer:q.answer,text:q.text}));
      const totals=Object.fromEntries(operations.map(op=>[op,facts.filter(f=>f.op===op).length]));
      bands.set(band,Object.freeze({operations:Object.freeze(operations),pathways:Object.freeze(pathways),names:Object.freeze({...engine.names}),facts:Object.freeze(facts),index:new Map(facts.map((f,i)=>[f.id,i])),totals:Object.freeze(totals),total:facts.length,trophiesPossible:pathways.length,rules:engine.rules}));
    }
    return {grade:g,...bands.get(band)};
  }
  const symbols={add:'+',sub:'−',mul:'×',div:'÷'};
  function factLabel(id){const m=/^(add|sub|mul|div):(\d+):(\d+)$/.exec(String(id));return m?m[2]+' '+symbols[m[1]]+' '+m[3]:String(id);}
  function factAnswer(id){const m=/^(add|sub|mul|div):(\d+):(\d+)$/.exec(String(id));if(!m)return null;const a=+m[2],b=+m[3];return m[1]==='add'?a+b:m[1]==='sub'?a-b:m[1]==='mul'?a*b:a/b;}
  // The other facts in the same fact family (7 × 8 with 56 ÷ 7 and 56 ÷ 8).
  function relatedFacts(id){const m=/^(add|sub|mul|div):(\d+):(\d+)$/.exec(String(id));if(!m)return[];const a=+m[2],b=+m[3],lo=Math.min,hi=Math.max;
    if(m[1]==='add')return[...new Set(['sub:'+(a+b)+':'+a,'sub:'+(a+b)+':'+b])];
    if(m[1]==='mul')return[...new Set(['div:'+(a*b)+':'+a,'div:'+(a*b)+':'+b])];
    if(m[1]==='sub'){const c=a-b;return[...new Set(['add:'+lo(b,c)+':'+hi(b,c),'sub:'+a+':'+c])].filter(v=>v!==id);}
    const q=a/b;return[...new Set(['mul:'+lo(b,q)+':'+hi(b,q),'div:'+a+':'+q])].filter(v=>v!==id);}

  // ---- one student
  function summarize(record,roster,options){
    const o={...DEFAULTS,...(options||{})},today=validDay(o.today)?o.today:localToday();
    const rec=record&&typeof record==='object'?record:{},row=roster&&typeof roster==='object'?roster:{};
    const info=gradeInfo(row.grade!=null?row.grade:rec.grade);
    const store=rec.facts&&typeof rec.facts==='object'&&!Array.isArray(rec.facts)?rec.facts:{};
    const operations=Object.fromEntries(info.operations.map(op=>[op,{name:info.names[op],total:info.totals[op],confirmed:0,steps:0,stepsTotal:info.totals[op]*3,started:0,notStarted:0,stuck:0,percent:0}]));
    const stuck=[],notStarted=[];let confirmed=0,steps=0,started=0;
    for(const fact of info.facts){
      const f=store[fact.id],op=operations[fact.op];
      if(!f||typeof f!=='object'){op.notStarted++;notStarted.push({id:fact.id,op:fact.op,text:fact.text});continue;}
      const stage=int(f.stage,0,4),refresh=[1,2].includes(f.refresh)?f.refresh:0,attempts=int(f.attempts,0,1e9),misses=int(f.misses,0,1e9);
      const lastSuccess=validDay(f.lastSuccess)?f.lastSuccess:null,failedDay=validDay(f.failedDay)?f.failedDay:null;
      if(!stage&&!attempts&&!failedDay){op.notStarted++;notStarted.push({id:fact.id,op:fact.op,text:fact.text});continue;}
      op.started++;started++;op.steps+=Math.min(3,stage);steps+=Math.min(3,stage);
      if(stage>=3&&!refresh){op.confirmed++;confirmed++;}
      // Same test the engine uses to put a fact at the front of the deck.
      const missedNow=!!failedDay&&(!lastSuccess||lastSuccess<=failedDay);
      if(refresh||missedNow){op.stuck++;stuck.push({id:fact.id,op:fact.op,text:fact.text,answer:fact.answer,misses,attempts,stage,refresh,failedDay,first:validDay(f.first)?f.first:null,reason:refresh?'refresh':'missed'});}
    }
    for(const op of info.operations)operations[op].percent=percent(operations[op].confirmed,operations[op].total);
    stuck.sort((a,b)=>b.misses-a.misses||String(b.failedDay||'').localeCompare(String(a.failedDay||''))||a.id.localeCompare(b.id));

    // Official checks: one per pathway per day, taken from the first 90 seconds of play.
    const official=(Array.isArray(rec.checks)?rec.checks:[]).filter(c=>c&&typeof c==='object'&&c.official&&c.valid&&info.pathways.includes(c.pathway)&&validDay(c.day)&&c.day<=today).sort((a,b)=>a.day.localeCompare(b.day));
    const view=c=>({day:c.day,pathway:c.pathway,passed:c.passed===true,correct:int(c.correct,0,1e6),attempts:int(c.attempts,0,1e6),accuracy:Number.isFinite(c.accuracy)?c.accuracy:0,balanced:c.balanced!==false,byOperation:c.byOperation&&typeof c.byOperation==='object'?c.byOperation:{},missed:(Array.isArray(c.missed)?c.missed:[]).filter(id=>info.index.has(id)).map(id=>({id,text:info.facts[info.index.get(id)].text}))});
    const byPathway={};let checksPassed=0;
    for(const p of info.pathways){
      const mine=official.filter(c=>c.pathway===p),days=[...new Set(mine.filter(c=>c.passed===true).map(c=>c.day))];
      const spanMet=days.length>=info.rules.checkDays&&dayDiff(days[0],days[days.length-1])>=info.rules.retentionDays;
      checksPassed+=days.length;
      byPathway[p]={name:info.names[p],passes:days.length,needed:info.rules.checkDays,spanDays:days.length?dayDiff(days[0],days[days.length-1]):0,spanMet,complete:spanMet,first:days[0]||null,lastPass:days[days.length-1]||null,nextEligible:days.length>=info.rules.checkDays&&!spanMet?addDays(days[0],info.rules.retentionDays):null,taken:mine.length,last:mine.length?view(mine[mine.length-1]):null};
    }
    const history=official.map(view).reverse();

    const awarded=rec.trophies&&typeof rec.trophies==='object'?rec.trophies:{};
    const earned=info.pathways.filter(p=>validDay(awarded[p])).map(p=>({pathway:p,name:info.names[p],day:awarded[p]}));
    const won=earned.length===info.pathways.length;

    // The daily log: one line per day played.
    const log=rec.days&&typeof rec.days==='object'&&!Array.isArray(rec.days)?rec.days:{};
    const series=Object.keys(log).filter(d=>validDay(d)&&d<=today&&log[d]&&typeof log[d]==='object').sort().map(d=>{const v=log[d],ms=int(v.ms,0,1e12);return{day:d,confirmed:int(v.confirmed,0,info.total),minutes:round1(ms/60000),ms,cards:int(v.cards,0,1e9),correct:int(v.correct,0,1e9),steps:int(v.steps,0,1e9)};});
    const windowed=(from,to)=>series.filter(s=>{const age=dayDiff(s.day,today);return age>=from&&age<=to;});
    const sum=(list,key)=>list.reduce((n,v)=>n+v[key],0);
    const thisWeek=windowed(0,6),lastWeek=windowed(7,13);
    let firstDay=series.length?series[0].day:null;
    if(!firstDay){ // a record older than the daily log still shows when its facts were first seen
      for(const f of Object.values(store))if(f&&validDay(f.first)&&f.first<=today&&(!firstDay||f.first<firstDay))firstDay=f.first;
    }
    const lastDay=series.length?series[series.length-1].day:null,cardsThisWeek=sum(thisWeek,'cards'),correctThisWeek=sum(thisWeek,'correct');
    const activity={firstDay,lastDay,daysPlayed:series.length,daysSinceLast:lastDay?dayDiff(lastDay,today):null,playedLast7:thisWeek.length>0,daysThisWeek:thisWeek.length,daysLastWeek:lastWeek.length,
      msThisWeek:sum(thisWeek,'ms'),msLastWeek:sum(lastWeek,'ms'),minutesThisWeek:round1(sum(thisWeek,'ms')/60000),minutesLastWeek:round1(sum(lastWeek,'ms')/60000),
      cardsThisWeek,correctThisWeek,accuracyThisWeek:cardsThisWeek?correctThisWeek/cardsThisWeek:null,stepsThisWeek:sum(thisWeek,'steps'),
      totalMinutes:round1(sum(series,'ms')/60000),totalCards:sum(series,'cards'),totalCorrect:sum(series,'correct')};

    return{
      student:{id:row.id!=null?String(row.id):'',name:row.name!=null?String(row.name):'',grade:info.grade,school:row.school!=null?String(row.school):'',classId:row.classId!=null?String(row.classId):'',className:row.className!=null?String(row.className):'',teacher:row.teacher!=null?String(row.teacher):''},
      grade:info.grade,today,operationList:[...info.operations],pathwayList:[...info.pathways],
      facts:{total:info.total,confirmed,percent:percent(confirmed,info.total),steps,stepsTotal:info.total*3,started,notStarted:notStarted.length},
      operations,
      checks:{byPathway,history,taken:official.length,passedDays:checksPassed,neededDays:info.pathways.length*info.rules.checkDays},
      trophies:{earned,count:earned.length,possible:info.pathways.length,won,wonDay:won?earned.map(e=>e.day).sort().pop():null},
      stuck,notStarted,activity,series,
      pace:pace({confirmed,total:info.total,won,firstDay,today,series,options:o})
    };
  }

  // PACE: a straight line from the first day played to every fact confirmed by the target day.
  function pace({confirmed,total,won,firstDay,today,series,options}){
    const o={...DEFAULTS,...(options||{})},target=validDay(o.target)?o.target:DEFAULTS.target,milestone=validDay(o.milestone)?o.milestone:DEFAULTS.milestone;
    const base={status:'notStarted',label:PACE_LABEL.notStarted,confirmed,total,expected:0,expectedPercent:0,ratio:null,grace:false,firstDay:firstDay||null,target,milestone,daysToTarget:dayDiff(today,target),daysToMilestone:dayDiff(today,milestone),projection:null};
    if(firstDay){
      const elapsed=dayDiff(firstDay,today),span=dayDiff(firstDay,target),fraction=span<=0?1:clamp(elapsed/span,0,1);
      base.expected=fraction*total;base.expectedPercent=round1(fraction*100);base.ratio=base.expected>0?confirmed/base.expected:null;
      // Grace counts days actually played: nothing can be confirmed before the third day of play.
      const played=(series||[]).filter(d=>d&&d.day<=today&&d.cards>0).length;
      base.grace=(played||elapsed+1)<o.graceDays;
      base.status=base.grace||base.expected<=0||base.ratio>=o.onPaceRatio?'onPace':base.ratio>=o.behindRatio?'behind':'atRisk';
      base.projection=projection({confirmed,total,today,series,days:o.projectionDays,target,milestone});
    }
    if(won)base.status='finished';
    base.label=PACE_LABEL[base.status];
    return base;
  }
  // At the rate of the last 14 days, the day every fact would be confirmed (null when there is no forward rate).
  function projection({confirmed,total,today,series,days,target,milestone}){
    if(confirmed>=total)return{date:today,perDay:0,perWeek:0,remaining:0,byTarget:true,byMilestone:true};
    const from=addDays(today,-days);let before=0;for(const s of series||[]){if(s.day<=from)before=s.confirmed;else break;}
    const perDay=(confirmed-before)/days;if(!(perDay>0))return null;
    const wait=Math.ceil((total-confirmed)/perDay);if(wait>3650)return null;
    const date=addDays(today,wait);
    return{date,perDay,perWeek:round1(perDay*7),remaining:total-confirmed,byTarget:date<=target,byMilestone:date<=milestone};
  }
  const attentionRank=s=>ATTENTION[s.pace.status]*10+(s.pace.ratio==null?0:clamp(s.pace.ratio,0,9.99));
  const byAttention=(a,b)=>attentionRank(a)-attentionRank(b)||a.facts.percent-b.facts.percent||a.student.name.localeCompare(b.student.name);

  // ---- a class, a grade, a school or the district
  function aggregate(summaries){
    const list=summaries||[],n=list.length,counts=Object.fromEntries(PACE.map(p=>[p.key,0]));
    let earned=0,possible=0,won=0,played=0,msThis=0,msLast=0,cards=0,correct=0,confirmed=0,total=0,started=0;const ops={};
    for(const s of list){
      counts[s.pace.status]++;earned+=s.trophies.count;possible+=s.trophies.possible;if(s.trophies.won)won++;if(s.activity.playedLast7)played++;if(s.activity.firstDay)started++;
      msThis+=s.activity.msThisWeek;msLast+=s.activity.msLastWeek;cards+=s.activity.cardsThisWeek;correct+=s.activity.correctThisWeek;confirmed+=s.facts.confirmed;total+=s.facts.total;
      for(const op of s.operationList){const t=ops[op]||(ops[op]={name:s.operations[op].name,students:0,confirmed:0,total:0,percent:0});t.students++;t.confirmed+=s.operations[op].confirmed;t.total+=s.operations[op].total;}
    }
    for(const t of Object.values(ops))t.percent=percent(t.confirmed,t.total);
    const onTrack=counts.onPace+counts.finished,med=median(list.map(s=>s.facts.percent));
    return{students:n,started,pace:counts,onPace:onTrack,onPacePercent:percent(onTrack,n),needSupport:counts.behind+counts.atRisk,
      medianPercent:med==null?null:round1(med),confirmed,total,confirmedPercent:percent(confirmed,total),
      playedLast7:played,playedLast7Percent:percent(played,n),
      trophies:{earned,possible,percent:percent(earned,possible)},won,wonPercent:percent(won,n),
      minutesThisWeek:round1(msThis/60000),minutesLastWeek:round1(msLast/60000),avgMinutesThisWeek:n?round1(msThis/60000/n):0,avgMinutesLastWeek:n?round1(msLast/60000/n):0,
      cardsThisWeek:cards,accuracyThisWeek:cards?correct/cards:null,operations:ops};
  }
  function groupBy(list,key){const out=[],seen=new Map();for(const item of list||[]){const k=key(item);if(!seen.has(k)){seen.set(k,{key:k,items:[]});out.push(seen.get(k));}seen.get(k).items.push(item);}return out;}
  // The facts most of a group is stuck on right now, with the students stuck on each.
  function mostMissed(summaries,options){
    const o={limit:5,minStudents:1,...(options||{})},list=summaries||[],facts=new Map();
    for(const s of list)for(const f of s.stuck){
      let item=facts.get(f.id);if(!item){item={id:f.id,op:f.op,text:f.text,answer:f.answer,count:0,misses:0,eligible:0,share:0,students:[],related:[]};facts.set(f.id,item);}
      item.count++;item.misses+=f.misses;item.students.push({id:s.student.id,name:s.student.name,classId:s.student.classId,misses:f.misses,reason:f.reason});
    }
    const holders=id=>list.filter(s=>gradeInfo(s.grade).index.has(id)).length;
    const ranked=[...facts.values()].filter(f=>f.count>=o.minStudents&&(!o.op||f.op===o.op)).sort((a,b)=>b.count-a.count||b.misses-a.misses||a.id.localeCompare(b.id));
    const out=o.limit?ranked.slice(0,o.limit):ranked;
    for(const item of out){
      item.eligible=holders(item.id);item.share=item.eligible?item.count/item.eligible:0;
      item.students.sort((a,b)=>b.misses-a.misses||a.name.localeCompare(b.name));
      item.related=relatedFacts(item.id).filter(id=>facts.has(id)).map(id=>({id,text:facts.get(id).text,count:facts.get(id).count}));
    }
    return out;
  }
  // Week-by-week growth for a group. Weeks are rolling 7-day windows ending on "today".
  function weeklySeries(summaries,options){
    const o={...DEFAULTS,...(options||{})},list=summaries||[],today=validDay(o.today)?o.today:(list[0]?list[0].today:localToday()),out=[];
    const total=list.reduce((n,s)=>n+s.facts.total,0);
    for(let w=o.weeks-1;w>=0;w--){
      const end=addDays(today,-7*w),start=addDays(end,-6);let ms=0,active=0,confirmed=0,cards=0;const shares=[];
      for(const s of list){
        let last=0,played=false;
        for(const d of s.series){if(d.day>end)break;last=d.confirmed;if(d.day>=start){ms+=d.ms;cards+=d.cards;played=true;}}
        if(played)active++;confirmed+=last;shares.push(s.facts.total?last/s.facts.total*100:0);
      }
      const med=median(shares);
      out.push({start,end,minutes:round1(ms/60000),minutesPerStudent:list.length?round1(ms/60000/list.length):0,activeStudents:active,activePercent:percent(active,list.length),cards,confirmed,confirmedPercent:percent(confirmed,total),medianPercent:med==null?0:round1(med)});
    }
    return out;
  }
  // Spreadsheet-safe CSV: quotes doubled, and cells that could be read as formulas are neutralised.
  function csv(rows){return(rows||[]).map(row=>row.map(cell=>{let v=cell==null?'':String(cell);if(/^[=+\-@\t\r]/.test(v)&&!/^-?\d+(\.\d+)?%?$/.test(v))v="'"+v;return'"'+v.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');}

  return{DEFAULTS,PACE,PACE_LABEL,gradeInfo,factLabel,factAnswer,relatedFacts,summarize,pace,projection,aggregate,groupBy,mostMissed,weeklySeries,attentionRank,byAttention,csv,median,validDay,dayDiff,addDays};
});
