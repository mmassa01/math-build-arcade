import * as T from '../store/vendor/three.module.min.js';
import {createDragon,poseDragon,scaleTexture} from './flight-model.mjs?v=mountains-48';
import {mountainHeight,waterVertex,waterFragment} from './landscape-hd.mjs?v=shore-47';
import {CoastWorld} from './coast-world.mjs?v=coast-49';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mod=(x,n)=>((x%n)+n)%n;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function rivalPosition(enemy,time,index=0){
 const age=enemy.age??time,entry=1-smooth(age/.65),side=enemy.side??(enemy.id%2?1:-1),escape=smooth((enemy.escapeAge||0)/.85);
 return new T.Vector3((enemy.x-.5)*24+side*(entry*60+escape*75)+Math.sin(time*.8+enemy.id)*1.2,8+index*1.8+Math.sin(time*1.4+enemy.id)*.65+escape*12,27+index*17+entry*13+escape*30);
}
export const landHeight=mountainHeight;
export class FjordFlight{
 constructor(canvas){
  this.canvas=canvas;this.views=new Map();this.shots=new Map();this.key='';this.width=0;this.height=0;this.lastTime=0;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,3));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.scene=new T.Scene();this.scene.background=new T.Color('#93afbd');this.scene.fog=new T.FogExp2('#b6c8c8',.0012);this.camera=new T.PerspectiveCamera(57,1,.1,1400);this.camera.position.set(0,10,-16);
  this.scene.add(new T.HemisphereLight('#d4e8f4','#303b2b',2.1));const sun=new T.DirectionalLight('#ffe2b8',3.2);sun.position.set(-70,90,-35);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-20,right:20,top:24,bottom:-24,near:.5,far:220});sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;sun.target.position.set(0,3,0);this.scene.add(sun,sun.target);const rim=new T.DirectionalLight('#95bac9',1.2);rim.position.set(50,35,80);this.scene.add(rim);
  const environmentCanvas=document.createElement('canvas');environmentCanvas.width=512;environmentCanvas.height=256;const ec=environmentCanvas.getContext('2d'),eg=ec.createLinearGradient(0,0,0,256);eg.addColorStop(0,'#7f9bac');eg.addColorStop(.48,'#e8eae0');eg.addColorStop(.53,'#516b67');eg.addColorStop(1,'#182e2e');ec.fillStyle=eg;ec.fillRect(0,0,512,256);const glow=ec.createRadialGradient(95,78,1,95,78,40);glow.addColorStop(0,'#fff5da');glow.addColorStop(.2,'#ffe8be');glow.addColorStop(1,'#ffe8be00');ec.fillStyle=glow;ec.fillRect(0,0,512,256);const skyTexture=new T.CanvasTexture(environmentCanvas);skyTexture.colorSpace=T.SRGBColorSpace;skyTexture.mapping=T.EquirectangularReflectionMapping;const pmrem=new T.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromEquirectangular(skyTexture).texture;this.scene.environmentIntensity=.65;pmrem.dispose();skyTexture.dispose();
  this.scales=scaleTexture();this.hero=createDragon('skyfire',this.scales);this.scene.add(this.hero);
  this.background();this.buildLandscape();this.buildWater();this.addMist();this.resize();
 }
 background(){
  const g=new T.PlaneGeometry(1400,933),mat=new T.MeshBasicMaterial({color:'#ffffff',fog:false,depthWrite:false,toneMapped:false});this.plate=new T.Mesh(g,mat);this.plate.position.set(0,100,650);this.plate.rotation.y=Math.PI;this.plate.renderOrder=-10;this.scene.add(this.plate);
  new T.TextureLoader().load(new URL('./art/fjord-v45.webp',import.meta.url).href,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(16,this.renderer.capabilities.getMaxAnisotropy());t.magFilter=T.LinearFilter;mat.map=t;mat.needsUpdate=true;this.pano=t;this.artLoaded=true;});
 }
 buildLandscape(){this.coast=new CoastWorld(this.scene);}

 buildWater(){
  this.reflection=new T.WebGLRenderTarget(1024,512,{type:this.renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,generateMipmaps:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});this.reflection.texture.colorSpace=T.LinearSRGBColorSpace;this.mirrorCamera=new T.PerspectiveCamera();this.reflectionMatrix=new T.Matrix4();this.reflectionFrame=0;
  const mat=new T.ShaderMaterial({uniforms:{time:{value:0},reflectionMap:{value:this.reflection.texture},reflectionMatrix:{value:this.reflectionMatrix},cameraPos:{value:this.camera.position}},vertexShader:waterVertex,fragmentShader:waterFragment});
  const water=new T.Mesh(new T.PlaneGeometry(1800,1600,48,160),mat);water.rotation.x=-Math.PI/2;water.position.set(0,-3.4,500);this.scene.add(water);this.water=water;
 }
 reflectLake(){
  if(this.reflectionFrame++%2&&this.reflectionFrame>2)return;const y=-3.4,dir=new T.Vector3();this.camera.getWorldDirection(dir);const target=this.camera.position.clone().add(dir);target.y=2*y-target.y;
  this.mirrorCamera.copy(this.camera);this.mirrorCamera.position.copy(this.camera.position);this.mirrorCamera.position.y=2*y-this.camera.position.y;this.mirrorCamera.up.copy(this.camera.up);this.mirrorCamera.up.y*=-1;this.mirrorCamera.lookAt(target);this.mirrorCamera.updateMatrixWorld();
  this.reflectionMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(this.mirrorCamera.projectionMatrix).multiply(this.mirrorCamera.matrixWorldInverse);
  const renderer=this.renderer,oldTarget=renderer.getRenderTarget(),clip=renderer.clippingPlanes;this.water.visible=false;renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,1,0),-y)];renderer.setRenderTarget(this.reflection);renderer.clear();renderer.render(this.scene,this.mirrorCamera);renderer.setRenderTarget(oldTarget);renderer.clippingPlanes=clip;this.water.visible=true;
 }

 addMist(){
  const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(64,32,2,64,32,64);g.addColorStop(0,'#e2eeed88');g.addColorStop(1,'#e2eeed00');x.fillStyle=g;x.fillRect(0,0,128,64);const tex=new T.CanvasTexture(c);this.mists=[];
  for(let i=0;i<9;i++){const m=new T.Mesh(new T.PlaneGeometry(80,12),new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide}));m.position.set((i%2?1:-1)*28,1,40+i*36);m.rotation.y=Math.PI;this.scene.add(m);this.mists.push(m);}
 }
 resize(){const r=this.canvas.getBoundingClientRect();if(r.width===this.width&&r.height===this.height)return;this.width=r.width;this.height=r.height;this.renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);this.reflection?.setSize(Math.min(2048,Math.ceil(r.width*Math.min(devicePixelRatio||1,2))),Math.min(1536,Math.ceil(r.height*Math.min(devicePixelRatio||1,2))));this.camera.aspect=Math.max(.2,r.width/Math.max(1,r.height));this.camera.fov=this.camera.aspect<.85?65:57;this.camera.updateProjectionMatrix();}
 project(s,point,size=6){const p=point.clone().project(this.camera),distance=Math.max(1,point.distanceTo(this.camera.position)),scale=s.h/(2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*distance);return{x:(p.x*.5+.5)*s.w,y:(-.5*p.y+.5)*s.h,size:size*scale};}
 target(s,x,z){const e=s.game?.enemies.find(e=>Math.abs(e.x-x)<.001&&Math.abs(e.z-z)<.002);return this.project(s,e?rivalPosition(e,s.time,s.game.enemies.indexOf(e)):new T.Vector3((x-.5)*24,8,27),9);}
 update(s){
  this.resize();const time=s.reduced?0:s.time,travel=time*15,bank=s.motion?.roll??(s.reduced?0:clamp(((s.game?.targetX??.5)-(s.game?.x??.5))*.55,-.16,.16)),x=s.motion?.x??((s.game?.x??.5)-.5)*8;
  const skin=s.equippedDragon?.src?.match(/(frostwing|stormfire|obsidian|golden)/)?.[1]||'skyfire';if(skin!==this.key){this.key=skin;this.scene.remove(this.hero);this.hero.traverse(m=>{if(m.isMesh)m.geometry.dispose();});this.hero=createDragon(skin,this.scales);this.scene.add(this.hero);}
  this.hero.position.set(x,5.4+(s.motion?.heave??Math.sin(time*.7)*.35),0);this.hero.rotation.y=s.motion?.yaw??0;poseDragon(this.hero,time,bank,s.reduced);
  if(s.victoryFlight>=0){const q=smooth(s.victoryFlight/4);this.hero.position.y+=q*10;this.hero.position.z+=q*48;}
  const portrait=this.camera.aspect<.85,desired=new T.Vector3(x*.42+Math.sin(time*.13)*.38,portrait?10.5:9.6,portrait?(skin==='golden'?-23:-21):-15.8),alpha=s.paused?1:1-Math.exp(-s.dt*3);
  this.camera.position.lerp(desired,alpha);this.camera.up.set(bank*.24,1,0);this.camera.lookAt(x*.30,7.6,35);this.camera.updateMatrixWorld();
  this.water.material.uniforms.time.value=time;
  this.coast?.update(time);
  this.mists.forEach((m,i)=>{m.position.z=mod(40+i*36-travel*.6+25,330)-25;});
  const ids=new Set();for(const [i,e]of (s.game?.enemies||[]).entries()){ids.add(e.id);let model=this.views.get(e.id);if(!model){model=createDragon(e.id%2?'obsidian':'stormfire',this.scales);model.scale.setScalar(.68);this.views.set(e.id,model);this.scene.add(model);}model.visible=e.targeted||e.escaping||(!s.game.ready&&(e===s.game.primary()||s.game.charge===3));model.position.copy(rivalPosition(e,time,i));model.rotation.y=-e.side*(1-smooth(e.age/.65))*.9-e.side*smooth((e.escapeAge||0)/.85)*.8;poseDragon(model,time+e.id,e.side*.07,s.reduced);}
  for(const [id,m]of this.views)if(!ids.has(id)){this.scene.remove(m);m.traverse(o=>{if(o.isMesh)o.geometry.dispose();});this.views.delete(id);}
  if(!s.paused||!this.shadowRendered){this.renderer.shadowMap.needsUpdate=true;this.shadowRendered=true;}this.reflectLake();this.renderer.render(this.scene,this.camera);this.overlay(s);s.canvas.dataset.renderer='fjord-flight-3d';s.canvas.dataset.skin=skin;
 }
 overlay(s){
  const {ctx,w,h}=s;ctx.clearRect(0,0,w,h);const primary=s.game?.primary?.();
  for(const e of s.game?.enemies||[]){if(e!==primary&&!e.targeted)continue;const p=this.target(s,e.x,e.z),r=clamp(p.size*.35,12,60);ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=e.targeted?'#ffedb2':'#fff4d396';ctx.lineWidth=1.2;for(let j=0;j<4;j++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(-r,-r*.65);ctx.lineTo(-r,-r);ctx.lineTo(-r*.65,-r);ctx.stroke();}ctx.font='800 9px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff5d0';ctx.shadowBlur=5;ctx.shadowColor='#10252c';ctx.fillText(e.targeted?'LOCKED':Math.max(0,3-(s.game?.elapsed||0)).toFixed(1)+'s',0,-r-9);ctx.restore();}
  const hero=this.project(s,this.hero.position,12);window.DragonCinema?.drawAccent?.(s,hero.x,hero.y,hero.size,this.key);
  const mouth=this.hero.localToWorld(new T.Vector3(0,.6,3.5)),start=this.project(s,mouth);
  for(const shot of s.game?.shots||[]){const e=s.game.enemies.find(e=>e.id===shot.targetId);if(!e)continue;const end=this.target(s,e.x,e.z);if(shot.miss){end.x+=shot.side*w*.4;end.y-=h*.12;}const t=clamp(shot.elapsed/shot.duration,0,1),at=q=>({x:start.x+(end.x-start.x)*q,y:start.y+(end.y-start.y)*q-Math.sin(q*Math.PI)*h*.025}),p=at(t),tail=at(Math.max(0,t-.33));ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor='#ff7b21';ctx.shadowBlur=shot.power?30:17;const g=ctx.createLinearGradient(tail.x,tail.y,p.x,p.y);g.addColorStop(0,'#ff4c0000');g.addColorStop(.5,'#ff8a22cc');g.addColorStop(1,'#fff6ce');ctx.strokeStyle=g;ctx.lineWidth=shot.power?15:8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(p.x,p.y);ctx.stroke();for(let i=0;i<16;i++){const q=Math.max(0,t-i*.015),a=at(q);ctx.fillStyle=i%2?'#ffe18b':'#ff781f';ctx.globalAlpha=1-i/17;ctx.beginPath();ctx.arc(a.x+Math.sin(i*8+s.time*13)*5,a.y+Math.cos(i*5+s.time*14)*4,(shot.power?5:3)*(1-i/20),0,Math.PI*2);ctx.fill();}ctx.restore();}
  for(const p of s.particles){if(!s.paused){p.life-=s.dt;p.x+=p.vx*s.dt;p.y+=p.vy*s.dt;}ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.shadowColor='#ffab46';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,2+p.life*3,0,Math.PI*2);ctx.fill();ctx.restore();}
  for(const ring of s.rings){if(!s.paused)ring.life-=s.dt;if(ring.life<=0)continue;const p=this.target(s,ring.x,ring.z);ctx.save();ctx.globalAlpha=ring.life;ctx.strokeStyle='#ffdb8a';ctx.lineWidth=3;ctx.shadowBlur=15;ctx.shadowColor='#ffa650';ctx.beginPath();ctx.arc(p.x,p.y,12+(1-ring.life)*85,0,Math.PI*2);ctx.stroke();ctx.font='900 22px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff3c1';ctx.fillText(ring.power?'+50':'+25',p.x,p.y-25);ctx.restore();}
  if(s.paused&&s.game?.active){ctx.fillStyle='#102e4144';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff1cf';ctx.font='900 22px system-ui';ctx.textAlign='center';ctx.fillText('FLIGHT PAUSED',w/2,h/2);}
 }
}
if(typeof window!=='undefined'){
 const api=window.DragonCinema,oldDraw=api.draw,oldTarget=api.target;let view,failed=false;
 api.draw=s=>{if(failed)return oldDraw(s);try{if(!view){const canvas=document.createElement('canvas');canvas.className='flight3d';canvas.setAttribute('aria-hidden','true');s.canvas.before(canvas);view=new FjordFlight(canvas);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;canvas.remove();});window.DragonFlightDebug={view,snapshot:()=>({renderer:'fjord-flight-3d',drawCalls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles,skin:view.key,artLoaded:!!view.artLoaded,coastReady:!!view.coast?.ready,coastFailed:!!view.coast?.failed})};}view.update(s);return true;}catch(error){failed=true;document.querySelector('.flight3d')?.remove();console.warn('Dragon 3D unavailable; using the compatible flight view.',error);return oldDraw(s);}};
 api.target=(s,x,z)=>view&&!failed?view.target(s,x,z):oldTarget(s,x,z);
}
