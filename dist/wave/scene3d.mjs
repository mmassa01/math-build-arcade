// Wave Riders real-time 3D scene.
// This module only draws. It reads the race that dirt/game.js already runs and never changes
// cards, timing, coins, the pace rider or saved gear. If WebGL is missing, the context is lost,
// or the frame rate stays very low, the original 2D WaveCinema picture takes over automatically.
import * as T from '../store/vendor/three.module.min.js';
import {createCraft,adoptStoreCraft,craftKind,craftColor,buoyGeometry,islandGeometry,archGeometry} from './models.mjs?v=wave3d-1';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(v,n)=>((v%n)+n)%n,ease=(dt,rate)=>1-Math.exp(-dt*rate);
// The sea repeats every LOOP metres so travelled distance can wrap without a visible seam.
export const LOOP=240;
const K1=Math.PI*2*10/LOOP,K2=Math.PI*2*17/LOOP,K3=Math.PI*2*29/LOOP;
/** Height of the swell at a world point. The water shader uses the same three waves. */
export function waveHeight(x,z,t){return .17*Math.sin(z*K1+x*.11+t*1.3)+.09*Math.sin(z*K2-x*.23+t*1.9+1.7)+.045*Math.sin(x*.61+z*K3+t*2.6);}
const WAVE_GLSL=`
float waveH(vec2 p,float t){return .17*sin(p.y*${K1.toFixed(6)}+p.x*.11+t*1.3)+.09*sin(p.y*${K2.toFixed(6)}-p.x*.23+t*1.9+1.7)+.045*sin(p.x*.61+p.y*${K3.toFixed(6)}+t*2.6);}
vec2 waveD(vec2 p,float t){float a=.17*cos(p.y*${K1.toFixed(6)}+p.x*.11+t*1.3),b=.09*cos(p.y*${K2.toFixed(6)}-p.x*.23+t*1.9+1.7),c=.045*cos(p.x*.61+p.y*${K3.toFixed(6)}+t*2.6);return vec2(a*.11-b*.23+c*.61,a*${K1.toFixed(6)}+b*${K2.toFixed(6)}+c*${K3.toFixed(6)});}`;

export const AHEAD_MAX=30,BEHIND_MAX=6.6,PLAYER_LANE=1.25,PACE_LANE=-1.55,CAMERA_X=-.12;
/**
 * How far the gold pace rider is from the student, in metres along the course.
 * Negative means the pace rider is ahead (up the course), positive means it has dropped back.
 * The honest race gap is compressed so the rider always stays readable.
 */
export function paceOffset(gap){
 if(!Number.isFinite(gap))return 0;const amount=Math.abs(gap);if(amount<.18)return 0;
 return gap<0?-Math.max(1.4,AHEAD_MAX*Math.tanh(amount/3.2)):Math.max(1.4,BEHIND_MAX*Math.tanh(amount/2.2));
}

function dataTexture(size,fn){const data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const c=fn((x+.5)/size,(y+.5)/size),i=(y*size+x)*4;data[i]=c[0]*255;data[i+1]=c[1]*255;data[i+2]=c[2]*255;data[i+3]=c[3]*255;}const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s);};
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;}
const textures={
 soft:()=>dataTexture(64,(u,v)=>{const r=Math.hypot(u-.5,v-.5)*2;return [1,1,1,Math.exp(-r*r*3.2)*smooth(1,.8,r)];}),
 ring:()=>dataTexture(128,(u,v)=>{const r=Math.hypot(u-.5,v-.5)*2,n=noise(u*18,v*18);return [1,1,1,smooth(.42,.72,r)*smooth(1,.8,r)*(.45+.55*n)];}),
 // Stand-in wake until (or unless) the painted foam texture arrives: a V opening away from the stern.
 wake:()=>dataTexture(128,(u,v)=>{const back=1-v,half=.05+back*.43,x=Math.abs(u-.5),edge=smooth(half,half*.55,x)*smooth(half*.1,half*.6,x+.02),core=smooth(half*.5,0,x)*smooth(.5,0,back),n=noise(u*22,v*30);return [1,1,1,clamp((edge*.8+core)*(.5+.6*n)*smooth(1,.75,back)*smooth(0,.03,back),0,1)];}),
 checker:()=>{const t=dataTexture(32,(u,v)=>{const on=(Math.floor(u*8)+Math.floor(v*4))%2;return on?[.97,.97,.94,1]:[.09,.12,.17,1];});t.magFilter=T.NearestFilter;t.wrapS=t.wrapT=T.RepeatWrapping;return t;},
 bands:()=>{const t=dataTexture(32,(u)=>Math.floor(u*8)%2?[.98,.98,.95,1]:[.1,.72,.74,1]);t.wrapS=t.wrapT=T.RepeatWrapping;return t;},
 cloud:()=>dataTexture(128,(u,v)=>{let a=0;for(const [cx,cy,r] of [[.3,.56,.24],[.5,.46,.3],[.7,.56,.25],[.42,.62,.2],[.6,.63,.2]]){const d=Math.hypot((u-cx),(v-cy)*1.7)/r;a=Math.max(a,smooth(1,.35,d));}const shade=.88+.12*smooth(.45,.7,v);return [shade,shade,shade,a*.9*(.85+.15*noise(u*9,v*9))];}),
 // A calm procedural sea for devices where the painted ocean texture is unavailable.
 sea:()=>{const t=dataTexture(128,(u,v)=>{const n=noise(u*8,v*8)*.6+noise(u*19,v*19)*.4;return [.1+n*.25,.55+n*.3,.72+n*.22,1];});t.wrapS=t.wrapT=T.MirroredRepeatWrapping;return t;}
};

const SUN=new T.Vector3(-.36,.2,-.91).normalize();
const PALETTE={haze:'#bfe9f2',zenith:'#2f8fde',mid:'#7cc8ee',shallow:'#22c2cf',deep:'#0c68b4',sun:'#fff3c9'};

