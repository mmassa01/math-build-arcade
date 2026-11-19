import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/store/vendor/three.module.min.js';
import {createCraft,adoptStoreCraft,craftKind,craftColor,buoyGeometry,islandGeometry,archGeometry,trianglesIn,meshesIn,STARTER_COLOR,GOLD_COLOR,CRAFT_KINDS} from '../dist/wave/models.mjs';
import {WaveScene,waveHeight,paceOffset,drawOverlay,LOOP,AHEAD_MAX,BEHIND_MAX} from '../dist/wave/scene3d.mjs';
import {createCollectible} from '../dist/store/models.mjs';

const finite=root=>root.traverse(m=>{if(!m.isMesh)return;for(const v of m.geometry.attributes.position.array)assert(Number.isFinite(v),'finite model geometry');assert(m.geometry.attributes.normal,'lit models carry normals');});

// Saved store gear still decides the craft: starter blue, the four purchased hulls, and a gold pace rider.
assert.equal(craftKind(null),'classic');assert.equal(craftColor(null),STARTER_COLOR);assert.equal(craftColor({color:'not-a-colour'}),STARTER_COLOR,'malformed saved gear falls back to the starter paint');
assert.equal(craftKind({id:'jetski-1'}),'standup');assert.equal(craftKind({id:'jetski-2',model:'touring'}),'touring');assert.equal(craftKind({id:'jetski-3',model:'racing'}),'racing');assert.equal(craftKind({id:'jetski-4',model:'future'}),'future');assert.equal(craftKind({tier:4,name:'Top racer'}),'classic','gear without a known hull keeps the starter shape');
assert.equal(craftColor({id:'jetski-3',color:'#ee4e4d'}),'#ee4e4d');assert.equal(craftColor({color:'#ee4e4d'},true),GOLD_COLOR,'the pace rider is always gold');
for(const model of CRAFT_KINDS){
 const craft=createCraft({model,color:'#53cbbd'});finite(craft);
 assert(meshesIn(craft)<=14,model+' stays within a small draw-call budget');assert(trianglesIn(craft)<12000,model+' stays light enough for a school Chromebook');
 const box=new T.Box3().setFromObject(craft),size=box.getSize(new T.Vector3());assert(size.z>2.6&&size.z<4.6,'hull is a full-length craft');assert(size.x>.9&&size.x<1.8);assert(size.y>1.4,'a rider sits or stands above the hull');
 assert(craft.userData.rider,'every race craft carries a rider');assert.equal(craft.userData.standing,model==='standup','only the freestyle craft has a standing rider');assert.equal(craft.userData.color,'#53cbbd');
}
const gold=createCraft({model:'racing',color:'#ee4e4d'},{gold:true});assert.equal(gold.userData.color,GOLD_COLOR);assert.equal(gold.userData.kind,'classic','the pace rider never borrows a purchased craft');
const store=createCollectible('jetski'),storeTriangles=trianglesIn(store),neptune=adoptStoreCraft(store);finite(neptune);
assert(meshesIn(neptune)<=14,'Neptune X is merged into a few draw calls for the race');assert(trianglesIn(neptune)<storeTriangles*.7,'details too small for the chase camera are dropped');assert.equal(trianglesIn(store),storeTriangles,'the store model itself is left untouched');
for(const g of [buoyGeometry('#ffc93d'),islandGeometry(2,60,30),archGeometry()])for(const v of g.attributes.position.array)assert(Number.isFinite(v));

// The swell is seamless over the wrap distance and gentle enough to sit a craft on.
for(const [x,z,t] of [[0,0,0],[3,-40,2.5],[-9,120,31]]){const h=waveHeight(x,z,t);assert(Math.abs(h)<.32);assert(Math.abs(h-waveHeight(x,z+LOOP,t))<1e-9,'water repeats exactly at the wrap distance');}

// The pace rider's place comes from the honest race gap, compressed so it stays readable.
assert.equal(paceOffset(0),0);assert.equal(paceOffset(.1),0,'side by side inside the reported dead-band');assert.equal(paceOffset(NaN),0);
assert(paceOffset(-.3)<=-1.4&&paceOffset(.3)>=1.4,'a small reported lead is visible');
let previous=paceOffset(-40);assert(previous>=-AHEAD_MAX);for(let gap=-39;gap<=40;gap+=.5){const z=paceOffset(gap);assert(z>=previous-1e-9,'pace rider position is monotonic in the gap');assert(z>=-AHEAD_MAX&&z<=BEHIND_MAX,'pace rider is clamped on screen');previous=z;}

