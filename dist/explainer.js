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
    {at:0,title:'What if every student were fluent?',copy:'Imagine the mathematics McIntosh County students could reach when basic fact recall no longer stands in the way.',src:'./?tourStage=1'},
    {at:56,title:'Meet Maya',copy:'A fictional third grader helps us follow one continuous learning record across the real system.',src:'./?tourStage=1'},
    {at:83,title:'Dragon Sky Quest',copy:'A fluent answer lands the fire strike while demo mode protects coins and progress.',src:'dragon/index.html?v=review-56',action:'#demo'},
    {at:90,title:'Skyrail Subway Run',copy:'The runner follows the golden trail and answers the same timed facts.',src:'races/subway.html?v=review-56',action:'#demo',continuation:true},
    {at:95,title:'Ping-Pong Rally',copy:'Correct answers move the paddle and charge a power shot.',src:'pong/index.html?v=review-56',action:'#demo',continuation:true},
    {at:100,title:'Seed of Genius',copy:'Real growth footage makes learning across time visible.',src:'seed/index.html?v=review-56',action:'#previewVideo',continuation:true},
    {at:110,title:'Horse Race',copy:'Cleared and practice facts drive the pace horse around Tiger Downs.',src:'races/horse.html?v=review-56',action:'#horseDemo',continuation:true},
    {at:114,title:'Dirt Track Championship',copy:'Correct answers charge the nitro while the student chases the gold pace car.',src:'dirt/index.html?v=review-56',action:'#demo',continuation:true},
    {at:117,title:'Wave Riders Ignition',copy:'Fluent recall powers a hydro boost across the coastal course.',src:'wave/index.html?v=review-56',action:'#demo',continuation:true},
    {at:121,title:'Castle in the Clouds',copy:'Each cleared fact adds visible progress to a floating kingdom.',src:'castle/index.html?v=review-56',action:'#demo',continuation:true},
    {at:124,title:'Neon Auto Shop',copy:'Students power up a dream racer while the same facts move between cleared and practice.',src:'hangar/index.html?v=review-56',action:'#demo',continuation:true},
    {at:128,title:'Star Defenders',copy:'Fast facts fire the ship, charge the super laser, and protect the galaxy.',src:'invaders/index.html?v=review-56',action:'#demo',continuation:true},
    {at:136,title:'Five connected pathways',copy:'Addition, Subtraction, Multiplication, Division, and Mixed all use one shared learner record.',src:'./?tourStage=1',transition:'fade'},
    {at:143,title:'A working hand, not the whole deck',copy:'Maya receives 24 due cards selected from missed, practice, and cleared facts.',src:'races/horse.html?v=review-56',action:'#horseDemo'},
    {at:177,title:'What the system measures',copy:'Only answer time counts. Accuracy, speed, and repeated success determine whether a fact advances.',src:'races/horse.html?v=review-56'},
    {at:218,title:'Evidence that lasts',copy:'Confirmed facts return after fourteen days so durable recall matters more than one strong session.',src:'seed/index.html?v=review-56',action:'#previewVideo',transition:'fade'},
    {at:229,title:'The daily check',copy:'A 90-second check uses the same timed facts and stays separate from coins and game rewards.',src:'./?tourStage=1',transition:'fade'},
    {at:277,title:'Trophies represent evidence',copy:'Operation trophies require confirmed facts and repeated passing checks across different days.',src:'./?tourStage=1',action:'#exampleButton'},
    {at:288,title:'Rewards support the journey',copy:'Coins and gear make progress visible, but demo mode never changes a student record.',src:'store.html?v=dragons-33'},
    {at:303,title:'What should I teach next?',copy:'The teacher report ranks facts, identifies exact students, and creates practical instructional groups.',src:'educators/',focus:'#teachTitle',transition:'fade'},
    {at:359,title:'What does Maya need?',copy:'The student report separates coverage, fluent recall, and retention, then shows the evidence behind each conclusion.',src:'educators/?class=g3a&student=s0053',focus:'#studentTitle',transition:'fade'},
    {at:423,title:'A district view of growth',copy:'Leaders can compare grades and classes while keeping participation separate from demonstrated fluency.',src:'district.html',transition:'fade'},
    {at:465,title:'Back to Tiger Downs',copy:'The closing returns to Horse Race because gameplay and the learning record are one connected experience.',src:'races/horse.html?v=review-56',action:'#horseDemo',transition:'fade'},
    {at:488,title:'One continuous learning story',copy:'The games motivate practice while reports turn each answer into useful instructional evidence.',src:'./?tourStage=1',transition:'fade'},
    {at:518,title:'Fluency is built, not guessed',copy:'Ten adventures, one continuous learning story, and a stronger mathematical foundation for McIntosh County.',src:'./?tourStage=1',continuation:true}
  ];
  let sceneIndex=-1;
  let pendingAction='';
  let pendingFocus='';
  let stageLoadTimer=0;
  let stageActionTimer=0;
  let stageTransitionTimer=0;
  let stageLoadToken=0;
  let pendingStageSrc='';
  let pendingTransition='';
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
  function settleTransition(){
    clearTimeout(stageTransitionTimer);
    activeStage.hidden=false;
    standbyStage.hidden=true;
    for(const frame of [activeStage,standbyStage])frame.classList.remove('is-incoming','is-outgoing');
  }
  function finishStageLoad(token,frame){
    if(token!==stageLoadToken||frame!==standbyStage||!pendingStageSrc||frame.getAttribute('src')!==pendingStageSrc||!frameReady(frame))return;
    clearTimeout(stageLoadTimer);
    const previous=activeStage;
    frame.hidden=false;
    activeStage=frame;
    standbyStage=previous;
    loading.hidden=true;
    const action=pendingAction;
    const focus=pendingFocus;
    const transition=pendingTransition;
    pendingAction='';
    pendingFocus='';
    pendingStageSrc='';
    pendingTransition='';
    if(transition==='fade'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      activeStage.classList.add('is-incoming');
      standbyStage.classList.add('is-outgoing');
      stageTransitionTimer=setTimeout(settleTransition,480);
    }else{
      settleTransition();
    }
    clearTimeout(stageActionTimer);
    if(action||focus)stageActionTimer=setTimeout(()=>{runAction(action,activeStage);focusScene(focus,activeStage);},450);
  }
  function showScene(index,force){
    const next=scenes[Math.max(0,Math.min(scenes.length-1,index))];
    chapterNumber.textContent='Chapter '+chapterFor(index)+' of '+chapterCount;
    chapterTitle.textContent=next.title;
    chapterCopy.textContent=next.copy;
    if(!force&&sceneIndex===index)return;
    settleTransition();
    sceneIndex=index;
    pendingAction=next.action||'';
    pendingFocus=next.focus||'';
    pendingTransition=next.transition||'';
    const token=++stageLoadToken;
    clearTimeout(stageLoadTimer);
    clearTimeout(stageActionTimer);
    loading.hidden=false;
    loading.textContent='Opening '+next.title+'...';
    const current=activeStage.getAttribute('src')||'';
    if(current===next.src){loading.hidden=true;pendingAction='';pendingFocus='';pendingStageSrc='';pendingTransition='';runAction(next.action||'',activeStage);focusScene(next.focus||'',activeStage);return;}
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
  function close(){audio.pause();clearTimeout(stageLoadTimer);clearTimeout(stageActionTimer);settleTransition();stageLoadToken++;pendingAction='';pendingFocus='';pendingStageSrc='';pendingTransition='';loading.hidden=true;sceneIndex=-1;for(const frame of [activeStage,standbyStage]){try{frame.contentWindow.postMessage({type:'arcade-pause'},location.origin);}catch(error){console.info('Explainer scene pause was not available.',error);}}if(dialog.open)dialog.close();document.documentElement.style.overflow='';}
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
    audio.addEventListener('loadedmetadata',()=>{seek.max=String(audio.duration||524.856);sync();});
  }
  if(isLoopback)window.__FluencyExplainerQA={showScene};
  if(Number.isInteger(qaScene)&&qaScene>=0&&qaScene<scenes.length){dialog.showModal();document.documentElement.style.overflow='hidden';showScene(qaScene,true);}
  else sync();
})();
