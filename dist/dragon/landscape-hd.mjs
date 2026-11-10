import * as T from '../store/vendor/three.module.min.js';
import {shoreHeight} from './forest-shore.mjs?v=shore-47';
const mod=(n,d)=>((n%d)+d)%d;
export const WORLD_LENGTH=780;
function ridge(x,z,scale){const u=x*scale,v=z/WORLD_LENGTH*Math.PI*2;return 1-Math.abs(Math.sin(u+Math.sin(v*3)*.85)*Math.cos(v*5+u*.47));}
export function mountainHeight(x,z){
 return shoreHeight(x,z);
}
export function terrainGeometry(side,k,segments=96){
 const g=new T.PlaneGeometry(145,260,segments,Math.round(segments*1.6));g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const x=side*(p.getX(i)+100),z=p.getZ(i)+130+k*260,y=mountainHeight(x,z),slope=Math.abs(mountainHeight(x+.6,z)-mountainHeight(x-.6,z))/1.2+Math.abs(mountainHeight(x,z+.6)-mountainHeight(x,z-.6))/1.2;
  p.setXYZ(i,x,y,p.getZ(i));let c=new T.Color('#7c8d65');if(y>32||slope>1.25)c.lerp(new T.Color('#959b96'),Math.min(1,Math.max((y-30)/40,(slope-1.1)*.65)));if(y>85)c.lerp(new T.Color('#e4e9e7'),Math.min(1,(y-85)/27));c.multiplyScalar(.87+ridge(x,z,.31)*.13);colors.push(c.r,c.g,c.b);
 }g.setAttribute('color',new T.Float32BufferAttribute(colors,3));if(side<0){const index=g.index.array;for(let i=0;i<index.length;i+=3){const b=index[i+1];index[i+1]=index[i+2];index[i+2]=b;}}g.computeVertexNormals();return g;
}
export function spruceGeometry(){
 // Layered, irregular foliage has a natural silhouette instead of a single cone.
 const positions=[],normals=[];for(let tier=0;tier<7;tier++){const y=.05+tier*.12,r=.34*(1-tier/8),geo=new T.ConeGeometry(r,.35,9,1,true).toNonIndexed();const p=geo.attributes.position,n=geo.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),jitter=.90+.10*Math.sin(i*3.71+tier*9);positions.push(x*jitter,p.getY(i)+y+.17,z*jitter);normals.push(n.getX(i),n.getY(i),n.getZ(i));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return g;
}
export function rockTexture(){
 const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d'),image=ctx.createImageData(1024,1024);let seed=84521;
 for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){seed=(Math.imul(seed,1664525)+1013904223)|0;const grain=(seed>>>24)/255;const stratum=Math.sin(x*.031+y*.07+Math.sin(y*.018)*3),vein=Math.pow(Math.max(0,Math.sin(x*.052-y*.021+Math.sin(y*.014)*2)),18);const value=clamp(111+grain*48+stratum*14+vein*32,0,255),i=(y*1024+x)*4;image.data[i]=value;image.data[i+1]=value+2;image.data[i+2]=value+1;image.data[i+3]=255;}
 ctx.putImageData(image,0,0);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;
}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function detailTerrainMaterial(material,rock){
 material.onBeforeCompile=shader=>{shader.uniforms.rockMap={value:rock};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 terrainPosition; varying float terrainSlope;').replace('#include <begin_vertex>','#include <begin_vertex>\nterrainPosition=position;terrainSlope=1.-normal.y;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D rockMap;varying vec3 terrainPosition; varying float terrainSlope;').replace('#include <map_fragment>',`#include <map_fragment>
 float stone=max(smoothstep(30.,65.,terrainPosition.y),smoothstep(.15,.65,terrainSlope));
 vec3 granite=texture2D(rockMap,terrainPosition.xz*.06).rgb;
 diffuseColor.rgb=mix(diffuseColor.rgb,granite*.86,stone);
 float snow=smoothstep(85.,119.,terrainPosition.y)*smoothstep(.30,.90,1.-terrainSlope);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.91,.95,.96),snow);`);};material.customProgramCacheKey=()=> 'fjord-terrain-hd-46';
}
export const waterVertex=`
 varying vec3 wp; varying vec4 mirrorCoord; uniform mat4 reflectionMatrix;uniform float time;
 void main(){vec3 p=position;p.z+=sin(p.x*.23+time*.5)*.035+cos(p.y*.2-time*.4)*.03;vec4 w=modelMatrix*vec4(p,1.);wp=w.xyz;mirrorCoord=reflectionMatrix*w;gl_Position=projectionMatrix*viewMatrix*w;}
`;
export const waterFragment=`
 precision highp float;
 varying vec3 wp;varying vec4 mirrorCoord;
 uniform float time;uniform sampler2D reflectionMap;uniform vec3 cameraPos;
 float wave(vec2 p){return sin(p.x*.85+p.y*.36)*.10+sin(p.x*1.7-p.y*.72)*.034+sin(p.y*4.1+p.x*2.3)*.011+sin(p.x*7.3-p.y*5.6)*.0035;}
 void main(){
  vec2 p=wp.xz+vec2(time*.18,time*11.);
  float eps=.035,hx=(wave(p+vec2(eps,0.))-wave(p-vec2(eps,0.)))/(2.*eps),hz=(wave(p+vec2(0.,eps))-wave(p-vec2(0.,eps)))/(2.*eps);
  vec3 n=normalize(vec3(-hx,1.,-hz)),v=normalize(cameraPos-wp),sunDir=normalize(vec3(-.55,.8,-.3));
  float fresnel=.045+.955*pow(1.-max(0.,dot(n,v)),5.);
  vec2 uv=mirrorCoord.xy/mirrorCoord.w;uv+=n.xz*.016;
  vec3 reflection=texture2D(reflectionMap,clamp(uv,.001,.999)).rgb;
  float depthFade=1.-exp(-max(0.,wp.z)*.012);
  vec3 water=mix(vec3(.015,.20,.215),vec3(.045,.24,.26),depthFade);
  vec3 color=mix(water,reflection,.35+fresnel*.55);
  float spec=pow(max(0.,dot(n,normalize(v+sunDir))),190.);
  color+=vec3(1.,.88,.66)*spec*.75;
  float fog=1.-exp(-max(0.,wp.z)*.0012);color=mix(color,vec3(.55,.68,.70),fog);
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;
