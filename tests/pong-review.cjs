const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {Match}=require('../dist/pong/engine.js');
const renderSandbox={window:{},Image:function(){this.complete=false;},Math,document:{}};
vm.createContext(renderSandbox);vm.runInContext(fs.readFileSync('dist/pong/cinema.js','utf8'),renderSandbox);
const cinema=renderSandbox.window.PongCinema;
assert.equal(cinema.paddleStyle,'horizontal-textured');assert(!fs.readFileSync('dist/pong/cinema.js','utf8').includes('drawImage(art.paddle'),'rubber face cannot embed the old diagonal image and handle');
assert.equal(cinema.contactStyle,'squash-ring','contact uses a brief flattened mark and expanding ring');
assert.equal(cinema.powerBallStyle,'white-hot-compact','powered ball keeps a crisp core and compact corona');
for(const [width,height]of [[390,410],[768,500],[1024,600],[1366,720]])for(const side of [0,1])for(const lane of [.08,.5,.92]){
 const camera=cinema.camera(width,height),pose=cinema.paddlePose(camera,lane,side),m={phase:'flight',progress:1,turn:side,shotFrom:.5,shotTo:lane};
 const world=cinema.ballWorld(m,0,0),ball=camera.project(world.x,world.y,world.z);
 assert(Math.abs(pose.screen.x-ball.x)<1e-8&&Math.abs(pose.screen.y-ball.y)<1e-8,'ball contacts the face center at either end, all lanes and viewports');
 assert.equal(pose.angle,0,'horizontal face never banks away from contact');assert(pose.rx>pose.ry*2,'paddle reads as a horizontal face');
 const serve=cinema.ballWorld({phase:'serve',paddles:[lane,.5]},0,0),near=cinema.contactWorld(lane,0);assert.deepEqual({...serve,t:undefined},{...near,t:undefined});
}
for(const turn of [0,1]){
 const m={phase:'flight',progress:.001,shotPowered:true,shotFrom:.1,shotTo:.9,turn};assert.equal(cinema.trailWorld(m).length,0,'no stack of clamped launch samples');
 m.progress=.7;const tail=cinema.trailWorld(m),ball=cinema.ballWorld(m,0,0);assert(tail.length>10);assert.equal(new Set(tail.map(p=>p.t)).size,tail.length);for(const p of tail){assert(p.t>0&&p.t<m.progress);assert(turn?p.z<ball.z:p.z>ball.z,'tail remains behind travel direction');assert([p.x,p.y,p.z].every(Number.isFinite));}
}
const gradients=[],ellipses=[];
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(_,color){gradients.push(color);}}),ellipse(...a){ellipses.push(a);}},{get:(o,k)=>o[k]||(()=>{})});
const hitWorld=cinema.contactWorld(.15,0),hit={side:0,position:.15,world:hitWorld,life:.75,power:true};
const state={ctx,canvas:{dataset:{}},w:800,h:500,match:{phase:'flight',progress:.4,shotFrom:.5,shotTo:.8,turn:1,paddles:[.9,.5],charge:[0,0],time:400},paused:true,now:400,pointAt:0,reduced:false,impacts:[hit],dt:16};
cinema.draw(state);assert.equal(hit.life,.75,'paused impacts freeze');const expected=cinema.camera(800,500).project(hitWorld.x,hitWorld.y,hitWorld.z),ring=ellipses.at(-1);assert(Math.abs(ring[0]-expected.x)<1e-8&&Math.abs(ring[1]-expected.y)<1e-8,'impact stays at captured contact, not moving paddle');assert(gradients.includes('#fffdf1'),'ordinary ball is white');
assert(ellipses.some(e=>Math.abs(e[0]-expected.x)<1e-8&&Math.abs(e[1]-expected.y)<1e-8&&e[2]>e[3]*3),'fresh contact includes a readable paddle-face squash');
state.match.shotPowered=true;cinema.draw(state);assert(gradients.includes('#fffef2'),'power ball has a distinct white-hot core');assert(gradients.includes('#ffd15f88')&&gradients.includes('#ff812b44'),'power ball has layered compact flame colors');
assert.equal(state.canvas.dataset.paddle,'horizontal-textured');
const m=new Match({random:()=>.4});m.answer(0,m.question.answer);assert(!m.shotPowered);m.update(1050);m.answer(0,m.question.answer);m.update(3000);assert(!m.shotPowered);m.update(1050);m.answer(0,m.question.answer);m.update(3000);assert(m.shotPowered&&m.powerOwner===0,'third correct strike launches power');assert.equal(m.flightSeconds,1.05,'power shot is not slower than the normal computer-bound ball');assert.equal(m.charge[1],0);m.update(1050);assert.equal(m.flightSeconds,3,'power does not change human answer window');m.answer(0,m.question.answer+1);const before=m.coins[0];m.update(3000);assert.equal(m.coins[0],before,'wrong return does not award coins');

