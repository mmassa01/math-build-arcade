import * as T from '../store/vendor/three.module.min.js';

export const LANE_WIDTH=3.5, ROOF_HEIGHT=3.35, DEPTH=88, STATION_CLEARANCE=8.48;
export const worldZ=z=>(1-z)*DEPTH;
// The camera faces +Z, so world -X is screen right. Preserve the engine's left/right lanes.
export const worldX=lane=>-lane*LANE_WIDTH;
const geometries=new Map(), materials=new Map();
export function material(color,metalness=0,roughness=.6){const key=[color,metalness,roughness].join();if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));return materials.get(key)}
function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)}
export function box(parent,x,y,z,w,h,d,mat,r=0){
 const key=['box',w,h,d,r].join();const g=geometry(key,()=>{if(!r)return new T.BoxGeometry(w,h,d);const shape=new T.Shape(),a=-w/2,b=-h/2;shape.moveTo(a+r,b);shape.lineTo(a+w-r,b);shape.quadraticCurveTo(a+w,b,a+w,b+r);shape.lineTo(a+w,b+h-r);shape.quadraticCurveTo(a+w,b+h,a+w-r,b+h);shape.lineTo(a+r,b+h);shape.quadraticCurveTo(a,b+h,a,b+h-r);shape.lineTo(a,b+r);shape.quadraticCurveTo(a,b,a+r,b);const q=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:Math.min(r*.35,d*.18),bevelThickness:Math.min(r*.35,d*.18),curveSegments:5});q.translate(0,0,-d/2);q.computeVertexNormals();return q});
 const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function sphere(parent,x,y,z,rx,ry,rz,mat){const g=geometry('sphere',()=>new T.SphereGeometry(1,16,12)),m=new T.Mesh(g,mat);m.position.set(x,y,z);m.scale.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m}
export function cylinder(parent,x,y,z,r,h,mat){const m=new T.Mesh(geometry('cyl:'+r+':'+h,()=>new T.CylinderGeometry(r,r,h,12)),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
// Smooth, rounded limb volumes keep the same joint pivots as the original running rig.
export function capsule(parent,x,y,z,r,length,mat,depth=1){const g=geometry('capsule:'+r+':'+length,()=>new T.CapsuleGeometry(r,length,6,12)),m=new T.Mesh(g,mat);m.position.set(x,y,z);m.scale.z=depth;m.castShadow=true;parent.add(m);return m}
export function labelTexture(text,bg='#113e50',fg='#fff3ce',width=1024,height=160){const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,width,height);x.fillStyle=fg;x.font='900 '+Math.round(height*.54)+'px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,width/2,height*.52,width*.94);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}

export function batchStatic(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map(),all=[];
 root.traverse(m=>{if(!m.isMesh||m.isInstancedMesh||Array.isArray(m.material))return;const key=m.material.uuid+':'+m.castShadow+':'+m.receiveShadow;let b=groups.get(key);if(!b){b={material:m.material,cast:m.castShadow,receive:m.receiveShadow,p:[],n:[],uv:[]};groups.set(key,b)}const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,matrix=new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld),normal=new T.Matrix3().getNormalMatrix(matrix),v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);b.p.push(v.x,v.y,v.z);if(n)v.fromBufferAttribute(n,i).applyNormalMatrix(normal);else v.set(0,1,0);b.n.push(v.x,v.y,v.z);b.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0)}all.push(m)});
 for(const m of all)m.removeFromParent();for(const b of groups.values()){const g=new T.BufferGeometry();g.userData.batched=true;g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.computeBoundingSphere();const m=new T.Mesh(g,b.material);m.castShadow=b.cast;m.receiveShadow=b.receive;root.add(m)}return root;
}