function waterMaterial(tex){
 return new T.ShaderMaterial({
  uniforms:{uTex:{value:tex},uD:{value:0},uT:{value:0},uShallow:{value:new T.Color(PALETTE.shallow)},uDeep:{value:new T.Color(PALETTE.deep)},uSky:{value:new T.Color(PALETTE.mid)},uHaze:{value:new T.Color(PALETTE.haze)},uSunCol:{value:new T.Color(PALETTE.sun)},uSun:{value:SUN.clone()},uPainted:{value:0}},
  vertexShader:`uniform float uD,uT;varying vec3 vW;varying float vH;${WAVE_GLSL}
   void main(){vec3 p=position;float near=1.-smoothstep(90.,260.,length(p.xz));vH=waveH(vec2(p.x,p.z-uD),uT)*near;p.y=vH;vW=p;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform sampler2D uTex;uniform float uD,uT,uPainted;uniform vec3 uShallow,uDeep,uSky,uHaze,uSunCol,uSun;varying vec3 vW;varying float vH;${WAVE_GLSL}
   void main(){
    vec2 p=vec2(vW.x,vW.z-uD);vec3 toEye=cameraPosition-vW;float dist=length(toEye);vec3 V=toEye/dist;
    vec3 a=texture2D(uTex,p/12.+vec2(uT*.011,uT*.017)).rgb,b=texture2D(uTex,p/40.+vec2(-uT*.006,uT*.009)).rgb;
    float la=dot(a,vec3(.34)),lb=dot(b,vec3(.34)),near=1.-smoothstep(90.,260.,dist);
    vec2 d=waveD(p,uT)*near;vec3 n=normalize(vec3(-d.x+(la-lb)*.55,1.,-d.y+(a.g-b.b)*.4));
    float fres=clamp(.03+.97*pow(1.-max(dot(n,V),0.),4.),0.,1.);
    vec3 body=mix(uShallow,uDeep,smoothstep(6.,150.,dist));
    body=mix(body,body*(.45+1.5*mix(a,b,.45)),.62*uPainted+.3*(1.-uPainted));
    body+=uShallow*.12*smoothstep(-.1,.3,vH);
    vec3 col=mix(body,uSky,fres*.82);
    vec3 R=reflect(-V,n);float glint=pow(max(dot(R,uSun),0.),90.);col+=uSunCol*glint*(.25+1.1*la);
    float crest=smoothstep(.58,.82,la*.6+lb*.6)*smoothstep(.02,.24,vH)*(1.-smoothstep(30.,110.,dist));col=mix(col,vec3(1.),crest*.55);
    col=mix(col,uHaze,smoothstep(140.,1000.,dist)*.96);
    gl_FragColor=vec4(col,1.);
    #include <colorspace_fragment>
   }`
 });
}
function decalMaterial(map,tint,{flow=0,additive=false}={}){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending,
  uniforms:{map:{value:map},uTint:{value:new T.Color(tint)},uOpacity:{value:1},uD:{value:0},uT:{value:0},uLift:{value:.05},uFlow:{value:flow}},
  vertexShader:`uniform float uD,uT,uLift;varying vec2 vUv;${WAVE_GLSL}
   void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);w.y=waveH(vec2(w.x,w.z-uD),uT)+uLift;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform sampler2D map;uniform vec3 uTint;uniform float uOpacity,uT,uFlow;varying vec2 vUv;
   void main(){vec4 c=texture2D(map,vUv);float churn=1.-uFlow*(.22+.22*sin(vUv.y*34.+uT*11.+vUv.x*9.));float tail=mix(1.,smoothstep(0.,.3,vUv.y),uFlow);gl_FragColor=vec4(mix(c.rgb,vec3(1.),.55)*uTint,c.a*uOpacity*churn*tail);
    #include <colorspace_fragment>
   }`});
}
function skyMaterial(){
 return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
  uniforms:{uHaze:{value:new T.Color(PALETTE.haze)},uMid:{value:new T.Color(PALETTE.mid)},uTop:{value:new T.Color(PALETTE.zenith)},uSunCol:{value:new T.Color(PALETTE.sun)},uSun:{value:SUN.clone()}},
  vertexShader:`varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.);gl_Position=p.xyww;}`,
  fragmentShader:`uniform vec3 uHaze,uMid,uTop,uSunCol,uSun;varying vec3 vDir;
   void main(){vec3 d=normalize(vDir);float h=max(d.y,0.);vec3 col=mix(uHaze,uMid,smoothstep(0.,.16,h));col=mix(col,uTop,smoothstep(.12,.6,h));
    float s=max(dot(d,uSun),0.);col+=uSunCol*(pow(s,2600.)*3.+pow(s,90.)*.26+pow(s,7.)*.1);
    gl_FragColor=vec4(col,1.);
    #include <colorspace_fragment>
   }`});
}
function sprayMaterial(map){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:map},uScale:{value:300}},
  vertexShader:`attribute vec2 aLife;uniform float uScale;varying float vA;void main(){vec4 mv=viewMatrix*vec4(position,1.);vA=aLife.x;gl_PointSize=aLife.y*uScale/max(.5,-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform sampler2D map;varying float vA;void main(){float a=texture2D(map,gl_PointCoord).a*vA;if(a<.01)discard;gl_FragColor=vec4(vec3(1.),a);
    #include <colorspace_fragment>
   }`});
}

const SPRAY=260,GATES=10,GATE_SPACING=LOOP/GATES,ISLANDS=[[-150,60,1,52,26],[190,240,2,64,38],[-230,430,3,40,18],[140,610,4,48,22],[-170,790,5,70,34]],ISLAND_LOOP=960,STREAKS=22;

/**
 * The 3D picture. `frame(state, dt)` advances the presentation from the same state object the
 * 2D art layer receives, then `render()` paints it. Nothing here writes to the race.
 */