// The scene runs headless with a stand-in renderer: state in, no throw, finite transforms, no engine writes.
let renders=0;const renderer={setPixelRatio(){},setSize(){},render(){renders++},info:{render:{calls:0,triangles:0}},capabilities:{getMaxAnisotropy:()=>1},dispose(){}};
const scene=new WaveScene({},{renderer});assert(scene.resize(800,600,2));assert.equal(scene.ratio,1.5,'device pixel ratio is capped');assert.equal(scene.resize(800,600,2),false);
let drawCalls=0;scene.scene.traverse(o=>{if(o.isMesh||o.isPoints)drawCalls++;});assert(drawCalls<70,'whole scene keeps a modest draw-call budget: '+drawCalls);
const race={correct:0,attempts:0,boost:0,speed:.04,playerDistance:0,laps:3,gap:0},base={race,gear:null,mode:'countdown',paused:false,reduced:false,turn:0,visualGap:0,dt:1/60,w:800,h:600,sparks:[]};
const check=()=>{for(const o of [scene.player.group,scene.pace.group,scene.camera]){o.updateMatrixWorld(true);for(const n of o.matrixWorld.elements)assert(Number.isFinite(n),'finite transforms');}for(const l of [scene.labels.player,scene.labels.pace])assert(Number.isFinite(l.x)&&Number.isFinite(l.y));};
const run=(state,frames,dt=1/60)=>{for(let i=0;i<frames;i++){scene.frame({...base,...state,dt},dt);scene.render();check();}};
const frozen=JSON.stringify(race);
run({mode:'countdown'},30);assert.equal(scene.speed,0,'craft idle during the countdown');assert(scene.arch.visible,'a start gate waits ahead of the line');assert(Math.abs(scene.pace.group.position.z-scene.player.group.position.z)<.5,'riders line up side by side');assert(scene.labels.player.visible&&scene.labels.pace.visible);
run({mode:'racing'},120);assert(scene.speed>8,'the sea streams past once racing');assert(scene.distance>10);
run({mode:'racing',visualGap:-6},240);assert(scene.pace.group.position.z<scene.player.group.position.z-15,'a slower student sees the gold rider well ahead');assert(scene.labels.pace.visible,'and it is still on screen');assert(scene.labels.pace.y<scene.labels.player.y,'higher toward the horizon');
run({mode:'racing',visualGap:6},240);assert(scene.pace.group.position.z>scene.player.group.position.z+3,'a faster student leaves the gold rider behind');
// A sudden change in the gap eases over many frames at 30 and 60 fps: nothing teleports.
for(const dt of [1/30,1/60]){run({mode:'racing',visualGap:6},200,dt);let z=scene.pace.group.position.z,x=scene.player.group.position.x,worst=0;for(let i=0;i<120;i++){run({mode:'racing',visualGap:-6,turn:Math.sin(i/9)*.7},1,dt);worst=Math.max(worst,Math.abs(scene.pace.group.position.z-z)/dt,Math.abs(scene.player.group.position.x-x)/dt);z=scene.pace.group.position.z;x=scene.player.group.position.x;}assert(worst<90,'eased motion at '+Math.round(1/dt)+' fps, worst step '+worst.toFixed(1)+' m/s');}
// A correct answer surges, a miss settles and slows, neither is instant.
run({mode:'racing'},120);const steady=scene.speed;race.correct++;race.attempts++;{let pitch=scene.player.group.rotation.x,jump=0;for(let i=0;i<20;i++){run({mode:'racing'},1);jump=Math.max(jump,Math.abs(scene.player.group.rotation.x-pitch));pitch=scene.player.group.rotation.x;}assert(jump<.04,'the bow lifts over several frames, never in one');}assert(scene.surge>.4);assert(scene.speed>steady,'correct answer = visible surge');
run({mode:'racing'},240);race.attempts++;run({mode:'racing'},40);assert(scene.settle>.4);assert(scene.speed<steady,'a miss lets the craft settle and slow');assert(scene.speed>4,'without stopping or punishing effects');
// Hydro Boost widens the view; reduced motion keeps the camera calm.
run({mode:'racing'},300);const calmFov=scene.fov;race.boost=2;race.correct++;race.attempts++;run({mode:'racing'},60);assert(scene.fov>calmFov+3,'Hydro Boost kicks the field of view');assert(scene.streaks.visible);
run({mode:'racing',reduced:true},240);assert(Math.abs(scene.fov-calmFov)<.6,'reduced motion: no field-of-view kick');assert.equal(scene.streaks.visible,false);race.boost=0;
// Pause freezes the picture exactly.
const snapshot=()=>[scene.distance,scene.time,scene.player.group.position.toArray().join(),scene.pace.group.position.toArray().join(),scene.camera.position.toArray().join()].join('|');
run({mode:'racing'},60);const before=snapshot();run({mode:'racing',paused:true},30);assert.equal(snapshot(),before,'pause freezes motion');
// Finish brings the checkered gate.
run({mode:'finish'},10);assert.equal(scene.archKind,'finish');assert(scene.arch.visible);
// Equipped gear rebuilds only the student's craft.
const paceCraft=scene.pace.craft;run({mode:'racing',gear:{id:'jetski-2',model:'touring',color:'#53cbbd',trim:{id:'jetski-trim-neon',color:'#73e5ce'}}},3);assert.equal(scene.player.craft.userData.kind,'touring');assert.equal(scene.player.craft.userData.color,'#53cbbd');assert(scene.player.glow,'neon trim glows on the water');assert.equal(scene.pace.craft,paceCraft);assert.equal(scene.pace.craft.userData.color,GOLD_COLOR);
run({mode:'racing',gear:{id:'jetski-0',color:'#3a9ee8',trim:{id:'jetski-trim-stars',color:'#f2c94c'}}},3);assert(scene.player.star,'star badge flies from the stern');assert.equal(scene.player.glow,null);
assert.equal(JSON.stringify({...race,correct:0,attempts:0}),frozen,'the scene only reads the race');
assert(renders>1000);

