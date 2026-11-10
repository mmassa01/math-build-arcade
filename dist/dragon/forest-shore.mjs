import * as T from '../store/vendor/three.module.min.js';
const mod=(n,d)=>((n%d)+d)%d,lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
function hash(x,z){let n=Math.imul(x,374761393)^Math.imul(z,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function noise(x,z,period){const a=Math.floor(x),b=Math.floor(z),u=smooth(x-a),v=smooth(z-b);return lerp(lerp(hash(a,mod(b,period)),hash(a+1,mod(b,period)),u),lerp(hash(a,mod(b+1,period)),hash(a+1,mod(b+1,period)),u),v);}
export function coastAt(z){return 43+noise(7,z/780*6,6)*15+noise(23,z/780*13,13)*4;}
export function shoreHeight(x,z){
 const inland=Math.max(0,Math.abs(x)-coastAt(z)),q=Math.min(1,inland/35),broad=noise(Math.abs(x)/63,z/780*5,5),ridges=noise(Math.abs(x)/24,z/780*14,14);
 return -4+inland*.26+q*(broad*25+ridges*7)+(q*q)*noise(Math.abs(x)/10,z/780*29,29)*2;
}
export function pineGeometry(){
 const positions=[],uv=[],indices=[];
 for(let side=0;side<3;side++){const angle=side*Math.PI/3,c=Math.cos(angle)*.43,s=Math.sin(angle)*.43,n=positions.length/3;positions.push(-c,0,-s,c,0,s,c,1,s,-c,1,-s);uv.push(0,0,1,0,1,1,0,1);indices.push(n,n+1,n+2,n,n+2,n+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function pineTexture(){
 const c=document.createElement('canvas');c.width=384;c.height=768;const ctx=c.getContext('2d');let seed=89217;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
 ctx.strokeStyle='#514b39';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(192,752);ctx.lineTo(191,40);ctx.stroke();
 // Individual branch sprays and needles produce a broken organic edge, not triangles.
 for(let level=0;level<87;level++){const y=45+level*7.8,f=level/87,width=Math.pow(f,.66)*150*(.76+random()*.24)*(1-Math.max(0,f-.82)*1.7);for(const side of [-1,1]){const reach=width*(.70+random()*.30),endY=y+8+random()*20;ctx.strokeStyle='#303c2b';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(192,y);ctx.lineTo(192+side*reach,endY);ctx.stroke();
  for(let tuft=0;tuft<15;tuft++){const q=tuft/15,px=192+side*reach*q,py=y+(endY-y)*q;for(let needle=0;needle<8;needle++){const sun=side<0,shade=Math.floor(random()*20),green=sun?62:43;ctx.strokeStyle=`rgba(${green-15+shade},${green+shade},${green-22+shade},.88)`;ctx.lineWidth=.7+random()*.9;const length=5+random()*13;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+side*(random()*8+1),py-length);ctx.stroke();ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-side*(random()*7),py-length*.6);ctx.stroke();}}
 }}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}
export function forestRecords(count=4200){
 const list=[];for(let i=0;i<count*3&&list.length<count;i++){const z=mod(i*43.131,780),side=i%2?1:-1,x=side*(coastAt(z)+1.5+mod(i*23.791,110)),y=shoreHeight(x,z);if(y>35)continue;const slope=Math.abs(shoreHeight(x+1,z)-shoreHeight(x-1,z))*.5;if(slope>.9)continue;list.push({x,z,y,h:2.2+hash(i,13)*4.1,angle:hash(i,44)*Math.PI});}return list;
}
export function photoShoreMaterial(material,photo){
 material.vertexColors=false;material.color.set('#ffffff');material.map=photo;material.roughness=1;
 material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 shorePos;').replace('#include <begin_vertex>','#include <begin_vertex>\nshorePos=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 shorePos;').replace('#include <map_fragment>',`#ifdef USE_MAP
 float edge=clamp((abs(shorePos.x)-43.)/130.,0.,1.);
 float u=.025+edge*.25+sin(shorePos.z*.009)*.018;
 if(shorePos.x<0.)u=1.-u;
 float v=clamp(.402+shorePos.y*.0065,.402,.79);
 vec3 albedo=texture2D(map,vec2(u,v)).rgb;
 diffuseColor.rgb*=albedo;
 #endif`);};material.customProgramCacheKey=()=> 'photographic-forest-shore-47';material.needsUpdate=true;
}
