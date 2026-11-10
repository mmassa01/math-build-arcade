import * as T from '../store/vendor/three.module.min.js';
import {box,sphere,cylinder,material,labelTexture,createTrain,createRunner,poseRunner,batchStatic,worldZ,worldX,LANE_WIDTH,ROOF_HEIGHT} from './models.mjs?v=review-56';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mod=(x,n)=>((x%n)+n)%n;
export class SkyrailScene{
 constructor(canvas){
  this.canvas=canvas;this.time=0;this.gearId='';this.trainViews=new Map();this.coinViews=new Map();this.bursts=[];this.jumpGlow=0;this.lastHeight=0;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.94;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene=new T.Scene();this.scene.background=new T.Color('#319ed1');this.scene.fog=new T.FogExp2('#9ccddd',.0038);this.camera=new T.PerspectiveCamera(57,1,.1,650);this.camera.position.set(0,6.4,-13.5);
  const fill=new T.HemisphereLight('#c2e9ff','#303944',1.45);this.scene.add(fill);
  this.sun=new T.DirectionalLight('#ffdfad',2.8);this.sun.position.set(-22,36,-13);this.sun.castShadow=true;Object.assign(this.sun.shadow.camera,{left:-22,right:22,top:38,bottom:-24,near:.5,far:110});this.sun.shadow.mapSize.set(1536,1536);this.sun.shadow.bias=-.0004;this.sun.shadow.normalBias=.035;this.sun.target.position.set(0,0,20);this.scene.add(this.sun,this.sun.target);
  const rim=new T.DirectionalLight('#b9efff',1.1);rim.position.set(15,10,25);this.scene.add(rim);
  this.environment();this.buildWorld();this.loadCityArt();this.runner=createRunner();this.scene.add(this.runner);
  this.coingeo=new T.CylinderGeometry(.38,.38,.105,24);this.coingeo.rotateX(Math.PI/2);this.ringGeo=new T.TorusGeometry(.26,.025,6,24);this.starGeo=new T.OctahedronGeometry(.135,0);this.coinMat=material('#ffc83c',.7,.22);this.coinFace=material('#ffe491',.35,.3);
  this.dotgeo=new T.SphereGeometry(.055,6,5);this.dotmat=new T.MeshBasicMaterial({color:'#ffe39b'});this.resize();
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('hint').textContent='Graphics paused. Reload to restart your run.';window.dispatchEvent(new Event('skyrail-context-lost'));});
 }
 environment(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#327eb8');g.addColorStop(.48,'#a7d7e7');g.addColorStop(.53,'#edcda1');g.addColorStop(1,'#293842');x.fillStyle=g;x.fillRect(0,0,512,256);const sun=x.createRadialGradient(80,100,0,80,100,50);sun.addColorStop(0,'#fff5dd');sun.addColorStop(.2,'#fff5dd');sun.addColorStop(1,'#fff5dd00');x.fillStyle=sun;x.fillRect(0,0,512,256);const tex=new T.CanvasTexture(c);tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.SRGBColorSpace;const pm=new T.PMREMGenerator(this.renderer);this.scene.environment=pm.fromEquirectangular(tex).texture;this.scene.environmentIntensity=.45;tex.dispose();pm.dispose();
 }
 loadCityArt(){
  // Loading art never blocks the game. The procedural facade remains if a download fails.
  new T.TextureLoader().load(new URL('./art/harbor-facades-v1.webp',import.meta.url).href,atlas=>{
   atlas.colorSpace=T.SRGBColorSpace;atlas.wrapS=atlas.wrapT=T.RepeatWrapping;atlas.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
   for(const v of this.city){const texture=atlas.clone();texture.repeat.set(1/3,v.floors/4);texture.offset.x=v.style/3;texture.needsUpdate=true;v.wall.material=new T.MeshStandardMaterial({map:texture,roughness:v.style===2?.42:.85,metalness:v.style===2?.2:0});}
   this.cityArtLoaded=true;
  },undefined,()=>{this.cityArtLoaded=false;});
 }
 facade(color){
  this.facades??=new Map();if(this.facades.has(color))return this.facades.get(color);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,256,256);
  for(let row=0;row<3;row++){const y=row*84+15;x.fillStyle='#f6f3df';x.fillRect(0,y+58,256,4);for(let col=0;col<4;col++){const a=col*64+12;x.fillStyle='#365e6b';x.fillRect(a,y,37,52);x.fillStyle=(col+row)%4===0?'#b1d6d0':'#5f939e';x.fillRect(a+3,y+3,31,44);x.fillStyle='#a9c6bd';x.fillRect(a+17,y+2,2,47);x.fillRect(a+2,y+24,33,2);x.fillStyle='#e1ddd0';x.fillRect(a-2,y+50,41,4);x.fillStyle='#ffffff25';x.fillRect(a+4,y+4,6,38);}}
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(1,2);texture.anisotropy=4;const mat=new T.MeshStandardMaterial({color:'#ffffff',map:texture,roughness:.73,metalness:.05});this.facades.set(color,mat);return mat;
 }
 buildWorld(){
  const scene=this.scene,concrete=material('#b5bdbe',.06,.84),steel=material('#163e59',.65,.4),rail=material('#b6d7e7',.78,.26),dark=material('#24313d',.15,.9),yellow=material('#ffbf28',.18,.6),teal=material('#087d92',.25,.38),white=material('#fff0d5'),orange=material('#e26c32');
  // Elevated railway: actual rail geometry, sleepers, side walks, and supports.
  box(scene,0,-.8,105,13,1.4,280,concrete,.15);box(scene,0,-.08,105,10.8,.17,280,dark);
  for(const side of [-1,1]){box(scene,side*5.8,.04,105,1.1,.28,280,concrete);box(scene,side*5.23,.21,105,.16,.045,280,yellow);box(scene,side*6.38,.62,105,.08,.09,280,steel);box(scene,side*6.38,1.12,105,.08,.08,280,rail);}
  for(let lane=-1;lane<=1;lane++){for(const side of [-1,1]){box(scene,lane*LANE_WIDTH+side*.79,.12,105,.11,.16,280,rail);box(scene,lane*LANE_WIDTH+side*.79,.03,105,.22,.08,280,steel);}}
  this.sleepers=new T.InstancedMesh(new T.BoxGeometry(2.1,.12,.24),material('#798a88',.08,.9),3*96);const dummy=new T.Object3D();let k=0;for(let z=-30;z<258;z+=3)for(let lane=-1;lane<=1;lane++){dummy.position.set(lane*LANE_WIDTH,-.005,z);dummy.updateMatrix();this.sleepers.setMatrixAt(k++,dummy.matrix)}scene.add(this.sleepers);
  const ocean=new T.Mesh(new T.PlaneGeometry(1800,1500),material('#13698b',.28,.25));ocean.rotation.x=-Math.PI/2;ocean.position.set(0,-14,200);scene.add(ocean);
  // The viaduct passes above a real city: continuous land, quay walls, roads and sidewalks.
  this.cityGroundTop=-11;const land=new T.Group();land.name='grounded-city';
  for(const side of [-1,1]){
   box(land,side*91,-12.5,150,162,3,900,material('#655b52')); // Top exactly matches building footings.
   box(land,side*9.9,-12,150,.4,4,900,material('#a4917a'));
   box(land,side*14,-10.96,150,7,.08,900,material('#293441'));
   box(land,side*18.3,-10.86,150,1.4,.28,900,concrete);
   for(let z=-90;z<490;z+=12){box(land,side*14,-10.9,z,.1,.015,4,yellow);}
  }
  batchStatic(land);scene.add(land);
  // Low city blocks and taller glass towers frame the railway without blocking the lanes.
  this.city=[];const palette=['#c75c3c','#dfac40','#286b9c'];
  for(let i=0;i<28;i++){const group=new T.Group(),side=i%2?1:-1,floors=4+(i*7%10),h=floors*3,w=7+(i%3)*2,d=8+i%5*2,style=i%3;group.name='city-building-'+i;group.position.set(side*(23+(i%4)*13),this.cityGroundTop,20+i*12);
   const wall=box(group,0,h/2,0,w,h,d,this.facade(palette[style]));wall.name='textured-facade';
   const details=new T.Group();group.add(details);
   box(details,0,.35,0,w+.55,.7,d+.55,material('#6b625a'));
   box(details,0,h+.15,0,w+.65,.45,d+.65,white,.08);box(details,0,h+.5,0,w+.3,.25,d+.3,teal);
   for(let floor=1;floor<floors;floor++)box(details,0,floor*3,0,w+.16,.12,d+.16,style===2?steel:white);
   for(const sx of [-1,1]){box(details,sx*(w/2-.12),h/2,-d/2-.1,.23,h,.25,white);}
   for(const sx of [-1,1]){box(details,sx*w*.26,1.45,-d/2-.09,w*.32,2.2,.17,material('#153e51',.25,.25),.05);box(details,sx*w*.26,2.8,-d/2-.4,w*.4,.17,.8,style===1?teal:orange,.04);}
   box(details,0,h+.9,0,w*.42,1.4,d*.35,steel,.12);
   // Architectural details are batched separately so the wall can receive its generated map.
   details.traverse(m=>{m.castShadow=false});batchStatic(details);wall.castShadow=false;scene.add(group);this.city.push({group,wall,floors,style,base:group.position.z,side});
  }
  // Passing station modules, cross beams, copper roof ribs, and illuminated route signs.
  this.stations=[];
  for(let i=0;i<6;i++){
   const g=new T.Group();g.position.z=i*48-24;scene.add(g);this.stations.push(g);
   for(const side of [-1,1]){box(g,side*6.7,4.4,0,.34,9,.4,steel,.06);box(g,side*6.7,8.7,0,.65,.3,.8,orange,.05);box(g,side*7.8,.1,0,2.6,.4,25,concrete,.06);box(g,side*8.85,1.1,0,.1,1.8,25,teal,.025);
    for(let j=0;j<4;j++)box(g,side*6.38,.65,-12+j*7,.07,1.3,.07,rail);
    const planter=box(g,side*7.7,.55,7,1.4,.6,2.3,white,.12);sphere(g,side*7.7,1.1,7,.75,.6,1.1,material('#669465'));sphere(g,side*7.7,1.4,7,.5,.65,.7,material('#81b16c'));
    box(g,side*7.5,1.02,-6,1.65,.18,2.2,orange,.07);box(g,side*7.9,1.56,-6,.18,1.1,2.2,steel,.05);
   }
   // The entire aperture clears the tallest outfit at maximum legal roof jump.
   box(g,0,8.8,0,13.65,.25,.36,steel,.04);box(g,0,9.1,0,13.8,.16,.6,orange,.04);box(g,0,8.51,0,10,.045,.26,new T.MeshBasicMaterial({color:'#fff1b0'}));
   const curve=new T.CatmullRomCurve3([new T.Vector3(-6.8,9,0),new T.Vector3(-3.4,10.2,0),new T.Vector3(0,10.6,0),new T.Vector3(3.4,10.2,0),new T.Vector3(6.8,9,0)]);const arch=new T.Mesh(new T.TubeGeometry(curve,24,.075,6,false),orange);g.add(arch);const arch2=arch.clone();arch2.position.z=6;g.add(arch2);const arch3=arch.clone();arch3.position.z=-6;g.add(arch3);
   for(const x of [-5,-2.5,0,2.5,5])box(g,x,10.45-Math.abs(x)*.18,0,.065,.075,12,rail);
   if(i%2===0){const sign=new T.Mesh(new T.PlaneGeometry(2.9,.45),new T.MeshBasicMaterial({map:labelTexture(i===0?'HARBOR LINE':i===2?'SUNRISE STATION':'SKYRAIL EXPRESS')}));sign.rotation.y=Math.PI;sign.position.set(5,9.45,-.25);g.add(sign);}
   const support=box(g,0,-7.8,0,2.4,13.5,3.2,material('#78989b'),.25);support.castShadow=false;batchStatic(g);
  }
  // Cable bridge beyond the station gives a strong depth cue at the horizon.
  for(const side of [-1,1]){box(scene,side*10,19,190,1.2,59,1.6,white,.2);box(scene,side*10,46.5,190,1.5,.6,3,orange,.1);for(let j=0;j<9;j++){const z=100+j*20,a=new T.Vector3(side*10,44,190),b=new T.Vector3(side*6.4,1,z),line=new T.Line(new T.BufferGeometry().setFromPoints([a,b]),new T.LineBasicMaterial({color:'#f6e4c1'}));scene.add(line);}}
  const sun=new T.Mesh(new T.SphereGeometry(15,24,16),new T.MeshBasicMaterial({color:'#fff0c0',fog:false}));sun.position.set(-130,100,440);scene.add(sun);
  for(let i=0;i<9;i++){const cloud=new T.Group();for(let j=0;j<4;j++)sphere(cloud,j*9,Math.sin(j*2)*2,0,11,3.5,6,material('#e9f3e9'));cloud.position.set(-200+i*55,68+(i%3)*18,220+(i%4)*60);cloud.traverse(n=>{n.castShadow=false});scene.add(cloud);}
 }
 resize(){const r=this.canvas.getBoundingClientRect();this.renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);this.camera.aspect=Math.max(.2,r.width/Math.max(1,r.height));this.camera.fov=this.camera.aspect<.85?67:57;this.camera.updateProjectionMatrix();}
 event(type,data){if(type==='coin'||type==='land'){const count=type==='land'?20:12;for(let i=0;i<count;i++){const p=new T.Mesh(this.dotgeo,this.dotmat);p.position.copy(this.runner.position);p.position.y+=1.2;p.userData={life:.7,v:new T.Vector3((Math.random()-.5)*6,Math.random()*5+2,(Math.random()-.5)*5)};this.scene.add(p);this.bursts.push(p)}}if(type==='jump')this.jumpGlow=.5;}
 update(engine,dt){
  if(!engine.paused)this.time+=dt;const travel=engine.world*16,pose=engine.pose(),height=Math.max(0,(pose.roof+pose.lift)*ROOF_HEIGHT),x=worldX(pose.lane);
  const gearKey=JSON.stringify([engine.gear?.id,engine.gear?.color,engine.gear?.trim]);if(gearKey!==this.gearId){this.gearId=gearKey;this.scene.remove(this.runner);this.runner=createRunner(engine.gear||{});this.scene.add(this.runner);}
  this.runner.position.set(x,.18+height,0);const bank=clamp(engine.lane-engine.targetLane,-1,1);this.runner.rotation.z=-bank*.13;this.runner.rotation.y=bank*.12;poseRunner(this.runner,this.time,{jump:!!pose.jump,bank,land:pose.landSquash});
  const desiredY=6.5+height*.55,smooth=1-Math.exp(-dt*4.5);this.camera.position.x+=(x*.24-this.camera.position.x)*smooth;this.camera.position.y+=(desiredY-this.camera.position.y)*smooth;this.camera.position.z=this.camera.aspect<.85?-15.5:-13.5;this.camera.lookAt(x*.17,1.5+height*.45,20);this.sleepers.position.z=-mod(travel,3);
  for(let i=0;i<this.stations.length;i++)this.stations[i].position.z=-28+mod(i*48-travel,288);
  for(const v of this.city)v.group.position.z=-55+mod(v.base-travel*.32,400);
  const live=new Set();for(const tr of engine.trains){live.add(tr.id);let view=this.trainViews.get(tr.id);if(!view){view=createTrain(tr.color,tr.length*88);this.scene.add(view);this.trainViews.set(tr.id,view)}view.position.set(worldX(tr.lane),.18,worldZ(tr.z));view.visible=view.position.z<180&&view.position.z+view.userData.length>-24;}
  for(const [id,view]of this.trainViews)if(!live.has(id)){this.scene.remove(view);view.traverse(m=>{if(m.geometry?.userData.batched)m.geometry.dispose()});this.trainViews.delete(id)}
  const ids=new Set();for(const c of engine.coinTrail){ids.add(c.id);let v=this.coinViews.get(c.id);if(!v){v=new T.Group();v.add(new T.Mesh(this.coingeo,this.coinMat));const face=new T.Mesh(this.ringGeo,this.coinFace);face.position.z=-.065;v.add(face);const star=new T.Mesh(this.starGeo,this.coinFace);star.scale.z=.25;star.position.z=-.074;v.add(star);this.scene.add(v);this.coinViews.set(c.id,v)}v.visible=!c.collected&&c.z<1.1;const covered=engine.trains.some(t=>t.lane===c.lane&&t.z>=c.z&&t.z-t.length<=c.z);const targetHeight=(covered?ROOF_HEIGHT:0)+1.2;v.userData.y??=targetHeight;v.userData.y+=(targetHeight-v.userData.y)*(1-Math.exp(-dt*9));v.position.set(worldX(c.lane),v.userData.y+Math.sin(this.time*3+c.z*9)*.12,worldZ(c.z));v.rotation.y=this.time*2.5+c.z*3;}
  for(const [id,v]of this.coinViews)if(!ids.has(id)){this.scene.remove(v);this.coinViews.delete(id)}
  if(!engine.paused)for(let i=this.bursts.length-1;i>=0;i--){const p=this.bursts[i];p.userData.life-=dt;p.userData.v.y-=dt*8;p.position.addScaledVector(p.userData.v,dt);p.scale.setScalar(Math.max(0,p.userData.life));if(p.userData.life<=0){this.scene.remove(p);this.bursts.splice(i,1)}}
  this.renderer.render(this.scene,this.camera);
  this.canvas.dataset.renderer='webgl-3d';
 }
}

if(typeof window!=='undefined'){
 window.Skyrail3D={create(canvas){try{const target=canvas.cloneNode(false),view=new SkyrailScene(target);canvas.replaceWith(target);view.resize();if(typeof ResizeObserver!=="undefined"){view.observer=new ResizeObserver(()=>view.resize());view.observer.observe(target)}document.querySelector('.liveTag').textContent='HARBOR LINE ● LIVE 3D';window.SkyrailDebug={view,snapshot:()=>({renderer:'webgl-3d',drawCalls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles,trains:view.trainViews.size,coins:view.coinViews.size})};return view}catch(error){document.querySelector('.liveTag').textContent='COMPATIBILITY VIEW';console.warn('Skyrail 3D unavailable; using the compatible 2D view.',error);return null}}};
 await import('./game.js?v=review-56');
}
