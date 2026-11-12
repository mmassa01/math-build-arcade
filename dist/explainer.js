(function(){
  'use strict';
  const params=new URLSearchParams(location.search);
  const isLoopback=location.hostname==='127.0.0.1'||location.hostname==='localhost';
  const qaScene=isLoopback&&params.has('tourScene')?Number(params.get('tourScene')):NaN;
  const qaMode=Number.isInteger(qaScene)&&qaScene>=0;
  const openButton=document.getElementById('openExplainer');
  if(params.get('tourStage')==='1'){
    document.body.classList.add('explainer-stage');
    if(openButton)openButton.hidden=true;
    return;
  }
  const dialog=document.getElementById('explainerDialog');
  if(!openButton||!dialog)return;
  const audio=document.getElementById('explainerAudio');
  let activeStage=document.getElementById('explainerStage');
  let standbyStage=document.getElementById('explainerStageNext');
  const loading=document.getElementById('explainerLoading');
  const play=document.getElementById('explainerPlay');
  const seek=document.getElementById('explainerSeek');
  const time=document.getElementById('explainerTime');
  const chapterNumber=document.getElementById('explainerChapterNumber');
  const chapterTitle=document.getElementById('explainerChapterTitle');
  const chapterCopy=document.getElementById('explainerChapterCopy');
  const caption=document.querySelector('.explainerCaption');
  const scenes=[
    {at:0,title:'Why fluency matters',copy:'Math fluency creates room for students to reason, solve, notice patterns, and explain.',src:'./?tourStage=1'},
    {at:55,title:'Looking through the real system',copy:'The tour moves through the actual arcade, pathways, game demos, and reporting pages.',src:'./?tourStage=1'},
    {at:76,title:'Meet Maya',copy:'A fictional third grader helps us follow one continuous learning record across every adventure.',src:'./?tourStage=1'},
    {at:108,title:'Dragon Sky Quest',copy:'A fluent answer lands the fire strike while demo mode protects coins and progress.',src:'dragon/index.html?v=review-56',action:'#demo'},
    {at:125,title:'Skyrail Subway Run',copy:'The runner follows the golden trail, changes lanes, and answers the same timed facts.',src:'races/subway.html?v=review-56',action:'#demo'},
    {at:146,title:'Ping-Pong Rally',copy:'The computer returns the ball while correct answers move the paddle and charge a power shot.',src:'pong/index.html?v=review-56',action:'#demo'},
    {at:165,title:'Seed of Genius',copy:'Real growth footage makes learning across time visible as roots emerge and the plant rises.',src:'seed/index.html?v=review-56',action:'#previewVideo'},
    {at:183,title:'Five connected pathways',copy:'Addition, Subtraction, Multiplication, Division, and Mixed all use one shared learner record.',src:'./?tourStage=1'},
    {at:220,title:'Horse Race',copy:'The cleared and practice facts now drive the pace horse around Tiger Downs.',src:'races/horse.html?v=review-56',action:'#horseDemo'},
    {at:279,title:'Dirt Track Championship',copy:'Correct answers charge the nitro while the student chases the gold pace car.',src:'dirt/index.html?v=review-56',action:'#demo'},
    {at:300,title:'Wave Riders Ignition',copy:'The same fluent-recall rule powers a hydro boost across the coastal course.',src:'wave/index.html?v=review-56',action:'#demo',continuation:true},
    {at:322,title:'Castle in the Clouds',copy:'Each cleared fact adds visible progress to a floating kingdom.',src:'castle/index.html?v=review-56',action:'#demo',continuation:true},
    {at:346,title:'Neon Auto Shop',copy:'Students power up a dream racer while the same facts move between cleared and practice.',src:'hangar/index.html?v=review-56',action:'#demo',continuation:true},
    {at:370,title:'Star Defenders',copy:'Fast facts fire the ship, charge the super laser, and protect the galaxy.',src:'invaders/index.html?v=review-56',action:'#demo',continuation:true},
    {at:396,title:'Growth across time',copy:'Confirmed facts return after fourteen days so durable recall matters more than one strong session.',src:'seed/index.html?v=review-56',action:'#previewVideo'},
    {at:448,title:'The daily check',copy:'A 90-second check uses the same timed facts and remains separate from coins and game rewards.',src:'./?tourStage=1'},
    {at:504,title:'One playable learning event',copy:'Maya can choose any adventure while the system records due facts, timing, practice, and checks.',src:'./?tourStage=1'},
    {at:537,title:'Trophy journey',copy:'Every operation trophy requires confirmed facts and repeated passing checks across days.',src:'./?tourStage=1',action:'#exampleButton'},
    {at:592,title:'Rewards support the journey',copy:'Coins and gear make progress visible, but demo mode never changes a student record.',src:'store.html?v=dragons-33'},
    {at:649,title:'Teacher report',copy:'Fictional sample data shows what to teach next, ready-made groups, milestone position, and class growth.',src:'educators/'},
    {at:683,title:'Student detail',copy:'The student report separates confirmed, not started, and stuck facts, then shows pace, pathways, and check history.',src:'educators/?class=g3a&student=s0053',focus:'#studentTitle'},
    {at:715,title:'District report',copy:'Leaders can compare grades and classes, find most-missed facts, and follow participation and confirmation trends.',src:'district.html'},
    {at:756,title:'One connected picture of growth',copy:'Authentic game action and useful instructional evidence stay connected without confusing speed with all of mathematics.',src:'./?tourStage=1'},
    {at:811,title:'Back to Tiger Downs',copy:'Maya chooses Horse Race, answers the card, and watches her horse move while the same honest learning record continues underneath.',src:'races/horse.html?v=review-56',action:'#horseDemo',continuation:true},
    {at:900,title:'Fluency is built, not guessed',copy:'Ten adventures, one continuous learning story, and evidence that grows with the learner.',src:'./?tourStage=1',continuation:true}
  ];
  let sceneIndex=-1;
  let pendingAction='';
  let pendingFocus='';
  let stageLoadTimer=0;
  let stageActionTimer=0;
  let stageLoadToken=0;
  let pendingStageSrc='';
  const chapterCount=scenes.reduce((count,scene)=>count+(scene.continuation?0:1),0);
  function format(value){const seconds=Math.max(0,Math.floor(Number(value)||0)),m=Math.floor(seconds/60),s=seconds%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
  function indexFor(value){let result=0;const position=Number(value||0)+0.35;for(let i=1;i<scenes.length;i++){if(position>=scenes[i].at)result=i;else break;}return result;}
  function chapterFor(index){let chapter=0;for(let i=0;i<=index;i++)if(!scenes[i].continuation)chapter++;return chapter;}
  function runAction(selector,frame=activeStage){
    if(!selector)return;
    try{
      const doc=frame.contentDocument;
      const target=doc&&doc.querySelector(selector);
      if(target&&!target.disabled)target.click();
    }catch(error){console.info('Explainer scene action was not available.',error);}
  }
  function focusScene(selector,frame=activeStage){
    if(!selector)return;
    try{
      const doc=frame.contentDocument;
      const target=doc&&doc.querySelector(selector);
      const section=target&&(target.closest('.card')||target);
      if(section){
        const sticky=doc.querySelector('.sampleLabel');
        const offset=(sticky?sticky.getBoundingClientRect().height:0)+18;
        const top=section.getBoundingClientRect().top+frame.contentWindow.scrollY-offset;
        frame.contentWindow.scrollTo({top:Math.max(0,top),behavior:'auto'});
      }
    }catch(error){console.info('Explainer scene focus was not available.',error);}
  }
  function frameReady(frame){
    try{return Boolean(frame.contentDocument&&frame.contentDocument.readyState!=='loading'&&frame.contentDocument.body&&frame.contentDocument.body.childElementCount);}
    catch(error){return false;}
  }
  function finishStageLoad(token,frame){
    if(token!==stageLoadToken||frame!==standbyStage||!pendingStageSrc||frame.getAttribute('src')!==pendingStageSrc||!frameReady(frame))return;
    clearTimeout(stageLoadTimer);
    activeStage.hidden=true;
    frame.hidden=false;
    const previous=activeStage;
    activeStage=frame;
    standbyStage=previous;
    loading.hidden=true;
    const action=pendingAction;
    const focus=pendingFocus;
    pendingAction='';
    pendingFocus='';
    pendingStageSrc='';
    clearTimeout(stageActionTimer);
    if(action||focus)stageActionTimer=setTimeout(()=>{runAction(action,activeStage);focusScene(focus,activeStage);},450);
  }
  function showScene(index,force){
    const next=scenes[Math.max(0,Math.min(scenes.length-1,index))];
    chapterNumber.textContent='Chapter '+chapterFor(index)+' of '+chapterCount;
    chapterTitle.textContent=next.title;
    chapterCopy.textContent=next.copy;
    if(!force&&sceneIndex===index)return;
    sceneIndex=index;
    pendingAction=next.action||'';
    pendingFocus=next.focus||'';
    const token=++stageLoadToken;
    clearTimeout(stageLoadTimer);
    clearTimeout(stageActionTimer);
    loading.hidden=false;
    loading.textContent='Opening '+next.title+'...';
    const current=activeStage.getAttribute('src')||'';
    if(current===next.src){loading.hidden=true;pendingAction='';pendingFocus='';runAction(next.action||'',activeStage);focusScene(next.focus||'',activeStage);return;}
    pendingStageSrc=next.src;
    standbyStage.hidden=true;
    standbyStage.setAttribute('src',next.src);
    stageLoadTimer=setTimeout(()=>{
      if(frameReady(standbyStage))finishStageLoad(token,standbyStage);
      else loading.hidden=true;
    },2200);
  }
  activeStage.addEventListener('load',event=>finishStageLoad(stageLoadToken,event.currentTarget));
  standbyStage.addEventListener('load',event=>finishStageLoad(stageLoadToken,event.currentTarget));
  function sync(){
    const current=Number(audio.currentTime)||0;
    seek.value=String(current);
    time.textContent=format(current);
    showScene(indexFor(current),false);
    play.textContent=audio.paused?'Play':'Pause';
  }
  function start(){
    if(!dialog.open)dialog.showModal();
    document.documentElement.style.overflow='hidden';
    showScene(indexFor(audio.currentTime),true);
    const request=audio.play();
    if(request&&request.catch)request.catch(()=>{play.textContent='Play';});
  }
  function close(){audio.pause();clearTimeout(stageLoadTimer);clearTimeout(stageActionTimer);stageLoadToken++;pendingAction='';pendingFocus='';pendingStageSrc='';loading.hidden=true;sceneIndex=-1;for(const frame of [activeStage,standbyStage]){try{frame.contentWindow.postMessage({type:'arcade-pause'},location.origin);}catch(error){console.info('Explainer scene pause was not available.',error);}}if(dialog.open)dialog.close();document.documentElement.style.overflow='';}
  openButton.addEventListener('click',start);
  document.getElementById('closeExplainer').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  play.addEventListener('click',()=>{if(audio.paused)audio.play();else audio.pause();});
  document.getElementById('explainerBack').addEventListener('click',()=>{const target=Math.max(0,indexFor(audio.currentTime)-1);audio.currentTime=scenes[target].at;showScene(target,true);});
  document.getElementById('explainerNext').addEventListener('click',()=>{const target=Math.min(scenes.length-1,indexFor(audio.currentTime)+1);audio.currentTime=scenes[target].at;showScene(target,true);});
  document.getElementById('explainerCaptions').addEventListener('click',event=>{const on=event.currentTarget.getAttribute('aria-pressed')==='true';event.currentTarget.setAttribute('aria-pressed',String(!on));event.currentTarget.textContent=on?'Captions off':'Captions on';caption.hidden=on;});
  seek.addEventListener('input',()=>{audio.currentTime=Number(seek.value);showScene(indexFor(audio.currentTime),false);sync();});
  if(!qaMode){
    audio.addEventListener('timeupdate',sync);
    audio.addEventListener('play',sync);
    audio.addEventListener('pause',sync);
    audio.addEventListener('ended',()=>{audio.currentTime=0;sync();});
    audio.addEventListener('loadedmetadata',()=>{seek.max=String(audio.duration||909.072);sync();});
  }
  if(isLoopback)window.__FluencyExplainerQA={showScene};
  if(Number.isInteger(qaScene)&&qaScene>=0&&qaScene<scenes.length){dialog.showModal();document.documentElement.style.overflow='hidden';showScene(qaScene,true);}
  else sync();
})();
