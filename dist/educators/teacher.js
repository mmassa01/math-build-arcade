// Teacher report: one class, then one student. Renders FICTIONAL sample data only.
// A hosting platform would replace `data` with the signed-in teacher's own roster and
// the records it stores for those students (see integration.md).
(function(){
  'use strict';
  const R=window.ArcadeReporting,U=window.ArcadeReportUI,E=U.esc,data=window.ArcadeReportingSample.load();
  const view=document.getElementById('view'),picker=document.getElementById('classPicker'),asOf=document.getElementById('asOf');
  const options={today:data.today,milestone:data.milestone,target:data.target},classes=new Map(data.classes.map(c=>[c.id,c])),cache=new Map();
  const GRAY='#6b6976';
  function summariesFor(id){if(!cache.has(id))cache.set(id,data.students.filter(s=>s.roster.classId===id).map(s=>R.summarize(s.record,s.roster,options)));return cache.get(id);}
  const state={classId:null,studentId:null,fromDistrict:false};
  function readUrl(){const q=new URLSearchParams(location.search),fallback=(data.classes.find(c=>c.grade===3)||data.classes[0]).id;
    state.classId=classes.has(q.get('class'))?q.get('class'):fallback;state.fromDistrict=q.get('from')==='district';
    const student=q.get('student');state.studentId=student&&summariesFor(state.classId).some(s=>s.student.id===student)?student:null;}
  function url(){const q=new URLSearchParams();q.set('class',state.classId);if(state.studentId)q.set('student',state.studentId);if(state.fromDistrict)q.set('from','district');return'?'+q;}
  function go(change,replace){Object.assign(state,change);history[replace?'replaceState':'pushState'](null,'',url());render();window.scrollTo(0,0);}

  picker.innerHTML=data.schools.map(s=>'<optgroup label="'+E(s.name)+'">'+data.classes.filter(c=>c.school===s.id).map(c=>'<option value="'+E(c.id)+'">'+E(c.name+' — '+c.teacher)+'</option>').join('')+'</optgroup>').join('');
  picker.addEventListener('change',()=>go({classId:picker.value,studentId:null}));
  window.addEventListener('popstate',()=>{readUrl();render();});
  view.addEventListener('click',e=>{
    const student=e.target.closest('[data-student]');if(student)return go({studentId:student.getAttribute('data-student')});
    if(e.target.closest('[data-back]'))return go({studentId:null});
    if(e.target.closest('[data-print]')){document.body.classList.add('printGroups');window.print();}
  });
  window.addEventListener('afterprint',()=>document.body.classList.remove('printGroups'));

  function render(){
    const cls=classes.get(state.classId),sums=summariesFor(state.classId);picker.value=state.classId;
    asOf.innerHTML='<b>'+E(cls.name)+'</b> · '+E(cls.teacher)+' · '+E(cls.schoolName)+' · '+U.plural(sums.length,'student')+' · as of <b>'+E(U.day(data.today,'long'))+'</b>';
    const student=state.studentId&&sums.find(s=>s.student.id===state.studentId);
    document.title=(student?student.student.name+' · ':'')+cls.name+' · Teacher report · Math Build Arcade (sample data)';
    if(student)renderStudent(cls,student);else renderClass(cls,sums);
  }

  // ---------------------------------------------------------------- class
  function renderClass(cls,sums){
    const info=R.gradeInfo(cls.grade),group=R.aggregate(sums),n=sums.length,teach=R.mostMissed(sums,{limit:5,minStudents:2});
    const daysLeft=R.dayDiff(data.today,data.milestone);
    const teachHtml=teach.length?'<ol class="teach">'+teach.map((f,i)=>{
      const slipped=f.students.filter(s=>s.reason==='refresh').length,share=Math.round(f.share*100);
      const why='Missed the last time it came up'+(slipped?' ('+slipped+' had it confirmed, then missed it)':'')+'. '+U.plural(f.misses,'miss','misses')+' so far across this group.'+
        (f.related.length?' Same fact family: '+f.related.map(r=>r.text+' ('+U.plural(r.count,'student')+' stuck)').join(', ')+'.':'');
      return'<li><span class="rank" aria-hidden="true">#'+(i+1)+'</span><div class="fact">'+E(f.text)+'<small>= '+E(f.answer)+'</small></div>'+
        '<div class="who">'+f.count+' of '+f.eligible+' students · '+share+'% of the class</div><div class="meter" aria-hidden="true"><i style="width:'+share+'%"></i></div>'+
        '<p class="why">'+E(why)+'</p><h3 class="sr">Small group for '+E(f.text)+'</h3><ul class="group">'+f.students.map(s=>'<li><button type="button" class="chipBtn" data-student="'+E(s.id)+'" title="Open '+E(s.name)+'">'+E(s.name)+' <small>'+U.plural(s.misses,'miss','misses')+'</small></button></li>').join('')+'</ul></li>';
    }).join('')+'</ol>':'<p class="empty">No fact is shared by two or more students right now. Check the student table below for individual needs.</p>';

    view.innerHTML=
      '<section class="card printKeep" aria-labelledby="teachTitle"><div class="cardHead"><div><h2 id="teachTitle">Teach these facts next</h2><p>The facts the most students in this class are stuck on right now: missed the last time they came up, or confirmed earlier and then missed. Ordered by how many students each one would help. Every card is a ready-made small group.</p></div><button type="button" class="btn" data-print>Print small-group list</button></div>'+teachHtml+'</section>'+

      '<section class="card" aria-labelledby="paceTitle"><div class="cardHead"><div><h2 id="paceTitle">The class against the milestone</h2><p>District milestone: proficient by '+E(U.day(data.milestone,'year'))+', '+daysLeft+' days from now. A student is on pace when their confirmed facts keep up with a straight line from their first day to every fact confirmed by '+E(U.day(data.target))+'.</p></div></div>'+
      U.paceStack(group.pace,{height:34})+
      '<ul class="statusList">'+R.PACE.map(p=>'<li class="key-'+p.key+'"><div class="n">'+group.pace[p.key]+'</div><div class="l key key-'+p.key+'"><i aria-hidden="true"></i>'+E(p.label)+'</div><div class="m">'+E(p.meaning)+'</div></li>').join('')+'</ul>'+
      '<div class="tiles" style="margin-top:14px">'+
        tile('Median facts confirmed',U.pct(group.medianPercent),'of the '+info.total+' grade '+cls.grade+' facts')+
        tile('Played in the last 7 days',group.playedLast7+' <small>of '+n+'</small>',U.pct(group.playedLast7Percent)+' of the class')+
        tile('Trophies earned',group.trophies.earned+' <small>of '+group.trophies.possible+'</small>',info.trophiesPossible+' possible per student in grade '+cls.grade)+
        tile('Practice time this week',U.num(group.avgMinutesThisWeek)+' <small>min per student</small>','last week '+U.num(group.avgMinutesLastWeek)+' min · answer time only')+
      '</div></section>'+

      '<section class="card" aria-labelledby="tableTitle"><div class="cardHead"><div><h2 id="tableTitle">Every student</h2><p>Students who need attention come first. Select a column heading to sort, or a name to open that student.</p></div></div><div id="classTable"></div></section>'+

      '<section class="card" aria-labelledby="growthTitle"><div class="cardHead"><div><h2 id="growthTitle">Class growth</h2><p>Week by week: how much of the grade’s fact set the class has confirmed against the pace line, and how much practice went into it.</p></div></div>'+
      '<div class="grid2"><div><h3>Facts confirmed, class average</h3>'+U.chartKey([{name:'Class average',color:'var(--series-1)'},{name:'Pace line',color:GRAY,style:'dash'}])+'<div class="chart" id="growthChart"></div></div>'+
      '<div><h3>Practice minutes per student, each week</h3><ul class="chartKey"><li class="muted">Answer time recorded by the game, averaged over the whole class</li></ul><div class="chart" id="minutesChart"></div></div></div><div id="growthData"></div></section>';

    U.table(document.getElementById('classTable'),{caption:cls.name+': '+n+' students',rows:sums,defaultOrder:R.byAttention,columns:[
      {key:'name',label:'Student',sort:s=>s.student.name,cell:s=>'<button type="button" class="rowLink" data-student="'+E(s.student.id)+'">'+E(s.student.name)+'</button>'},
      {key:'pace',label:'Pace',sort:R.attentionRank,cell:s=>U.paceChip(s.pace.status)},
      {key:'all',label:'Confirmed',sort:s=>s.facts.percent,first:-1,cell:s=>'<span data-tip="'+E(s.facts.confirmed+' of '+s.facts.total+' facts confirmed')+'">'+U.bar(s.facts.percent)+'</span>'},
      ...info.operations.map(op=>({key:op,label:info.names[op],cls:'hideSm',sort:s=>s.operations[op].percent,first:-1,cell:s=>'<span data-tip="'+E('<b>'+info.names[op]+'</b>'+s.operations[op].confirmed+' of '+s.operations[op].total+' confirmed')+'">'+U.bar(s.operations[op].percent,{thin:true})+'</span>'})),
      {key:'checks',label:'Check days passed',cls:'hideSm',num:true,sort:s=>s.checks.passedDays,first:-1,cell:s=>s.checks.passedDays+' <span class="muted">of '+s.checks.neededDays+'</span>'},
      {key:'trophies',label:'Trophies',num:true,sort:s=>s.trophies.count,first:-1,cell:s=>s.trophies.count+' <span class="muted">of '+s.trophies.possible+'</span>'},
      {key:'last',label:'Last played',sort:s=>s.activity.daysSinceLast==null?9999:s.activity.daysSinceLast,cell:s=>s.activity.lastDay?'<span data-tip="'+E(U.day(s.activity.lastDay,'long'))+'">'+E(U.ago(s.activity.daysSinceLast))+'</span>':'<span class="muted">Never</span>'},
      {key:'minutes',label:'Min this week',num:true,sort:s=>s.activity.minutesThisWeek,first:-1,cell:s=>U.num(s.activity.minutesThisWeek)}
    ]});

    const weeks=R.weeklySeries(sums,{today:data.today,weeks:10});
    const expected=weeks.map(w=>n?sums.reduce((t,s)=>t+expectedShare(s,w.end),0)/n:0);
    U.lineChart(document.getElementById('growthChart'),{height:250,label:'Line chart: class average of facts confirmed, by week, against the pace line. Now '+U.pct(weeks[weeks.length-1].confirmedPercent)+' against '+U.pct(expected[expected.length-1])+' expected.',
      x:{min:0,max:weeks.length-1,ticks:weeks.map((w,i)=>({v:i,label:U.day(w.end)}))},y:{max:100,format:v=>Math.round(v)+'%'},rightPad:46,
      series:[{name:'Pace line',color:GRAY,style:'dash',points:expected.map((v,i)=>[i,v])},{name:'Class average',color:'var(--series-1)',points:weeks.map((w,i)=>[i,w.confirmedPercent]),endLabel:U.pct(weeks[weeks.length-1].confirmedPercent)}],
      tip:i=>'<b>Week ending '+E(U.day(weeks[i].end))+'</b>Class average '+U.pct(weeks[i].confirmedPercent)+' confirmed<br>Pace line '+U.pct(expected[i])});
    U.barChart(document.getElementById('minutesChart'),{height:250,label:'Bar chart: practice minutes per student in each of the last ten weeks.',format:v=>U.num(v),
      bars:weeks.map(w=>({label:U.day(w.end),value:w.minutesPerStudent,tip:'<b>Week ending '+E(U.day(w.end))+'</b>'+U.num(w.minutesPerStudent)+' min per student<br>'+w.activeStudents+' of '+n+' students played'}))});
    document.getElementById('growthData').innerHTML='<details class="data"><summary>Show these numbers as a table</summary><div class="tableWrap"><table><caption>Class growth by week</caption><thead><tr><th scope="col">Week ending</th><th scope="col" class="num">Class average confirmed</th><th scope="col" class="num">Pace line</th><th scope="col" class="num">Students who played</th><th scope="col" class="num">Minutes per student</th></tr></thead><tbody>'+
      weeks.map((w,i)=>'<tr><th scope="row">'+E(U.day(w.end,'year'))+'</th><td class="num">'+U.pct(w.confirmedPercent)+'</td><td class="num">'+U.pct(expected[i])+'</td><td class="num">'+w.activeStudents+' of '+n+'</td><td class="num">'+U.num(w.minutesPerStudent)+'</td></tr>').join('')+'</tbody></table></div></details>';
  }
  const tile=(k,v,s)=>'<div class="tile"><div class="k">'+E(k)+'</div><div class="v">'+v+'</div><div class="s">'+E(s)+'</div></div>';
  // Where the pace line stood for one student on a given day, as a share of their facts.
  function expectedShare(s,day){const first=s.pace.firstDay;if(!first||day<first)return 0;const span=R.dayDiff(first,s.pace.target);return span<=0?100:Math.min(1,R.dayDiff(first,day)/span)*100;}

  // ---------------------------------------------------------------- student
  function renderStudent(cls,s){
    const info=R.gradeInfo(s.grade),p=s.pace,a=s.activity,proj=p.projection;
    let headline;
    if(p.status==='finished')headline='Finished on '+U.day(s.trophies.wonDay,'year')+': every grade '+s.grade+' trophy is earned.';
    else if(p.status==='notStarted')headline='No practice has been recorded for this student yet.';
    else headline=p.label+': '+s.facts.confirmed+' of '+s.facts.total+' facts confirmed. The pace line expects about '+Math.round(p.expected)+' by today'+(p.ratio==null?'':' ('+Math.round(p.ratio*100)+'% of expected)')+'.'+(p.grace?' Still in the first three days, when nothing can be confirmed yet.':'');
    let outlook='';
    if(p.status!=='notStarted'&&p.status!=='finished'){
      if(!proj)outlook='No facts were confirmed in the last 14 days, so there is no projection yet.';
      else if(!proj.remaining)outlook='Every fact is confirmed. What remains is passing the checks for each trophy.';
      else outlook='At the rate of the last 14 days ('+U.num(proj.perWeek)+' facts a week), every fact would be confirmed around '+U.day(proj.date,'year')+' — '+(proj.byTarget?'ahead of the '+U.day(p.target)+' pace target.':proj.byMilestone?'after the pace target but before the '+U.day(p.milestone)+' milestone.':'after the '+U.day(p.milestone)+' milestone.');
    }
    const pathRows=info.pathways.map(path=>{
      const c=s.checks.byPathway[path],op=path==='mixed'?{confirmed:s.facts.confirmed,total:s.facts.total,percent:s.facts.percent,notStarted:s.facts.notStarted,stuck:s.stuck.length}:s.operations[path],trophy=s.trophies.earned.find(t=>t.pathway===path);
      const span=c.complete?'7-day span met':c.passes>=c.needed?'needs a pass on or after '+U.day(c.nextEligible):c.passes?'needs '+(c.needed-c.passes)+' more':'';
      return'<tr><th scope="row">'+E(info.names[path])+(path==='mixed'?' <span class="muted">(all facts)</span>':'')+'</th><td>'+U.bar(op.percent,{label:op.confirmed+' of '+op.total})+'</td><td class="num">'+op.notStarted+'</td><td class="num">'+op.stuck+'</td>'+
        '<td>'+U.dots(Math.min(c.passes,c.needed),c.needed)+' <span class="muted">'+E(span)+'</span></td>'+
        '<td>'+(c.last?E(U.day(c.last.day))+': <span class="'+(c.last.passed?'good':'bad')+'">'+(c.last.passed?'Passed':'Not yet')+'</span> <span class="muted">'+c.last.correct+' of '+c.last.attempts+'</span>':'<span class="muted">No check yet</span>')+'</td>'+
        '<td>'+(trophy?'<span class="good">Earned</span> '+E(U.day(trophy.day)):'<span class="muted">—</span>')+'</td></tr>';
    }).join('');
    const top=s.stuck.slice(0,12),rest=s.stuck.slice(12);
    const stuckHtml=s.stuck.length?'<div class="tableWrap"><table><caption>'+U.plural(s.stuck.length,'fact')+' to work on, most-missed first</caption><thead><tr><th scope="col">Fact</th><th scope="col" class="num">Misses</th><th scope="col" class="num">Tries</th><th scope="col">Why it is here</th><th scope="col">Last missed</th></tr></thead><tbody>'+
      top.map(f=>'<tr><th scope="row">'+E(f.text)+' <span class="muted">= '+E(f.answer)+'</span></th><td class="num">'+f.misses+'</td><td class="num">'+f.attempts+'</td><td>'+(f.reason==='refresh'?'Was confirmed, then missed':'Missed last time')+'</td><td>'+E(U.day(f.failedDay))+'</td></tr>').join('')+'</tbody></table></div>'+
      (rest.length?'<details class="data"><summary>'+rest.length+' more</summary><div class="factList">'+rest.map(f=>'<span class="chip">'+E(f.text)+' <span class="muted">×'+f.misses+'</span></span>').join('')+'</div></details>':''):'<p class="empty">No stuck facts right now.</p>';
    const checks=s.checks.history,shown=checks.slice(0,6);
    const checkRow=c=>'<tr><th scope="row">'+E(U.day(c.day))+'</th><td>'+E(info.names[c.pathway])+'</td><td><span class="'+(c.passed?'good':'bad')+'">'+(c.passed?'Passed':'Not yet')+'</span></td><td class="num">'+c.correct+' of '+c.attempts+' · '+Math.round(c.accuracy*100)+'%</td><td>'+(c.missed.length?c.missed.map(m=>'<span class="chip">'+E(m.text)+'</span>').join(''):'<span class="muted">None</span>')+'</td></tr>';
    const checkTable=(list,caption)=>'<div class="tableWrap"><table><caption>'+E(caption)+'</caption><thead><tr><th scope="col">Day</th><th scope="col">Pathway</th><th scope="col">Result</th><th scope="col" class="num">Correct</th><th scope="col">Facts missed in the check</th></tr></thead><tbody>'+list.map(checkRow).join('')+'</tbody></table></div>';
    const checksHtml=checks.length?checkTable(shown,'A check is the first 90 seconds of each day in a pathway. Passing takes 30 correct and 95% accuracy.')+(checks.length>shown.length?'<details class="data"><summary>All '+checks.length+' checks</summary>'+checkTable(checks,'Every recorded check, newest first')+'</details>':''):'<p class="empty">No check has been recorded yet.</p>';
    const waiting=info.operations.map(op=>({op,list:s.notStarted.filter(f=>f.op===op)})).filter(g=>g.list.length);

    view.innerHTML=
      '<nav class="crumbs noPrint" aria-label="Breadcrumb">'+(state.fromDistrict?'<a class="btn small" href="../district.html">← District report</a>':'')+'<button type="button" class="btn small" data-back>← '+E(cls.name)+'</button></nav>'+
      '<section class="card" aria-labelledby="studentTitle"><div class="studentHead"><h2 id="studentTitle">'+E(s.student.name)+'</h2>'+U.paceChip(p.status)+'<span class="muted">'+E(cls.name)+' · '+E(cls.teacher)+'</span></div>'+
      '<p class="callout" style="margin:14px 0">'+E(headline)+(outlook?' '+E(outlook):'')+'</p>'+
      '<div class="tiles">'+
        tile('Facts confirmed',s.facts.confirmed+' <small>of '+s.facts.total+'</small>',U.pct(s.facts.percent)+' · expected by today '+U.pct(p.expectedPercent))+
        tile('Trophies',s.trophies.count+' <small>of '+s.trophies.possible+'</small>',s.trophies.earned.map(t=>t.name).join(', ')||'None yet')+
        tile('Last played',E(U.ago(a.daysSinceLast)),a.lastDay?U.day(a.lastDay,'long')+' · '+U.plural(a.daysPlayed,'day')+' played in all':'No day recorded')+
        tile('Practice this week',U.num(a.minutesThisWeek)+' <small>min</small>','last week '+U.num(a.minutesLastWeek)+' min · answer time only')+
        tile('Accuracy this week',a.accuracyThisWeek==null?'—':U.pct(a.accuracyThisWeek*100),a.cardsThisWeek?U.plural(a.cardsThisWeek,'card')+' answered · correct means right within 3 seconds':'No cards this week')+
      '</div></section>'+
      (p.firstDay?'<section class="card" aria-labelledby="lineTitle"><div class="cardHead"><div><h2 id="lineTitle">Growth against the pace line</h2><p>Confirmed facts since the first day played ('+E(U.day(p.firstDay,'year'))+'). The pace line reaches all '+s.facts.total+' facts on '+E(U.day(p.target))+', two weeks before the milestone.</p></div></div>'+
        U.chartKey([{name:'Confirmed facts',color:'var(--series-1)'},{name:'Pace line',color:GRAY,style:'dash'}].concat(proj&&proj.remaining?[{name:'Projection at the recent rate',color:'var(--series-2)',style:'dot'}]:[]))+'<div class="chart" id="studentChart"></div></section>':'')+
      '<section class="card" aria-labelledby="opsTitle"><div class="cardHead"><div><h2 id="opsTitle">Pathways and trophies</h2><p>A trophy needs every fact in the pathway confirmed and three passed check days at least seven days apart from first to last. Grade '+s.grade+' can earn '+info.trophiesPossible+'.</p></div></div>'+
        '<div class="tableWrap"><table><caption>Progress in each pathway</caption><thead><tr><th scope="col">Pathway</th><th scope="col">Confirmed</th><th scope="col" class="num">Not started</th><th scope="col" class="num">Stuck now</th><th scope="col">Check days passed</th><th scope="col">Latest check</th><th scope="col">Trophy</th></tr></thead><tbody>'+pathRows+'</tbody></table></div></section>'+
      '<div class="grid2"><section class="card" aria-labelledby="stuckTitle"><div class="cardHead"><div><h2 id="stuckTitle">Stuck facts</h2><p>Missed the last time they came up, or confirmed earlier and then missed.</p></div></div>'+stuckHtml+'</section>'+
      '<section class="card" aria-labelledby="checkTitle"><div class="cardHead"><div><h2 id="checkTitle">Check history</h2><p>Newest first, with the facts missed in each check.</p></div></div>'+checksHtml+'</section></div>'+
      (waiting.length?'<section class="card" aria-labelledby="newTitle"><div class="cardHead"><div><h2 id="newTitle">Not started yet</h2><p>'+U.plural(s.notStarted.length,'fact')+' this student has not met.</p></div></div>'+waiting.map(g=>'<details class="data"><summary>'+E(info.names[g.op])+': '+g.list.length+' of '+info.totals[g.op]+'</summary><div class="factList">'+g.list.map(f=>'<span class="chip">'+E(f.text)+'</span>').join('')+'</div></details>').join('')+'</section>':'');

    const chart=document.getElementById('studentChart');if(!chart)return;
    const first=p.firstDay,off=d=>R.dayDiff(first,d),now=off(data.today),end=Math.max(off(p.milestone),now),target=Math.max(0,off(p.target));
    const line=s.series.map(d=>[off(d.day),d.confirmed]);if(!line.length||line[0][0]>0)line.unshift([0,0]);if(line[line.length-1][0]<now)line.push([now,line[line.length-1][1]]);
    const series=[{name:'Pace line',color:GRAY,style:'dash',points:[[0,0],[Math.min(target,end),s.facts.total],[end,s.facts.total]]}];
    if(proj&&proj.remaining){const stop=Math.min(end,off(proj.date));series.push({name:'Projection',color:'var(--series-2)',style:'dot',points:[[now,s.facts.confirmed],[stop,Math.min(s.facts.total,s.facts.confirmed+proj.perDay*(stop-now))]]});}
    series.push({name:'Confirmed facts',color:'var(--series-1)',step:true,points:line});
    const ticks=[];for(let d=0;d<=end;d++){const date=R.addDays(first,d);if(date.slice(8)==='01'||d===0)ticks.push({v:d,label:U.day(date)});}
    const at=x=>{let v=0;for(const pt of line){if(pt[0]<=x)v=pt[1];else break;}return v;};
    U.lineChart(chart,{height:280,label:'Line chart: '+s.student.name+' has confirmed '+s.facts.confirmed+' of '+s.facts.total+' facts; the pace line expects '+Math.round(p.expected)+' by today.',
      x:{min:0,max:end,ticks},y:{max:s.facts.total,format:v=>Math.round(v)},series,marks:[{x:now,label:'Today'},{x:off(p.milestone),label:'Milestone '+U.day(p.milestone)}],
      tip:x=>'<b>'+E(U.day(R.addDays(first,x),'long'))+'</b>'+(x<=now?at(x)+' facts confirmed<br>':'')+'Pace line '+Math.round(Math.min(1,target?x/target:1)*s.facts.total)});
  }

  U.wireTips();readUrl();history.replaceState(null,'',url());render();
})();
