(()=>{
  'use strict';
  const P=window.ArcadePractice,$=id=>document.getElementById(id),symbols={add:'+',sub:'−',mul:'×',div:'÷',mixed:'✦'};
  let active=null,question=null,tick=null,afterCheck=null,startedAt=0,announced=null;
  const narrow=()=>typeof matchMedia==='function'&&matchMedia('(max-width:620px)').matches;
  const title=p=>P.names[p];
  function meter(p,example=false){
    const current=!example&&p.id===P.getPathway(),c=p.checks,n=Math.min(3,c.passes),retention=c.nextEligible?' · retention check on or after '+c.nextEligible:'';
    return `<article class="pathCard ${current?'selected':''} ${p.earned?'earned':''}" data-path="${p.id}"><div class="pathCardHead"><span class="operationSymbol">${symbols[p.id]}</span><h3>${p.name}</h3><span class="pathTrophy" role="img" aria-label="${p.earned?'Trophy earned':'Trophy to earn'}">🏆</span></div><div class="pathBar" role="progressbar" aria-label="${p.name} practice milestones" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.practicePercent}"><i style="width:${p.practicePercent}%"></i></div><div class="pathPercent"><strong>${p.practicePercent}%</strong><span>practice milestones</span></div><p>${p.mastered} / ${p.total} facts confirmed${p.refresh?' · '+p.refresh+' need refreshing':''}</p><div class="checkDots" aria-label="${p.name}: ${n} of 3 checks passed">${[0,1,2].map(i=>`<b class="${i<n?'passed':''}">${i<n?'✓':'○'}</b>`).join('')}<span>${c.complete?'Checks confirmed':n+' / 3 checks'}${retention}</span></div>${p.id==='mixed'?`<p class="mixedRequirement">${p.operationTrophies} / 4 operation trophies · balanced mixed checks</p>`:''}${example?'':`<button class="choosePath" data-choose-path="${p.id}" aria-pressed="${current}">${current?'✓ Practicing this pathway':'Choose '+p.name}</button>`}</article>`;
  }
  function render(){
    const paths=P.progress(),selected=paths.find(p=>p.id===P.getPathway()),earned=paths.filter(p=>p.earned).length;
    $('pathCards').innerHTML=paths.map(p=>meter(p)).join('');
    $('trophyCount').textContent=earned+' of 5 trophies earned';
    $('trophyRibbon').innerHTML=paths.map(p=>`<span class="${p.earned?'lit':''}" title="${p.name}: ${p.earned?'earned':'in progress'}"><b>${p.earned?'🏆':symbols[p.id]}</b>${p.name}</span>`).join('');
    $('selectedPathLabel').textContent=selected.name+' pathway';
    $('pathStatus').textContent=selected.remaining?selected.remaining+' facts ready today. Choose any game below.':'Today’s scheduled facts are clear. Games keep going with review of the facts you know least.';
    const today=selected.checks.today;
    $('checkButton').textContent=today?'Try another 90-second check':'Start today’s 90-second check';
    const status=P.checkStatus();
    $('todayCheck').textContent=today?(today.passed?'Today’s check: passed':'Today’s check: keep practicing')+' · '+today.correct+' correct · '+Math.round(today.accuracy*100)+'% accuracy. The rest of today is practice.':status.elapsedMs?'Today’s check is under way: '+Math.ceil(status.remainingMs/1000)+' seconds of answer time to go.':'Your first 90 seconds of answering today is your check. Just pick a game.';
    const chip=$('roomCheck'),left=Math.ceil(status.remainingMs/1000);chip.hidden=typeof mode!=='undefined'&&mode!=='play';const small=narrow(),percent=today?Math.round(today.accuracy*100)+'%':'';chip.className='roomCheck'+(today&&today.passed?' done':'');chip.textContent=today?(today.passed?'✓ ':'')+(small?today.correct+' · '+percent:'Check: '+today.correct+' correct · '+percent):(small?'⏱ ':'Check ')+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');chip.setAttribute?.('aria-label',today?'Today’s check: '+today.correct+' correct, '+percent+(today.passed?', passed':''):'Check time left '+left+' seconds');
    // Announce each finished check once; checks from before this page load stay quiet.
    if(announced===null)announced=new Set(paths.map(p=>p.checks.today&&p.checks.today.id).filter(Boolean));
    if(today&&!announced.has(today.id)){announced.add(today.id);if(today.source==='game'){notify(today.passed?'✓ Today’s check passed: '+today.correct+' correct · '+Math.round(today.accuracy*100)+'%':'Today’s check: '+today.correct+' correct · '+Math.round(today.accuracy*100)+'%. Keep playing to practice.');window.arcadeToastHold=Date.now()+2600;}}
    $('storageNotice').hidden=P.storageAvailable;
    $('pathCards').querySelectorAll('[data-choose-path]').forEach(b=>b.onclick=()=>{if(typeof selected!=='undefined'&&!$('room').hidden)home();P.setPathway(b.dataset.choosePath);render();});
  }
  const ruleText=`<p class="pilotLabel">PILOT RULES · BASIC ARITHMETIC FACT FLUENCY</p><h2>Five pathways. Every game stays open.</h2><p>The same foundation set is available to everyone: addition with sums through 20, nonnegative subtraction with starting numbers through 20, multiplication through 12 × 12, and related division. Reversed addition and multiplication facts share a record. There is no grade selector. Cards with a 0 or a 1 (such as 7 + 0, 9 − 1, 6 × 1 or 8 ÷ 1) are left out, and every game shuffles its cards, bringing back first the ones you missed.</p><h3>One answer begins a card. Remembering it confirms it.</h3><ol><li>Answer independently and correctly within three seconds.</li><li>Do it again the next day or later.</li><li>Do it again at least three days after that.</li><li>Confirm it at least seven days after that.</li></ol><p>Only one milestone per fact per day. Incorrect, slow, skipped, or helped responses stay in review. A correct retry on the same day does not advance the fact. Confirmed cards return for maintenance after 14 days. A missed maintenance card needs two fresh successes on separate days, with three days between those successes. Absences never count as errors.</p><h3>Pass the 90-second check inside your game</h3><p>There is no separate test. The first 90 seconds you play each day in a pathway is that day’s check, in whichever game you choose. Every card has three seconds. At least <strong>30 correct</strong> and <strong>95% accuracy</strong>. Incorrect answers and time-outs count against accuracy. The 90 seconds counts only the time a card is waiting for your answer. Game animations, pauses and time away do not use it up, so every game gives the same chance, and it carries into your next round or game the same day. Answer every card correctly inside its three seconds and you will reach 30. Demo mode never counts. After the 90 seconds everything is still recorded as practice.</p><p>Earn three passing scores on separate days, with at least seven days between your first and last pass. Cards you have missed come first, then cards you are still learning, then cards you know, so the check gets fairer as you learn: a trophy needs every fact confirmed, and by then the whole check is drawn from facts you know.</p><h3>Earn all five trophies</h3><p>For each operation: confirm every fact and complete its three passing checks. For Mixed: earn the four operation trophies and complete three passing mixed checks on separate days across at least seven days. Each mixed check also requires at least seven correct answers per operation and 90% accuracy within each operation. Mixed practice advances the same shared fact records. You can practice and take checks in any pathway from day one.</p><p>The practice bar counts the four milestones per fact. The three check indicators are a separate requirement. Trophies already earned stay in your collection; current review needs remain visible.</p><p>These are local pilot criteria, not a nationally validated benchmark or a measure of all mathematics. Appropriate supports and response conditions should be agreed with the student’s school before using scores for decisions.</p><p>This edition saves on this browser. Individual student accounts and cross-device school monitoring are not connected yet. Existing coins and purchases are preserved; older practice can establish one starting milestone but cannot award retention or check passes.</p>`;
  $('pathRulesBody').innerHTML=ruleText;
  $('rulesButton').onclick=()=>$('pathRules').showModal();
  $('closeRules').onclick=()=>$('pathRules').close();
  function intro(callback=null){
    afterCheck=callback;
    $('checkIntro').hidden=false;$('checkRunning').hidden=true;$('checkResult').hidden=true;
    $('checkTitle').textContent=title(P.getPathway())+' · 90-second check';
    const s=P.progress().find(p=>p.id===P.getPathway());
    $('checkIntroCopy').textContent='At least 30 correct with 95% accuracy.'+(P.getPathway()==='mixed'?' Mixed also needs at least 7 correct in every operation, with 90% accuracy in each.':'')+' Enter each answer, then press Enter or Send. Skips count as incorrect. No game animations run during the check.';
    $('checkOfficialNote').textContent=s.checks.today?'You already have today’s official score for this pathway. This is an extra practice check.':'This will be today’s official score for this pathway. Three passing days must span at least seven days.';
    $('checkContinue').textContent=callback?'Continue to your game':'Back to pathways';
    $('checkDialog').showModal();
  }
  function showQuestion(){question=active.next();if(!question)return; $('checkQuestion').textContent=question.text+' = ?';$('checkOperation').textContent=title(question.op);$('checkAnswer').value='';$('checkAnswer').focus();}
  function end(interrupted=false){
    if(!active)return;clearInterval(tick);tick=null;
    const result=active.finish({interrupted});active=null;question=null;
    $('checkRunning').hidden=true;$('checkIntro').hidden=true;$('checkResult').hidden=false;
    $('resultTitle').textContent=!result.valid?'Check interrupted':result.passed?(result.official?'Passing check recorded!':'Practice goal reached!'):'Good practice. Keep building.';
    $('resultScore').textContent=result.correct+' correct · '+result.attempts+' attempted · '+Math.round(result.accuracy*100)+'% accuracy';
    $('resultDetails').replaceChildren();
    for(const [op,v]of Object.entries(result.byOperation)){if(result.pathway!=='mixed'&&result.pathway!==op)continue;const p=document.createElement('p');p.textContent=title(op)+': '+v.correct+' / '+v.attempts+' correct ('+Math.round(v.accuracy*100)+'%)';$('resultDetails').append(p);}
    $('resultNote').textContent=!result.valid?'The full uninterrupted 90 seconds are required. This check earns no pass. Your practice history is retained.':result.official?(result.passed?'One passing day recorded. Your next qualifying pass must be on another day.':'Today’s official score is saved. Extra practice remains open; your next qualifying check is another day.'):'Extra practice result saved. Only the first completed check each day counts toward a trophy.';
    // An interrupted check is not official, so the game gate is still closed:
    // offer the check again instead of a game that would bounce the student out.
    if(!result.valid&&afterCheck){const callback=afterCheck;afterCheck=()=>intro(callback);$('checkContinue').textContent='Try the check again';}
    render();
  }
  function start(){
    active=P.startCheck();startedAt=performance.now();$('checkIntro').hidden=true;$('checkRunning').hidden=false;$('checkResult').hidden=true;$('checkClock').textContent='1:30';$('checkLiveCount').textContent='0 answered';$('checkRunning').dataset.responses='0';showQuestion();
    tick=setInterval(()=>{if(!active)return;const n=Math.ceil(active.remaining()/1000);$('checkClock').textContent=Math.floor(n/60)+':'+String(n%60).padStart(2,'0');if(n<=0)end();},80);
  }
  function submit(skip=false){if(!active||!question)return;if(active.remaining()<=0){end();return;}const text=$('checkAnswer').value.trim();if(!skip&&!/^\d{1,3}$/.test(text))return;const r=active.answer(question.token,skip?null:Number(text));if(!r.accepted){end();return;}const count=Number($('checkRunning').dataset.responses)+1;$('checkRunning').dataset.responses=count;$('checkLiveCount').textContent=count+' answered';showQuestion();}
  $('checkButton').onclick=()=>intro();$('beginCheck').onclick=start;
  $('checkForm').onsubmit=e=>{e.preventDefault();submit();};$('skipCheck').onclick=()=>submit(true);
  $('checkPad').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!active)return;const input=$('checkAnswer');if(b.dataset.key==='clear')input.value='';else if(b.dataset.key==='back')input.value=input.value.slice(0,-1);else if(input.value.length<3)input.value+=b.dataset.key;input.focus();});
  $('checkAnswer').oninput=e=>{e.target.value=e.target.value.replace(/[^0-9]/g,'').slice(0,3);};
  function closeCheck(){if(active){end(true);return;}$('checkDialog').close();afterCheck=null;}
  $('closeCheck').onclick=closeCheck;$('checkDialog').addEventListener('cancel',e=>{e.preventDefault();closeCheck();});
  // However the dialog closes, a check can never keep running out of sight.
  $('checkDialog').addEventListener('close',()=>{if(!active)return;clearInterval(tick);tick=null;try{active.finish({interrupted:true});}catch(e){}active=null;question=null;render();});
  $('checkContinue').onclick=()=>{const callback=afterCheck;afterCheck=null;$('checkDialog').close();callback?.();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)end(true);});
  // Every game stays open: Let's play goes straight to the game. The 90-second
  // check is optional and starts only from its own button on the pathways panel.
  window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('game').contentWindow)return;if(['arcade-practice-progress','arcade-mode','arcade-ready'].includes(e.data?.type))render();});
  // A guided example exercises the real rules with an isolated, in-memory
  // learner and simulated dates. It never reads or writes the player record.
  let example=null,exampleStep=0,exampleNow=0;
  const exampleBase=new Date(2026,0,5,12).getTime(),dayMs=86400000;
  function examplePractice(offset){exampleNow=exampleBase+offset*dayMs;example.setPathway('mixed');const run=example.begin();let q,guard=0;while((q=run.next())&&guard++<700)run.record(q,true,1000);}
  function exampleCheck(p,offset){exampleNow=exampleBase+offset*dayMs;example.setPathway(p);const check=example.startCheck();for(let i=0;i<30;i++){const q=check.next();exampleNow+=2000;check.answer(q.token,q.answer);}exampleNow+=30000;return check.finish();}
  function drawExample(){const labels=['A new learner: every game and pathway is open.','First successful day: practice bars advance, but no facts are confirmed.','Next-day success: two milestones per fact. Still no mastery trophy.','Three-day review: three milestones. Retention is still to come.','Seven-day retention: facts confirmed. Check indicators are still empty.','Two passing check days: no trophies yet. Three days must span a week.','Final operation checks: four trophies earned. Mixed still needs its last pass.','Balanced mixed check: the fifth trophy is earned.'];$('exampleCaption').textContent=labels[exampleStep];$('exampleCards').innerHTML=example.progress().map(p=>meter(p,true)).join('');$('exampleNext').textContent=exampleStep===7?'Restart example':'Show next milestone';$('exampleBadge').textContent=example.progress().filter(p=>p.earned).length+' / 5 example trophies';}
  function resetExample(){exampleNow=exampleBase;example=P.create(null,()=>exampleNow,()=>.47);exampleStep=0;drawExample();}
  $('exampleButton').onclick=()=>{resetExample();$('progressionExample').showModal();};$('closeExample').onclick=()=>$('progressionExample').close();
  $('exampleNext').onclick=()=>{if(exampleStep===7){resetExample();return;}exampleStep++;if(exampleStep<=4)examplePractice([0,0,1,4,11][exampleStep]);if(exampleStep===5)for(const offset of [11,12])for(const p of P.pathways)exampleCheck(p,offset);if(exampleStep===6)for(const p of ['add','sub','mul','div'])exampleCheck(p,18);if(exampleStep===7)exampleCheck('mixed',18);drawExample();};
  $('downloadProgress').onclick=()=>{const data=JSON.stringify(P.exportRecord(),null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='arcade-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  window.PathwayUI={render,requestCheck:intro};render();
  // A shared or restored game URL must still start on the arcade landing page.
  // Only an explicit Play/check click should open the fluency-check dialog.
  if(worlds[location.hash.slice(1)])history.replaceState(null,'',location.pathname+location.search);
})();
