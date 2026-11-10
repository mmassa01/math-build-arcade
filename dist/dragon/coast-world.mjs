import * as T from '../store/vendor/three.module.min.js';
export const COAST_PERIOD=780,WATER_LEVEL=-3.4;
const mod=(n,d)=>((n%d)+d)%d,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t;
export function hash(x,z){let n=Math.imul(x,374761393)^Math.imul(z,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
function noise(x,z,period){const a=Math.floor(x),b=Math.floor(z),f=x-a,g=z-b,u=f*f*(3-2*f),v=g*g*(3-2*g);return lerp(lerp(hash(a,mod(b,period)),hash(a+1,mod(b,period)),u),lerp(hash(a,mod(b+1,period)),hash(a+1,mod(b+1,period)),u),v);}
export function coastEdge(z,side=1){const q=mod(z,780)/780;return(side>0?22:72)+noise(side*9,q*6,6)*(side>0?17:14)+Math.sin(q*Math.PI*4)*(side>0?6:4);}
export function coastHeight(x,z){
 const side=x>=0?1:-1,inland=Math.abs(x)-coastEdge(z,side);if(inland<0)return WATER_LEVEL-.4+inland*.20;
 const fade=1-Math.exp(-inland/9),q=mod(z,780)/780;
 return WATER_LEVEL-.4+fade*(4.8+noise(Math.abs(x)/30,q*12,12)*4)+noise(Math.abs(x)/13,q*27,27)*fade*1.2;
}
export function forestDensity(x,z){return noise(Math.abs(x)/23+12,mod(z,780)/780*13,13);}
export function coastGeometry(side,k,resolution=72){
 const g=new T.PlaneGeometry(165,260,resolution,Math.round(resolution*1.6));g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv,weights=[];
 for(let i=0;i<p.count;i++){const x=side*(p.getX(i)+87.5),z=p.getZ(i)+130+k*260,y=coastHeight(x,z),elevation=y-WATER_LEVEL,slope=Math.abs(coastHeight(x+.4,z)-coastHeight(x-.4,z))+Math.abs(coastHeight(x,z+.4)-coastHeight(x,z-.4));p.setXYZ(i,x,y,p.getZ(i));uv.setXY(i,x*.085,z*(64/780));const rock=clamp((1.8-elevation)*.5+slope*.55,0,1),shade=.85-forestDensity(x,z)*.22;weights.push(rock,shade,elevation);}
 g.setAttribute('coastWeights',new T.Float32BufferAttribute(weights,3));if(side<0){const index=g.index.array;for(let i=0;i<index.length;i+=3){const t=index[i+1];index[i+1]=index[i+2];index[i+2]=t;}}g.computeVertexNormals();return g;
}
export function treeRecords(count=2200){const list=[];for(let i=0;i<count*4&&list.length<count;i++){const side=i%5?1:-1,z=mod(i*37.131,780),x=side*(coastEdge(z,side)+7+hash(i,13)*90),y=coastHeight(x,z),density=forestDensity(x,z);if(density<.42||y<WATER_LEVEL+2)continue;list.push({x,y,z,h:5.5+hash(i,41)*7,variant:i%4,angle:hash(i,7)*Math.PI,shade:.68+hash(i,93)*.32});}return list;}
export function rockRecords(count=120){const list=[];for(let i=0;i<count;i++){const side=i%5?1:-1,z=mod(i*47.791,780),x=side*(coastEdge(z,side)-3+hash(i,2)*10),size=.8+hash(i,4)*2.4,y=Math.max(WATER_LEVEL-size*.3,coastHeight(x,z)-size*.3);list.push({x,y,z,size,variant:i%3,angle:hash(i,8)*Math.PI});}return list;}
export function rockGeometry(variant=0){const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=.84+.13*Math.sin(x*3.2+y*2.7+variant*4)+.07*Math.sin(z*5.1-x*2.1+variant);p.setXYZ(i,x*r,y*r,z*r);}g.computeVertexNormals();return g;}
export function treeGeometry(aspect=.55){const p=[],uv=[],index=[];for(let j=0;j<2;j++){const a=j*Math.PI/2,c=Math.cos(a)*aspect/2,s=Math.sin(a)*aspect/2,n=p.length/3;p.push(-c,0,-s,c,0,s,c,1,s,-c,1,-s);uv.push(0,0,1,0,1,1,0,1);index.push(n,n+1,n+2,n,n+2,n+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;}
export function cutTreeAtlas(image){const c=document.createElement('canvas');c.width=image.naturalWidth||image.width;c.height=image.naturalHeight||image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data,cw=Math.floor(c.width/2),ch=Math.floor(c.height/2),trees=[];
 for(let cell=0;cell<4;cell++){const ox=cell%2*cw,oy=Math.floor(cell/2)*ch;let left=cw,top=ch,right=0,bottom=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((y+oy)*c.width+x+ox)*4+3]>160){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(cw-1,right+2);bottom=Math.min(ch-1,bottom+2);const tree=document.createElement('canvas');tree.width=Math.max(1,right-left+1);tree.height=Math.max(1,bottom-top+1);tree.getContext('2d').drawImage(image,ox+left,oy+top,tree.width,tree.height,0,0,tree.width,tree.height);trees.push(tree);}return trees;
}
function image(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
export async function loadCoastArt(){const [ground,granite,atlas]=await Promise.all([image(new URL('./art/terrain-v45.webp',import.meta.url).href),image(new URL('./art/granite-v49.webp',import.meta.url).href),image(new URL('./art/forest-atlas-v49.webp',import.meta.url).href)]);return{ground,granite,trees:cutTreeAtlas(atlas)};}
function texture(image,repeat=false){const t=new T.CanvasTexture(image);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
function terrainMaterial(art){const grass=texture(art.ground,true),rock=texture(art.granite,true),mat=new T.MeshStandardMaterial({color:'#bec1b5',map:grass,bumpMap:grass,bumpScale:.10,roughness:.98});
 mat.onBeforeCompile=s=>{s.uniforms.graniteMap={value:rock};s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 coastWeights;varying vec3 vCoast;varying vec2 coastUV;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCoast=coastWeights;coastUV=uv;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D graniteMap;varying vec3 vCoast;varying vec2 coastUV;').replace('#include <map_fragment>',`#include <map_fragment>
 vec3 granite=texture2D(graniteMap,coastUV*.75).rgb;
 diffuseColor.rgb=mix(diffuseColor.rgb,granite*.67,vCoast.x);
 diffuseColor.rgb*=vCoast.y;
 diffuseColor.rgb*=mix(.69,1.,smoothstep(.1,1.7,vCoast.z));`);};mat.customProgramCacheKey=()=> 'natural-low-coast-49';return mat;}
export class CoastWorld{
 constructor(scene){this.scene=scene;this.ready=false;this.failed=false;this.ground=[];this.forest=[];this.stones=[];this.art=null;this.promise=loadCoastArt().then(art=>{this.art=art;this.build(art);this.ready=true;}).catch(error=>{this.failed=true;console.warn('Coast detail could not load; distant scenery remains available.',error);});}
 build(art){const mat=terrainMaterial(art);for(const side of [-1,1])for(let k=0;k<3;k++){const mesh=new T.Mesh(coastGeometry(side,k),mat);mesh.position.z=130+k*260;mesh.userData.base=mesh.position.z;mesh.receiveShadow=true;this.scene.add(mesh);this.ground.push(mesh);}
  const allTrees=treeRecords();for(let variant=0;variant<4;variant++){const records=allTrees.filter(r=>r.variant===variant),picture=art.trees[variant],material=new T.MeshBasicMaterial({map:texture(picture),alphaTest:.50,alphaToCoverage:true,side:T.DoubleSide,toneMapped:false}),mesh=new T.InstancedMesh(treeGeometry(picture.width/picture.height),material,records.length);mesh.frustumCulled=false;const group={mesh,records};this.scene.add(mesh);this.forest.push(group);const color=new T.Color();records.forEach((r,i)=>{color.setScalar(r.shade);mesh.setColorAt(i,color);});}
  const allRocks=rockRecords(),stoneTexture=texture(art.granite,true),stoneMaterial=new T.MeshStandardMaterial({map:stoneTexture,bumpMap:stoneTexture,bumpScale:.17,color:'#a6aa9f',roughness:.94});for(let variant=0;variant<3;variant++){const records=allRocks.filter(r=>r.variant===variant),mesh=new T.InstancedMesh(rockGeometry(variant),stoneMaterial,records.length);mesh.frustumCulled=false;mesh.receiveShadow=true;this.scene.add(mesh);this.stones.push({mesh,records});}this.update(0);
 }
 update(time){if(!this.art)return;const travel=time*15,dummy=new T.Object3D();for(const mesh of this.ground)mesh.position.z=mod(mesh.userData.base-travel+130,780)-130;
  for(const {mesh,records}of this.forest){records.forEach((r,i)=>{dummy.position.set(r.x,r.y,mod(r.z-travel+130,780)-130);dummy.rotation.set(0,r.angle,0);dummy.scale.setScalar(r.h);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;}
  for(const {mesh,records}of this.stones){records.forEach((r,i)=>{dummy.position.set(r.x,r.y,mod(r.z-travel+130,780)-130);dummy.rotation.set(.13*Math.sin(i),r.angle,.11*Math.cos(i));dummy.scale.set(r.size*1.45,r.size*.75,r.size*1.1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;}
 }
}
