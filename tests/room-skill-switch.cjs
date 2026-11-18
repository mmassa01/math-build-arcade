// The arcade pathway is the only skill source inside a game: legacy per-game
// operation menus stay hidden from page load, every game names the live skill,
// and the room's skill picker switches it without leaking old cards or coins.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {create:createPathways}=require('../dist/practice-pathways.js');
const {create:createEconomy}=require('../dist/economy.js');
const read=f=>fs.readFileSync(f,'utf8');
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name)};
const clock=()=>new Date(2026,10,18,12).getTime();
function service(grade=3,pathway='div'){const data=new Map();const P=createPathways({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},clock,()=>.4);P.setGrade(grade);P.setPathway(pathway);return P}

// A game page with the five setup-menu games' markup shape: <label>Math<select id="operation">…
function gamePage({embedded=true,P=null,subway=false}={}){
  const nodes={},inserted=[];
  const mk=(id,extra={})=>nodes[id]={id,hidden:false,disabled:false,style:{},isConnected:false,setAttribute(){},append(){},focus(){},remove(){},...extra};
  const label=id=>({tag:'label',hidden:false,before(n){n.isConnected=true;inserted.push({node:n,before:this})}});
  const opLabel=label(),rangeLabel=label();
  mk('operation',{closest:()=>subway?null:opLabel,before(n){n.isConnected=true;inserted.push({node:n,before:this})}});
  if(!subway)mk('range',{closest:()=>rangeLabel});
  const document={hidden:false,readyState:'interactive',body:{append(n){n.isConnected=true}},getElementById:id=>nodes[id]||null,createElement:()=>({style:{},isConnected:false,setAttribute(){},remove(){}}),addEventListener(){},dispatchEvent(){}};
  // A standalone page is its own parent, so practice-client finds no service.
  const self={},parent=embedded?{location:{origin:'https://arcade.test'},ArcadePractice:P,postMessage(){}}:self;
  const scope={window:self,parent,document,location:{origin:'https://arcade.test'},performance:{now:()=>0},Date,CustomEvent:class{constructor(t){this.type=t}},setTimeout(){return 1},clearTimeout(){},console};
  vm.createContext(scope);
  vm.runInContext(read('dist/practice-client.js'),scope);
  return{nodes,opLabel,rangeLabel,inserted,api:self.ArcadeLearning};
}

test('embedded with practice active, the legacy Math and Facts-up-to menus are hidden before Play',()=>{
  const g=gamePage({P:service(3,'div')});
  assert.equal(g.opLabel.hidden,true,'operation menu label hidden at load');
  assert.equal(g.rangeLabel.hidden,true,'range menu label hidden at load');
  assert.equal(g.nodes.operation.disabled,true);assert.equal(g.nodes.range.disabled,true);
  assert.equal(g.inserted.length,1,'one skill tag replaces the menus');
  assert.equal(g.inserted[0].node.textContent,'Practicing: Division');
  assert.equal(g.inserted[0].before,g.opLabel,'the tag sits where the Math menu was');
  assert(/font:800 15px/.test(g.inserted[0].node.style.cssText),'the setup tag is readable, not an 8px hint');
  const s=gamePage({P:service(3,'mul'),subway:true});
  assert.equal(s.nodes.operation.hidden,true,'Skyrail\'s bare operation select is hidden too');
  assert.equal(s.inserted[0].node.textContent,'Practicing: Multiplication');
});

test('a standalone game page with no practice service keeps its own menus',()=>{
  const g=gamePage({embedded:false});
  assert.equal(g.opLabel.hidden,false);assert.equal(g.rangeLabel.hidden,false);
  assert.equal(g.nodes.operation.disabled,false);assert.equal(g.inserted.length,0);
});

