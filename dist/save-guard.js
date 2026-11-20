// Public-site save guard. Progress lives in this browser's localStorage, so two open tabs
// would each save their own copy and silently overwrite the other. The newest tab takes over;
// an older tab stops saving and says the arcade is open in another tab. A save the browser
// refuses (storage full or blocked) is shown instead of being lost silently.
// Inert when a host already supplies ArcadeStorage: Pathway's signed-in bootstrap (which has
// its own server-side revision lock) and the guided-tour sandbox.
(function(){
  'use strict';
  if(window.ArcadeStorage)return;
  let real=null;
  try{real=window.localStorage;real.getItem('mathArcadeActiveTab.v1');}catch{return;}
  if(!real)return;
  const CLAIM='mathArcadeActiveTab.v1';
  const me={id:Math.random().toString(36).slice(2)+Date.now().toString(36),at:Date.now()};
  let locked=false,failing=false,notice=null,warning=null;
  const parse=v=>{try{const c=JSON.parse(v);return c&&typeof c.id==='string'&&Number.isFinite(c.at)?c:null;}catch{return null;}};
  const newer=(a,b)=>a.at>b.at||(a.at===b.at&&a.id>b.id);
  function el(tag,props,css){const n=document.createElement(tag);Object.assign(n,props||{});if(css)n.style.cssText=css;return n;}
  function lock(){
    if(locked)return;locked=true;
    try{const game=document.getElementById('game');if(game&&game.contentWindow)game.contentWindow.postMessage({type:'arcade-pause'},location.origin);}catch{}
    for(const dialog of document.querySelectorAll('dialog[open]'))try{dialog.close();}catch{}
    notice=el('section',{id:'tabGuardNotice',className:'tabGuardNotice'},'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:#1a1036e6;color:#fff;font:600 18px/1.45 system-ui,sans-serif;text-align:center');
    notice.setAttribute('role','alertdialog');notice.setAttribute('aria-modal','true');notice.setAttribute('aria-labelledby','tabGuardTitle');
    const panel=el('div',null,'max-width:440px;border:2px solid #ffe89888;border-radius:24px;padding:28px;background:linear-gradient(140deg,#674099,#30234f);box-shadow:0 20px 70px #0006');
    const title=el('h2',{id:'tabGuardTitle',textContent:'Math Arcade is open in another tab'},'margin:0 0 10px;font-size:26px');
    const text=el('p',{textContent:'Your progress is safe there. This tab has stopped saving so the two tabs cannot overwrite each other.'},'margin:0 0 18px;font-weight:500');
    const button=el('button',{type:'button',textContent:'Play in this tab instead'},'font:inherit;font-weight:800;border:0;border-radius:14px;padding:12px 22px;background:#ffe27d;color:#2a1650;cursor:pointer');
    button.onclick=()=>location.reload();
    panel.append(title,text,button);notice.append(panel);(document.body||document.documentElement).append(notice);
    try{button.focus();}catch{}
  }
  function showFailure(){
    if(failing)return;failing=true;
    if(!warning){warning=el('p',{id:'saveFailedNotice',className:'saveFailedNotice',textContent:'Your progress is not saving: this browser’s storage is full or turned off. Tell a grown-up. (Tap to hide)'},'position:fixed;left:8px;right:8px;top:6px;z-index:2147483646;max-width:560px;box-sizing:border-box;margin:0 auto;padding:6px 12px;border-radius:12px;cursor:pointer;background:#7c2e49;color:#fff;font:700 13px/1.35 system-ui,sans-serif;box-shadow:0 6px 18px #0006;text-align:center');warning.setAttribute('role','alert');warning.addEventListener?.('click',()=>{warning.hidden=true;});}
    (document.body||document.documentElement).append(warning);warning.hidden=false;
  }
  function clearFailure(){if(!failing)return;failing=false;if(warning)warning.hidden=true;}
  const storage={
    // Browser storage has a size limit, so the practice engine keeps this save bounded (Pathway's server-backed storage never sets this).
    browserLocal:true,
    getItem:key=>real.getItem(key),
    setItem(key,value){if(locked)return;try{real.setItem(key,value);clearFailure();}catch(error){showFailure();throw error;}},
    removeItem(key){if(locked)return;real.removeItem(key);},
    key:index=>real.key(index),
    get length(){return real.length;}
  };
  window.ArcadeStorage=storage;
  window.ArcadeSaveGuard={get locked(){return locked;},get failing(){return failing;},id:me.id};
  try{real.setItem(CLAIM,JSON.stringify(me));}catch{}
  function verify(){const owner=parse(real.getItem(CLAIM));if(owner&&owner.id!==me.id&&newer(owner,me))lock();}
  try{window.addEventListener('storage',event=>{if(event.key===CLAIM){const owner=parse(event.newValue);if(owner&&owner.id!==me.id&&newer(owner,me))lock();}});}catch{}
  try{document.addEventListener('visibilitychange',()=>{if(!document.hidden)verify();});}catch{}
  // Back/forward cache: this page's memory may be older than the save; reload rather than overwrite.
  try{window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});}catch{}
})();
