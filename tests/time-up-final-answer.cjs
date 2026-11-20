// When the round clock runs out just as a correct answer lands, that answer was already recorded for
// the teacher's check (ArcadeLearning.record), so the game must also pay it and show it: recorded
// correct == coins paid / 10 == the end screen's count, in Skyrail and in Dragon Quest. The demo
// still pays nothing.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function learning(){let n=0;const records=[];return{records,active:false,begin(demo){this.active=!demo},next(){n++;const a=1+n%7;return{id:'add:2+'+a,text:'2 + '+a,answer:2+a,choices:[2+a,1,30,31],token:'t'+n}},record(q,correct){records.push(correct);return{accepted:true}},shown(){},discard(){},flush(){this.flushed=true},get correct(){return records.filter(Boolean).length}}}
function round(){return{enabled:true,elapsed:0,duration:120,expire:false,select:{onchange(){}},start(){this.expire=false},stop(){},tick(){if(!this.expire)return false;this.expire=false;return true}}}

// Skyrail (dist/subway, also loaded by races/subway.html).
function skyrail(mode){let clock=1000,raf=null;const nodes={},listeners={},messages=[],L=learning(),R=round();
 const node=id=>nodes[id]??={id,children:[],style:{},hidden:false,textContent:'',classList:{add(){},remove(){},toggle(){}},value:id==='operation'?'add':'',replaceChildren(){},getBoundingClientRect:()=>({width:390,height:430})};
 const parent={postMessage:m=>messages.push(m)};
 const s={window:{Skyrail3D:{create:()=>({resize(){},event(){},update(){}})},addEventListener:(name,fn)=>listeners[name]=fn,ArcadeLearning:L,ArcadeRound:{mount:()=>R}},parent,location:{origin:'https://arcade.test'},
  document:{hidden:false,body:{classList:{add(){},remove(){}}},getElementById:node,addEventListener(){}},Image:function(){},performance:{now:()=>clock},requestAnimationFrame(f){raf=f},setTimeout(f){f();return 1},clearTimeout(){},localStorage:{getItem:()=>null,setItem(){}},
  SubwayEngine:require('../dist/subway/engine.js'),ArcadeNumberEntry:require('./number-entry-fixture.cjs'),Math,JSON};
 vm.createContext(s);vm.runInContext(read('dist/subway/game.js').replace('const engine=new SubwayEngine.Engine','const engine=window.testEngine=new SubwayEngine.Engine'),s);
 listeners.message({origin:'https://arcade.test',source:parent,data:{type:'arcade-command',action:mode}});
 const e=s.window.testEngine,step=ms=>{clock+=ms;raf(clock)};
 return{e,L,R,node,messages,step,type(){for(const n of String(e.card.answer))node('choices').numberEntry.key(n)}};}
{const g=skyrail('play');assert(g.e.timed,'the round clock is on');
 for(let i=0;i<5;i++){while(g.e.phase!=='thinking')g.step(50);g.step(400);g.type();assert.equal(g.e.phase,'moving');}
 // The fifth answer is recorded and its coin trail is in flight when the round clock ends.
 assert.equal(g.L.correct,5);assert.equal(g.e.mastered,4,'trail still in flight');g.R.expire=true;g.step(16);
 const paid=g.messages.filter(m=>m.type==='arcade-reward').reduce((n,m)=>n+m.amount,0),done=g.messages.filter(m=>m.type==='arcade-complete');
 assert.equal(paid,g.L.correct*10,'the final recorded answer is paid');assert.equal(g.e.mastered,g.L.correct);assert.equal(g.e.coins,paid);
 assert.match(g.node('finishText').textContent,new RegExp('You answered '+g.L.correct+' facts correctly and collected '+paid+' coins'));
 assert.equal(done.length,1);assert.equal(done[0].earned,paid);assert.equal(done[0].mastered,g.L.correct);assert(g.L.flushed,'held timeouts flushed before completion');
 const ids=g.messages.filter(m=>m.type==='arcade-reward').map(m=>m.id);assert.equal(new Set(ids).size,ids.length,'each card pays once');
 g.step(16);g.step(1000);assert.equal(g.messages.filter(m=>m.type==='arcade-reward').length,ids.length,'nothing is paid twice after the end');}
{const g=skyrail('demo');for(let i=0;i<3;i++){while(g.e.phase!=='moving')g.step(50);}g.R.expire=true;g.step(16);
 assert.equal(g.e.phase,'won');assert.equal(g.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,'the demo pays nothing');}

