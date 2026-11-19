const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
// A small DOM stand-in: enough for the bridge to add its canvas beside #scene and measure the HUD once.
function page(){
 const nodes={},listeners={},inserted=[];
 const make=id=>({id,children:[],hidden:false,dataset:{},style:{},listeners:{},classList:{toggle(){},add(){},remove(){}},value:({operation:'add',range:'10',laps:'3',pace:'20'})[id]||'',textContent:'',lastChild:{textContent:''},
  setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,right:390,bottom:430,width:390,height:430}),replaceChildren(...v){this.children=v},append(...v){this.children.push(...v);for(const n of v)n.parentNode=this},remove(){this.removed=true;if(this.parentNode?.children)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null},showModal(){this.open=true},close(){this.open=false}});
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*6})},{get:(o,k)=>o[k]||(()=>{})});
 const node=id=>nodes[id]||(nodes[id]=make(id)),stage=make('stage');stage.insertBefore=(n,before)=>{n.parentNode=stage;inserted.push(n);assert.equal(before,node('scene'),'the 3D canvas sits under the existing 2D canvas')};node('scene').parentNode=stage;
 const pile=make('practice-pile'),document={body:{dataset:{},classList:{toggle(name,on){document.body.flags[name]=on}},flags:{}},getElementById:node,createElement:tag=>make(tag+':'+Math.random()),querySelector:sel=>/practice .card-pile-stack/.test(sel)?pile:node(sel),addEventListener(){}};
 return{node,document,inserted,listeners,pile,ctx};
}
function fakeScene(log){return{labels:{player:{x:.6,y:.5,visible:true,depth:8},pace:{x:.4,y:.42,visible:true,depth:20}},pixelCap:0,resize(w,h){const changed=w!==this.w||h!==this.h||this.cap!==this.pixelCap;this.w=w;this.h=h;this.cap=this.pixelCap;if(changed)log.resizes++;return changed},frame(s,dt){log.frames++;log.last=s;if(log.explode)throw new Error('driver crashed')},render(){log.renders++},dispose(){log.disposed++},stats:()=>({})};}

