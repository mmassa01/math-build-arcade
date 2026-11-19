// Guided-tour sandbox. The tour shows the real site in frames (?tourStage=1). A tour frame
// reads the visitor's real save so it looks live, but every write stays in this frame's
// memory: Buy, practice, settings and rewards inside the tour can never change the real save.
(function(){
  'use strict';
  let tour=false;
  try{tour=new URLSearchParams(location.search).get('tourStage')==='1';}catch{}
  // A link followed inside a tour scene stays sandboxed too.
  try{const host=window.frameElement;if(host&&host.classList&&host.classList.contains('explainerStage'))tour=true;}catch{}
  if(!tour)return;
  let base=null;
  try{base=window.ArcadeStorage||window.localStorage;}catch{}
  const written=new Map(),removed=new Set();
  const read=key=>{key=String(key);if(written.has(key))return written.get(key);if(removed.has(key))return null;try{const v=base?base.getItem(key):null;return v==null?null:String(v);}catch{return null;}};
  const storage=Object.freeze({
    getItem:read,
    setItem(key,value){key=String(key);removed.delete(key);written.set(key,String(value));},
    removeItem(key){key=String(key);written.delete(key);removed.add(key);},
    clear(){written.clear();try{for(let i=0;i<(base?.length||0);i++){const k=base.key(i);if(k!=null)removed.add(k);}}catch{}},
    key(i){const keys=new Set(written.keys());try{for(let n=0;n<(base?.length||0);n++){const k=base.key(n);if(k!=null&&!removed.has(k))keys.add(k);}}catch{}return [...keys][i]??null;},
    get length(){let n=0;while(this.key(n)!=null)n++;return n;}
  });
  window.ArcadeStorage=storage;
  window.ArcadeTourSandbox=true;
  try{if(parent!==window&&parent.location.origin===location.origin&&parent.ArcadeGrade!=null&&window.ArcadeGrade==null)window.ArcadeGrade=parent.ArcadeGrade;}catch{}
})();