// Real runtime timer and pause wiring, independent of the browser.
const nodes={},timers=new Map(),removed=[],widgetApi=require('./number-entry-fixture.cjs');let now=0,timerNo=0;
function node(id){return nodes[id]||(nodes[id]={children:[],classList:{toggle(){},add(){}},style:{},dataset:{},lastChild:{textContent:''},value:({operation:'add',range:'10',seconds:'3'})[id]||'',getContext:()=>ctx,getBoundingClientRect:()=>({width:390,height:410}),setAttribute(){},addEventListener(){},replaceChildren(...v){this.children=v;},showModal(){this.open=true;},close(){this.open=false;}});}
const parent={postMessage(){}},runtime={parent,window:{addEventListener(){}},location:{origin:'https://arcade.test'},document:{body:{classList:{toggle(){}}},getElementById:node,querySelector:node,createElement:()=>node('n'+Math.random()),addEventListener(){}},Image:function(){this.complete=false;},ResizeObserver:class{observe(){}},performance:{now:()=>now},requestAnimationFrame(){},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout(fn,ms){const id=++timerNo;timers.set(id,{fn,ms});return id;},clearTimeout(id){removed.push(id);timers.delete(id);},localStorage:{getItem:()=>null,setItem(){}},Math,console,PongEngine:{Match},ArcadeNumberEntry:{...widgetApi,mount(...args){const widget=widgetApi.mount(...args);widget.setPaused=value=>widget.paused=value;return widget;}}};
vm.createContext(runtime);vm.runInContext(fs.readFileSync('dist/pong/game.js','utf8'),runtime);const run=code=>vm.runInContext(code,runtime);
run("start(false);match.phase='finished';match.events.push({type:'finish',player:1});handleEvents();");const stale=[...timers.values()].find(t=>t.ms===450).fn;assert(!node('victory').open);run('start(false)');stale();assert(!node('victory').open,'stale victory cannot reopen after restart');assert(removed.length>0,'restart cancels delayed finish timer');
run('paused=true;renderUI()');assert.equal(node('answers0').numberEntry.paused,true);assert.equal(node('answers0').numberEntry.remaining,3,'paused card timer remains at its actual value');run('paused=false;renderUI()');assert.equal(node('answers0').numberEntry.paused,false);
run("match.phase='finished';match.events.push({type:'finish',player:1});handleEvents();");const settingsStale=[...timers.values()].find(t=>t.ms===450).fn;node('settings').onclick();settingsStale();assert(!node('victory').open,'settings cancels delayed victory');assert.equal(node('answers0').numberEntry.paused,true);assert(node('finalStats').textContent.includes('same three-second window'));
console.log('PASS Pong review: horizontal contact geometry, directional non-stacked flames, distinct ball core, captured impacts, three-correct power, fixed human deadline, pause state, restart/settings victory guards');
