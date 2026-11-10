import * as T from '../store/vendor/three.module.min.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const SHORE_PANELS=[{side:1,x:135,z:185,width:240},{side:-1,x:-139,z:205,width:252}];
export function shoreAlpha(u,y){
 const edge=u<.5?u/.36:(1-u)/.36;
 if(edge<0||edge>1||y<.26||y>.617)return 0;
 const contour=.305+.282*Math.pow(edge,.93)+(Math.sin(u*183)+Math.sin(u*431))*.0018;
 return smooth((y-contour)/.008)*(1-smooth((y-.604)/.013))*(1-smooth((edge-.90)/.10))*smooth(edge/.045);
}
export function createShoreCanvas(photo,side){
 const c=document.createElement('canvas');c.width=768;c.height=512;const ctx=c.getContext('2d',{willReadFrequently:true}),u0=side>0?0:.64,photoWidth=photo.naturalWidth||photo.width,photoHeight=photo.naturalHeight||photo.height;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(photo,u0*photoWidth,.26*photoHeight,.36*photoWidth,.357*photoHeight,0,0,c.width,c.height);
 const pixels=ctx.getImageData(0,0,c.width,c.height);for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const u=u0+x/(c.width-1)*.36,py=.26+y/(c.height-1)*.357,i=(y*c.width+x)*4;pixels.data[i+3]=Math.round(255*shoreAlpha(u,py));}
 ctx.putImageData(pixels,0,0);return c;
}
export function panelPose(panel,time=0){
 const height=panel.width/(.36*1536/(.357*1024)),z=panel.z+Math.sin(time*.08)*7;
 return {...panel,height,y:-3.4+height*(.5-(.617-.605)/.357),z};
}
export class PhotoShores{
 constructor(scene,photo){this.scene=scene;this.panels=[];
  for(const spec of SHORE_PANELS){const canvas=createShoreCanvas(photo,spec.side),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
   const pose=panelPose(spec),mat=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,alphaTest:.015,side:T.DoubleSide,toneMapped:false,fog:true});
   const mesh=new T.Mesh(new T.PlaneGeometry(pose.width,pose.height),mat);mesh.rotation.y=Math.PI;mesh.position.set(pose.x,pose.y,pose.z);mesh.name='photographic-shore-'+spec.side;scene.add(mesh);this.panels.push({spec,mesh,canvas});
  }
 }
 update(time){for(const p of this.panels)p.mesh.position.z=panelPose(p.spec,time).z;}
}
// Software projection uses the exact runtime textures, so the shore artwork can
// be inspected even in a browser that does not expose a WebGL context.
export function drawProjectedShore(ctx,canvas,camera,panel,w,h){
 const p=panel.pose||panelPose(panel.spec||panel),image=panel.canvas;
 const point=(u,v)=>{const q=new T.Vector3(p.x+(u-.5)*-p.width,p.y+(.5-v)*p.height,p.z).project(camera);return{x:(q.x*.5+.5)*w,y:(-.5*q.y+.5)*h};};
 function triangle(a,b,c,sa,sb,sc){const d=sa.x*(sb.y-sc.y)+sb.x*(sc.y-sa.y)+sc.x*(sa.y-sb.y);if(Math.abs(d)<1e-7)return;const A=(a.x*(sb.y-sc.y)+b.x*(sc.y-sa.y)+c.x*(sa.y-sb.y))/d,B=(a.y*(sb.y-sc.y)+b.y*(sc.y-sa.y)+c.y*(sa.y-sb.y))/d,C=(a.x*(sc.x-sb.x)+b.x*(sa.x-sc.x)+c.x*(sb.x-sa.x))/d,D=(a.y*(sc.x-sb.x)+b.y*(sa.x-sc.x)+c.y*(sb.x-sa.x))/d,E=(a.x*(sb.x*sc.y-sc.x*sb.y)+b.x*(sc.x*sa.y-sa.x*sc.y)+c.x*(sa.x*sb.y-sb.x*sa.y))/d,F=(a.y*(sb.x*sc.y-sc.x*sb.y)+b.y*(sc.x*sa.y-sa.x*sc.y)+c.y*(sa.x*sb.y-sb.x*sa.y))/d;
  ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();ctx.transform(A,B,C,D,E,F);ctx.drawImage(image,0,0);ctx.restore();}
 const a=point(0,0),b=point(1,0),c=point(1,1),d=point(0,1),s0={x:0,y:0},s1={x:image.width,y:0},s2={x:image.width,y:image.height},s3={x:0,y:image.height};triangle(a,b,c,s0,s1,s2);triangle(a,c,d,s0,s2,s3);
}