export class WaveScene{
 constructor(canvas,{renderer=null,loadTextures=typeof Image!=='undefined',onChange=()=>{}}={}){
  this.canvas=canvas;this.onChange=onChange;this.owned=!renderer;
  this.renderer=renderer||new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',stencil:false});
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.pixelCap=1.5;this.width=0;this.height=0;this.ratio=0;
  this.scene=new T.Scene();this.scene.fog=new T.Fog(PALETTE.haze,150,1000);
  this.camera=new T.PerspectiveCamera(46,1,.3,2600);this.camera.position.set(CAMERA_X,2.75,7.8);
  this.scene.add(new T.HemisphereLight('#eaf8ff','#2f8fa8',1.25));const key=new T.DirectionalLight('#fff1d2',1.55);key.position.set(-5,9,6);this.scene.add(key);
  this.tex={soft:textures.soft(),ring:textures.ring(),wake:textures.wake(),checker:textures.checker(),bands:textures.bands(),cloud:textures.cloud(),sea:textures.sea()};
  this.time=0;this.distance=0;this.speed=0;this.surge=0;this.settle=0;this.boost=0;this.cheer=0;this.paceZ=0;this.playerZ=0;this.playerX=PLAYER_LANE;this.playerVX=0;this.paceX=PACE_LANE;this.fov=46;this.camX=CAMERA_X;this.gapZ=0;this.pitch=0;this.debugView=null;
  this.lastRace=null;this.lastCorrect=0;this.lastAttempts=0;this.lastLap=0;this.lastMode='';this.archAt=16;this.archKind='start';this.seed=7;this.gearKey=null;this.pendingGear=null;
  this.labels={player:{x:0,y:0,visible:false},pace:{x:0,y:0,visible:false,edge:0,scale:1}};this._v=new T.Vector3();this._o=new T.Object3D();
  this.buildWorld();this.setGear(null);
  this.pace=this.makeEntry(createCraft(null,{gold:true}));
  if(loadTextures)this.loadArt();
 }
 buildWorld(){
  const sky=new T.Mesh(new T.SphereGeometry(1,24,12),skyMaterial());sky.frustumCulled=false;sky.renderOrder=-10;this.scene.add(sky);
  // Water grid: dense where the riders are, stretched toward the horizon.
  const rows=76,cols=44,pos=new Float32Array(rows*cols*3),idx=[];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const u=i/(cols-1)*2-1,v=j/(rows-1),k=(j*cols+i)*3;pos[k]=Math.sign(u)*(Math.abs(u)*18+Math.abs(u)**3.2*1500);pos[k+1]=0;pos[k+2]=16-v*26-v**3.4*2300;}
  for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const a=j*cols+i,b=a+1,c=a+cols,d=c+1;idx.push(a,b,c,b,d,c);}
  const grid=new T.BufferGeometry();grid.setAttribute('position',new T.BufferAttribute(pos,3));grid.setIndex(idx);
  this.waterMat=waterMaterial(this.tex.sea);this.water=new T.Mesh(grid,this.waterMat);this.water.frustumCulled=false;this.scene.add(this.water);
  // A far shoreline that never arrives, for a clear horizon.
  const N=90,sp=[],sc=[],si=[],far=new T.Color('#86bfd6'),near=new T.Color('#6aa9bf');let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647,seed/2147483647);let hgt=30;
  for(let i=0;i<=N;i++){const a=Math.PI*(.06+.88*i/N),r=1900,x=Math.cos(a)*r,z=-Math.sin(a)*r;hgt=clamp(hgt+(rnd()-.5)*46,10,150);const gapHere=Math.abs(i/N-.47)<.07?.12:1;sp.push(x,-2,z,x,hgt*gapHere,z);for(const c of [near,far])sc.push(c.r,c.g,c.b);if(i<N){const k=i*2;si.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const shore=new T.BufferGeometry();shore.setAttribute('position',new T.Float32BufferAttribute(sp,3));shore.setAttribute('color',new T.Float32BufferAttribute(sc,3));shore.setIndex(si);
  this.shore=new T.Mesh(shore,new T.MeshBasicMaterial({vertexColors:true,fog:false,side:T.DoubleSide}));this.shore.frustumCulled=false;this.scene.add(this.shore);
  this.clouds=new T.Group();const cloudMat=new T.MeshBasicMaterial({map:this.tex.cloud,transparent:true,depthWrite:false,fog:false});
  for(const [x,y,s] of [[-900,250,420],[-260,330,560],[380,240,470],[1000,310,520],[-1500,210,400],[1550,220,380]]){const c=new T.Mesh(new T.PlaneGeometry(1,.55),cloudMat);c.position.set(x,y,-2000);c.scale.setScalar(s);this.clouds.add(c);}
  this.scene.add(this.clouds);
  const land=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});this.islands=ISLANDS.map(([x,z,seedN,r,h])=>{const m=new T.Mesh(islandGeometry(seedN,r,h),land);m.userData={x,z};this.scene.add(m);return m;});
  const buoyMat=new T.MeshPhongMaterial({vertexColors:true,shininess:60});
  this.buoys=[new T.InstancedMesh(buoyGeometry('#ffc93d'),buoyMat,GATES),new T.InstancedMesh(buoyGeometry('#ff6b4a'),buoyMat,GATES)];for(const b of this.buoys){b.frustumCulled=false;this.scene.add(b);}
  this.archMats={finish:new T.MeshLambertMaterial({map:this.tex.checker}),lap:new T.MeshLambertMaterial({map:this.tex.bands}),start:new T.MeshLambertMaterial({map:this.tex.bands})};
  for(const m of Object.values(this.archMats))m.map.repeat.set(3,1);
  this.arch=new T.Mesh(archGeometry(),this.archMats.start);this.arch.visible=false;this.scene.add(this.arch);
  // Spray: one pooled point cloud for every craft.
  this.sprayPos=new Float32Array(SPRAY*3);this.sprayLife=new Float32Array(SPRAY*2);this.sprayVel=new Float32Array(SPRAY*3);this.sprayAge=new Float32Array(SPRAY*2);this.sprayNext=0;
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(this.sprayPos,3));sg.setAttribute('aLife',new T.BufferAttribute(this.sprayLife,2));
  this.sprayMat=sprayMaterial(this.tex.soft);this.spray=new T.Points(sg,this.sprayMat);this.spray.frustumCulled=false;this.spray.renderOrder=6;this.scene.add(this.spray);
  this.streakMat=new T.MeshBasicMaterial({color:'#eaffff',transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,fog:false});
  this.streaks=new T.InstancedMesh(new T.PlaneGeometry(.05,1),this.streakMat,STREAKS);this.streaks.frustumCulled=false;this.streaks.visible=false;this.streaks.renderOrder=7;this.scene.add(this.streaks);
 }
 // Each craft carries its own water contact: shadow, hull foam and a wake that follows the swell.
 makeEntry(craft){
  const group=new T.Group(),decal=(map,tint,w,l,opts)=>{const g=new T.PlaneGeometry(w,l,6,14);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,decalMaterial(map,tint,opts));m.frustumCulled=false;this.scene.add(m);return m;};
  group.add(craft);this.scene.add(group);
  const entry={group,craft,shadow:decal(this.tex.soft,'#04283f',1,1),foam:decal(this.tex.ring,'#f4ffff',1,1),wake:decal(this.wakeTex||this.tex.wake,'#ffffff',1,1,{flow:1}),glow:null};
  entry.shadow.renderOrder=1;entry.wake.renderOrder=2;entry.foam.renderOrder=3;entry.shadow.material.uniforms.uLift.value=.03;entry.wake.material.uniforms.uLift.value=.045;entry.foam.material.uniforms.uLift.value=.06;
  return entry;
 }
 disposeEntry(entry){for(const o of [entry.shadow,entry.foam,entry.wake,entry.glow]){if(!o)continue;this.scene.remove(o);o.geometry.dispose();o.material.dispose();}this.scene.remove(entry.group);entry.group.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});}
 /** Rebuilds the student's craft when the equipped store gear changes. */
 setGear(gear){
  const key=JSON.stringify([gear?.id,gear?.model,gear?.color,gear?.trim?.id,gear?.trim?.color]);if(key===this.gearKey)return;this.gearKey=key;
  if(this.player)this.disposeEntry(this.player);
  this.player=this.makeEntry(createCraft(gear));
  const trim=gear?.trim;
  if(typeof trim?.id==='string'&&trim.id.endsWith('neon')){const g=new T.PlaneGeometry(1,1,6,14);g.rotateX(-Math.PI/2);const glow=new T.Mesh(g,decalMaterial(this.tex.ring,/^#[0-9a-f]{6}$/i.test(trim.color)?trim.color:'#73e5ce',{additive:true}));glow.frustumCulled=false;glow.renderOrder=4;glow.material.uniforms.uLift.value=.08;this.scene.add(glow);this.player.glow=glow;}
  if(typeof trim?.id==='string'&&trim.id.endsWith('stars')){const star=new T.Mesh(new T.OctahedronGeometry(.16,0),new T.MeshPhongMaterial({color:'#ffd95a',emissive:'#8a6a10',shininess:120}));star.position.set(0,1.75,1.45);const mast=new T.Mesh(new T.CylinderGeometry(.015,.02,1,6),new T.MeshLambertMaterial({color:'#dfe8ee'}));mast.position.set(0,1.15,1.45);this.player.craft.add(mast,star);this.player.star=star;}
  if(craftKind(gear)==='future')this.requestStoreCraft(key);
  this.onChange();
 }
 // The exact Neptune X sculpt is fetched only for students who own it.
 requestStoreCraft(key){
  if(typeof window==='undefined')return;
  import('../store/models.mjs?v=neptune-28').then(m=>{if(this.gearKey!==key||this.disposed)return;const craft=adoptStoreCraft(m.createCollectible('jetski')),old=this.player.craft;if(this.player.star)craft.add(...old.children.filter(c=>c.name!=='hull'&&c.name!=='rider'));this.player.group.remove(old);old.traverse(o=>{if(o.isMesh&&(o.parent?.name==='hull'||o.parent?.name==='rider'))o.geometry.dispose();});this.player.group.add(craft);this.player.craft=craft;this.onChange();}).catch(()=>{});
 }
 loadArt(){
  const loader=new T.TextureLoader(),base=new URL('./art/',import.meta.url);
  loader.load(new URL('ocean-surface-v38.webp',base).href,t=>{if(this.disposed){t.dispose();return;}t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=Math.min(4,this.renderer.capabilities?.getMaxAnisotropy?.()||1);this.waterMat.uniforms.uTex.value=t;this.waterMat.uniforms.uPainted.value=1;this.oceanTex=t;this.onChange();},undefined,()=>{});
  loader.load(new URL('foam-wake-v38.webp',base).href,t=>{if(this.disposed){t.dispose();return;}t.colorSpace=T.SRGBColorSpace;this.wakeTex=t;for(const e of [this.player,this.pace])e.wake.material.uniforms.map.value=t;this.onChange();},undefined,()=>{});
 }
 resize(w,h,deviceRatio=1){
  const ratio=Math.min(deviceRatio||1,this.pixelCap);if(w===this.width&&h===this.height&&ratio===this.ratio)return false;
  this.width=w;this.height=h;this.ratio=ratio;this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;return true;
 }
 emit(x,y,z,vx,vy,vz,life,size){const i=this.sprayNext;this.sprayNext=(i+1)%SPRAY;this.sprayPos[i*3]=x;this.sprayPos[i*3+1]=y;this.sprayPos[i*3+2]=z;this.sprayVel[i*3]=vx;this.sprayVel[i*3+1]=vy;this.sprayVel[i*3+2]=vz;this.sprayAge[i*2]=life;this.sprayAge[i*2+1]=life;this.sprayLife[i*2+1]=size;}
 random(){this.seed=(this.seed*16807)%2147483647;return this.seed/2147483647;}
 burst(entry,count,power){const p=entry.group.position,len=entry.craft.userData.length/2;for(let i=0;i<count;i++){const side=i%2?1:-1,r=this.random();this.emit(p.x+side*(.3+r*.5),p.y+.25,p.z-len*.5+this.random()*len*1.4,side*(1.4+this.random()*3.2)*power,(2+this.random()*3.6)*power,this.speed*.22+this.random()*2,.55+this.random()*.5,.16+this.random()*.2);}}
 /** Advance the presentation by dt seconds from the game's own state object. */
 frame(s,dtIn){
  const race=s.race||null,reduced=!!s.reduced,paused=!!s.paused,dt=paused?0:clamp(Number.isFinite(dtIn)?dtIn:0,0,.1),running=s.mode==='racing'||s.mode==='finish';
  this.setGear(s.gear||null);
  if(race!==this.lastRace||(s.mode==='countdown'&&this.lastMode!=='countdown')){this.lastRace=race;this.lastCorrect=race?.correct||0;this.lastAttempts=race?.attempts||0;this.lastLap=Math.floor(race?.playerDistance||0);this.surge=this.settle=this.boost=this.cheer=0;this.speed=0;this.paceZ=0;this.playerZ=0;this.gapZ=0;this.pitch=0;this.archKind='start';this.archAt=this.distance+16;for(let i=0;i<SPRAY;i++)this.sprayAge[i*2]=0;}
  if(s.mode==='finish'&&this.lastMode!=='finish'){this.archKind='finish';this.archAt=this.distance+38;this.cheer=1;}
  this.lastMode=s.mode;
  if(race&&!paused){
   if(race.correct>this.lastCorrect){this.surge=1;this.settle=0;if(!reduced)this.burst(this.player,race.boost>0?46:22,race.boost>0?1.35:1);}
   else if(race.attempts>this.lastAttempts){this.settle=1;this.surge*=.3;}
   this.lastCorrect=race.correct;this.lastAttempts=race.attempts;
   const lap=Math.min(Math.floor((race.playerDistance||0)+1e-8),Math.floor(race.laps||0));if(lap>this.lastLap){this.lastLap=lap;if(s.mode==='racing'&&this.archAt-this.distance<-10){this.archKind='lap';this.archAt=this.distance+64;}}
  }
  // Smoothed presentation values. Every one eases with dt, so nothing teleports at 30 or 60 fps.
  const boosting=running&&(race?.boost||0)>0;this.time+=dt*(reduced?.35:1);
  this.boost+=((boosting?1:0)-this.boost)*ease(dt,boosting?7:2.2);this.surge*=Math.exp(-dt*1.5);this.settle*=Math.exp(-dt*.95);this.cheer*=Math.exp(-dt*.5);
  const engine=clamp((race?.speed||0)*70,0,7),cruise=running?(13+engine+this.surge*6+this.boost*11)*(1-this.settle*.42)*(reduced?.6:1):0;
  this.speed+=(cruise-this.speed)*ease(dt,cruise>this.speed?2.6:1.5);this.distance+=this.speed*dt;
  const D=mod(this.distance,LOOP),t=this.time,pace01=clamp(this.speed/24,0,1.3);
  const turn=reduced?0:clamp(Number(s.turn)||0,-1,1),targetX=PLAYER_LANE+turn*.7,previousX=this.playerX;this.playerX+=(targetX-this.playerX)*ease(dt,3);
  if(dt>0)this.playerVX+=((this.playerX-previousX)/dt-this.playerVX)*ease(dt,6);
  
  const gap=s.mode==='countdown'||s.mode==='ready'?0:Number(s.visualGap)||0;this.gapZ+=(paceOffset(gap)-this.gapZ)*ease(dt,2.4);
  // A lead is shared between the two craft: the student pulls up the course while the pace rider slips back, so both stay in frame.
  const lead=Math.max(0,this.gapZ);this.paceZ=this.gapZ<0?this.gapZ:lead*.3;
  this.playerZ+=((-(lead*.42+this.surge*.8+this.boost*.8)+this.settle*.8)-this.playerZ)*ease(dt,3.2);
  const paceTargetX=PACE_LANE+(reduced?0:Math.sin(this.distance*.035+1.3)*.55);const paceVX=dt>0?(paceTargetX-this.paceX)*3:0;this.paceX+=(paceTargetX-this.paceX)*ease(dt,3);
  this.pitch+=((this.surge*.17+this.boost*.11-this.settle*.06)-this.pitch)*ease(dt,6);
  this.pose(this.player,this.playerX,this.playerZ,this.playerVX,D,t,pace01,this.pitch,this.boost,reduced,0);
  this.pose(this.pace,this.paceX,this.paceZ,paceVX,D,t,running?.8:0,0,0,reduced,1.9);
  if(this.player.star)this.player.star.rotation.y=t*2.2;
  // Spray: bow sheets while moving, a rooster tail under Hydro Boost.
  if(dt>0&&!reduced&&running){
   for(let n=0;n<2;n++){const e=n?this.pace:this.player,mine=n===0,amount=(mine?pace01:.75)*(mine?1+this.boost*1.6:1),p=e.group.position,len=e.craft.userData.length/2;e.sprayDue=(e.sprayDue||0)+dt*(mine?46:26)*amount;
    while(e.sprayDue>=1){e.sprayDue--;const side=this.random()<.5?-1:1;this.emit(p.x+side*(.32+this.random()*.25),p.y+.18,p.z-len*.62+this.random()*.5,side*(1.2+this.random()*2.4)*(.6+amount*.5),1.3+this.random()*2.2*amount,this.speed*.3+this.random()*1.5,.4+this.random()*.4,.1+this.random()*.14);}
    if(mine&&this.boost>.2){e.tailDue=(e.tailDue||0)+dt*70*this.boost;while(e.tailDue>=1){e.tailDue--;this.emit(p.x+(this.random()-.5)*.5,p.y+.3,p.z+len,(this.random()-.5)*2.2,3.4+this.random()*3.6,this.speed*.42+this.random()*3,.6+this.random()*.5,.14+this.random()*.2);}}}
  }
  if(dt>0){const pos=this.sprayPos,vel=this.sprayVel,age=this.sprayAge,life=this.sprayLife;for(let i=0;i<SPRAY;i++){const a=age[i*2];if(a<=0){life[i*2]=0;continue;}const n=a-dt;age[i*2]=n;vel[i*3+1]-=9.5*dt;pos[i*3]+=vel[i*3]*dt;pos[i*3+1]+=vel[i*3+1]*dt;pos[i*3+2]+=vel[i*3+2]*dt;const k=clamp(n/age[i*2+1],0,1);life[i*2]=pos[i*3+1]<-.1?0:k*.85;}
   this.spray.geometry.attributes.position.needsUpdate=true;this.spray.geometry.attributes.aLife.needsUpdate=true;}
  // Course furniture streams toward the camera at the travelled distance.
  const o=this._o;
  for(let i=0;i<GATES;i++){const z=mod(i*GATE_SPACING+D,LOOP)-(LOOP-22);for(let side=0;side<2;side++){const x=side?9.2:-9.2,y=waveHeight(x,z-D,t);o.position.set(x,y-.12,z);o.rotation.set(reduced?0:Math.sin(t*1.7+i)*.07,0,reduced?0:Math.cos(t*1.3+i*2)*.07);o.scale.setScalar(1);o.updateMatrix();this.buoys[side].setMatrixAt(i,o.matrix);}}
  this.buoys[0].instanceMatrix.needsUpdate=this.buoys[1].instanceMatrix.needsUpdate=true;
  for(let n=0;n<this.islands.length;n++){const m=this.islands[n],z=mod(m.userData.z+this.distance*.9,ISLAND_LOOP)-(ISLAND_LOOP-90);m.position.set(m.userData.x,0,z);}
  const archZ=-(this.archAt-this.distance);this.arch.visible=archZ>-260&&archZ<14;if(this.arch.visible){this.arch.material=this.archMats[this.archKind];this.arch.position.set(0,-.4,archZ);}
  this.streaks.visible=this.boost>.03&&!reduced;
  if(this.streaks.visible){this.streakMat.opacity=this.boost*.5;for(let i=0;i<STREAKS;i++){const a=i*2.399,r=4.5+(i%5)*1.5,z=mod(i*9.7+this.distance*2.6,90)-80;o.position.set(Math.cos(a)*r+this.camX,Math.abs(Math.sin(a))*r*.55+.5,z);o.rotation.set(-Math.PI/2,0,0);o.scale.set(1,5+this.boost*7,1);o.updateMatrix();this.streaks.setMatrixAt(i,o.matrix);}this.streaks.instanceMatrix.needsUpdate=true;}
  this.waterMat.uniforms.uD.value=D;this.waterMat.uniforms.uT.value=t;
  // Chase camera: behind and a little above the student's craft, easing after it.
  const aspect=this.camera.aspect||1,baseFov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(23))*Math.max(1,1.25/aspect))),wantFov=baseFov+(reduced?0:this.boost*5.5+this.surge*1.2);
  const reframed=this.camera.userData.aspect!==aspect;this.fov+=(wantFov-this.fov)*(reframed?1:ease(dt,4));if(Math.abs(this.camera.fov-this.fov)>.001||reframed){this.camera.fov=this.fov;this.camera.userData.aspect=aspect;this.camera.updateProjectionMatrix();}
  this.camX+=((CAMERA_X+(this.playerX-PLAYER_LANE)*.5)-this.camX)*ease(dt,2.5);
  const lift=reduced?0:waveHeight(this.camX,8-D,t)*.3;this.camera.position.set(this.camX,2.75+lift+this.boost*.15,7.8+(reduced?0:this.boost*.5));this.camera.lookAt(this.camX*.6,.95,-14);if(!reduced)this.camera.rotateZ(-turn*.012);
  if(this.debugView){this.camera.position.fromArray(this.debugView.pos);this.camera.lookAt(...this.debugView.look);}
  this.clouds.position.x=this.camX*.2;
  this.sprayMat.uniforms.uScale.value=(this.height||600)*this.ratio/(2*Math.tan(T.MathUtils.degToRad(this.fov/2)));
  this.camera.updateMatrixWorld();this.project(this.player,this.labels.player);this.project(this.pace,this.labels.pace);
 }
 pose(entry,x,z,vx,D,t,pace01,pitch,boost,reduced,phase){
  const craft=entry.craft,len=craft.userData.length,beam=craft.userData.beam,calm=reduced?0:1,h=waveHeight(x,z-D,t)*calm,bow=waveHeight(x,z-1-D,t)*calm,stern=waveHeight(x,z+1-D,t)*calm,port=waveHeight(x-.5,z-D,t)*calm,star=waveHeight(x+.5,z-D,t)*calm;
  entry.group.position.set(x,h-.06+pace01*.07+calm*Math.sin(t*5.3+phase)*.012*pace01,z);
  entry.group.rotation.set((bow-stern)*.36+pitch+pace01*.045,-vx*.07*calm,(port-star)*-.5-clamp(vx*.24,-.3,.3)*calm,'YXZ');
  if(craft.userData.rider){craft.userData.rider.rotation.z=-clamp(vx*.16,-.2,.2)*calm;craft.userData.rider.rotation.x=-boost*.1;}
  const shadow=entry.shadow.material.uniforms,foam=entry.foam.material.uniforms,wake=entry.wake.material.uniforms,glow=entry.glow?entry.glow.material.uniforms:null;
  shadow.uD.value=foam.uD.value=wake.uD.value=D;shadow.uT.value=foam.uT.value=wake.uT.value=t;
  entry.shadow.position.set(x,0,z+.1);entry.shadow.scale.set(beam*1.9,1,len*1.3);shadow.uOpacity.value=.5;
  entry.foam.position.set(x,0,z+.15);entry.foam.scale.set(beam*2.1+pace01*.5,1,len*1.25+pace01*.5);foam.uOpacity.value=.2+pace01*.28;
  const wl=4+pace01*7+boost*5,ww=3.2+pace01*4.2+boost*2;entry.wake.position.set(x,0,z+len*.36+wl/2);entry.wake.scale.set(ww,1,wl);wake.uOpacity.value=clamp(.2+pace01*.75+boost*.2,0,1);
  if(glow){glow.uD.value=D;glow.uT.value=t;entry.glow.position.set(x,0,z);entry.glow.scale.set(beam*3,1,len*1.6);glow.uOpacity.value=.5+calm*Math.sin(t*3)*.1;}
 }
 // Screen position for the "YOU" / "PACE RIDER" tags, as fractions of the stage.
 project(entry,out){
  const v=this._v,top=entry.craft.userData.standing?2.5:entry.craft.userData.kind==='future'?2.3:2.15;v.set(entry.group.position.x,entry.group.position.y+top,entry.group.position.z).applyMatrix4(this.camera.matrixWorldInverse);
  const behind=v.z>-.6,depth=-v.z;v.applyMatrix4(this.camera.projectionMatrix);out.x=v.x*.5+.5;out.y=-v.y*.5+.5;out.depth=depth;out.visible=!behind&&out.x>.04&&out.x<.96&&out.y<.98;out.edge=out.visible?0:(entry.group.position.x<this.camX?-1:1);
 }
 render(){this.renderer.render(this.scene,this.camera);}
 stats(){const info=this.renderer.info?.render||{};return{calls:info.calls||0,triangles:info.triangles||0,ratio:this.ratio,speed:this.speed,distance:this.distance,paceZ:this.paceZ,boost:this.boost,fov:this.fov};}
 dispose(){
  this.disposed=true;this.scene.traverse(o=>{o.geometry?.dispose?.();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m?.dispose?.();});
  for(const t of [...Object.values(this.tex),this.oceanTex,this.wakeTex])t?.dispose?.();
  if(this.owned){this.renderer.dispose();this.renderer.forceContextLoss?.();}
 }
}