export function createTrain(color=0,length=44){
 const root=new T.Group(),paint=material(['#e76d48','#2eb7c1','#f2ba42'][((color%3)+3)%3],.28,.34),cream=material('#e8ecdf',.3,.4),dark=material('#163848',.55,.3),glass=material('#164755',.35,.16),metal=material('#537080',.75,.3),rubber=material('#12232c');
 const stripe=material('#ffe5a8',.35,.35),light=new T.MeshBasicMaterial({color:'#fff3c5'}),red=new T.MeshBasicMaterial({color:'#ff7758'}),gap=.45,cars=3,carLength=(length-gap*(cars-1))/cars;
 for(let n=0;n<cars;n++){
  const z=carLength/2+n*(carLength+gap);box(root,0,1.87,z,2.7,2.75,carLength,cream,.28);box(root,0,.84,z,2.72,.72,carLength+.04,paint,.14);box(root,0,1.23,z,2.77,.12,carLength+.07,stripe,.02);
  box(root,0,.38,z,2.3,.55,carLength-.8,dark,.08);box(root,0,3.22,z,2.35,.16,carLength-.65,paint,.12);
  for(const side of [-1,1]){
   for(let i=0;i<7;i++){const wz=z-carLength*.39+i*carLength*.13;box(root,side*1.366,2.27,wz,.045,.83,1.04,glass,.015);box(root,side*1.395,2.72,wz,.035,.035,1.08,metal);}
   for(const o of [-.27,.27]){const dz=z+o*carLength;box(root,side*1.402,1.94,dz,.04,1.84,1.02,metal,.015);box(root,side*1.428,2.32,dz,.03,.66,.72,glass);box(root,side*1.44,1.48,dz,.02,.3,.7,paint);box(root,side*1.45,1.99,dz,.03,1.8,.025,cream);}
   for(const offset of [-.33,.33]){const wheel=cylinder(root,side*1.01,.31,z+offset*carLength,.32,.27,rubber);wheel.rotation.z=Math.PI/2;}
  }
  // Flush rooftop housings stay below the shared running/collision plane.
  for(const off of [-.28,.28]){box(root,0,3.24,z+off*carLength,1.48,.12,1.75,metal,.04);for(let j=-2;j<=2;j++)box(root,j*.22,3.31,z+off*carLength,.08,.025,1.42,dark);}
  if(n<2)box(root,0,1.48,z+carLength/2+gap/2,1.9,1.8,gap,dark,.05);
 }
 // The train's front is at z=0; the roof and collision support share one height.
 box(root,0,2.1,-.13,2.54,2.3,.26,paint,.3);box(root,0,2.49,-.3,2.18,.92,.09,glass,.14);box(root,0,2.99,-.36,.95,.17,.045,dark,.02);
 for(const side of [-1,1]){box(root,side*.93,1.47,-.3,.35,.19,.07,light,.05);box(root,side*1.01,1.08,-.32,.12,.1,.05,red,.025);box(root,side*.45,2.45,-.36,.025,.66,.025,metal);}
 box(root,0,.68,-.3,2.1,.22,.12,dark,.05);root.userData.length=length;return batchStatic(root);
}