test('the game label and ArcadeLearning report the live getPathway()',()=>{
  for(const p of ['add','sub','mul','div','mixed']){const P=service(3,p),g=gamePage({P});
    assert.equal(g.api.pathway,P.getPathway());assert.equal(g.api.pathwayName,P.names[p]);
    assert.equal(g.inserted[0].node.textContent,'Practicing: '+P.names[p]);}
  for(const game of ['castle','seed','hangar'])assert(read('dist/'+game+'/index.html').includes("sharedPractice?(window.ArcadeLearning.pathwayName?'Practicing: '+window.ArcadeLearning.pathwayName:'Shared pathway')"),game+' toolbar names the live skill');
});

// The real arcade shell and pathway UI with a fake DOM.
function arcade(grade=3,pathway='div'){
  const nodes=new Map(),listeners={},sent=[],timers=new Map();let timerId=0;
  const frameWindow={postMessage(data){sent.push(data)}};
  function node(id){if(nodes.has(id))return nodes.get(id);const n={id,hidden:id==='room'||id==='loading'||id==='roomSkillPick',open:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},children:[],options:[],textContent:'',innerHTML:'',value:id==='cardScroll'?'0':'',contentWindow:id==='game'?frameWindow:undefined,querySelectorAll(){return[]},querySelector(){return null},addEventListener(){},setAttribute(){},append(c){this.children.push(c)},replaceChildren(...c){this.children=c},remove(){},showModal(){this.open=true},close(){this.open=false},focus(){},getBoundingClientRect(){return{top:0,right:100,bottom:100,left:0}}};nodes.set(id,n);return n}
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const E=createEconomy(storage),P=createPathways(storage,clock,()=>.4);P.setGrade(grade);P.setPathway(pathway);
  const document={body:{style:{},append(){}},getElementById:node,querySelector(s){return s==='.adventures'?{after(){}}:null},querySelectorAll(){return[]},createElement:tag=>({tag,style:{},remove(){}}),addEventListener(){}};
  const window={ArcadeEconomy:E,ArcadePractice:P,addEventListener(t,f){(listeners[t]||=[]).push(f)}};
  const scope={window,document,location:{origin:'https://arcade.test',pathname:'/',hash:'',search:''},history:{replaceState(){}},ArcadeShop:{render(){}},Image:class{},ResizeObserver:class{observe(){}},matchMedia:()=>({matches:false}),innerWidth:1200,innerHeight:800,requestAnimationFrame(){},setTimeout(f){const id=++timerId;timers.set(id,f);return id},clearTimeout(id){timers.delete(id)},setInterval(){return 1},clearInterval(){},Blob:class{},URL:{},console,Math,Number,JSON,Date};
  vm.createContext(scope);
  vm.runInContext(read('dist/arcade.js'),scope,{filename:'dist/arcade.js'});
  vm.runInContext(read('dist/pathway-ui.js'),scope,{filename:'dist/pathway-ui.js'});
  const emit=(d,{origin='https://arcade.test',source=frameWindow}={})=>listeners.message.forEach(f=>f({data:d,origin,source}));
  return{E,P,node,emit,sent,timers,run:c=>vm.runInContext(c,scope)};
}

