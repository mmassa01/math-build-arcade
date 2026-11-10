import * as T from './vendor/three.module.min.js';
// Sculpted from the original white/blue/gold Moon Walker sprite.
export function createMoonWalker(){
 const g=new T.Group();g.name='Moon Walker';
 const material=(color,metalness=0,roughness=.5)=>new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.18,clearcoatRoughness:.35});
 const suit=material('#f0f1f0',.02,.57),seam=material('#c8ced4',.1,.55),blue=material('#1567dc',.2,.32),gold=material('#eab737',.72,.25),dark=material('#172a41',.5,.17),sole=material('#0751bf',.06,.57),silver=material('#b0bbc6',.7,.36),black=material('#263544',.05,.7);
 const add=(geo,mat,p=[0,0,0],scale=[1,1,1])=>{const o=new T.Mesh(geo,mat);o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;g.add(o);return o};
 const ell=(p,s,m=suit)=>add(new T.SphereGeometry(1,48,32),m,p,s);
 const tube=(pts,r,m=seam)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),48,r,10,false),m);
 const rod=(a,b,r,m=suit,r2=r)=>{const v=new T.Vector3(...a),w=new T.Vector3(...b),d=w.clone().sub(v);const o=add(new T.CylinderGeometry(r2,r,d.length(),32),m,v.clone().add(w).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o};
 function rounded(p,size,m=suit,r=.05){const [w,h,d]=size,shape=new T.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const geo=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.45,bevelSegments:4,steps:1,curveSegments:12});geo.translate(0,0,-d/2+r);return add(geo,m,p)}
 function ellipse(cx,cy,cz,rx,ry,r,m=seam){const pts=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;pts.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a),cz])}return tube(pts,r,m)}
 function sleeve(a,b,r1,r2){const av=new T.Vector3(...a),bv=new T.Vector3(...b),len=av.distanceTo(bv),points=[];for(let i=0;i<=48;i++){let t=i/48;const envelope=Math.sin(Math.PI*t);let r=r1*(1-t)+r2*t+.005*envelope*Math.sin(t*Math.PI*14)+.012*envelope;points.push(new T.Vector2(r,t*len))}const o=add(new T.LatheGeometry(points,40),suit,a);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o}
 // Tailored torso, layered waist and curved shoulder seams.
 ell([0,1.25,0],[.355,.48,.255]);ell([0,.91,.01],[.34,.21,.255]);
 const belt=add(new T.TorusGeometry(.307,.03,12,64),blue,[0,1.0,0],[1,.78,1]);belt.rotation.x=Math.PI/2;
 tube([[-.31,1.45,-.125],[-.24,1.56,-.18],[0,1.6,-.22],[.24,1.56,-.18],[.31,1.45,-.125]],.012);
 rounded([0,1.3,-.249],[.36,.31,.055],seam,.045);rounded([0,1.31,-.285],[.31,.25,.035],suit,.035);
 rounded([0,1.34,-.308],[.22,.09,.018],dark,.014);
 for(let i=0;i<3;i++)ell([-.075+i*.075,1.235,-.318],[.021,.021,.012],i===0?blue:gold);
 for(const side of [-1,1]){
  const shoulder=[side*.34,1.49,0],elbow=[side*.53,1.23,.075],wrist=[side*.52,1.1,-.19];
  ell(shoulder,[.19,.205,.205]);sleeve(shoulder,elbow,.148,.15);ell(elbow,[.153,.155,.153]);sleeve(elbow,wrist,.143,.12);
  rod([side*.52,1.15,-.13],[side*.52,1.1,-.21],.132,blue);rod([side*.52,1.16,-.117],[side*.52,1.145,-.145],.139,gold);
  ell([side*.52,1.04,-.238],[.115,.13,.12]);ell([side*.43,1.06,-.256],[.054,.079,.06]);
  for(let j=0;j<3;j++)tube([[side*(.46+j*.04),1.025,-.345],[side*(.46+j*.04),.975,-.328]],.004,seam);
  // Gold shoulder insignia, restrained blue stripe on the sleeve.
  ell([side*.491,1.48,0],[.016,.082,.092],blue);ell([side*.509,1.49,0],[.008,.046,.054],gold);
  const hip=[side*.19,.9,0],knee=[side*.22,.57,side===1?-.035:.06],ankle=[side*.23,.25,side===1?-.09:.075];
  sleeve(hip,knee,.165,.152);ell(knee,[.157,.168,.16]);sleeve(knee,ankle,.15,.135);
  rounded([side*.22,.56,(side===1?-.035:.06)-.143],[.19,.16,.035],suit,.035);
  rod([side*.23,.31,ankle[2]],[side*.23,.355,ankle[2]],.15,blue);rod([side*.23,.365,ankle[2]],[side*.23,.385,ankle[2]],.151,gold);
  const z=ankle[2]-.105;
  ell([side*.23,.175,z],[.185,.18,.28]);rounded([side*.23,.075,z-.015],[.345,.08,.5],sole,.045);
  // Raised sidewalls, gold piping and real blue tread across the sole.
  tube([[side*.23-.16,.12,z+.12],[side*.23-.16,.12,z-.15],[side*.23,.12,z-.25],[side*.23+.16,.12,z-.15],[side*.23+.16,.12,z+.12]],.012,gold);
  for(let i=0;i<7;i++)rounded([side*.23,.033,z-.18+i*.06],[.28,.026,.024],blue,.008);
  for(let i=0;i<4;i++)tube([[side*.23-.115,.2+i*.026,z-.18],[side*.23,.215+i*.026,z-.2],[side*.23+.115,.2+i*.026,z-.18]],.006,seam);
 }
 // Life support backpack: rounded padded case, gold ports, oxygen tanks and corrugated hoses.
 rounded([0,1.315,.328],[.52,.63,.24],seam,.08);rounded([0,1.33,.462],[.475,.575,.13],suit,.07);
 rounded([0,1.33,.538],[.29,.43,.025],suit,.045);ellipse(0,1.48,.56,.095,.095,.022,gold);ell([0,1.48,.565],[.067,.067,.018],blue);
 rounded([0,1.245,.559],[.14,.16,.02],gold,.028);rounded([0,1.25,.574],[.075,.115,.015],silver,.015);
 for(const side of [-1,1]){
  rod([side*.255,1.05,.37],[side*.255,1.48,.37],.09,suit);ell([side*.255,1.48,.37],[.09,.09,.09]);ell([side*.255,1.05,.37],[.09,.09,.09]);
  rod([side*.255,1.33,.37],[side*.255,1.37,.37],.095,blue);rod([side*.255,1.12,.37],[side*.255,1.15,.37],.095,gold);
  ellipse(side*.142,1.135,.559,.043,.043,.012,gold);ell([side*.142,1.135,.572],[.033,.033,.022],silver);
  const hose=new T.CatmullRomCurve3([[side*.142,1.135,.58],[side*.23,.97,.57],[side*.38,.95,.37],[side*.37,1.15,.14]].map(p=>new T.Vector3(...p)));
  add(new T.TubeGeometry(hose,56,.039,12,false),silver);
  for(let i=1;i<26;i++){let t=i/26,p=hose.getPoint(t),dir=hose.getTangent(t);const band=add(new T.TorusGeometry(.04,.005,6,16),seam,p.toArray());band.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dir)}
  for(let j=0;j<3;j++)rounded([side*.14,1.62-j*.028,.535],[.09,.008,.012],seam,.003);
 }
 // Large original round helmet with a separate curved visor. No intersecting gold face sphere.
 rod([0,1.58,0],[0,1.68,0],.265,blue);rod([0,1.65,0],[0,1.695,0],.28,gold);
 ell([0,2.025,0],[.48,.475,.445]);
 ell([0,2.01,-.338],[.386,.325,.154],gold);
 ell([0,2.015,-.379],[.353,.291,.137],dark);
 // Fine glass highlights stay on the visor surface rather than cutting through the face.
 tube([[-.245,2.17,-.46],[-.15,2.23,-.481],[-.02,2.25,-.48],[.105,2.23,-.475]],.008,suit);
 tube([[-.26,2.125,-.475],[-.24,2.16,-.476]],.004,blue);
 for(const side of [-1,1]){
  ell([side*.467,2.025,.015],[.043,.155,.155],gold);ell([side*.502,2.025,.015],[.015,.106,.106],gold);
  ell([side*.515,2.025,.015],[.008,.072,.072],silver);
  tube([[side*.34,1.72,.115],[side*.395,1.8,.185],[side*.38,2.02,.25],[side*.32,2.28,.21]],.008,seam);
 }
 // Subtle rear shell seam matches the original white helmet silhouette.
 tube([[-.29,2.31,.18],[0,2.385,.24],[.29,2.31,.18]],.005,seam);
 // Batch static pieces by material so the detailed suit stays light on mobile GPUs.
 g.updateMatrixWorld(true);const buckets=new Map();
 for(const o of g.children){const key=o.material;let b=buckets.get(key);if(!b)buckets.set(key,b={positions:[],normals:[],indices:[]});const geo=o.geometry.clone().applyMatrix4(o.matrixWorld),p=geo.attributes.position,n=geo.attributes.normal,base=b.positions.length/3;b.positions.push(...p.array);b.normals.push(...n.array);if(geo.index){for(const i of geo.index.array)b.indices.push(base+i)}else{for(let i=0;i<p.count;i++)b.indices.push(base+i)}geo.dispose();o.geometry.dispose()}
 g.clear();for(const [m,b]of buckets){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.normals,3));geo.setIndex(b.indices);add(geo,m)}
 g.userData.kind='subway';g.updateMatrixWorld(true);return g;
}
