// The guided tour can never change the real save: pages run on an in-memory copy, games run
// inside a sandboxed stage, captions sit above the scene, and no scene loads before the tour opens.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function realStorage(seed){const m=new Map(Object.entries(seed));return{m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}}}
function page(search,{frameClass=null,seed={}}={}){const ls=realStorage(seed);const win={location:{search,origin:'https://arcade.test'},localStorage:ls,frameElement:frameClass?{classList:{contains:c=>c===frameClass}}:null,URLSearchParams,console};win.window=win;win.parent=win;vm.createContext(win);vm.runInContext(read('dist/tour-sandbox.js'),win);return{win,ls}}
// 1. Outside the tour nothing changes.
{const {win}=page('');assert.equal(win.ArcadeStorage,undefined,'the public site keeps its normal storage');}
// 2. A tour page reads the real save but writes only to memory.
const profile=(()=>{const st=realStorage({});const E=require('../dist/economy.js').create(st);for(let i=0;i<50;i++)E.reward(10,'seed:'+i);E.setJourney(439,439,[]);return st.m.get('mathArcadeProfile.v1')})();
for(const [search,frameClass] of [['?tourStage=1',null],['',"explainerStage"]]){
  const {win,ls}=page(search,{frameClass,seed:{'mathArcadeProfile.v1':profile,'arcadeRoundSeconds.v1':'120'}});
  assert(win.ArcadeStorage&&win.ArcadeTourSandbox,'tour frames get the sandbox ('+(search||'followed link')+')');
  const E=require('../dist/economy.js').create(win.ArcadeStorage);assert.equal(E.getState().coins,500,'the tour shows the real coins');
  const item=E.catalog.find(v=>v.price>0&&v.price<=500);assert(item,'something affordable');
  assert(E.purchase(item.id).ok,'Buy works inside the tour');assert(E.getState().coins<500);
  E.reward(10,'tour:1');win.ArcadeStorage.setItem('arcadeRoundSeconds.v1','300');win.ArcadeStorage.removeItem('mathArcadeProfile.v1');
  assert.equal(ls.m.get('mathArcadeProfile.v1'),profile,'the real coins and store are untouched');assert.equal(ls.m.get('arcadeRoundSeconds.v1'),'120','real settings untouched');
  const P=require('../dist/practice-pathways.js').create(win.ArcadeStorage,()=>new Date(2026,10,18,12).getTime(),()=>.4);const run=P.begin({endless:true});const q=run.next();run.record(q,true,900);
  assert(!ls.m.has('mathArcadePathways.v2'),'tour practice never reaches the real record');
}
// 3. Every scene runs sandboxed: pages carry tourStage, games run inside the stage, reports are isolated.
const script=read('dist/explainer.js');const scenes=[...script.matchAll(/src:'([^']+)'/g)].map(m=>m[1]);assert(scenes.length>=20);
const stageSrc=eval('('+script.match(/function stageSrc[^\n]*/)[0].replace(/^function stageSrc/,'function')+')');
for(const src of scenes){const s=stageSrc({src});
  if(/^(?:educators\/|district\.html)/.test(s)){const html=read('dist/'+(s.startsWith('district')?'district.html':'educators/index.html'));assert(html.indexOf('reporting/isolate.js')>=0&&html.indexOf('reporting/isolate.js')<html.indexOf('practice-pathways.js'),s+' reads no player save');continue}
  if(s.startsWith('explainer/stage.html')){assert.equal(decodeURIComponent(s.split('scene=')[1]),src);continue}
  assert(/[?&]tourStage=1/.test(s),src+' runs in the sandbox');
  const html=read('dist/'+(s.startsWith('./')?'index.html':s.split('?')[0]));const at=html.indexOf('tour-sandbox.js');assert(at>0,s+' loads the sandbox');
  for(const engine of ['economy.js','practice-pathways.js','practice.js'])if(html.includes(engine+'?'))assert(at<html.indexOf(engine+'?'),'sandbox loads before '+engine+' in '+s);
}
const stage=read('dist/explainer/stage.html');assert(stage.indexOf('tour-sandbox.js')<stage.indexOf('practice-pathways.js'),'the stage sandbox loads before the practice engine games will use');
// 4. The stage only loads same-site game routes and relays commands both ways with origin and source checks.
const stageJs=read('dist/explainer/stage.js');
function stageRun(scene){const frame={src:'',contentWindow:{postMessage(){}}};const listeners=[];const win={location:{search:'?tourStage=1&scene='+encodeURIComponent(scene),origin:'https://arcade.test'},document:{getElementById:()=>frame},URLSearchParams,addEventListener:(t,f)=>listeners.push(f)};win.window=win;win.parent={postMessage(){}};vm.createContext(win);vm.runInContext(stageJs,win);return{frame,listeners,win}}
assert.equal(stageRun('dragon/index.html?v=review-59').frame.src,'../dragon/index.html?v=review-59');
for(const bad of ['https://evil.test/x.html','//evil.test/a.html','../../x.html','javascript:alert(1)','dragon/index.html#x'])assert.equal(stageRun(bad).frame.src,'',bad+' is refused');
{const r=stageRun('pong/index.html');const toGame=[],toHost=[];r.frame.contentWindow.postMessage=d=>toGame.push(d);r.win.parent.postMessage=d=>toHost.push(d);
 r.listeners[0]({origin:'https://arcade.test',source:r.win.parent,data:{type:'arcade-command',action:'demo'}});assert.deepEqual(toGame,[{type:'arcade-command',action:'demo'}]);
 r.listeners[0]({origin:'https://evil.test',source:r.win.parent,data:{type:'arcade-command',action:'play'}});assert.equal(toGame.length,1,'untrusted origins are ignored');
 r.listeners[0]({origin:'https://arcade.test',source:r.frame.contentWindow,data:{type:'arcade-ready'}});assert.equal(JSON.stringify(toHost),JSON.stringify([{type:'arcade-ready'}]));
 r.listeners[0]({origin:'https://arcade.test',source:r.frame.contentWindow,data:{type:'arcade-reward',amount:10,id:'x'}});assert.equal(toHost.length,1,'game rewards never leave the stage');}
// 5. Captions sit above the scene; no scene loads until the tour opens.
const css=read('dist/explainer.css');const z=sel=>Math.max(...css.split('}').filter(rule=>rule.trim().startsWith(sel+'{')).map(rule=>Number((rule.match(/z-index:(\d+)/)||[])[1])||0));
assert(z('.explainerCaption')>Math.max(z('.explainerStage'),z('.explainerStage.is-incoming'),z('.explainerLoading')),'captions are drawn above the live scene');
const index=read('dist/index.html');assert.doesNotMatch(index,/id="explainerStage"[^>]*\ssrc=/,'the tour stage has no src until opened');
assert.match(script,/if\(dialog\.open\)showScene\(indexFor\(current\),false\)/,'audio sync never loads a scene while the tour is closed');
console.log('PASS explainer sandbox: tour scenes read the real save but never write it, games run in a relaying sandbox stage, captions on top, stage deferred until opened');
