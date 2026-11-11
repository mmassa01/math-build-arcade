// District report: compare grades and classes, then drill down grade → class → student
// (the class and student views are the teacher report, opened with query parameters).
// Renders FICTIONAL sample data only (see educators/integration.md).
(function(){
  'use strict';
  const R=window.ArcadeReporting,U=window.ArcadeReportUI,E=U.esc,data=window.ArcadeReportingSample.load();
  const view=document.getElementById('view'),asOf=document.getElementById('asOf');
  const options={today:data.today,milestone:data.milestone,target:data.target};
  const all=data.students.map(s=>R.summarize(s.record,s.roster,options)),classes=new Map(data.classes.map(c=>[c.id,c]));
  const grades=[...new Set(data.classes.map(c=>c.grade))].sort((a,b)=>a-b),schoolOf=g=>data.schools.find(s=>s.grades.includes(g));
  const GRAY='#6b6976',BAND_COLOR=['var(--series-1)','var(--series-2)','var(--series-3)'];
  const scopes=[{id:'all',label:'All grades',test:()=>true},...data.schools.map(s=>({id:'band-'+s.id,label:s.band+' · grades '+s.grades[0]+'–'+s.grades[s.grades.length-1],test:x=>s.grades.includes(x.grade)})),...grades.map(g=>({id:'grade-'+g,label:'Grade '+g,grade:g,test:x=>x.grade===g}))];
  let scope=scopes.find(s=>s.id===new URLSearchParams(location.search).get('scope'))||scopes[0],classTable=null;
  const tile=(k,v,s)=>'<div class="tile"><div class="k">'+E(k)+'</div><div class="v">'+v+'</div><div class="s">'+E(s)+'</div></div>';
  const classLink=(id,label)=>'<a class="rowLink" href="educators/index.html?class='+encodeURIComponent(id)+'&amp;from=district">'+E(label)+'</a>';
  function expectedShare(s,day){const first=s.pace.firstDay;if(!first||day<first)return 0;const span=R.dayDiff(first,s.pace.target);return span<=0?100:Math.min(1,R.dayDiff(first,day)/span)*100;}

  const district=R.aggregate(all);
  asOf.innerHTML='<b>'+E(data.district)+'</b> · '+data.schools.length+' schools · '+data.classes.length+' classes · '+all.length+' students · as of <b>'+E(U.day(data.today,'long'))+'</b>';
  view.innerHTML=
    '<section aria-labelledby="headTitle"><h2 id="headTitle" class="sr">District headline</h2><div class="tiles">'+
      tile('Students',U.num(district.students),district.started+' have started · '+district.pace.notStarted+' not yet')+
      tile('On pace or finished',U.pct(district.onPacePercent),district.onPace+' of '+district.students+' students')+
      tile('Played in the last 7 days',U.pct(district.playedLast7Percent),district.playedLast7+' of '+district.students+' students')+
      tile('Trophies earned',U.num(district.trophies.earned)+' <small>of '+U.num(district.trophies.possible)+'</small>','3 possible in grades 1–2, 5 from grade 3')+
      tile('Students who have won',U.num(district.won),'every trophy for their grade')+
    '</div></section>'+
    '<section class="card" aria-labelledby="mixTitle"><div class="cardHead"><div><h2 id="mixTitle">Every student against the milestone</h2><p>District milestone: proficient by '+E(U.day(data.milestone,'year'))+', '+R.dayDiff(data.today,data.milestone)+' days from now. On pace means a student’s confirmed facts keep up with a straight line from their first day to every fact confirmed by '+E(U.day(data.target))+'.</p></div></div>'+
      U.paceStack(district.pace,{height:34,minShare:4})+
      '<ul class="statusList">'+R.PACE.map(p=>'<li class="key-'+p.key+'"><div class="n">'+district.pace[p.key]+'</div><div class="l key key-'+p.key+'"><i aria-hidden="true"></i>'+E(p.label)+'</div><div class="m">'+E(p.meaning)+'</div></li>').join('')+'</ul></section>'+
    '<section class="card" aria-labelledby="gradeTitle"><div class="cardHead"><div><h2 id="gradeTitle">Grade by grade</h2><p>Each grade band has one school, so the useful comparison is between grades and between classes. Select a grade to see its classes below.</p></div></div>'+U.paceLegend()+'<div id="gradeTable" style="margin-top:12px"></div></section>'+
    '<section class="card" aria-labelledby="classTitle" id="classes"><div class="cardHead"><div><h2 id="classTitle">Class by class</h2><p>Classes that most need support come first. Select a column heading to sort, or a class to open its teacher report.</p></div>'+
      '<div class="controls"><label class="field">Show <select id="scopePicker">'+scopes.map(s=>'<option value="'+E(s.id)+'">'+E(s.label)+'</option>').join('')+'</select></label><button type="button" class="btn" id="csvButton">Download this table (CSV)</button></div></div><div id="classTable"></div></section>'+
    '<section class="card" aria-labelledby="missTitle"><div class="cardHead"><div><h2 id="missTitle">Most-missed facts</h2><p id="missNote"></p></div></div><div id="missed"></div></section>'+
    '<section class="card" aria-labelledby="trendTitle"><div class="cardHead"><div><h2 id="trendTitle">Trend over time</h2><p id="trendNote"></p></div></div><div class="grid2"><div><h3>Facts confirmed, average per student</h3><div id="trendKey"></div><div class="chart" id="trendChart"></div></div><div><h3>Students who played, each week</h3><ul class="chartKey"><li class="muted">Share of rostered students with at least one day of practice that week</li></ul><div class="chart" id="playChart"></div></div></div><div id="trendData"></div></section>';

  // ---- grade by grade (always the whole district)
  const gradeRows=grades.map(g=>{const list=all.filter(s=>s.grade===g);return{grade:g,school:schoolOf(g),agg:R.aggregate(list),classes:data.classes.filter(c=>c.grade===g).length};});
  U.table(document.getElementById('gradeTable'),{caption:'Grades 1–12 compared',rows:gradeRows,sortKey:'grade',columns:measureColumns({key:'grade',label:'Grade',sort:r=>r.grade,cell:r=>'<button type="button" class="rowLink" data-scope="grade-'+r.grade+'">Grade '+r.grade+'</button>'},
    {key:'school',label:'School',cls:'hideSm nw',sort:r=>r.grade,cell:r=>E(r.school.name)})});

  function measureColumns(first,second){return[first,second,
    {key:'students',label:'Students',num:true,sort:r=>r.agg.students,first:-1,cell:r=>r.agg.students,csv:r=>r.agg.students},
    {key:'mix',label:'Pace mix',cell:r=>'<div style="min-width:150px">'+U.paceStack(r.agg.pace,{height:18,numbers:false})+'</div>'},
    {key:'onPace',label:'On pace or finished',num:true,sort:r=>r.agg.onPacePercent,cell:r=>U.pct(r.agg.onPacePercent),csv:r=>r.agg.onPacePercent,csvLabel:'On pace or finished %'},
    {key:'support',label:'Behind or at risk',num:true,sort:r=>r.agg.needSupport,first:-1,cell:r=>r.agg.needSupport,csv:r=>r.agg.needSupport},
    {key:'median',label:'Median confirmed',sort:r=>r.agg.medianPercent,cell:r=>U.bar(r.agg.medianPercent,{thin:true}),csv:r=>r.agg.medianPercent,csvLabel:'Median facts confirmed %'},
    {key:'played',label:'Played in 7 days',sort:r=>r.agg.playedLast7Percent,cell:r=>U.bar(r.agg.playedLast7Percent,{thin:true,color:'var(--series-3)'}),csv:r=>r.agg.playedLast7Percent,csvLabel:'Played in last 7 days %'},
    {key:'trophies',label:'Trophies',num:true,cls:'hideSm',sort:r=>r.agg.trophies.percent,first:-1,cell:r=>r.agg.trophies.earned+' <span class="muted">of '+r.agg.trophies.possible+'</span>',csv:r=>r.agg.trophies.earned,csvLabel:'Trophies earned'},
    {key:'minutes',label:'Minutes per student this week',num:true,cls:'hideSm',sort:r=>r.agg.avgMinutesThisWeek,first:-1,cell:r=>U.num(r.agg.avgMinutesThisWeek),csv:r=>r.agg.avgMinutesThisWeek}];}

  // ---- everything that follows the selected scope
  function renderScope(){
    const list=all.filter(scope.test),picker=document.getElementById('scopePicker');picker.value=scope.id;
    const rows=R.groupBy(list,s=>s.student.classId).map(g=>({cls:classes.get(g.key),agg:R.aggregate(g.items)}));
    const columns=measureColumns({key:'class',label:'Class',sort:r=>r.cls.grade*100+r.cls.name.charCodeAt(r.cls.name.length-1),cell:r=>classLink(r.cls.id,r.cls.name),csv:r=>r.cls.name},
      {key:'teacher',label:'Teacher',cls:'hideSm nw',sort:r=>r.cls.teacher,cell:r=>E(r.cls.teacher),csv:r=>r.cls.teacher});
    columns.splice(2,0,{key:'school',label:'School',csvOnly:true,csv:r=>r.cls.schoolName},{key:'grade',label:'Grade',csvOnly:true,csv:r=>r.cls.grade});
    columns.push({key:'possible',label:'Trophies possible',csvOnly:true,csv:r=>r.agg.trophies.possible},{key:'note',label:'Note',csvOnly:true,csv:()=>'Fictional sample data'});
    const host=document.getElementById('classTable'),fresh=host.cloneNode(false);host.replaceWith(fresh);
    classTable=U.table(fresh,{caption:scope.label+': '+rows.length+' classes, '+list.length+' students',rows,defaultOrder:(a,b)=>a.agg.onPacePercent-b.agg.onPacePercent||b.agg.needSupport-a.agg.needSupport,columns});

    // most-missed facts
    const missed=document.getElementById('missed'),note=document.getElementById('missNote');
    if(scope.grade){
      const facts=R.mostMissed(list,{limit:8,minStudents:2});
      note.textContent='Grade '+scope.grade+': the facts the most students are stuck on right now, and the classes where each one is concentrated.';
      missed.innerHTML=facts.length?'<div class="tableWrap"><table><caption>Most-missed facts in grade '+scope.grade+'</caption><thead><tr><th scope="col">Fact</th><th scope="col">Students stuck</th><th scope="col" class="num">Misses</th><th scope="col">Where</th></tr></thead><tbody>'+facts.map(f=>{
        const where=R.groupBy(f.students,s=>s.classId).sort((a,b)=>b.items.length-a.items.length);
        return'<tr><th scope="row">'+E(f.text)+' <span class="muted">= '+E(f.answer)+'</span></th><td>'+U.bar(f.share*100,{label:f.count+' of '+f.eligible,color:'var(--accent)'})+'</td><td class="num">'+f.misses+'</td><td>'+where.map(w=>classLink(w.key,classes.get(w.key).name.replace(/^Grade \d+ · /,''))+' <span class="muted">'+w.items.length+'</span>').join(' · ')+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="empty">No fact is shared by two or more students in this grade right now.</p>';
    }else{
      const shown=grades.filter(g=>scope.test({grade:g}));
      note.textContent='The facts the most students are stuck on right now in each grade. Select a grade for the full list and the classes behind it.';
      missed.innerHTML='<div class="tableWrap"><table><caption>Most-missed facts by grade ('+E(scope.label)+')</caption><thead><tr><th scope="col">Grade</th><th scope="col">Most-missed facts and students stuck on each</th></tr></thead><tbody>'+shown.map(g=>{
        const mine=list.filter(s=>s.grade===g),facts=R.mostMissed(mine,{limit:5,minStudents:2});
        return'<tr><th scope="row"><button type="button" class="rowLink" data-scope="grade-'+g+'">Grade '+g+'</button></th><td>'+(facts.length?facts.map(f=>'<span class="chip">'+E(f.text)+' <span class="muted">· '+f.count+' of '+f.eligible+'</span></span>').join(''):'<span class="muted">Nothing shared yet</span>')+'</td></tr>';}).join('')+'</tbody></table></div>';
    }

    // trend
    const lines=scope.id==='all'?data.schools.map((s,i)=>({name:s.band+' (grades '+s.grades[0]+'–'+s.grades[s.grades.length-1]+')',short:s.band,color:BAND_COLOR[i],list:list.filter(x=>s.grades.includes(x.grade))})):[{name:scope.label,short:'',color:BAND_COLOR[0],list}];
    const weeks=R.weeklySeries(list,{today:data.today,weeks:10}),expected=weeks.map(w=>list.length?list.reduce((t,s)=>t+expectedShare(s,w.end),0)/list.length:0);
    for(const line of lines)line.weeks=R.weeklySeries(line.list,{today:data.today,weeks:10});
    const avg=w=>w.confirmedPercent;
    document.getElementById('trendNote').textContent=scope.label+', week by week: the average share of each student’s fact set that is confirmed, against the average pace line, and how many students practised.';
    document.getElementById('trendKey').innerHTML=U.chartKey(lines.map(l=>({name:l.name,color:l.color})).concat([{name:'Pace line (average)',color:GRAY,style:'dash'}]));
    const trend=document.getElementById('trendChart'),freshTrend=trend.cloneNode(false);trend.replaceWith(freshTrend);
    U.lineChart(freshTrend,{height:260,label:'Line chart: average facts confirmed by week for '+scope.label+'. Now '+U.pct(avg(weeks[weeks.length-1]))+' against a pace line of '+U.pct(expected[expected.length-1])+'.',
      x:{min:0,max:weeks.length-1,ticks:weeks.map((w,i)=>({v:i,label:U.day(w.end)}))},y:{max:100,format:v=>Math.round(v)+'%'},rightPad:lines.length>1?96:46,
      series:[{name:'Pace line',color:GRAY,style:'dash',points:expected.map((v,i)=>[i,v])},...lines.map(l=>({name:l.name,color:l.color,points:l.weeks.map((w,i)=>[i,avg(w)]),endLabel:(l.short?l.short+' ':'')+U.pct(avg(l.weeks[l.weeks.length-1]))}))],
      tip:i=>'<b>Week ending '+E(U.day(weeks[i].end))+'</b>'+lines.map(l=>E(l.short||'Average')+' '+U.pct(avg(l.weeks[i]))).join('<br>')+'<br>Pace line '+U.pct(expected[i])});
    const play=document.getElementById('playChart'),freshPlay=play.cloneNode(false);play.replaceWith(freshPlay);
    U.barChart(freshPlay,{height:260,max:100,color:'var(--series-3)',label:'Bar chart: share of students who played in each of the last ten weeks for '+scope.label+'.',format:v=>Math.round(v)+'%',
      bars:weeks.map(w=>({label:U.day(w.end),value:w.activePercent,tip:'<b>Week ending '+E(U.day(w.end))+'</b>'+w.activeStudents+' of '+list.length+' students played<br>'+U.num(w.minutesPerStudent)+' min per student'}))});
    document.getElementById('trendData').innerHTML='<details class="data"><summary>Show these numbers as a table</summary><div class="tableWrap"><table><caption>Trend by week ('+E(scope.label)+')</caption><thead><tr><th scope="col">Week ending</th>'+lines.map(l=>'<th scope="col" class="num">'+E(l.short||'Average')+' confirmed</th>').join('')+'<th scope="col" class="num">Pace line</th><th scope="col" class="num">Students who played</th><th scope="col" class="num">Minutes per student</th></tr></thead><tbody>'+
      weeks.map((w,i)=>'<tr><th scope="row">'+E(U.day(w.end,'year'))+'</th>'+lines.map(l=>'<td class="num">'+U.pct(avg(l.weeks[i]))+'</td>').join('')+'<td class="num">'+U.pct(expected[i])+'</td><td class="num">'+w.activeStudents+' of '+list.length+'</td><td class="num">'+U.num(w.minutesPerStudent)+'</td></tr>').join('')+'</tbody></table></div></details>';
  }
  function setScope(id,jump){const next=scopes.find(s=>s.id===id);if(!next)return;scope=next;const q=new URLSearchParams(location.search);if(scope.id==='all')q.delete('scope');else q.set('scope',scope.id);history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''));renderScope();
    if(jump){const target=document.getElementById('classes');target.scrollIntoView({block:'start'});document.getElementById('scopePicker').focus({preventScroll:true});}}
  view.addEventListener('change',e=>{if(e.target.id==='scopePicker')setScope(e.target.value);});
  view.addEventListener('click',e=>{
    const pick=e.target.closest('[data-scope]');if(pick)return setScope(pick.getAttribute('data-scope'),true);
    if(e.target.closest('#csvButton')&&classTable)U.download('sample-math-build-arcade-classes-'+scope.id+'-'+data.today+'.csv',classTable.csv());
  });
  U.wireTips();renderScope();
})();