// Dragon Quest.
function dragon(){let now=0,raf=null;const nodes={},messages=[],gates=[],L=learning(),R=round();
 const NE=require('../dist/number-entry.js');
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const node=id=>nodes[id]||(nodes[id]={id,children:[],open:false,hidden:false,textContent:'',classList:{toggle(){},add(){}},style:{},dataset:{},value:({operation:'add',range:'10'})[id]||'',getContext:()=>ctx,getBoundingClientRect:()=>({width:390,height:430}),setAttribute(){},addEventListener(){},replaceChildren(){},showModal(){this.open=true},close(){this.open=false}});
 const widget={buffer:new NE.Buffer(),holding:false,set(q,cb){this.q=q;this.cb=cb},setEnabled(){},setRemaining(){},setPaused(){},resolve(){return true},discard(){return null},finishHold(){},reset(){},showDemo(){}};
 const E={...NE,mount:()=>widget,startGate(host,o){const g={o,cancel(){}};gates.push(g);return g}};
 const s={parent:{postMessage:m=>messages.push(m)},window:{addEventListener(){},ArcadeRound:{mount:()=>R}},location:{origin:'https://arcade.test'},
  document:{hidden:false,body:{classList:{toggle(){}}},getElementById:node,querySelector:node,createElement:()=>node('n'+Math.random()),addEventListener(){}},
  Image:function(){this.complete=false;this.naturalWidth=0},ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame(f){raf=f},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout(f){f()},localStorage:{getItem:()=>null,setItem(){}},Math,console,
  ArcadeNumberEntry:E,ArcadeLearning:L};
 // The engine runs inside the page context so it records through the page's ArcadeLearning.
 s.window.ArcadeNumberEntry=E;vm.createContext(s);vm.runInContext(read('dist/dragon/encounters.js'),s);s.DragonEngine=s.window.DragonEngine;vm.runInContext(read('dist/dragon/game.js'),s);
 const run=t=>vm.runInContext(t,s),step=ms=>{now+=ms;raf(now)};
 return{run,node,messages,gates,L,R,step};}
{const g=dragon();g.node('start').onclick();g.gates[0].o.onStart();g.step(16);
 for(let i=0;i<6;i++){while(g.run('game.ready'))g.step(50);g.step(300);assert.equal(g.run('answer(game.question.answer),game.ready'),true);}
 // The sixth answer (a four-in-a-row inferno among them) is recorded; its fire is still in flight.
 assert.equal(g.L.correct,6);assert.equal(g.run('game.shots.length')>0,true,'fire still in flight');g.R.expire=true;g.step(16);
 const paid=g.messages.filter(m=>m.type==='arcade-reward').reduce((n,m)=>n+m.amount,0);
 assert.equal(paid,g.L.correct*10,'the final recorded answer is paid');assert.equal(g.run('game.coins'),paid);
 assert.match(g.node('summary').textContent,new RegExp('earned '+paid+' coins'));assert.equal(g.run('game.shots.length'),0);
 assert.equal(g.messages.filter(m=>m.type==='arcade-complete').length,1);assert(g.L.flushed);
 g.step(16);g.step(1000);assert.equal(g.messages.filter(m=>m.type==='arcade-reward').reduce((n,m)=>n+m.amount,0),paid,'nothing is paid twice after the end');}
{const g=dragon();g.node('demo').onclick();for(let i=0;i<40;i++)g.step(100);g.R.expire=true;g.step(16);
 assert.equal(g.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,'the demo pays nothing');}
console.log('PASS time-up final answer: an answer recorded as the round clock ends is paid and shown in Skyrail and Dragon Quest (recorded correct == paid/10 == end screen); demo pays nothing');
