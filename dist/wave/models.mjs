// Wave Riders 3D models. Procedural, stylised watercraft and riders that follow the store collection.
// Everything here is plain geometry: no DOM, no textures from disk, so it also runs in the node release tests.
import * as T from '../store/vendor/three.module.min.js';

export const CRAFT_KINDS=['classic','standup','touring','racing','future'];
const BY_ID={'jetski-1':'standup','jetski-2':'touring','jetski-3':'racing','jetski-4':'future'};
/** Maps the saved store gear onto a hull shape. Unknown or missing gear is the blue starter craft. */
export function craftKind(gear){if(!gear)return 'classic';if(CRAFT_KINDS.includes(gear.model))return gear.model;return BY_ID[gear.id]||'classic';}
export const STARTER_COLOR='#2f8fe8',GOLD_COLOR='#f0b93a';
const HEX=/^#[0-9a-f]{6}$/i;
/** The paint the student sees: the equipped colour, or starter blue. The pace rider is always gold. */
export function craftColor(gear,gold=false){if(gold)return GOLD_COLOR;const c=gear?.color;return typeof c==='string'&&HEX.test(c)?c:STARTER_COLOR;}

const paint=(color,shininess=70)=>new T.MeshPhongMaterial({color,shininess,specular:'#9fb4c4'});
const matte=color=>new T.MeshLambertMaterial({color});
const UP=new T.Vector3(0,1,0);
function add(group,geometry,material,p,s){const m=new T.Mesh(geometry,material);if(p)m.position.set(p[0],p[1],p[2]);if(s)m.scale.set(s[0],s[1],s[2]);group.add(m);return m;}
const ball=(g,p,s,m)=>add(g,new T.SphereGeometry(1,14,10),m,p,s);
const box=(g,p,s,m)=>add(g,new T.BoxGeometry(1,1,1),m,p,s);
function limb(g,a,b,r,m,r2=r){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),o=add(g,new T.CylinderGeometry(r2,r,d.length(),10,1),m,av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(UP,d.normalize());ball(g,b,[r2,r2,r2],m);return o;}
/** Skins a hull through elliptical cross-sections [z, halfWidth, centreY, halfHeight]; `square` boxes the section. */
function loft(g,sections,m,square=.8,N=16){
 const pos=[],idx=[];
 for(const [z,w,y,h] of sections)for(let i=0;i<N;i++){const a=i/N*Math.PI*2,sx=Math.sin(a),cy=Math.cos(a);pos.push(Math.sign(sx)*Math.abs(sx)**square*w,y+Math.sign(cy)*Math.abs(cy)**square*h,z);}
 for(let j=0;j<sections.length-1;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=b+N,d=a+N;idx.push(a,c,b,a,d,c);}
 for(const [j,rev] of [[0,false],[sections.length-1,true]]){const start=pos.length/3;pos.push(0,sections[j][2],sections[j][0]);for(let i=0;i<N;i++)rev?idx.push(start,j*N+(i+1)%N,j*N+i):idx.push(start,j*N+i,j*N+(i+1)%N);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();return add(g,geo,m);
}
/** Merges every mesh that shares a material into one draw call. Returns the same group. */
export function bake(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map(),all=[],v=new T.Vector3(),matrix=new T.Matrix4(),normal=new T.Matrix3();
 root.traverse(m=>{if(!m.isMesh||m.userData.keep)return;let b=groups.get(m.material);if(!b){b={p:[],n:[]};groups.set(m.material,b);}
  const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,p=g.attributes.position,n=g.attributes.normal;matrix.multiplyMatrices(inverse,m.matrixWorld);normal.getNormalMatrix(matrix);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);b.p.push(v.x,v.y,v.z);if(n)v.fromBufferAttribute(n,i).applyNormalMatrix(normal);else v.set(0,1,0);b.n.push(v.x,v.y,v.z);}
  if(g!==m.geometry)g.dispose();all.push(m);});
 for(const m of all){m.removeFromParent();m.geometry.dispose();}
 for(const [material,b] of groups){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.computeBoundingSphere();root.add(new T.Mesh(g,material));}
 return root;
}
const lighten=(color,amount)=>'#'+new T.Color(color).lerp(new T.Color('#ffffff'),amount).getHexString();
const darken=(color,amount)=>'#'+new T.Color(color).lerp(new T.Color('#0b1626'),amount).getHexString();