function pill(ctx,x,y,text,font,fill,ink,arrow=0){
 ctx.font='800 '+font+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';const tw=ctx.measureText(text).width+font*1.7,th=font+9;
 ctx.fillStyle=fill;ctx.beginPath();(ctx.roundRect||ctx.rect).call(ctx,x-tw/2,y-th/2,tw,th,th/2);ctx.fill();
 if(arrow===0){ctx.beginPath();ctx.moveTo(x-4,y+th/2-.5);ctx.lineTo(x+4,y+th/2-.5);ctx.lineTo(x,y+th/2+5);ctx.closePath();ctx.fill();}
 ctx.fillStyle=ink;ctx.fillText(text,x,y+.5);return tw;
}
/**
 * The flat layer above the 3D picture: rider tags, the "pace rider is behind you" marker and the
 * coins that fly to the wallet. Drawn on the game's existing 2D canvas, which sits over the 3D one.
 */
export function drawOverlay(s,labels,layout={}){
 const {ctx,w,h}=s;if(!ctx||!(w>0)||!(h>0))return;
 ctx.save();ctx.clearRect(0,0,w,h);
 const font=clamp(w*.012,9,12),top=(layout.safeTop||0)+font,you=labels.player,pace=labels.pace;
 if(s.mode!=='ready'){
  if(pace.visible){const far=clamp(1-(pace.depth-10)/40,.0,1);pill(ctx,clamp(pace.x*w,52,w-52),Math.max(top,pace.y*h-font*(.9+far*.5)),'PACE RIDER',font,'#e4bb4c','#33290c');}
  else{const left=pace.edge<=0,x=left?font*5.6:w-font*5.6,y=clamp(h*.74,top,h-font*4.5);pill(ctx,x,y,left?'◀ PACE RIDER':'PACE RIDER ▶',font,'#e4bb4c','#33290c',1);}
  if(you.visible)pill(ctx,clamp(you.x*w,30,w-30),Math.max(top,you.y*h-font*1.2),'YOU',font,'#0d4563f0','#f1ffff');
 }
 const wx=layout.walletX??Math.min(246,w*.56),wy=layout.walletY??40,sx=(you.visible?you.x:.6)*w,sy=(you.visible?you.y+.12:.72)*h;
 for(const p of s.sparks||[]){
  if(!s.paused){p.life-=s.dt;}
  if(!(p.life>0)||!p.coin)continue;
  const t=clamp(1-p.life/1.1,0,1),e=t*t*(3-2*t),x=sx+(wx-sx)*e+Math.sin(t*6+p.vx)*12,y=sy+(wy-sy)*e-Math.sin(t*Math.PI)*h*.12;
  ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle='#ffd754';ctx.beginPath();ctx.ellipse(x,y,7*(.45+.55*Math.abs(Math.cos(t*7+p.vx))),7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff3b5';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,4.6*(.45+.55*Math.abs(Math.cos(t*7+p.vx))),4.6,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.globalAlpha=1;
 if(s.flash>0&&!s.reduced){ctx.globalAlpha=Math.min(.12,s.flash*.07);ctx.fillStyle='#f4ffff';ctx.fillRect(0,0,w,h);}
 ctx.restore();
}

// Frame-rate guard: first lower the resolution, then hand the race back to the 2D picture.
export const QUALITY=[1.5,1,.75],SLOW_FRAME=1/22,TOO_SLOW_FRAME=1/14,WINDOW_SECONDS=3;

/**
 * Connects the 3D scene to the running game by wrapping WaveCinema.draw, the single hook
 * dirt/game.js already calls for Wave Riders. Dirt Track never loads this module.
 */
export function installBridge(win,{createScene,now=()=>win.performance.now(),force=null}={}){
 const doc=win.document,cinema=win.WaveCinema;if(!cinema||typeof cinema.draw!=='function')return null;
 const draw2d=cinema.draw.bind(cinema),base=doc.getElementById('scene');if(!base?.parentNode)return null;
 const state={mode:force==='2d'||force==='3d'?force:'auto',active:false,lost:false,reason:'',quality:0,frames:0,windowTime:0,last:0,stale:true,scene:null,canvas:null,layout:{safeTop:0},sizeW:0,sizeH:0,sizePixels:0,fallbacks:0,renders:0};
 const mark=()=>{try{doc.body.dataset.waveScene=state.active&&!state.lost?'3d':'2d';if(state.canvas)state.canvas.hidden=!(state.active&&!state.lost);}catch{}};
 function fallback(reason){state.reason=reason;state.fallbacks++;if(state.active){state.active=false;try{state.scene?.dispose();}catch{}state.scene=null;try{state.canvas?.remove();}catch{}state.canvas=null;}mark();}
 function start(){
  if(state.active||state.mode==='2d')return false;
  try{
   const canvas=doc.createElement('canvas');canvas.id='scene3d';canvas.setAttribute('aria-hidden','true');base.parentNode.insertBefore(canvas,base);state.canvas=canvas;
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault?.();state.lost=true;state.stale=true;mark();});
   canvas.addEventListener('webglcontextrestored',()=>{state.lost=false;state.stale=true;mark();});
   state.scene=createScene(canvas,()=>{state.stale=true;});state.scene.pixelCap=QUALITY[state.quality];state.active=true;state.lost=false;state.reason='';state.stale=true;state.sizeW=0;mark();return true;
  }catch(error){try{state.canvas?.remove();}catch{}state.canvas=null;state.scene=null;state.active=false;state.reason='unavailable';state.fallbacks++;mark();try{win.console?.warn?.('Wave Riders 3D is unavailable; using the 2D picture.',error);}catch{}return false;}
 }
 function measure(s){
  // Reads layout only when the stage changes size, never per frame.
  const pixels=s.canvas?.width||0;if(s.w===state.sizeW&&s.h===state.sizeH&&pixels===state.sizePixels)return false;state.sizeW=s.w;state.sizeH=s.h;state.sizePixels=pixels;
  try{const stage=base.getBoundingClientRect(),wallet=doc.getElementById('wallet')?.getBoundingClientRect?.();let safe=0;for(const sel of ['.hud','.raceStatus']){const r=doc.querySelector(sel)?.getBoundingClientRect?.();if(r&&r.width>0&&r.top-stage.top<s.h*.3)safe=Math.max(safe,r.bottom-stage.top);}
   state.layout.safeTop=clamp(safe,0,s.h*.45);if(wallet&&wallet.width>0){state.layout.walletX=wallet.left+wallet.width/2-stage.left;state.layout.walletY=wallet.top+wallet.height/2-stage.top;}}catch{}
  return true;
 }
 function watch(s){
  const t=now(),delta=(t-state.last)/1000;state.last=t;
  if(s.paused||s.mode!=='racing'||!(delta>0)||delta>.5){state.frames=0;state.windowTime=0;return;}
  state.frames++;state.windowTime+=delta;if(state.windowTime<WINDOW_SECONDS)return;
  const average=state.windowTime/state.frames;state.frames=0;state.windowTime=0;
  if(average<=SLOW_FRAME)return;
  if(state.quality<QUALITY.length-1){state.quality++;state.scene.pixelCap=QUALITY[state.quality];state.sizeW=0;}
  else if(average>TOO_SLOW_FRAME&&state.mode!=='3d')fallback('slow');
 }
 cinema.draw=s=>{
  if(!state.active||state.lost||!s||!(s.w>0)||!(s.h>0))return draw2d(s);
  try{
   const resized=measure(s);if(state.scene.resize(s.w,s.h,win.devicePixelRatio||1)||resized)state.stale=true;
   if(s.gear!==state.gear||s.mode!==state.gameMode||s.race!==state.race){state.gear=s.gear;state.gameMode=s.mode;state.race=s.race;state.stale=true;}
   // A paused race is painted once and then left alone until something changes.
   if(s.paused&&!state.stale){return true;}
   watch(s);if(!state.active)return draw2d(s);
   state.scene.frame(s,s.dt);state.scene.render();drawOverlay(s,state.scene.labels,state.layout);state.renders++;state.stale=false;
   if(s.canvas?.dataset){s.canvas.dataset.renderer='wave-3d';s.canvas.dataset.boats='2';}
   return true;
  }catch(error){fallback('error');try{win.console?.warn?.('Wave Riders 3D stopped; using the 2D picture.',error);}catch{}return draw2d(s);}
 };
 const api={state,start,draw2d,
  /** '3d' keeps the 3D scene even when slow, '2d' forces the original picture, 'auto' restores the guard. */
  setMode(mode){state.mode=mode==='2d'||mode==='3d'?mode:'auto';if(state.mode==='2d'){if(state.active)fallback('forced');}else if(!state.active){state.quality=0;start();}state.stale=true;return api.renderer();},
  renderer:()=>state.active&&!state.lost?'3d':'2d',stats:()=>({renderer:api.renderer(),reason:state.reason,quality:QUALITY[state.quality],renders:state.renders,...(state.scene?.stats?.()||{})})};
 start();mark();return api;
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
 let force=null;try{force=new URLSearchParams(location.search).get('scene');}catch{}
 window.WaveRiders3D=installBridge(window,{force,createScene:(canvas,onChange)=>new WaveScene(canvas,{onChange})});
}
