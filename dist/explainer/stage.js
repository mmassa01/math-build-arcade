// Holds one game scene of the guided tour. The game treats this page as its arcade, so it
// practises against the tour's in-memory copy (tour-sandbox.js), never the real save.
(function(){
  'use strict';
  const frame=document.getElementById('scene');
  let scene='';
  try{scene=new URLSearchParams(location.search).get('scene')||'';}catch{}
  // Only a same-site relative game route may load here.
  if(!/^[a-z0-9][a-z0-9_\-/]*\.html(?:\?[a-z0-9=&._\-]*)?$/i.test(scene)||scene.includes('..'))return;
  frame.src='../'+scene;
  window.ArcadeTourScene=frame;
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||!event.data||typeof event.data!=='object')return;
    if(event.source===parent&&parent!==window){try{frame.contentWindow.postMessage(event.data,location.origin);}catch{}return;}
    if(event.source===frame.contentWindow&&event.data.type==='arcade-ready'){try{parent.postMessage({type:'arcade-ready'},location.origin);}catch{}}
  });
})();