// Hull proportions per store craft: [length scale, beam scale, bow sharpness]
const SHAPES={classic:[1,1,0],touring:[1.06,1.2,-.05],racing:[1.12,.9,.12],standup:[.84,.86,0]};
function buildHull(kind,color,gold){
 const g=new T.Group(),[L,B]=SHAPES[kind],deck=paint(color,90),lower=paint(gold?'#4a3a17':kind==='racing'||kind==='standup'?'#1c222c':kind==='touring'?'#f4f1e6':'#f5f8fb',50),dark=paint('#18202b',30),seat=matte('#10151c'),accent=paint(gold?'#fff1bf':'#ffffff',80),metal=paint('#aab6c2',120);
 const S=rows=>rows.map(([z,w,y,h])=>[z*L,w*B,y,h]);
 // The lower hull sits in the water; its waterline is near y = 0.3.
 loft(g,S([[-1.98,.03,.5,.03],[-1.55,.3,.4,.17],[-.8,.52,.33,.25],[.3,.58,.32,.26],[1.35,.54,.33,.23],[1.52,.5,.36,.18]]),lower,.75);
 loft(g,S([[-1.94,.04,.57,.035],[-1.45,.31,.61,.1],[-.75,.51,.65,.14],[.3,.56,.63,.12],[1.4,.51,.59,.08],[1.5,.47,.57,.05]]),deck,.7);
 // A dark rub rail where deck meets hull, and a bright nose stripe so the craft reads from behind and above.
 for(const side of [-1,1]){const rail=new T.TubeGeometry(new T.CatmullRomCurve3([[.06,.52,-1.9],[.33,.5,-1.45],[.55,.5,-.75],[.6,.49,.3],[.56,.49,1.4]].map(([x,y,z])=>new T.Vector3(side*x*B,y,z*L))),18,.035,6,false);add(g,rail,dark);
  const stripe=box(g,[side*.3*B,.74,-.95*L],[.07,.02,.95*L],accent);stripe.rotation.y=-side*.2;stripe.rotation.z=-side*.32;
  box(g,[side*.5*B,.5,1.2*L],[.14,.12,.55],dark);
  // Gunwale stripe and traction mats: the parts of the deck the chase camera actually sees.
  box(g,[side*.49*B,.705,.35*L],[.05,.035,1.9*L],accent);box(g,[side*.34*B,.705,1.02*L],[.2*B,.02,.72*L],seat);box(g,[side*.3*B,.47,1.5*L],[.2*B,.07,.05],accent);}
 box(g,[0,.5,1.49*L],[.94*B,.2,.05],deck);
 if(kind==='standup'){
  // Freestyle craft: a short hood, a hinged steering pole and an open padded tray.
  loft(g,S([[-1.6,.1,.66,.05],[-1.15,.3,.8,.14],[-.75,.32,.9,.15],[-.45,.24,.86,.1]]),deck,.8);
  box(g,[0,.69,.55*L],[.62*B,.05,1.5*L],seat);
  const pole=limb(g,[0,.82,-.78*L],[0,1.5,-.02],.06,dark,.05);pole.userData.pole=true;
  limb(g,[-.3,1.5,-.02],[.3,1.5,-.02],.035,metal);for(const side of [-1,1])limb(g,[side*.2,1.5,-.02],[side*.33,1.5,-.02],.045,seat);
 }else{
  // Sit-down craft: a raised cowl carries the handlebars and the saddle runs back to a boarding step.
  loft(g,S([[-1.6,.1,.66,.05],[-1.05,.3,.8,.14],[-.6,.33,.95,.17],[-.3,.24,1,.14],[-.12,.14,.94,.08]]),deck,.8);
  loft(g,S([[-.2,.2,.84,.1],[.3,.24,.88,.12],[.95,.23,.86,.11],[1.25,.16,.8,.07]]),seat,.85,12);
  if(kind==='touring')loft(g,S([[1.05,.2,.98,.16],[1.22,.22,1.02,.2],[1.32,.16,.98,.14]]),seat,.85,12);
  if(kind==='racing')for(const side of [-1,1]){const fin=box(g,[side*.42*B,.74,1.05*L],[.05,.2,.6],deck);fin.rotation.x=.25;}
  const shield=box(g,[0,1.09,-.5*L],[.34,.16,.03],dark);shield.rotation.x=-.75;
  limb(g,[0,.98,-.46],[0,1.2,-.62],.055,dark);limb(g,[-.36,1.2,-.64],[.36,1.2,-.64],.03,metal);for(const side of [-1,1])limb(g,[side*.25,1.2,-.64],[side*.38,1.2,-.64],.042,seat);
 }
 const nozzle=add(g,new T.CylinderGeometry(.13,.1,.26,12),metal,[0,.4,1.58*L]);nozzle.rotation.x=Math.PI/2;
 return bake(g);
}
function buildRider(kind,color,gold){
 const g=new T.Group(),suit=matte(gold?'#5a4520':'#1b2a44'),jacket=paint(gold?'#2b2f38':lighten(color,.18),30),shell=paint(gold?'#f3c444':'#f6f8fb',110),stripe=paint(gold?'#3a2f18':darken(color,.1),60),visor=paint('#0f1d2c',140),glove=matte('#11161d');
 const standing=kind==='standup',crouch=kind==='racing'?.12:0;
 // Joint positions in craft space; the bow is toward -z.
 const hip=standing?[0,1.3,.9]:[0,.98,.42],chest=standing?[0,1.84,.52]:[0,1.56-crouch,.02-crouch],head=standing?[0,2.12,.36]:[0,1.85-crouch*1.4,-.13-crouch*1.5],hands=standing?[.26,1.5,-.02]:[.31,1.2,-.64];
 limb(g,hip,chest,.19,suit,.2);
 const mid=[(hip[0]+chest[0])/2,hip[1]+(chest[1]-hip[1])*.58,hip[2]+(chest[2]-hip[2])*.58],vest=limb(g,[hip[0],hip[1]+.12,hip[2]-.04],chest,.25,jacket,.26);vest.scale.z=.82;
 const lean=Math.atan2(hip[2]-chest[2],chest[1]-hip[1]),plate=box(g,[mid[0],mid[1]+.02,mid[2]+.2],[.24,.2,.04],accentFor(gold,color));plate.rotation.x=lean;
 // Two buckled straps make the life jacket read as a life jacket from behind.
 for(const f of [.3,.78]){const strap=box(g,[0,hip[1]+.12+(chest[1]-hip[1]-.12)*f,hip[2]-.04+(chest[2]-hip[2]+.04)*f],[.535,.05,.45],glove);strap.rotation.x=lean;}
 limb(g,chest,[head[0],head[1]-.16,head[2]+.03],.08,suit);
 ball(g,head,[.21,.215,.235],shell);box(g,[head[0],head[1]+.2,head[2]+.02],[.07,.03,.36],stripe);
 ball(g,[head[0],head[1]-.01,head[2]-.15],[.17,.11,.12],visor);box(g,[head[0],head[1]+.09,head[2]-.26],[.26,.03,.16],stripe);
 for(const side of [-1,1]){
  const shoulder=[side*.27,chest[1]-.06,chest[2]+.02],hand=[side*hands[0],hands[1],hands[2]],elbow=[side*.4,(shoulder[1]+hand[1])/2-.04,(shoulder[2]+hand[2])/2+.08];
  ball(g,shoulder,[.105,.105,.105],jacket);limb(g,shoulder,elbow,.085,suit,.075);limb(g,elbow,hand,.07,suit,.065);ball(g,hand,[.075,.07,.085],glove);
  if(standing){const knee=[side*.22,.98,.78],foot=[side*.2,.74,1];limb(g,[side*.13,hip[1],hip[2]],knee,.12,suit,.1);limb(g,knee,foot,.095,suit,.085);ball(g,[foot[0],foot[1]-.01,foot[2]-.06],[.09,.07,.17],glove);}
  else{const knee=[side*.34,1.0,-.1],foot=[side*.39,.7,.02];limb(g,[side*.15,.96,.4],knee,.125,suit,.105);limb(g,knee,foot,.095,suit,.085);ball(g,[foot[0],foot[1]-.02,foot[2]-.07],[.09,.07,.17],glove);}
 }
 return bake(g);
}
const accents=new Map();
function accentFor(gold,color){const key=gold?'gold':color;if(!accents.has(key))accents.set(key,paint(gold?'#ffd866':'#ffffff',40));return accents.get(key);}

