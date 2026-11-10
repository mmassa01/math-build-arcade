/* Wave Riders art layer. This module reads the race; it never changes its math, progress or rewards. */
(() => {
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(v,n)=>((v%n)+n)%n;
 const api=window.WaveCinema={version:38},images={},bounds=[];
 function load(key,url,ready){const image=new Image();images[key]=image;image.onload=()=>{try{ready?.(image)}catch{api[key+'Error']=true}};image.onerror=()=>{api[key+'Error']=true};image.src=url;return image;}
 const ready=image=>image?.complete&&image.naturalWidth>0;
 load('rider','art/rider-poses-v38.webp',image=>{
  const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(image,0,0);
  const pixels=cx.getImageData(0,0,c.width,c.height),p=pixels.data,cw=c.width/2,ch=c.height/2;
  for(let n=0;n<4;n++){let minX=cw,minY=ch,maxX=0,maxY=0;const ox=Math.floor(n%2*cw),oy=Math.floor(Math.floor(n/2)*ch);for(let y=0;y<Math.floor(ch);y++)for(let x=0;x<Math.floor(cw);x++)if(p[((oy+y)*c.width+ox+x)*4+3]>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}bounds.push({x:ox+minX,y:oy+minY,w:maxX-minX+1,h:maxY-minY+1});}
  // A gold pace rider is clearly distinguishable from every student-selected craft.
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]>30&&b>r*1.12&&b>g*.94){const light=Math.max(r,g,b)/255;p[i]=Math.round(238*light);p[i+1]=Math.round(190*light);p[i+2]=Math.round(71*light);}}
  cx.putImageData(pixels,0,0);images.gold=c;api.riderReady=true;
 });
 api.spriteRects=()=>bounds.map(r=>({...r}));
 load('water','art/ocean-surface-v38.webp',image=>{
  const c=document.createElement('canvas');c.width=c.height=1024;const cx=c.getContext('2d');
  // Mirrored quadrants give the water identical edge pixels for an uninterrupted repeating surface.
  for(const sx of [1,-1])for(const sy of [1,-1]){cx.save();cx.translate(sx<0?1024:0,sy<0?1024:0);cx.scale(sx,sy);cx.drawImage(image,0,0,512,512);cx.restore();}
  images.surface=c;api.waterReady=true;
 });
 load('wake','art/foam-wake-v38.webp');
 function visibleLead(gap){const sign=Math.sign(gap),amount=Math.abs(gap);if(!sign||amount<.18)return 0;return sign*Math.max(.14,Math.tanh(amount/2.35));}
 api.visibleLead=visibleLead;
 function layout(w,h,gap,turn=0){
  const lead=visibleLead(gap),horizon=h*.415,size=Math.min(w*.31,h*.42,280),center=w*.5-turn*w*.045;
  return [false,true].map(gold=>{const depth=.82+(gold?1:-1)*lead*.145;return {gold,depth,x:center+(gold?-1:1)*w*.205,y:horizon+(h-horizon)*depth*depth,size:size*(.94+(depth-.82)*.9)};});
 }
 api.layout=layout;
 function polygon(ctx,points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
 function water(s){
  const {ctx,w,h,travel,time,turn}=s,horizon=h*.415;
  const bg=s.stadium;if(ready(bg)){
   const dw=Math.max(w,h*bg.naturalWidth/bg.naturalHeight)*1.06,left=(w-dw)/2-turn*w*.025;ctx.drawImage(bg,left,0,dw,h);
   // Gentle refraction retains the full-resolution photographed wave detail underneath the flow layer.
   for(let i=0;i<64;i++){const d=i/64,sy=bg.naturalHeight*(.415+.585*d),sh=bg.naturalHeight*.585/64,dx=Math.sin(time*1.4+i*.19)*w*.002*d;ctx.drawImage(bg,0,sy,bg.naturalWidth,sh,left+dx,horizon+(h-horizon)*d,dw,(h-horizon)/64+.7);}
  }else{const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#52b9e6');sky.addColorStop(.414,'#d3f3ee');sky.addColorStop(.415,'#208fb3');sky.addColorStop(1,'#0b8d9c');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);}
  const tex=images.surface;
  if(tex){
   ctx.save();ctx.globalAlpha=.17;for(let i=0;i<108;i++){
    const d0=i/108,d1=(i+1)/108,d=(d0+d1)/2,y=horizon+(h-horizon)*d0*d0,dy=Math.max(.5,(h-horizon)*(d1*d1-d0*d0)+.6);
    const sw=tex.width/(1+d*.8),sx=(tex.width-sw)/2+turn*20*d,sy=mod(80/(.055+d*1.25)-travel*410,tex.height),sh=clamp(80/(.055+d0*1.25)-80/(.055+d1*1.25),1,60),first=Math.min(sh,tex.height-sy);
    ctx.drawImage(tex,sx,sy,sw,first,0,y,w,dy*first/sh);if(first<sh)ctx.drawImage(tex,sx,0,sw,sh-first,0,y+dy*first/sh,w,dy*(sh-first)/sh);
   }
   ctx.restore();const haze=ctx.createLinearGradient(0,horizon,0,h);haze.addColorStop(0,'#83e3ec90');haze.addColorStop(.08,'#51bfca20');haze.addColorStop(.35,'#007a9a00');haze.addColorStop(1,'#063c6f08');ctx.fillStyle=haze;ctx.fillRect(0,horizon,w,h-horizon);
  }
  // Small wave crests approach in perspective and sparkle independently of the source texture.
  for(let i=0;i<100;i++){const z=mod(i*.618033+travel*.16,1),y=horizon+(h-horizon)*z*z,x=mod(Math.sin(i*73.7)*.5+.5+turn*.03,1)*w,shine=.15+.25*Math.max(0,Math.sin(time*2.5+i*3));ctx.strokeStyle='rgba(235,255,255,'+shine*z+')';ctx.lineWidth=.5+z*1.2;ctx.beginPath();ctx.ellipse(x,y,2+z*z*15,.4+z*1.4,Math.sin(i)*.1,Math.PI,Math.PI*1.85);ctx.stroke();}
  // Sunlight stays in the water instead of following either boat like a sticker.
  const reflection=ctx.createLinearGradient(w*.1,horizon,w*.28,h);reflection.addColorStop(0,'#fff0b000');reflection.addColorStop(.5,'#fff4d018');reflection.addColorStop(1,'#fff7ca00');ctx.fillStyle=reflection;ctx.fillRect(0,horizon,w*.4,h-horizon);
 }
 function bridge(s){
  const {ctx,w,h,turn}=s,p=clamp(s.bridgePhase/1.23,0,1),z=210*(1-p)**2+2,f=h*.95,horizon=h*.415;
  const project=(x,y,depth=z)=>({x:w*.5+(x-turn*2)*f/depth,y:horizon+(3.5-y)*f/depth});
  const shade=ctx.createLinearGradient(0,h*.15,0,h*.5);shade.addColorStop(0,'#eff8e9');shade.addColorStop(.45,'#bacdc8');shade.addColorStop(1,'#4b797f');
  polygon(ctx,[project(-38,0,z+7),project(38,0,z+7),project(38,0,z+11),project(-38,0,z+11)],'#134c6530');
  for(const side of [-1,1]){
   const x=side*26;polygon(ctx,[project(x-.7,0),project(x+.7,0),project(x+.7,20),project(x-.7,20)],shade);
   polygon(ctx,[project(x+.7,0),project(x+.7,20),project(x+1.1,20,z+1.4),project(x+1.1,0,z+1.4)],'#5b8990');
   const base=project(x,0);ctx.strokeStyle='#b9f8ed55';ctx.lineWidth=Math.max(1,12*f/z);ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(base.x+Math.sin(s.time)*3,base.y+Math.min(h*.2,7*f/z));ctx.stroke();
   for(let j=1;j<9;j++)for(const direction of [-1,1]){const a=project(x,19),b=project(x+direction*j*1.45,8.4);ctx.strokeStyle='#faf5dc';ctx.lineWidth=clamp(f/z*.045,.45,2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  }
  polygon(ctx,[project(-43,8),project(43,8),project(43,8,z+3),project(-43,8,z+3)],'#e6e4c7');
  polygon(ctx,[project(-43,8),project(43,8),project(43,7.3),project(-43,7.3)],'#63898b');
  for(let j=-42;j<43;j+=2){const a=project(j,8),b=project(j,9);ctx.strokeStyle='#ffefc4';ctx.lineWidth=clamp(f/z*.055,.5,2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  const left=project(-43,9),right=project(43,9);ctx.strokeStyle='#e7f1da';ctx.lineWidth=clamp(f/z*.08,1,3);ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.stroke();
 }
 function buoys(s){
  const {ctx,w,h,travel,turn}=s,horizon=h*.415;
  for(let i=0;i<10;i++){const z=mod(i/10+travel*.10,1),y=horizon+(h-horizon)*z*z,span=w*(.04+.62*z*z);for(const side of [-1,1]){const x=w*.5+side*span-turn*w*.04*(1-z),r=1+z*z*11;
   ctx.save();ctx.translate(x,y+Math.sin(s.time*2+i)*r*.1);ctx.fillStyle='#082c4d30';ctx.beginPath();ctx.ellipse(r*.35,r*.25,r*1.45,r*.35,0,0,Math.PI*2);ctx.fill();
   const paint=ctx.createLinearGradient(-r,-r*2,r,0);paint.addColorStop(0,'#fff2ac');paint.addColorStop(.4,side<0?'#f6c647':'#f68b54');paint.addColorStop(1,side<0?'#b57815':'#b9472d');polygon(ctx,[{x:-r,y:0},{x:-r*.48,y:-r*2.3},{x:r*.48,y:-r*2.3},{x:r,y:0}],paint);ctx.fillStyle='#fcfff4';ctx.fillRect(-r*.72,-r*1.05,r*1.44,r*.28);ctx.strokeStyle='#e6ffff77';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,r*.2,r*1.8,r*.4,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }}
 }
 function wake(s,b){
  const {ctx,h,time}=s,boost=!b.gold&&s.race?.boost>0,running=['racing','finish'].includes(s.mode),length=running?b.size*(boost?1.9:1.3):b.size*.45;
  ctx.save();ctx.beginPath();ctx.rect(0,h*.415,s.w,h*.585);ctx.clip();
  if(ready(images.wake)){
   const width=b.size*(boost?2:1.65)*(1+Math.sin(time*4)*.012),foamHeight=length+b.size*.12;ctx.save();ctx.globalAlpha=running?(boost?.77:.57):.3;ctx.translate(b.x,b.y-b.size*.18);ctx.rotate(-s.turn*.045);ctx.drawImage(images.wake,-width/2,0,width,foamHeight);ctx.restore();
  }else for(const side of [-1,1])for(let line=0;line<4;line++){
   ctx.beginPath();for(let i=0;i<=25;i++){const t=i/25,y=b.y+length*t,x=b.x+side*b.size*(.15+t*(boost?.67:.5))+Math.sin(time*4+t*16+line)*b.size*.013*(1+t)-s.turn*t*b.size*.3;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
   ctx.strokeStyle=line===0?(boost?'#eaffff':'#f0ffff'):'rgba(210,255,255,'+(.32-line*.065)+')';ctx.lineWidth=b.size*(line===0?.017:.01)*(boost?1.6:1);ctx.stroke();
  }
  for(let i=0;i<(s.reduced?6:26);i++){
   const t=mod(time*(running?1.5:.45)+i*.137,1),side=i%2?1:-1,x=b.x+side*b.size*(.22+t*(boost?.7:.4))-s.turn*t*b.size*.2,y=b.y-b.size*.08-t*b.size*(boost?.35:.2)+t*t*b.size*.55,r=b.size*(.003+t*.013);
   ctx.fillStyle='rgba(239,255,255,'+((1-t)*.65)+')';ctx.beginPath();ctx.ellipse(x,y,r,r*.6,0,0,Math.PI*2);ctx.fill();
  }
  const wash=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.size*.27);wash.addColorStop(0,'#eaffff90');wash.addColorStop(1,'#c3ffff00');ctx.fillStyle=wash;ctx.fillRect(b.x-b.size*.3,b.y-b.size*.08,b.size*.6,b.size*.25);ctx.restore();
 }
 function boat(s,b){
  const {ctx,time,turn,gear}=s;
  if(!api.riderReady){s.legacyDrawCar(b.x,b.y,b.size,b.gold,turn);return;}
  const crest=s.reduced?0:Math.max(0,Math.sin(time*2.4+(b.gold?1.8:0))-.86)/.14,lift=crest*b.size*.035,bob=s.reduced?0:Math.sin(time*4+(b.gold?1:0))*b.size*.009;
  const frame=crest>.7?3:Math.abs(turn)>.28?(turn>0?2:1):0,rect=bounds[frame];
  ctx.save();ctx.translate(b.x,b.y+bob-lift);ctx.rotate(s.reduced?0:turn*.065+Math.sin(time*2)*.012);ctx.fillStyle='#073e5d55';ctx.beginPath();ctx.ellipse(0,1,b.size*.32,b.size*.045,0,0,Math.PI*2);ctx.fill();
  let custom=false;if(!b.gold&&gear?.atlas&&window.ArcadeArt)custom=window.ArcadeArt.draw(ctx,'jetski',images.rider,false,0,0,0,1,1,-b.size/2,-b.size*1.25,b.size,b.size*1.25,gear);
  if(!custom){const art=b.gold?images.gold:images.rider,scale=Math.min(b.size/rect.w,b.size*1.25/rect.h),dw=rect.w*scale,dh=rect.h*scale;ctx.drawImage(art,rect.x,rect.y,rect.w,rect.h,-dw/2,-dh,dw,dh);}
  if(!b.gold&&gear?.trim?.id?.endsWith('neon')){ctx.strokeStyle=gear.trim.color;ctx.shadowColor=gear.trim.color;ctx.shadowBlur=12;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-b.size*.12,b.size*.35,b.size*.13,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
  if(!b.gold&&gear?.trim?.id?.endsWith('stars')){ctx.fillStyle='#ffe896';ctx.font='bold '+Math.max(12,b.size*.12)+'px system-ui';ctx.fillText('★',b.size*.29,-b.size*.8);}
  ctx.restore();
  // A small layer of aerated water crosses the stern, so the hull is seated in the sea.
  if(ready(images.wake)){ctx.save();ctx.globalAlpha=.55;const foam=images.wake;ctx.drawImage(foam,foam.naturalWidth*.32,foam.naturalHeight*.08,foam.naturalWidth*.36,foam.naturalHeight*.2,b.x-b.size*.32,b.y-b.size*.075,b.size*.64,b.size*.13);ctx.restore();}
  // Labels sit beside each craft, not over the rider or the racing route.
  const label=b.gold?'PACE RIDER':'YOU',font=clamp(s.w*.009,8,11);ctx.font='800 '+font+'px system-ui';ctx.textAlign='center';const ly=b.y-b.size*1.28-10,lw=ctx.measureText(label).width+18;ctx.fillStyle=b.gold?'#dfb74b':'#103f59e6';ctx.beginPath();(ctx.roundRect||ctx.rect).call(ctx,b.x-lw/2,ly-font*.9,lw,font+10,8);ctx.fill();ctx.fillStyle=b.gold?'#3a3618':'#efffff';ctx.fillText(label,b.x,ly+3);
 }
 function rewards(s){
  const {ctx,w,h}=s;
  for(const p of s.sparks){if(!s.paused){p.life-=s.dt;p.x+=p.vx*s.dt;p.y+=p.vy*s.dt;}
   if(p.life<=0)continue;ctx.save();ctx.globalAlpha=clamp(p.life,0,1);
   if(p.coin){const t=clamp(1-p.life/1.1,0,1),ease=t*t*(3-2*t),x=w*.68+(Math.min(246,w*.56)-w*.68)*ease+Math.sin(t*6+p.vx)*12,y=h*.72+(40-h*.72)*ease-Math.sin(t*Math.PI)*60;ctx.translate(x,y);ctx.scale(.45+.55*Math.abs(Math.cos(t*7+p.vx)),1);ctx.shadowColor='#ffd451';ctx.shadowBlur=12;ctx.fillStyle='#ffd754';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff3b5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,4.8,0,Math.PI*2);ctx.stroke();}
   else{ctx.fillStyle='#e7ffff';ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
 }
 api.draw=s=>{
  if(!s.ctx||s.w<1||s.h<1)return false;
  const {ctx,w,h}=s,visual=s.reduced?{...s,time:0,travel:0,turn:0,bridgePhase:0}:s;ctx.save();water(visual);bridge(visual);buoys(visual);
  const boats=layout(w,h,s.visualGap,visual.turn).sort((a,b)=>a.y-b.y);for(const b of boats)wake(visual,b);for(const b of boats)boat(visual,b);rewards(s);
  if(s.race?.boost>0&&!s.reduced){const g=ctx.createRadialGradient(w*.5,h*.65,w*.25,w*.5,h*.55,w*.8);g.addColorStop(0,'#43eeff00');g.addColorStop(1,'#22d9ee38');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
  if(s.flash>0){ctx.globalAlpha=s.flash*.06;ctx.fillStyle='#f4ffff';ctx.fillRect(0,0,w,h);}ctx.restore();
  if(s.canvas){s.canvas.dataset.renderer='wave-cinema';s.canvas.dataset.water=api.waterReady?'textured':'compatible';s.canvas.dataset.boats=String(boats.length);}
  return true;
 };
})();