test('the room picker offers only the grade\'s pathways and shows the live one',()=>{
  const a=arcade(3,'div'),pick=a.node('roomSkill');
  assert.deepEqual(pick.children.map(o=>o.value),['add','sub','mul','div','mixed']);
  assert.deepEqual(pick.children.map(o=>o.textContent),['Addition','Subtraction','Multiplication','Division','Mixed']);
  assert.equal(pick.value,'div');assert.equal(a.node('roomSkillPick').hidden,false);
  const young=arcade(1,'sub');
  assert.deepEqual(young.node('roomSkill').children.map(o=>o.value),['add','sub','mixed'],'grade 1 sees no multiplication or division');
  const page=read('dist/index.html'),nav=page.slice(page.indexOf('<nav class="roomnav">'),page.indexOf('</nav>',page.indexOf('<nav class="roomnav">')));
  assert(nav.includes('id="roomSkill"')&&nav.includes('Practicing:'),'the picker lives in the room nav');
  assert(/@media\(max-width:620px\)\{\.roomnav\{flex-wrap:wrap/.test(read('dist/pathways.css')),'phones give the picker its own row');
});

test('switching mid-round reloads the game, serves the new skill, and never double-awards',()=>{
  const a=arcade(3,'div');
  a.run("openWorld('pong','play')");const src=a.node('game').src;assert.equal(src,'pong/index.html?v=review-57&practice=store-21');
  a.node('loading').hidden=true;a.emit({type:'arcade-mode',mode:'play'});
  // The round's live run is on Division.
  const run=a.P.begin({endless:true}),card=run.next();assert.equal(card.op,'div');
  a.emit({type:'arcade-reward',game:'pong',amount:10,id:'s1:1'});assert.equal(a.E.getState().coins,10);
  a.emit({type:'arcade-complete',game:'pong',won:true});assert.equal(a.timers.size>0,true,'a results screen is queued');
  a.node('game').src='changed-by-test';
  const pick=a.node('roomSkill');pick.value='mul';pick.onchange();
  assert.equal(a.P.getPathway(),'mul','the shared pathway switched');
  assert.equal(a.node('game').src,src,'the game reloads to its setup screen');
  assert.equal(a.node('loading').hidden,false);
  assert.equal(a.run('mode')+':'+a.run('pending'),'play:play','play stays play and lands on setup');
  for(const f of a.timers.values())f();assert.equal(a.node('resultsDialog').open,false,'the old round\'s results screen was cancelled');
  assert.equal(run.record(card,true,900).accepted,false,'a card from the old skill cannot be recorded after the switch');
  assert.equal(run.next(),null,'the old run serves no more cards');
  const fresh=a.P.begin({endless:true});for(let i=0;i<8;i++)assert.equal(fresh.next().op,'mul','the next cards come from the new skill');
  a.emit({type:'arcade-reward',game:'pong',amount:10,id:'s1:1'});assert.equal(a.E.getState().coins,10,'a replayed reward is still idempotent');
  assert.equal(a.node('roomSkill').value,'mul');
  assert.equal(a.node('pathCards').innerHTML.includes('data-path="mul"'),true);
  assert(/class="pathCard selected [^"]*" data-path="mul"/.test(a.node('pathCards').innerHTML),'home cards show the new pathway');
  a.node('game').src='same';pick.value='mul';pick.onchange();assert.equal(a.node('game').src,'same','choosing the current skill does nothing');
});

test('switching keeps the 90-second check per pathway and demo stays demo',()=>{
  const a=arcade(3,'add');a.run("openWorld('dragon','play')");a.emit({type:'arcade-mode',mode:'play'});
  const run=a.P.begin({endless:true});for(let i=0;i<5;i++){const q=run.next();run.record(q,true,1500)}
  assert.equal(a.P.checkStatus().elapsedMs,7500);
  const pick=a.node('roomSkill');pick.value='sub';pick.onchange();
  assert.equal(a.P.checkStatus().pathway,'sub');assert.equal(a.P.checkStatus().elapsedMs,0,'the new pathway starts its own check');
  pick.value='add';pick.onchange();assert.equal(a.P.checkStatus().elapsedMs,7500,'the earlier pathway\'s check time is kept, not lost or doubled');
  a.run("command('demo')");pick.value='mul';pick.onchange();
  assert.equal(a.run('mode'),'demo','a demo reloads as a demo');
  a.emit({type:'arcade-reward',game:'dragon',amount:10,id:'demo:1'});assert.equal(a.E.getState().coins,0,'demo never earns coins');
  const demo=a.P.begin({demo:true,endless:true}),q=demo.next();assert.equal(q.op,'mul');demo.record(q,true,900);
  assert.equal(a.P.progress().find(p=>p.id==='mul').mastered,0);assert.equal(a.P.checkStatus().elapsedMs,0,'demo answers never count toward the check');
});

console.log('PASS room skill switch: '+passed+' checks');