/**
 * A complete craft with its rider. `userData.rider` leans independently of the hull,
 * `userData.length` and `userData.beam` size the wake, shadow and spray.
 */
export function createCraft(gear=null,{gold=false}={}){
 const kind=gold?'classic':craftKind(gear),shape=kind==='future'?'racing':kind,color=craftColor(gear,gold),root=new T.Group(),hull=buildHull(shape,color,gold),rider=buildRider(shape,color,gold);
 hull.name='hull';rider.name='rider';root.add(hull,rider);
 Object.assign(root.userData,{kind,color,gold,hull,rider,length:3.5*SHAPES[shape][0],beam:1.16*SHAPES[shape][1],standing:shape==='standup'});
 return root;
}
/**
 * Neptune X keeps its exact store sculpt. The store model is built for a close-up turntable,
 * so the race copy drops parts too small to see from the chase camera, swaps the clear-coat
 * materials for one cheap lit material per colour and merges the result into a few draw calls.
 */
export function adoptStoreCraft(model){
 const root=new T.Group(),shell=new T.Group(),cache=new Map(),size=new T.Vector3(),bounds=new T.Box3();
 model.updateMatrixWorld(true);
 model.traverse(m=>{if(!m.isMesh)return;bounds.setFromObject(m).getSize(size);if(Math.max(size.x,size.y,size.z)<.09)return;
  const source=m.material,key=source.color.getHexString()+':'+(source.emissive?.getHexString()||'0')+':'+source.side;let material=cache.get(key);
  if(!material){material=new T.MeshPhongMaterial({color:source.color.clone(),emissive:source.emissive?source.emissive.clone().multiplyScalar(.6):undefined,shininess:30+source.metalness*110,specular:'#a9b8c9',side:source.side});cache.set(key,material);}
  const copy=new T.Mesh(m.geometry,material);copy.applyMatrix4(m.matrixWorld);shell.add(copy);});
 // The store sculpt is authored larger and higher than the race hulls; seat it on the same waterline.
 shell.scale.setScalar(.82);shell.position.y=.02;root.add(shell);
 root.updateMatrixWorld(true);const baked=bakeShared(shell);
 Object.assign(root.userData,{kind:'future',color:'#7408ef',gold:false,hull:baked,rider:null,length:3.5,beam:1.5,standing:false});
 return root;
}
// Like bake(), but leaves the source geometries alone: they belong to the store module.
function bakeShared(group){
 const groups=new Map(),v=new T.Vector3(),normal=new T.Matrix3(),meshes=[...group.children];
 for(const m of meshes){let b=groups.get(m.material);if(!b){b={p:[],n:[]};groups.set(m.material,b);}m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,p=g.attributes.position,n=g.attributes.normal;normal.getNormalMatrix(m.matrix);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrix);b.p.push(v.x,v.y,v.z);if(n)v.fromBufferAttribute(n,i).applyNormalMatrix(normal).normalize();else v.set(0,1,0);b.n.push(v.x,v.y,v.z);}
  if(g!==m.geometry)g.dispose();group.remove(m);}
 for(const [material,b] of groups){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.computeBoundingSphere();group.add(new T.Mesh(g,material));}
 return group;
}