(async()=>{
 const {installBridge,QUALITY}=await import('../dist/wave/scene3d.mjs');
 const state=(p,extra={})=>({ctx:p.ctx,canvas:p.node('scene'),w:390,h:430,time:1,travel:1,turn:.2,visualGap:0,gear:null,race:extra.race||{correct:0,attempts:0,boost:0},mode:'racing',paused:false,reduced:false,dt:.016,sparks:[],flash:0,...extra});
 const setup=(options={})=>{const p=page(),log={frames:0,renders:0,resizes:0,disposed:0,flat:0,explode:false},win={document:p.document,devicePixelRatio:2,performance:{now:()=>log.now||0},console:{warn(){log.warned=true}},WaveCinema:{version:38,draw(s){log.flat++;return'flat'}}};log.now=0;const api=installBridge(win,{now:()=>log.now,createScene:options.createScene||(()=>fakeScene(log)),force:options.force});return{p,log,win,api};};

 // WebGL missing: the constructor throws and the original 2D picture keeps drawing.
 {const {p,log,win,api}=setup({createScene(){throw new Error('WebGL is not available')}});assert.equal(api.renderer(),'2d');assert.equal(api.state.reason,'unavailable');assert.equal(win.WaveCinema.draw(state(p)),'flat');assert.equal(log.flat,1);assert.equal(p.document.body.dataset.waveScene,'2d');assert.equal(p.inserted.length,1);assert(p.inserted[0].removed,'the unused 3D canvas is taken out again');assert(log.warned);}
 // No art layer at all (script failed): nothing to wrap, nothing thrown.
 assert.equal(installBridge({document:page().document},{createScene(){throw new Error('never')}}),null);

 // 3D available: state in, 3D frame out, the 2D painter is not called, sizes cap at the quality level.
 {const {p,log,win,api}=setup();assert.equal(api.renderer(),'3d');assert.equal(p.document.body.dataset.waveScene,'3d');assert.equal(api.state.scene.pixelCap,QUALITY[0]);
  const race={correct:2,attempts:3,boost:0},frozen=JSON.stringify(race);
  for(let i=0;i<10;i++){log.now+=16;assert.equal(win.WaveCinema.draw(state(p,{race})),true);}
  assert.equal(log.frames,10);assert.equal(log.renders,10);assert.equal(log.flat,0);assert.equal(log.last.race,race);assert.equal(JSON.stringify(race),frozen,'the bridge never writes to the race');assert.equal(p.node('scene').dataset.renderer,'wave-3d');assert.equal(p.node('scene').dataset.boats,'2');
  // Pause keeps the last painted frame: the loop stops rendering until something changes.
  for(let i=0;i<30;i++){log.now+=16;assert.equal(win.WaveCinema.draw(state(p,{race,paused:true})),true);}
  assert.equal(log.renders,10,'pause stops the render loop');assert.equal(log.frames,10);
  log.now+=16;win.WaveCinema.draw(state(p,{race,paused:true,gear:{id:'jetski-3'}}));assert.equal(log.renders,11,'equipping gear while paused repaints once');
  log.now+=16;win.WaveCinema.draw(state(p,{race,paused:true,gear:{id:'jetski-3'},w:600}));assert.equal(log.renders,12,'a resize while paused repaints once');const settled=log.renders;
  for(let i=0;i<5;i++){log.now+=16;win.WaveCinema.draw(state(p,{race}));}assert.equal(log.renders,settled+5,'resume renders every frame again');
  // Context lost: straight back to the 2D picture; restored: 3D again.
  p.inserted[0].listeners.webglcontextlost({preventDefault(){log.prevented=true}});assert(log.prevented);assert.equal(api.renderer(),'2d');assert.equal(win.WaveCinema.draw(state(p,{race})),'flat');assert.equal(p.inserted[0].hidden,true);
  p.inserted[0].listeners.webglcontextrestored();assert.equal(api.renderer(),'3d');assert.equal(win.WaveCinema.draw(state(p,{race})),true);assert.equal(p.inserted[0].hidden,false);
  // Zero-size stage (hidden iframe) never reaches the renderer.
  const before=log.frames;assert.equal(win.WaveCinema.draw(state(p,{race,w:0,h:0})),'flat');assert.equal(log.frames,before);
  // A crash inside the 3D frame hands the same frame to the 2D painter for good.
  log.explode=true;log.flat=0;assert.equal(win.WaveCinema.draw(state(p,{race})),'flat');assert.equal(api.state.reason,'error');assert.equal(log.disposed,1);log.explode=false;assert.equal(win.WaveCinema.draw(state(p,{race})),'flat');assert.equal(api.renderer(),'2d');}

 // Sustained very low frame rate: resolution steps down first, then the race falls back to 2D on its own.
 {const {p,log,win,api}=setup();const race={correct:0,attempts:0,boost:0};
  for(let i=0;i<40;i++){log.now+=100;win.WaveCinema.draw(state(p,{race}));}assert.equal(api.state.scene.pixelCap,QUALITY[1],'first response to slow frames is a lower resolution');assert.equal(api.renderer(),'3d');
  for(let i=0;i<400&&api.renderer()==='3d';i++){log.now+=100;win.WaveCinema.draw(state(p,{race}));}
  assert.equal(api.renderer(),'2d');assert.equal(api.state.reason,'slow');assert.equal(log.disposed,1);assert(log.flat>0);assert.equal(p.document.body.dataset.waveScene,'2d');}
 // Healthy frame rates, pauses, hidden tabs and the countdown never trigger the guard.
 {const {p,log,win,api}=setup();const race={correct:0,attempts:0,boost:0};
  for(let i=0;i<900;i++){log.now+=33;win.WaveCinema.draw(state(p,{race}));}assert.equal(api.state.quality,0,'30 fps keeps full quality');
  for(let i=0;i<200;i++){log.now+=100;win.WaveCinema.draw(state(p,{race,mode:'countdown'}));}for(let i=0;i<20;i++){log.now+=5000;win.WaveCinema.draw(state(p,{race}));}assert.equal(api.state.quality,0,'long gaps from a hidden tab are ignored');assert.equal(api.renderer(),'3d');}
 // Forced modes for review and support.
 {const {p,log,win,api}=setup({force:'3d'});for(let i=0;i<400;i++){log.now+=200;win.WaveCinema.draw(state(p));}assert.equal(api.renderer(),'3d','forced 3D ignores the frame-rate guard');assert.equal(api.setMode('2d'),'2d');assert.equal(win.WaveCinema.draw(state(p)),'flat');assert.equal(api.setMode('auto'),'3d');}
 {const {api,p,win}=setup({force:'2d'});assert.equal(api.renderer(),'2d');assert.equal(p.inserted.length,0);assert.equal(win.WaveCinema.draw(state(p)),'flat');}

 // The real game loop through the bridge: Wave delegates every frame to 3D, rules and rewards are unchanged.
 function game(name,{bridge=false}={}){
  const p=page(),messages=[],listeners={},writes=[],log={frames:0,renders:0,resizes:0,disposed:0,flat:0};let now=0;
  const parent={postMessage:m=>messages.push(m)},s={parent,window:{addEventListener(type,fn){listeners[type]=fn}},location:{origin:'https://arcade.test'},document:p.document,Image:function(){this.complete=true;this.naturalWidth=1254;this.naturalHeight=1254},ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame(){},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout(f){f()},localStorage:{getItem:()=>null,setItem:(k,v)=>writes.push(v)},Math,console};
  p.document.body.dataset.game=name==='wave'?'jetski':'sprint';s.DirtEngine=require('../dist/dirt/engine.js');s.ArcadeNumberEntry=s.window.ArcadeNumberEntry=require('./number-entry-fixture.cjs');vm.createContext(s);
  if(bridge){s.window.WaveCinema={draw(){log.flat++;return true}};s.window.document=p.document;s.window.devicePixelRatio=1;s.window.performance=s.performance;s.window.console={warn(){}};}
  vm.runInContext(fs.readFileSync(path.join(root,'dist/dirt/game.js'),'utf8'),s);
  const api=bridge?installBridge(s.window,{now:()=>now,createScene:()=>fakeScene(log)}):null;
  return{p,log,api,messages,writes,listeners,parent,run:t=>vm.runInContext(t,s),step(ms){now+=ms;vm.runInContext('loop('+now+')',s)},scope:s};
 }
 {const g=game('wave',{bridge:true});g.listeners.message({origin:'https://arcade.test',source:g.parent,data:{type:'arcade-command',action:'demo'}});
  for(let i=0;i<5000&&g.run('mode')!=='results';i++)g.step(33);
  assert.equal(g.run('race.won'),true);assert.equal(g.run('race.correct'),24,'the demo race plays through unchanged under the 3D layer');assert(g.log.frames>1000);assert.equal(g.log.flat,0);
  assert.equal(g.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,'demo awards nothing');assert.equal(g.writes.length,0,'demo saves nothing');assert.equal(g.run('wallet'),0);
  const rendered=g.log.renders;for(let i=0;i<20;i++)g.step(33);assert.equal(g.log.renders,rendered,'the results screen is paused: no rendering');
  // Real play: one idempotent 10-coin award per correct card, three seconds per card, pause freezes time.
  g.run('start(false);count=0');g.step(16);g.run('answer(race.question.answer);answer(race.question.answer)');let rewards=g.messages.filter(m=>m.type==='arcade-reward');assert.equal(rewards.length,1);assert.equal(rewards[0].amount,10);assert.equal(rewards[0].game,'jetski');
  g.step(300);assert.equal(g.run('race.questionRemaining'),3,'a fresh card still gets the full three seconds');g.step(1000);const elapsed=g.run('race.elapsed');g.run('setRacePaused(true)');g.step(5000);assert.equal(g.run('race.elapsed'),elapsed,'pause freezes race time');assert.equal(g.p.document.body.flags['race-paused'],true);g.run('setRacePaused(false)');
  // A miss: the shared card shows the whole fact large (round 2), so the old practice-pile overlay is gone;
  // the status line keeps the kind wording. This widget double has no correction hold, so the quarter second is unchanged.
  const text=g.run('race.question.text'),answer=g.run('race.question.answer');g.run('answer(ArcadeNumberEntry.wrong(race.question.answer))');
  assert.equal(g.p.pile.children.length,0,'one correction: nothing is laid over the practice pile');assert.equal(g.p.node('feedback').textContent,text+' = '+answer+'. You’ve got the next one!','kind wording is kept');
  assert.equal(g.run('race.cooldown'),.25,'the next card still arrives after the same quarter second');g.step(260);assert.equal(g.run('race.ready'),true);assert.equal(g.run('race.questionRemaining')>2.9,true);
  assert.equal(g.messages.filter(m=>m.type==='arcade-reward').length,1,'a miss awards nothing');
  g.run('answer(race.question.answer)');assert.equal(g.messages.filter(m=>m.type==='arcade-reward').length,2);}
 // Wave without the module (failed download): the 2D art layer still gets every frame.
 {const g=game('wave');let flat=0;g.run('window.WaveCinema={draw(){window.flatFrames=(window.flatFrames||0)+1;return true}}');g.run('start(false);count=0');for(let i=0;i<10;i++)g.step(16);assert.equal(g.run('window.flatFrames')>=10,true);}
 // Dirt Track is untouched: it never loads the 3D module and still draws through its own art layer.
 {const g=game('dirt');g.run('window.DirtCinema={draw(s){window.dirtFrames=(window.dirtFrames||0)+1;window.dirtState=s;return true}};window.WaveCinema={draw(){throw new Error("Dirt must never call the Wave art layer")}}');g.run('start(false);count=0');for(let i=0;i<10;i++)g.step(16);assert(g.run('window.dirtFrames')>=10);assert.equal(g.run('window.dirtState.race===race'),true);assert.equal(g.scope.window.WaveRiders3D,undefined);
  g.run('answer(ArcadeNumberEntry.wrong(race.question.answer))');assert.equal(g.p.pile.children.length,0,'Dirt Track shows the correction on the shared card only');}
 const wave=fs.readFileSync(path.join(root,'dist/wave/index.html'),'utf8'),dirt=fs.readFileSync(path.join(root,'dist/dirt/index.html'),'utf8');
 assert.match(wave,/<script type="module" src="scene3d\.mjs\?v=[\w-]+"><\/script>/,'Wave loads the 3D module with a cache version');assert(wave.indexOf('scene3d.mjs')>wave.indexOf('../dirt/game.js'),'the game starts in 2D and upgrades once the module arrives');assert(wave.includes('cinema.js?'),'the 2D art layer is still loaded as the fallback');
 assert(!/scene3d|three\.module/.test(dirt),'Dirt Track does not load the 3D scene');assert(!/scene3d|WaveRiders3D/.test(fs.readFileSync(path.join(root,'dist/dirt/game.js'),'utf8')),'the shared game loop has no 3D-specific code');
 for(const file of ['dist/wave/cinema.css','dist/dirt/cinema.css','dist/dirt/game.js'])assert(!/missFact/.test(fs.readFileSync(path.join(root,file),'utf8')),file+' has no second correction beside the shared card');
 console.log('PASS Wave Riders 3D bridge: WebGL-missing, context-loss, crash and low-FPS fallbacks to 2D, pause stops rendering, full demo with zero rewards, unchanged coins/timing, one miss correction (on the shared card), Dirt Track unaffected.');
})().catch(error=>{console.error(error);process.exitCode=1;});
