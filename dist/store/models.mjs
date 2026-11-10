import {createMoonWalker} from './moonwalker.mjs?v=moon-27';
import * as T from './vendor/three.module.min.js';
export function createCollectible(kind,horseData){
 if(kind==='subway')return createMoonWalker();
 const root=new T.Group();const mat=(color,metalness=.1,roughness=.36,emissive)=>new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.7,clearcoatRoughness:.22,...(emissive?{emissive,emissiveIntensity:2}: {})});
 const gold=mat('#e9b94d',.82,.22),dark=mat('#121824',.25,.32),rubber=mat('#15171c',.03,.8),chrome=mat('#b7c4d6',.9,.23),blue=mat('#2580e8',.45,.26),cyan=mat('#5fe4ff',.2,.2,'#16c8ff'),white=mat('#e9edf1',.15,.36),purple=mat('#8152d2',.5,.22),brown=mat('#b7894e',.1,.68),cream=mat('#f2dec0',.05,.8);
 const mesh=(geo,m,p=[0,0,0],s=[1,1,1],g=root)=>{const a=new T.Mesh(geo,m);a.position.set(...p);a.scale.set(...s);a.castShadow=true;a.receiveShadow=true;g.add(a);return a};
 const ball=(p,s,m=gold,g=root)=>mesh(new T.SphereGeometry(1,40,28),m,p,s,g);
 const box=(p,s,m=gold,g=root)=>mesh(new T.BoxGeometry(1,1,1),m,p,s,g);
 const rod=(a,b,r,m=chrome,g=root,r2=r)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),o=mesh(new T.CylinderGeometry(r2,r,d.length(),18),m,av.clone().add(bv).multiplyScalar(.5).toArray(),[1,1,1],g);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o};
 const tube=(points,r,m=gold,g=root)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),40,r,8,false),m,[0,0,0],[1,1,1],g);
 const ring=(p,r,w,m=gold,g=root)=>mesh(new T.TorusGeometry(r,w,10,40),m,p,[1,1,1],g);
 function loft(sections,m,N=32){const pos=[],idx=[];sections.forEach(([z,w,y,h])=>{for(let i=0;i<N;i++){const a=i/N*Math.PI*2;pos.push(Math.sin(a)*w,y+Math.cos(a)*h,z)}});for(let j=0;j<sections.length-1;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=b+N,d=a+N;idx.push(a,c,b,a,d,c)}for(const [j,rev] of [[0,false],[sections.length-1,true]]){const start=pos.length/3;pos.push(0,sections[j][2],sections[j][0]);for(let i=0;i<N;i++)rev?idx.push(start,j*N+(i+1)%N,j*N+i):idx.push(start,j*N+i,j*N+(i+1)%N)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return mesh(g,m)}
 function nozzle(x,y,z,r){rod([x,y,z-.16],[x,y,z+.12],r,chrome);const rim=ring([x,y,z+.13],r*.83,.035,dark);ball([x,y,z+.15],[r*.67,r*.67,.035],cyan);ring([x,y,z+.18],r*.66,.024,cyan);}
 if(kind==='car'){
  loft([[-2.12,.36,.48,.1],[-1.8,.87,.54,.18],[-1.0,1.0,.58,.26],[.4,1.02,.58,.28],[1.65,.93,.6,.27],[2.05,.7,.57,.2]],gold);
  loft([[-2.16,.4,.31,.04],[-1.5,.98,.32,.07],[1.5,1.02,.34,.09],[2.12,.75,.35,.04]],dark);
  ball([0,.88,.12],[.67,.43,1.07],dark);tube([[-.63,.84,-.52],[-.45,1.22,-.2],[.45,1.22,-.2],[.63,.84,-.52]],.025,gold);
  for(const side of [-1,1]){for(const z of [-1.26,1.28]){const x=side*1.02,y=.49;rod([x-side*.16,y,z],[x+side*.16,y,z],.45,rubber);const rim=ring([x+side*.18,y,z],.31,.035,chrome);rim.rotation.y=Math.PI/2;const hub=rod([x+side*.17,y,z],[x+side*.2,y,z],.115,gold);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([x+side*.19,y,z],[x+side*.19,y+Math.sin(a)*.29,z+Math.cos(a)*.29],.023,chrome)}ball([side*.86,.66,z],[.25,.21,.59],gold)}
   tube([[side*.32,.66,-1.95],[side*.69,.65,-1.86],[side*.83,.67,-1.59]],.035,cyan);tube([[side*.91,.51,-.6],[side*1.04,.53,.2],[side*.96,.54,.65]],.025,cyan);for(let i=0;i<4;i++)box([side*.87,.84,1+i*.1],[.19,.022,.035],dark);box([side*.51,.92,1.58],[.08,.5,.12],dark);nozzle(side*.43,.59,2.03,.29)}
  const wing=box([0,1.2,1.72],[2.55,.085,.45],gold);wing.rotation.x=-.07;for(const side of [-1,1])box([side*1.25,1.25,1.72],[.045,.22,.5],dark);box([0,.42,-2.12],[.7,.13,.04],dark);
 }else if(kind==='jetski'){
  // Neptune X follows the original purple/silver armored craft and its rider.
  purple.color.set('#7408ef');purple.metalness=.65;purple.roughness=.2;purple.clearcoat=1;
  const armor=mat('#292733',.5,.31),visor=mat('#067dc9',.66,.14,'#013c73');
  chrome.roughness=.25;dark.roughness=.43;
  const panel=(points,m)=>{const geo=new T.BufferGeometry(),indices=[];for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setIndex(indices);geo.computeVertexNormals();const pm=m.clone();pm.side=T.DoubleSide;return mesh(geo,pm)};
  const jet=(x)=>{const barrel=mesh(new T.CylinderGeometry(.27,.22,.47,48,1,true),chrome,[x,.56,1.73]);barrel.rotation.x=Math.PI/2;const inner=mesh(new T.CylinderGeometry(.225,.15,.41,48,1,true),dark,[x,.56,1.75]);inner.rotation.x=Math.PI/2;ring([x,.56,1.975],.244,.021,chrome);ring([x,.56,1.978],.214,.012,cyan);ball([x,.56,1.57],[.15,.15,.018],cyan);for(let i=0;i<12;i++){const t=i*Math.PI/6;rod([x+Math.cos(t)*.16,.56+Math.sin(t)*.16,1.62],[x+Math.cos(t)*.213,.56+Math.sin(t)*.213,1.96],.009,blue)} };
  const tag=(o,name)=>(o.name=name,o);
  tag(loft([[-2.18,.15,.35,.07],[-1.7,.67,.34,.2],[-.6,.83,.36,.25],[.9,.78,.36,.25],[1.76,.57,.37,.17]],dark,12),'neptune-keel');
  tag(loft([[-2.2,.07,.56,.025],[-1.8,.57,.64,.13],[-1.05,.72,.7,.19],[-.25,.65,.67,.14],[1.0,.66,.63,.17],[1.7,.5,.62,.1]],purple,12),'neptune-purple-armor');
  // Angular black central hood and sculpted side pontoons.
  loft([[-1.98,.05,.72,.025],[-1.4,.4,.91,.12],[-.72,.44,1.0,.13],[-.4,.3,.88,.1]],armor,10);
  for(const side of [-1,1]){
   const pod=loft([[-1.96,.04,.5,.025],[-1.25,.2,.55,.1],[.15,.24,.52,.15],[1.4,.21,.52,.13],[1.8,.12,.54,.07]],purple,10);pod.position.x=side*.67;
   tube([[side*.33,.77,-1.88],[side*.64,.84,-1.3],[side*.72,.78,-.6],[side*.69,.62,.62],[side*.57,.65,1.48]],.035,chrome);
   tube([[side*.56,.42,-1.7],[side*.85,.41,-.65],[side*.83,.4,.85],[side*.66,.44,1.65]],.018,purple);
   tube([[side*.43,.79,-1.73],[side*.64,.81,-1.3]],.04,cyan);
   box([side*.59,.69,.17],[.25,.045,1.2],dark);
   for(let i=0;i<6;i++){const vent=box([side*.765,.67,.55+i*.1],[.025,.1,.05],rubber);vent.rotation.z=side*.3}
   jet(side*.52);
   const fin=box([side*.59,.8,1.42],[.12,.045,.54],armor);fin.rotation.x=.22;
   box([side*.6,.8,1.4],[.14,.05,.07],chrome);
   // Layered swept armor follows the original silhouette, including the pointed silver chine.
   panel([[side*.79,.59,-1.68],[side*.87,.54,-.6],[side*.88,.55,.8],[side*.67,.63,1.66],[side*.77,.74,1.27],[side*.9,.67,.6],[side*.86,.68,-.55]],purple);
   panel([[side*.86,.54,-1.5],[side*.9,.47,-.64],[side*.86,.48,.96],[side*.66,.57,1.69],[side*.74,.59,1.22],[side*.85,.52,.85]],chrome);
   panel([[side*.71,.74,-1.28],[side*.46,.91,-.87],[side*.43,.91,-.59],[side*.7,.72,-.28]],chrome);
   panel([[side*.72,.733,-1.05],[side*.49,.87,-.75],[side*.53,.81,-.46],[side*.7,.71,-.25]],dark);
   for(let row=0;row<5;row++)for(let col=0;col<4;col++){
    const vent=ball([side*(.59+row*.022),.81-row*.019,-.86+col*.06],[.007,.008,.018],rubber);
   }
   for(let i=0;i<8;i++)box([side*.59,.72,.48+i*.08],[.2,.018,.027],armor);
   panel([[side*.35,.84,1.57],[side*.57,.91,1.31],[side*.7,.91,1.58],[side*.57,.83,1.83]],purple);
   tube([[side*.38,.92,-1.37],[side*.31,1.015,-.99],[side*.32,1.025,-.72]],.018,chrome);

  }
  ball([0,.84,.55],[.34,.14,.84],rubber);
  for(let i=0;i<7;i++)tube([[-.27,.91,.45+i*.1],[0,.98,.45+i*.1],[.27,.91,.45+i*.1]],.006,armor);
  tube([[-.29,.88,1.2],[0,.93,1.34],[.29,.88,1.2]],.012,chrome);
  tag(ball([0,1.08,-.62],[.29,.2,.35],armor),'neptune-console');
  const screen=box([0,1.245,-.57],[.19,.025,.15],blue);screen.rotation.x=.4;
  for(const x of [-.12,.12])ball([x,1.24,-.48],[.02,.012,.02],chrome);
  rod([0,1.03,-.65],[0,1.4,-.57],.08,armor);
  tube([[-.43,1.4,-.43],[-.25,1.46,-.6],[.25,1.46,-.6],[.43,1.4,-.43]],.045,dark);
  for(const side of [-1,1])rod([side*.32,1.43,-.52],[side*.47,1.38,-.4],.065,rubber);
  // Crouched racing rider: armored boots, bent knees, matching sleeves and blue visor.
  tag(ball([0,1.27,.49],[.28,.24,.38],rubber),'neptune-rider');
  const torso=rod([0,1.35,.53],[0,1.95,.27],.25,rubber,root,.24);
  tag(torso,'neptune-rider-torso');
  ball([0,1.65,.47],[.27,.35,.18],purple);
  ball([0,1.68,.37],[.235,.3,.15],armor);
  tube([[-.19,1.4,.51],[-.24,1.63,.55],[-.2,1.87,.47]],.021,purple);
  tube([[.19,1.4,.51],[.24,1.63,.55],[.2,1.87,.47]],.021,purple);
  for(let i=0;i<5;i++){const band=ring([0,1.95+i*.018,.19-i*.013],.118,.009,armor);band.rotation.x=Math.PI/2}
  ball([0,1.72,.64],[.25,.34,.1],armor);
  for(let i=0;i<4;i++)box([0,1.48+i*.12,.71-i*.04],[.38,.045,.035],chrome);
  for(const side of [-1,1]){
   rod([side*.15,1.32,.49],[side*.45,1.23,-.08],.15,rubber);
   rod([side*.31,1.35,.41],[side*.46,1.28,-.05],.087,purple);
   tube([[side*.28,1.41,.52],[side*.4,1.4,.26],[side*.47,1.32,-.03]],.018,chrome);
   tag(ball([side*.46,1.21,-.13],[.15,.19,.14],chrome),'neptune-knee-armor');
   rod([side*.46,1.16,-.09],[side*.49,.84,.06],.11,armor);
   rod([side*.48,1.07,-.05],[side*.5,.85,.03],.055,purple);
   ball([side*.49,.78,-.09],[.13,.12,.29],rubber);box([side*.5,.77,-.16],[.18,.065,.26],purple);
   tube([[side*.4,.7,-.31],[side*.52,.7,-.36],[side*.61,.7,-.2],[side*.61,.7,.1]],.012,chrome);
   for(let k=0;k<4;k++)box([side*.5,.84,-.18+k*.045],[.18,.015,.018],armor);
   const shoulder=[side*.24,1.92,.21],elbow=[side*.36,1.57,-.12],hand=[side*.4,1.43,-.47];
   rod(shoulder,elbow,.13,rubber);rod(elbow,hand,.105,rubber);
   tag(ball(shoulder,[.17,.16,.18],purple),'neptune-shoulder-armor');
   ball([side*.28,1.96,.16],[.13,.095,.12],chrome);
   ball([side*.36,1.57,-.13],[.13,.13,.13],chrome);
   ball([side*.43,1.58,-.13],[.065,.085,.09],purple);
   for(let k=0;k<4;k++){const rib=ring([side*.32,1.68+k*.025,.035+k*.02],.112,.009,armor);rib.rotation.x=.4}
   rod([side*.36,1.58,-.15],[side*.4,1.47,-.38],.095,purple);
   ball(hand,[.11,.095,.12],dark);for(let j=0;j<3;j++)rod([side*(.36+j*.025),1.46,-.46],[side*(.36+j*.025),1.38,-.49],.016,chrome);
  }
  rod([0,1.98,.24],[0,2.11,.05],.105,rubber);
  tag(ball([0,2.25,-.015],[.31,.31,.37],armor),'neptune-armored-helmet');
  ball([0,2.36,.035],[.298,.245,.3],purple);
  panel([[-.11,2.51,.24],[.11,2.51,.24],[.18,2.53,-.28],[0,2.57,-.45],[-.18,2.53,-.28]],purple);
  tube([[0,2.51,.26],[0,2.575,-.1],[0,2.58,-.37]],.013,chrome);
  tag(ball([0,2.27,-.29],[.25,.215,.18],visor),'neptune-blue-visor');
  tube([[-.18,2.38,-.41],[0,2.43,-.445],[.12,2.4,-.44]],.008,cyan);
  panel([[-.22,2.11,-.3],[-.13,2.02,-.46],[.13,2.02,-.46],[.22,2.11,-.3],[0,2.08,-.5]],purple);
  for(let i=0;i<3;i++)box([-.07+i*.07,2.065,-.478],[.025,.035,.018],rubber);
  for(const side of [-1,1]){
   tag(ball([side*.305,2.24,-.025],[.045,.12,.12],chrome),'neptune-helmet-ear');
   ball([side*.34,2.24,-.025],[.018,.075,.075],cyan);
   tube([[side*.23,2.08,-.05],[side*.25,2.02,-.32],[side*.13,2.06,-.48]],.035,chrome);
   const peak=box([side*.12,2.48,-.25],[.16,.035,.48],purple);peak.rotation.x=-.12;
  }
  tube([[-.23,2.43,-.31],[0,2.48,-.43],[.23,2.43,-.31]],.026,purple);
 }else if(kind==='subway'){
  ball([0,1.18,0],[.43,.58,.28],white);ball([0,.69,0],[.39,.2,.26],white);box([0,1.15,-.27],[.42,.38,.06],blue);box([0,1.15,-.31],[.3,.22,.04],dark);for(let i=0;i<3;i++)ball([-.08+i*.08,1.2,-.34],[.025,.025,.015],i===0?cyan:gold);
  box([0,1.3,.34],[.55,.65,.32],white);for(const side of [-1,1]){rod([side*.3,1.0,.47],[side*.3,1.55,.47],.13,chrome);ring([side*.3,1.5,.47],.12,.025,gold).rotation.x=Math.PI/2;const shoulder=[side*.42,1.54,0],elbow=[side*.65,1.18,-.04],hand=[side*.58,.94,-.21];rod(shoulder,elbow,.15,white);ball(shoulder,[.19,.2,.2],white);rod(elbow,hand,.13,white);ball(elbow,[.15,.15,.15],white);ball(hand,[.14,.16,.15],blue);rod([side*.23,.72,0],[side*.27,.3,.01],.17,white);ball([side*.27,.3,0],[.18,.2,.18],white);ball([side*.27,.17,-.15],[.21,.17,.32],white);box([side*.27,.075,-.15],[.4,.065,.58],blue);rod([side*.26,.49,0],[side*.26,.56,0],.178,gold)}
  ball([0,1.94,0],[.48,.47,.43],white);ball([0,1.96,-.26],[.4,.34,.23],gold);ball([0,1.98,-.405],[.34,.27,.07],dark);tube([[-.25,2.09,-.455],[0,2.16,-.475],[.2,2.1,-.455]],.015,cyan);for(const side of [-1,1]){ball([side*.46,1.95,0],[.06,.17,.16],gold);ball([side*.48,1.95,0],[.035,.1,.1],blue)}
 }else{
  if(horseData){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(horseData.positions,3));g.setIndex(horseData.indices);g.rotateY(Math.PI);g.computeVertexNormals();mesh(g,brown)}else{ball([0,1.05,0],[.35,.48,.86],brown);rod([0,1.18,-.55],[0,1.8,-1.12],.27,brown);ball([0,1.82,-1.17],[.19,.28,.43],brown);for(const x of [-.22,.22])for(const z of [-.5,.5])rod([x,1,z],[x,.15,z],.09,brown)}
  // Matching palomino silks, saddle, reins, and a complete racing rider.
  ball([0,1.25,.13],[.39,.08,.45],gold);ball([0,1.32,.1],[.3,.075,.28],dark);for(const side of [-1,1])box([side*.33,1.12,.1],[.045,.34,.6],gold);
  rod([0,1.53,.2],[0,1.9,-.2],.19,gold);ball([0,1.58,.14],[.24,.18,.26],white);ball([0,2.02,-.34],[.135,.16,.15],cream);ball([0,2.14,-.34],[.16,.095,.17],gold);box([0,2.1,-.46],[.24,.025,.17],dark);
  for(const side of [-1,1]){rod([side*.16,1.58,.12],[side*.43,1.25,-.05],.105,white);rod([side*.43,1.25,-.05],[side*.37,.91,.03],.08,dark);ball([side*.37,.9,-.04],[.09,.09,.18],dark);rod([side*.17,1.83,-.17],[side*.28,1.62,-.48],.085,gold);rod([side*.28,1.62,-.48],[side*.18,1.65,-.77],.065,gold);ball([side*.18,1.65,-.77],[.065,.065,.07],cream);tube([[side*.18,1.65,-.77],[side*.26,1.43,-.97],[side*.15,1.48,-1.5]],.012,dark)}
 }
 root.userData.kind=kind;root.updateMatrixWorld(true);return root;
}