/** A course buoy with a white reflective band, one merged geometry with vertex colours. */
export function buoyGeometry(color){
 const parts=[[new T.CylinderGeometry(.2,.55,1.5,10,1),[0,.75,0],color],[new T.CylinderGeometry(.34,.4,.26,10,1),[0,.82,0],'#ffffff'],[new T.SphereGeometry(.2,8,6),[0,1.52,0],color],[new T.CylinderGeometry(.75,.75,.16,12,1),[0,.03,0],'#e9f1f1']];
 return mergeColored(parts);
}
function mergeColored(parts){
 const p=[],n=[],c=[],v=new T.Vector3(),col=new T.Color();
 for(const [geometry,offset,color] of parts){const g=geometry.index?geometry.toNonIndexed():geometry,pos=g.attributes.position,nor=g.attributes.normal;col.set(color);for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);p.push(v.x+offset[0],v.y+offset[1],v.z+offset[2]);n.push(nor.getX(i),nor.getY(i),nor.getZ(i));c.push(col.r,col.g,col.b);}g.dispose();geometry.dispose();}
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(p,3));out.setAttribute('normal',new T.Float32BufferAttribute(n,3));out.setAttribute('color',new T.Float32BufferAttribute(c,3));out.computeBoundingSphere();return out;
}
/** A low island: sand skirt, green slopes, a few tree clumps. Deterministic from its seed. */
export function islandGeometry(seed=1,radius=46,height=24){
 let s=seed*9301+49297;const rnd=()=>(s=(s*233280+49297)%1048573,s/1048573);
 const rings=6,N=12,p=[],c=[],idx=[],sand=new T.Color('#ecd9a0'),green=new T.Color('#3f9a57'),deep=new T.Color('#2b7a4b'),rock=new T.Color('#8b9a8c'),col=new T.Color();
 const profile=[[1,-1.5],[.9,1.2],[.68,height*.3],[.46,height*.62],[.24,height*.88],[.07,height]];
 for(let j=0;j<rings;j++)for(let i=0;i<N;i++){const a=i/N*Math.PI*2,jit=j?1+(rnd()-.5)*.34:1+(rnd()-.5)*.12,r=radius*profile[j][0]*jit;p.push(Math.cos(a)*r,profile[j][1]*(j>1?.8+rnd()*.35:1),Math.sin(a)*r*.8);
  col.copy(j<2?sand:j<4?green:j<5?deep:height>30?rock:deep);if(j>=2)col.offsetHSL(0,0,(rnd()-.5)*.06);c.push(col.r,col.g,col.b);}
 for(let j=0;j<rings-1;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,d=a+N,e=b+N;idx.push(a,d,b,b,d,e);}
 const top=p.length/3;p.push(0,height*1.02,0);c.push(deep.r,deep.g,deep.b);for(let i=0;i<N;i++)idx.push((rings-1)*N+i,top,(rings-1)*N+(i+1)%N);
 const base=new T.BufferGeometry();base.setAttribute('position',new T.Float32BufferAttribute(p,3));base.setAttribute('color',new T.Float32BufferAttribute(c,3));base.setIndex(idx);
 const flat=base.toNonIndexed();flat.computeVertexNormals();base.dispose();
 const parts=[];for(let k=0;k<7;k++){const a=rnd()*Math.PI*2,r=radius*(.2+rnd()*.42),size=3+rnd()*4;parts.push([new T.IcosahedronGeometry(size,0),[Math.cos(a)*r,height*(.5-r/radius*.42)+size*.5+2,Math.sin(a)*r*.8],k%2?'#2f8a4c':'#4aa862']);}
 const trees=mergeColored(parts),P=[...flat.attributes.position.array,...trees.attributes.position.array],Nn=[...flat.attributes.normal.array,...trees.attributes.normal.array],C=[...flat.attributes.color.array,...trees.attributes.color.array];flat.dispose();trees.dispose();
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(P,3));out.setAttribute('normal',new T.Float32BufferAttribute(Nn,3));out.setAttribute('color',new T.Float32BufferAttribute(C,3));out.computeBoundingSphere();return out;
}
/** An inflatable gate the riders pass under at the start, each lap and the finish. */
export function archGeometry(span=10,height=6.2,tube=.62){const g=new T.TorusGeometry(span,tube,8,28,Math.PI);g.scale(1,height/span,1);return g;}
export function trianglesIn(root){let n=0;root.traverse(m=>{if(m.isMesh){const g=m.geometry;n+=(g.index?g.index.count:g.attributes.position.count)/3;}});return Math.round(n);}
export function meshesIn(root){let n=0;root.traverse(m=>{if(m.isMesh)n++;});return n;}
