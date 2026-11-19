// Two public-site tabs cannot silently overwrite each other's progress, a refused save is shown,
// and the guard stays out of the way of Pathway's own ArcadeStorage and the tour sandbox.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const guard=fs.readFileSync('dist/save-guard.js','utf8'),sandbox=fs.readFileSync('dist/tour-sandbox.js','utf8');
const createEconomy=require('../dist/economy.js').create,createPathways=require('../dist/practice-pathways.js').create;
function browser(){const data=new Map(),tabs=[];let full=false;let clock=1000;
  const area={getItem:k=>data.has(k)?data.get(k):null,removeItem:k=>data.delete(k),key:i=>[...data.keys()][i]??null,get length(){return data.size}};
  function tab({pre=null,search=''}={}){const listeners={},docListeners={},nodes=[];
    const doc={hidden:false,body:{append:n=>nodes.push(n)},documentElement:{append:n=>nodes.push(n)},createElement:tag=>({tag,style:{},setAttribute(){},append(...c){this.children=c},focus(){}}),getElementById:()=>null,querySelectorAll:()=>[],addEventListener:(t,f)=>(docListeners[t]||=[]).push(f)};
    const me={reloads:0,nodes};
    const localStorage={...area,setItem(k,v){if(full&&k!=='mathArcadeActiveTab.v1')throw Object.assign(new Error('QuotaExceededError'),{name:'QuotaExceededError'});const old=data.has(k)?data.get(k):null;data.set(k,String(v));for(const t of tabs)if(t!==me)t.fire({key:k,oldValue:old,newValue:String(v),storageArea:localStorage})}};
    Object.setPrototypeOf(localStorage,area);
    const win={localStorage,document:doc,location:{search,origin:'https://arcade.test',reload(){me.reloads++}},URLSearchParams,Date:{now:()=>++clock},Math,JSON,Number,addEventListener:(t,f)=>(listeners[t]||=[]).push(f),frameElement:null};
    win.window=win;win.parent=win;if(pre)win.ArcadeStorage=pre;vm.createContext(win);vm.runInContext(sandbox,win);vm.runInContext(guard,win);
    me.win=win;me.fire=e=>(listeners.storage||[]).forEach(f=>f(e));me.show=()=>(docListeners.visibilitychange||[]).forEach(f=>f());
    me.economy=()=>createEconomy(win.ArcadeStorage);tabs.push(me);return me}
  return{data,tab,setFull:v=>{full=v}}}
// Two tabs: the newer one takes over and the older one stops saving with a clear notice.
{const b=browser();const A=b.tab();const EA=A.economy();EA.reward(10,'a1');EA.reward(10,'a2');
 assert.equal(JSON.parse(b.data.get('mathArcadeProfile.v1')).coins,20);
 const B=b.tab();assert(A.win.ArcadeSaveGuard.locked,'the older tab locks when a newer tab opens');assert(!B.win.ArcadeSaveGuard.locked);
 assert(A.nodes.some(n=>n.id==='tabGuardNotice'&&/open in another tab/.test(n.children?.[0]?.children?.[0]?.textContent||'')),'the older tab says the arcade is open in another tab');
 const EB=B.economy();assert.equal(EB.getState().coins,20,'the new tab starts from the latest save');EB.reward(10,'b1');
 EA.reward(10,'a3');EA.reward(10,'a4');
 assert.equal(JSON.parse(b.data.get('mathArcadeProfile.v1')).coins,30,'the older tab can no longer overwrite the newer tab');
 const PA=createPathways(A.win.ArcadeStorage,()=>Date.UTC(2026,10,18),()=>.4);const before=b.data.get('mathArcadePathways.v2');PA.setPathway('mul');assert.equal(b.data.get('mathArcadePathways.v2'),before,'practice from the locked tab is not saved');
 // "Play in this tab instead" reloads, which claims again and locks the other tab.
 const button=A.nodes.find(n=>n.id==='tabGuardNotice').children[0].children[2];button.onclick();assert.equal(A.reloads,1);
 const A2=b.tab();assert(B.win.ArcadeSaveGuard.locked,'taking over locks the other tab');assert.equal(A2.economy().getState().coins,30,'the reloaded tab keeps the other tab’s progress');}
// Simultaneous starts never lock both tabs; a tab that missed an event checks again when shown.
{const b=browser();const A=b.tab(),B=b.tab();assert.equal([A,B].filter(t=>t.win.ArcadeSaveGuard.locked).length,1);
 const C=b.tab({});C.win.ArcadeSaveGuard;B.show();assert(B.win.ArcadeSaveGuard.locked);}
// A refused save is visible, still reported to the engine, and clears once saving works again.
{const b=browser();const A=b.tab();const P=createPathways(A.win.ArcadeStorage,()=>Date.UTC(2026,10,18),()=>.4);const E=A.economy();
 b.setFull(true);E.reward(10,'x1');assert(A.win.ArcadeSaveGuard.failing,'a full browser storage is shown');const banner=A.nodes.find(n=>n.id==='saveFailedNotice');assert(banner&&!banner.hidden&&/not saving/.test(banner.textContent));
 P.setPathway('add');assert.equal(P.storageAvailable,false,'the engine still learns its save failed');
 b.setFull(false);E.reward(10,'x2');assert(!A.win.ArcadeSaveGuard.failing);assert(banner.hidden,'the notice clears once a save succeeds');P.setPathway('sub');assert.equal(P.storageAvailable,true);}
// Inert under Pathway (its own ArcadeStorage) and inside the tour sandbox.
{const b=browser();const pathway={getItem:()=>null,setItem(){},removeItem(){}};const T=b.tab({pre:pathway});assert.equal(T.win.ArcadeStorage,pathway,'Pathway’s storage is left in place');assert.equal(T.win.ArcadeSaveGuard,undefined);assert(!b.data.has('mathArcadeActiveTab.v1'),'no tab claim under Pathway');
 const tour=b.tab({search:'?tourStage=1'});assert(tour.win.ArcadeTourSandbox);assert.equal(tour.win.ArcadeSaveGuard,undefined,'a tour scene never claims the tab');assert(!b.data.has('mathArcadeActiveTab.v1'));}
// Load order: the guard (and the tour sandbox) run before every engine that reads ArcadeStorage.
for(const page of ['dist/index.html','dist/store.html']){const html=fs.readFileSync(page,'utf8');const g=html.indexOf('save-guard.js'),t=html.indexOf('tour-sandbox.js');assert(t>0&&g>t,page+': sandbox then guard');for(const e of ['practice.js?','practice-pathways.js?','economy.js?'])if(html.includes(e))assert(g<html.indexOf(e),page+': guard before '+e)}
console.log('PASS tab save guard: newer tab takes over, older tab stops saving with a notice, refused saves are shown, inert under Pathway and the tour');
