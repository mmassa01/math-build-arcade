import * as T from '../store/vendor/three.module.min.js';
import {batchStatic} from '../subway/models.mjs';

const v=(x,y,z)=>new T.Vector3(x,y,z);
export const palettes={
 skyfire:{body:'#294e63',wing:'#a37b45',horn:'#d5c4a1'},
 frostwing:{body:'#81b8ca',wing:'#366d94',horn:'#e2f4ee'},
 stormfire:{body:'#4b3b69',wing:'#4d7c9c',horn:'#d5dce2'},
 obsidian:{body:'#292c2c',wing:'#ad532f',horn:'#8e8571'},
 golden:{body:'#b68a3a',wing:'#c49643',horn:'#e6cc85'}
};
export const upgrades={skyfire:{tier:0,wing:1,body:1,crown:0},frostwing:{tier:1,wing:1.03,body:1,crown:2},stormfire:{tier:2,wing:1.06,body:1.02,crown:4},obsidian:{tier:3,wing:1.08,body:1.06,crown:4},golden:{tier:4,wing:1.12,body:1.10,crown:6}};
function noise(x,y){return (Math.sin(x*127.1+y*311.7)*43758.5453)%1;}
export function scaleTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#9b9b9b';ctx.fillRect(0,0,512,512);
 for(let row=-1;row<35;row++)for(let col=-1;col<35;col++){const x=col*16+(row%2)*8,y=row*16,g=Math.floor(140+Math.abs(noise(col,row))*60);ctx.fillStyle=`rgb(${g},${g},${g})`;ctx.strokeStyle='#626262';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y,8.5,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#ffffff35';ctx.beginPath();ctx.ellipse(x-1,y-2,5,6,-.3,Math.PI,Math.PI*1.75);ctx.stroke();}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,4);return t;
}
function ellipsoid(root,x,y,z,a,b,c,mat){const m=new T.Mesh(new T.SphereGeometry(1,24,16),mat);m.position.set(x,y,z);m.scale.set(a,b,c);m.castShadow=true;root.add(m);return m;}
function bone(root,a,b,r1,r2,mat){const d=b.clone().sub(a),m=new T.Mesh(new T.CylinderGeometry(r2,r1,d.length(),10),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());root.add(m);return m;}
function tube(root,points,r,mat,segments=24){const curve=new T.CatmullRomCurve3(points),m=new T.Mesh(new T.TubeGeometry(curve,segments,r,8,false),mat);root.add(m);return m;}
export function createDragon(key='skyfire',texture=null){
 const p=palettes[key]||palettes.skyfire,upgrade=upgrades[key]||upgrades.skyfire,root=new T.Group(),rig=new T.Group();root.add(rig);rig.scale.set(1,upgrade.body,upgrade.body);
 const scales=new T.MeshStandardMaterial({color:p.body,roughness:key==='golden'?.30:.61,metalness:key==='golden'?.72:.12,bumpMap:texture,bumpScale:.065});
 const horn=new T.MeshStandardMaterial({color:p.horn,roughness:.58}),belly=new T.MeshStandardMaterial({color:p.wing,roughness:.78,bumpMap:texture,bumpScale:.035});
 const membrane=new T.MeshPhysicalMaterial({color:p.wing,roughness:key==='golden'?.44:.82,side:T.DoubleSide,metalness:key==='golden'?.32:.06,clearcoat:key==='golden'?.28:.05,bumpMap:texture,bumpScale:.045});
 const accent=new T.MeshStandardMaterial({color:key==='frostwing'?'#a9edff':key==='stormfire'?'#a6b9ff':key==='obsidian'?'#e86d2b':'#f1c665',emissive:key==='frostwing'?'#4a9cb4':key==='stormfire'?'#686bcb':key==='obsidian'?'#e74e17':'#9a5b15',emissiveIntensity:key==='obsidian'?.65:.18,roughness:.32,metalness:key==='golden'?.8:.2});
 ellipsoid(rig,0,0,0,.66,.66,1.62,scales);ellipsoid(rig,0,-.31,.12,.53,.38,1.4,belly);
 // Curved tapering neck, long snout and swept horns face the flight direction (+Z).
 const neckPosition=[],neckUV=[],neckIndex=[];for(let ring=0;ring<=18;ring++){const q=ring/18,r=.43-q*.14;for(let j=0;j<=24;j++){const a=j/24*Math.PI*2;neckPosition.push(Math.sin(a)*r,.1+q*.43+Math.cos(a)*r*(.95-q*.13),1.05+q*1.8);neckUV.push(j/24,q);}}for(let ring=0;ring<18;ring++)for(let j=0;j<24;j++){const n=ring*25+j;neckIndex.push(n,n+25,n+1,n+1,n+25,n+26);}const neckGeometry=new T.BufferGeometry();neckGeometry.setAttribute('position',new T.Float32BufferAttribute(neckPosition,3));neckGeometry.setAttribute('uv',new T.Float32BufferAttribute(neckUV,2));neckGeometry.setIndex(neckIndex);neckGeometry.computeVertexNormals();const neck=new T.Mesh(neckGeometry,scales);rig.add(neck);
 const head=new T.Group();head.position.set(0,.61,3.03);rig.add(head);
 ellipsoid(head,0,0,0,.38,.34,.57,scales);ellipsoid(head,0,-.07,.48,.25,.19,.51,scales);ellipsoid(head,0,-.20,.36,.25,.08,.50,belly);
 for(const s of [-1,1]){ellipsoid(head,s*.30,.06,.13,.075,.07,.12,new T.MeshStandardMaterial({color:'#f1c75e',emissive:'#c67516',emissiveIntensity:.3}));ellipsoid(head,s*.35,.075,.17,.019,.05,.062,new T.MeshStandardMaterial({color:'#081718'}));tube(head,[v(s*.27,.2,-.23),v(s*.46,.45,-.57),v(s*.50,.55,-1.03)],.065,horn);bone(head,v(s*.23,-.09,.75),v(s*.19,-.07,.9),.055,.015,horn);}
 // Each earned creature has a different silhouette, not just a different paint color.
 for(let i=0;i<upgrade.crown;i++){const angle=i/Math.max(1,upgrade.crown-1)*Math.PI,x=Math.cos(angle)*.30,z=-.18-Math.sin(angle)*.32;const tip=new T.Mesh(new T.ConeGeometry(key==='frostwing'?.075:.065,key==='golden'?.62:.42,5),key==='golden'?horn:accent);tip.position.set(x,.35+Math.sin(angle)*.10,z);tip.rotation.z=-x*.6;tip.rotation.x=-.35;head.add(tip);}
 if(key==='golden'){for(const side of [-1,1]){ellipsoid(head,side*.31,.07,.13,.08,.08,.13,new T.MeshStandardMaterial({color:'#3ea886',emissive:'#12674b',emissiveIntensity:.4,metalness:.3,roughness:.18}));for(let i=0;i<5;i++){const z=.3+i*.43;ellipsoid(rig,side*.36,.35+i*.035,z,.22,.16,.28,horn);tube(rig,[v(side*.25,.50,z),v(side*.46,.38,z+.13),v(side*.55,.22,z+.18)],.025,accent,8);}}}
 if(key==='obsidian')for(let i=0;i<9;i++){const z=-.8+i*.4;for(const side of [-1,1])tube(rig,[v(side*.13,.64,z),v(side*.30,.57,z+.09),v(side*.39,.47,z+.24)],.018,accent,8);ellipsoid(rig,0,.61,z,.27,.10,.25,scales);}
 // Overlapping dorsal armor and independent tapered tail segments.
 for(let i=0;i<14;i++){const z=-1.25+i*.29,y=.65-Math.abs(z)*.055;const m=new T.Mesh(new T.ConeGeometry(.115,.36+(i%3)*.04,5),horn);m.position.set(0,y,z);m.rotation.x=-.45;rig.add(m);}
 const tail=[];let parent=rig;for(let i=0;i<12;i++){const g=new T.Group();g.position.set(0,i===0?-.08:0,i===0?-1.27:-.43);parent.add(g);const r=.30*(1-i/13);ellipsoid(g,0,0,-.22,r,r,.36,scales);if(i%2===0){const sp=new T.Mesh(new T.ConeGeometry(Math.max(.035,r*.4),r,5),horn);sp.position.set(0,r,-.2);g.add(sp);}tail.push(g);parent=g;}
 // Tucked, jointed hind legs, with three distinct hooked talons per foot.
 for(const s of [-1,1]){const leg=new T.Group();leg.position.set(s*.48,-.25,-.8);rig.add(leg);ellipsoid(leg,s*.1,-.21,-.13,.23,.36,.46,scales);bone(leg,v(s*.13,-.35,-.25),v(s*.2,-.7,-.7),.16,.1,scales);ellipsoid(leg,s*.2,-.69,-.81,.15,.12,.27,scales);for(let j=0;j<3;j++)tube(leg,[v(s*.2+(j-1)*.1,-.70,-.95),v(s*.2+(j-1)*.12,-.82,-1.1),v(s*.2+(j-1)*.12,-.89,-1.04)],.025,horn,8);}
 const wings=[];
 for(const side of [-1,1]){
  const pivot=new T.Group();pivot.position.set(side*.44,.18,.60);pivot.scale.x=upgrade.wing;rig.add(pivot);
  // Five finger bones define a real, scalloped membrane, not a flat image.
  const wrist=v(side*2.18,.16,.6),tips=[v(side*5.65,-.02,.76),v(side*5.1,-.03,-.7),v(side*3.9,-.06,-2.1),v(side*2.32,-.08,-2.62),v(side*.28,-.13,-1.76)];
  bone(pivot,v(0,0,0),v(side*1.05,.1,.46),.25,.16,scales);bone(pivot,v(side*1.05,.1,.46),wrist,.16,.09,scales);
  for(let i=0;i<4;i++){const mid=wrist.clone().lerp(tips[i],.6);mid.y+=.08;tube(pivot,[wrist,mid,tips[i]],.035+(3-i)*.008,scales,12);}
  tube(pivot,[wrist,v(side*2.1,.38,1.02),v(side*2.32,.56,1.12)],.065,horn,10);
  const vertices=[],uv=[],indices=[];const origin=v(0,0,0),edge=[v(0,0,.10),v(side*1.05,.1,.46),wrist,...tips];
  // Fan panels subdivided radially so the sail can flex in the airflow.
  for(let panel=0;panel<edge.length;panel++){
   const a=edge[panel],b=edge[(panel+1)%edge.length],base=vertices.length/3;
   for(let u=0;u<=8;u++)for(let t=0;t<=8;t++){const q=t/8,f=u/8,point=a.clone().lerp(b,f).multiplyScalar(q);if(panel>=3){point.z+=Math.sin(f*Math.PI)*.32*q*q;point.y-=Math.sin(f*Math.PI)*.12*q;}else point.y-=Math.sin(q*Math.PI)*.14;vertices.push(point.x,point.y,point.z);uv.push(point.x/5.8+.5,point.z/4+.6);}
   for(let u=0;u<8;u++)for(let t=0;t<8;t++){const n=base+u*9+t;indices.push(n,n+9,n+1,n+1,n+9,n+10);}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,membrane);mesh.castShadow=true;pivot.add(mesh);
  // Subtle veins run along every membrane panel.
  for(let i=0;i<4;i++){const a=tips[i],b=tips[i+1],mid=a.clone().lerp(b,.5);mid.z+=.26;tube(pivot,[wrist.clone().multiplyScalar(.8),mid.clone().multiplyScalar(.55),mid],.012,belly,10);}
  if(upgrade.tier>0)for(let i=0;i<4;i++){const a=wrist.clone().multiplyScalar(.90),b=tips[i].clone().multiplyScalar(.94);tube(pivot,[a,a.clone().lerp(b,.6).add(v(0,.02,0)),b],key==='golden'?.025:.015,accent,12);}
  if(key==='stormfire'||key==='obsidian'||key==='golden')for(let i=0;i<3;i++){const point=tips[i+1];bone(pivot,point,point.clone().add(v(side*.18,.08,-.28)),.065,0,key==='golden'?horn:accent);}
  wings.push({pivot,side,mesh,base:new Float32Array(vertices)});
 }
 // Batch rigid scales and wing skeletons without flattening the animated joints.
 for(const w of wings){w.mesh.removeFromParent();batchStatic(w.pivot);w.pivot.add(w.mesh);w.pivot.removeFromParent();}
 tail[0].removeFromParent();batchStatic(rig);rig.add(tail[0]);for(const w of wings)rig.add(w.pivot);
 root.userData={rig,tail,wings,head,key,upgrade};return root;
}
export function poseDragon(root,time,bank=0,reduced=false){
 const {rig,tail,wings}=root.userData,phase=time*2.65,beat=reduced?0:Math.sin(phase);
 rig.position.y=reduced?0:Math.sin(phase-.5)*.18;rig.rotation.x=reduced?0:Math.sin(phase-.7)*.035;rig.rotation.z=bank;
 for(const {pivot,side,mesh,base}of wings){pivot.rotation.z=side*(.08+beat*.50);pivot.rotation.y=side*(.06+Math.cos(phase)*.045);const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2];a.setY(i,y+(reduced?0:Math.sin(phase-.6+Math.abs(x)*.28)*.12*Math.abs(x)/5));}a.needsUpdate=true;mesh.geometry.computeVertexNormals();}
 tail.forEach((g,i)=>{g.rotation.y=reduced?0:Math.sin(time*1.7-i*.32)*.075-bank*.15;g.rotation.x=reduced?0:Math.cos(phase-i*.18)*.025;});
}
