const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {create:createEconomy}=require('../dist/economy.js');
const {create:createPathways}=require('../dist/practice-pathways.js');

function storageCases(){
  const broken={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
  const economy=createEconomy(broken);
  assert.equal(economy.getState().coins,0);
  assert(economy.reward(25,'first').ok,'unavailable storage still permits this-tab rewards');
  assert.equal(economy.reward(25,'first').reason,'duplicate');
  assert.equal(economy.getState().coins,25);

  const malformed=createEconomy({getItem(){return '{not json'},setItem(){}});
  assert.equal(malformed.getState().coins,0,'malformed economy data falls back to a clean profile');
  assert(malformed.reward(25,'safe').ok);

  const dirty=JSON.stringify({version:1,coins:-5,lifetimeEarned:'bad',owned:['missing'],equipped:{car:'missing'},rewardIds:['kept','kept','',7],trophies:['horse','horse',null],pendingUnlocks:['missing']});
  const cleaned=createEconomy({getItem(){return dirty},setItem(){}}).getState();
  assert.equal(cleaned.coins,0);
  assert.deepEqual(cleaned.rewardIds,['kept']);
  assert.deepEqual(cleaned.trophies,['horse']);

  const pathways=createPathways(broken,()=>new Date(2026,10,4,12).getTime(),()=>.4);
  pathways.setPathway('add');
  assert.equal(pathways.storageAvailable,false);
  assert(pathways.begin().next(),'unavailable pathway storage still permits practice');
  const malformedPathways=createPathways({getItem(){return '{bad'},setItem(){}},()=>new Date(2026,10,4,12).getTime(),()=>.4);
  assert.equal(malformedPathways.getPathway(),'mixed');
  assert(malformedPathways.begin().next(),'malformed pathway data falls back to a clean learner');
}

function arcadeHarness(){
  const nodes=new Map(),listeners={},sent=[],timers=new Map(),history=[];
  let timerId=0;
  const frameWindow={postMessage(data,origin){sent.push({data,origin})}};
  function node(id){
    if(nodes.has(id))return nodes.get(id);
    const value={id,hidden:id==='room'||id==='loading',open:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},children:[],textContent:'',innerHTML:'',value:'0',scrollHeight:0,clientHeight:0,scrollTop:0,contentWindow:id==='game'?frameWindow:undefined,querySelectorAll(){return[]},querySelector(){return null},addEventListener(){},append(child){this.children.push(child)},remove(){this.removed=true},showModal(){this.open=true},close(){this.open=false},getBoundingClientRect(){return{top:0,right:100,bottom:100,left:0}}};
    nodes.set(id,value);return value;
  }
  const storageData=new Map();
  const storage={getItem:key=>storageData.get(key)||null,setItem:(key,value)=>storageData.set(key,value)};
  const E=createEconomy(storage);
  const document={body:{style:{},append(){}},getElementById:node,querySelector(selector){if(selector==='.adventures')return{after(){}};return null},querySelectorAll(){return[]},createElement:tag=>node(tag+Math.random())};
  const window={ArcadeEconomy:E,ArcadePractice:{},addEventListener(type,fn){listeners[type]=fn}};
  const scope={window,document,location:{origin:'https://arcade.test',pathname:'/',hash:''},history:{replaceState(_state,_title,url){history.push(url)}},ArcadeShop:{render(){}},Image:class{},ResizeObserver:class{observe(){}},matchMedia:()=>({matches:false}),innerWidth:1200,innerHeight:800,requestAnimationFrame(){},setTimeout(fn){const id=++timerId;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)},console,Math,Number,JSON};
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync('dist/arcade.js','utf8'),scope,{filename:'dist/arcade.js'});
  const emit=(data,{origin=scope.location.origin,source=frameWindow}={})=>listeners.message({data,origin,source});
  const run=code=>vm.runInContext(code,scope);
  return{E,emit,frameWindow,history,node,run,sent,timers};
}

storageCases();
const h=arcadeHarness();
h.run("openWorld('horse','play')");
assert.equal(h.node('game').src,'races/horse.html?v=review-56&practice=store-21');
h.emit({type:'arcade-reward',game:'horse',amount:25,id:'answer-1'});
assert.equal(h.E.getState().coins,25);
h.emit({type:'arcade-reward',game:'horse',amount:25,id:'answer-1'});
assert.equal(h.E.getState().coins,25,'duplicate reward message is idempotent');
h.emit({type:'arcade-reward',game:'horse',amount:25,id:'foreign-origin'},{origin:'https://evil.test'});
h.emit({type:'arcade-reward',game:'horse',amount:25,id:'foreign-window'},{source:{}});
h.emit({type:'arcade-reward',game:'dragon',amount:25,id:'wrong-game'});
h.emit({type:'arcade-reward',game:'horse',amount:101,id:'oversized'});
h.emit({type:'arcade-reward',game:'horse',amount:25,id:''});
assert.equal(h.E.getState().coins,25,'untrusted, mismatched, and invalid rewards are rejected');

h.emit({type:'arcade-complete',game:'horse',won:true});
h.emit({type:'arcade-complete',game:'horse',won:true});
assert.deepEqual(h.E.getState().trophies,['horse'],'duplicate completion awards one trophy');
h.run("command('demo')");
h.emit({type:'arcade-reward',game:'horse',amount:25,id:'demo-reward'});
assert.equal(h.E.getState().coins,25,'demo messages never award coins');

h.timers.clear();
h.run('home()');
assert.equal(h.timers.size,1,'home queues one deferred iframe unload');
const stale=[...h.timers.values()][0];
h.run("openWorld('dragon','play')");
assert.equal(h.timers.size,0,'new navigation cancels the queued unload');
stale();
assert.notEqual(h.node('game').src,'about:blank','stale unload cannot blank the new game');
h.run('home();home()');
assert.equal(h.timers.size,1,'rapid repeated home navigation keeps only the newest unload');
const current=[...h.timers.values()][0];current();
assert.equal(h.node('game').src,'about:blank','current home navigation unloads the frame');

console.log('PASS release runtime: storage recovery, duplicate reward and trophy protection, iframe trust checks, demo isolation, and stale navigation timer safety');