export function createRunner(gear={}){
 const root=new T.Group(),body=new T.Group();root.add(body);const astronaut=gear.model==='astro'||gear.id==='subway-4',robot=gear.model==='robot'||gear.id==='subway-2',bunny=gear.model==='bunny'||gear.id==='subway-1',dino=gear.model==='dino'||gear.id==='subway-3';
 const color=astronaut?'#e8f0eb':robot?'#a5d7d4':dino?'#73c28c':bunny?'#dfb0d5':gear.color||'#f4a344',suit=material(color,.12,.5),pants=material(astronaut?'#bccccc':'#244d69',.05,.65),white=material('#f9f2df',.06,.58),skin=material('#b57c57',0,.8),hair=material('#312e32'),teal=material(astronaut?'#b69558':'#1ab8b6',.3,.38),sole=material('#fff5cf',.1,.5),black=material('#1b3e50',.1,.42);
 const pelvis=new T.Group();pelvis.position.y=.99;body.add(pelvis);sphere(pelvis,0,.04,0,.27,.2,.19,pants);const torso=new T.Group();torso.position.y=1.13;body.add(torso);sphere(torso,0,.32,0,.3,.4,.205,suit);sphere(torso,0,.63,-.015,.23,.13,.19,suit);
 // A shaped backpack, shoulder straps, seams, and sneaker soles keep the runner readable from behind.
 sphere(torso,0,.34,-.25,.23,.285,.15,teal);box(torso,0,.31,-.39,.29,.22,.065,suit,.075);box(torso,0,.32,-.428,.17,.025,.012,white,.008);for(const s of [-1,1]){capsule(torso,s*.19,.37,-.34,.019,.36,white);sphere(torso,s*.22,.58,-.14,.05,.13,.06,teal);}
 const head=new T.Group();head.position.set(0,1.98,.025);body.add(head);sphere(head,0,0,0,.235,.285,.225,astronaut||robot?suit:skin);
 if(astronaut||robot){sphere(head,0,.015,.12,.207,.18,.145,material('#193e56',.64,.13));box(torso,0,.35,-.39,.2,.13,.04,white,.02);for(const s of [-1,1])cylinder(torso,s*.22,.31,-.28,.065,.48,white);}
 else{sphere(head,0,.15,-.035,.243,.16,.23,hair);sphere(head,0,.1,.21,.22,.045,.13,suit);for(const s of [-1,1])sphere(head,s*.226,-.015,.015,.045,.065,.055,skin);if(bunny){sphere(head,0,.12,-.055,.25,.18,.235,suit);for(const s of [-1,1]){sphere(head,s*.13,.46,0,.065,.27,.05,suit);sphere(head,s*.13,.46,.047,.03,.19,.012,white);}}if(dino)for(let i=0;i<4;i++)sphere(torso,0,.08+i*.16,-.32,.045,.075,.09,teal);}
 const limbs=[];for(const s of [-1,1]){
  const hip=new T.Group();hip.position.set(s*.17,1.03,0);body.add(hip);capsule(hip,0,-.2,0,.12,.25,pants,1.08);const knee=new T.Group();knee.position.y=-.44;hip.add(knee);capsule(knee,0,-.18,0,.095,.22,pants,1.08);sphere(knee,0,-.385,.085,.14,.12,.245,suit);box(knee,0,-.475,.085,.26,.055,.46,sole,.06);for(let lace=0;lace<3;lace++)box(knee,0,-.3-lace*.018,.12+lace*.03,.13,.018,.022,white,.005);
  const shoulder=new T.Group();shoulder.position.set(s*.32,1.65,0);body.add(shoulder);capsule(shoulder,0,-.17,0,.1,.19,suit);const elbow=new T.Group();elbow.position.y=-.33;shoulder.add(elbow);capsule(elbow,0,-.15,0,.079,.18,suit);capsule(elbow,0,-.27,0,.084,.025,teal);sphere(elbow,0,-.33,0,.085,.1,.09,astronaut?white:skin);limbs.push({hip,knee,shoulder,elbow,side:s});
 }
 if(gear.trim?.id?.endsWith('neon')){const ring=new T.Mesh(new T.TorusGeometry(.27,.018,6,32),new T.MeshBasicMaterial({color:gear.trim.color}));ring.position.set(0,1.49,-.39);body.add(ring);}
 root.userData={body,limbs,torso,head,gear};return root;
}

export function poseRunner(root,time,{jump=false,bank=0,land=false}={}){
 const {body,limbs,torso,head}=root.userData,phase=time*13;
 for(const l of limbs){const s=Math.sin(phase+l.side*Math.PI/2);l.hip.rotation.x=jump?-.65:s*.72;l.knee.rotation.x=jump?1.15:.22+Math.max(0,-s)*1.12;l.shoulder.rotation.x=jump?-1.5:-s*.68;l.elbow.rotation.x=jump?-.85:-.65-Math.max(0,s)*.45;}
 body.position.y=jump?0:Math.abs(Math.sin(phase))*.065;body.rotation.z=-bank*.18;torso.rotation.x=jump?-.12:.1;head.rotation.y=-bank*.13;body.scale.y=land?.92:1;
}