// Rider tags, the off-screen marker and coins are finite at every size; pause freezes coins.
const texts=[],ctx=new Proxy({measureText:t=>({width:t.length*6}),fillText(t,x,y){assert(Number.isFinite(x)&&Number.isFinite(y));texts.push(t);}},{get:(o,k)=>o[k]||((...a)=>{if(['ellipse','rect','roundRect','moveTo','lineTo','fillRect','clearRect'].includes(k))assert(a.filter(v=>typeof v==='number').every(Number.isFinite),k+' finite');})});
for(const [w,h] of [[1280,700],[390,330],[435,287],[750,500]]){
 texts.length=0;drawOverlay({ctx,w,h,mode:'racing',paused:false,dt:.016,sparks:[],flash:.2},{player:{x:.6,y:.5,visible:true,depth:8},pace:{x:.4,y:.42,visible:true,depth:30}},{safeTop:60});assert(texts.includes('YOU')&&texts.includes('PACE RIDER'));
 texts.length=0;drawOverlay({ctx,w,h,mode:'racing',paused:false,dt:.016,sparks:[]},{player:{x:.6,y:.5,visible:true,depth:8},pace:{x:-.4,y:.9,visible:false,edge:-1,depth:2}},{});assert(texts.some(t=>t.includes('PACE RIDER')&&t.includes('◀')),'an off-screen pace rider gets an edge marker');
}
const coin={life:1.1,coin:true,vx:3},spray={life:1.1,coin:false,vx:1};drawOverlay({ctx,w:400,h:300,mode:'racing',paused:true,dt:.1,sparks:[coin,spray]},scene.labels,{});assert.equal(coin.life,1.1,'pause freezes coin effects');
drawOverlay({ctx,w:400,h:300,mode:'racing',paused:false,dt:.1,sparks:[coin,spray]},scene.labels,{});assert(coin.life<1.05&&spray.life<1.05,'effects expire so the game can clear them');
scene.dispose();

// Shipping contract: local vendored three.js only, relative paths, 2D art still in place.
for(const file of ['dist/wave/scene3d.mjs','dist/wave/models.mjs']){
 const source=fs.readFileSync(file,'utf8');assert(!/https?:\/\//.test(source),file+' loads nothing from another origin');
 for(const m of source.matchAll(/from '([^']+)'|import\('([^']+)'\)/g)){const target=(m[1]||m[2]).split('?')[0];assert(target.startsWith('.'),'relative import '+target);assert(fs.existsSync(new URL(target,new URL('../'+file,import.meta.url))),'import exists: '+target);}
}
for(const f of ['rider-poses-v38.webp','ocean-surface-v38.webp','foam-wake-v38.webp'])assert(fs.statSync('dist/wave/art/'+f).size>10000,'existing artwork is kept: '+f);
console.log('PASS Wave Riders 3D: gear-matched craft with riders, bounded geometry and draw calls, seamless swell, clamped monotonic pace rider, eased motion at 30/60 fps, surge/settle/boost, reduced motion, exact pause, finish gate, finite overlay and unchanged race state.');
