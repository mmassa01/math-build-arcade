/* Presentation only. Math, pacing, mastery and coins remain in DirtEngine. */
(()=>{'use strict';
 const api=window.DirtCinema={version:42},images={},rects=[];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(v,n)=>((v%n)+n)%n;
 function load(key,src,fn){const im=new Image();images[key]=im;im.onload=()=>{try{fn?.(im)}catch{api[key+'Error']=true}};im.onerror=()=>api[key+'Error']=true;im.src=src;}
 const ready=im=>im?.complete&&im.naturalWidth>0;
 load('track','art/raceway-v41.webp');
 load('soil','art/clay-v42.webp',im=>{const tile=document.createElement('canvas');tile.width=tile.height=1024;const cx=tile.getContext('2d');for(const x of [1,-1])for(const y of [1,-1]){cx.save();cx.translate(x<0?1024:0,y<0?1024:0);cx.scale(x,y);cx.drawImage(im,0,0,512,512);cx.restore();}images.clay=tile;});
 load('cars','art/sprint-poses-v41.webp',im=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);const data=cx.getImageData(0,0,c.width,c.height),d=data.data,cw=c.width/2,ch=c.height/2;
  for(let n=0;n<4;n++){const ox=n%2*cw,oy=Math.floor(n/2)*ch;let left=cw,top=ch,right=0,bottom=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(d[((oy+y)*c.width+ox+x)*4+3]>150){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}rects.push({x:ox+left,y:oy+top,w:right-left+1,h:bottom-top+1});}
  for(let i=0;i<d.length;i+=4)if(d[i+3]>30&&d[i+2]>d[i]*1.15&&d[i+2]>d[i+1]*.94){const light=Math.max(d[i],d[i+1],d[i+2])/255;d[i]=245*light;d[i+1]=184*light;d[i+2]=45*light;}cx.putImageData(data,0,0);images.gold=c;api.carsReady=true;
 });
 api.spriteRects=()=>rects.map(r=>({...r}));
 function curve(travel){return .28+.24*Math.sin(travel*.26);}
 function road(w,h,z,bend){return {x:w*.5-bend*w*.30*(1-z)**3,y:h*.36+h*.64*z*z,half:w*(.18+1.02*z*z)};}
 api.road=road;
 api.groundWorld=(z,travel)=>4/(z*z+.02)+travel*25;
 function visibleLead(gap){const sign=Math.sign(gap),amount=Math.abs(gap);if(!sign||amount<.18)return 0;return sign*Math.max(.14,Math.tanh(amount/2.35));}
 api.visibleLead=visibleLead;
 function layout(w,h,gap,bend=0){const lead=visibleLead(gap),base=Math.min(w*.30,h*.43,320);return [false,true].map(gold=>{const z=.83+(gold?1:-1)*lead*.145,r=road(w,h,z,bend);return{gold,z,x:r.x+(gold?-1:1)*r.half*.25,y:r.y,size:base*(z/.83)**2,trackLeft:r.x-r.half,trackRight:r.x+r.half};});}
 api.layout=layout;
 function poly(ctx,points,fill){ctx.fillStyle=fill;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
 function track(s,bend){const {ctx,w,h,travel}=s,bg=images.track,H=h*.36;
  // Only sky and distant grandstands come from the photograph. No baked-in road or fence.
  if(ready(bg)){const sourceH=bg.naturalHeight*.42,dw=Math.max(w,H*bg.naturalWidth/sourceH)*1.05;ctx.drawImage(bg,0,0,bg.naturalWidth,sourceH,(w-dw)/2-bend*w*.025,0,dw,H+1);}else{const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#5ea5c7');sky.addColorStop(1,'#edd0a0');ctx.fillStyle=sky;ctx.fillRect(0,0,w,H);}
  const soil=ctx.createLinearGradient(0,H,0,h);soil.addColorStop(0,'#b97d55');soil.addColorStop(.3,'#a86b44');soil.addColorStop(1,'#81452f');ctx.fillStyle=soil;ctx.fillRect(0,H,w,h-H);
  const tex=images.clay;if(tex){ctx.save();ctx.globalAlpha=.54;for(let i=0;i<128;i++){const z0=i/128,z1=(i+1)/128,z=(z0+z1)/2,a=road(w,h,z0,bend),b=road(w,h,z1,bend),sy=mod(api.groundWorld(z,travel)*35,1024),sh=clamp((api.groundWorld(z0,0)-api.groundWorld(z1,0))*35,1,80),first=Math.min(sh,1024-sy),sw=1024/(1+z*.55),sx=(1024-sw)/2;ctx.drawImage(tex,sx,sy,sw,first,0,a.y,w,(b.y-a.y+.7)*first/sh);if(first<sh)ctx.drawImage(tex,sx,0,sw,sh-first,0,a.y+(b.y-a.y)*first/sh,w,(b.y-a.y+.7)*(sh-first)/sh);}ctx.restore();}
  // Rubbered-in racing lines follow exactly the same projection as the cars.
  for(let j=0;j<9;j++){ctx.beginPath();for(let i=0;i<=64;i++){const z=i/64,r=road(w,h,z,bend),x=r.x+(j/8-.5)*r.half*1.2;i?ctx.lineTo(x,r.y):ctx.moveTo(x,r.y);}ctx.strokeStyle=j%3?'#4b302126':'#e1a26e21';ctx.lineWidth=1+j*.2;ctx.stroke();}
  const grass=ctx.createLinearGradient(0,H,0,h);grass.addColorStop(0,'#7c8453');grass.addColorStop(1,'#54643a');
  for(let i=0;i<64;i++){const z0=i/64,z1=(i+1)/64,a=road(w,h,z0,bend),b=road(w,h,z1,bend);poly(ctx,[{x:0,y:a.y},{x:a.x-a.half,y:a.y},{x:b.x-b.half,y:b.y},{x:0,y:b.y}],grass);}
  // Fine grass texture and a soft dirt shoulder, never floating curb discs.
  for(let i=0;i<120;i++){const z=mod(i*.618033+travel*.13,1),r=road(w,h,z,bend),edge=r.x-r.half;if(edge<=0)continue;const x=mod(i*.381966,1)*edge;ctx.strokeStyle=i%2?'#cad08c38':'#253e2738';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,r.y);ctx.lineTo(x+2*z,r.y-3*z);ctx.stroke();}
  for(let side=-1;side<=1;side+=2){ctx.beginPath();for(let i=0;i<=64;i++){const z=i/64,r=road(w,h,z,bend),x=r.x+side*r.half;i?ctx.lineTo(x,r.y):ctx.moveTo(x,r.y);}ctx.strokeStyle=side<0?'#d5a67588':'#68482d77';ctx.lineWidth=2;ctx.stroke();}
  // The outside wall is at +1 road width. Both car lanes remain well inside it.
  for(let i=0;i<64;i++){const z0=i/64,z1=(i+1)/64,a=road(w,h,z0,bend),b=road(w,h,z1,bend),xa=a.x+a.half,xb=b.x+b.half,ha=h*.075*z0*z0,hb=h*.075*z1*z1;const section=Math.floor(7/(z0+.08)+travel*14);poly(ctx,[{x:xa,y:a.y},{x:xb,y:b.y},{x:xb,y:b.y-hb},{x:xa,y:a.y-ha}],'#e7d7ba');poly(ctx,[{x:xa,y:a.y-ha},{x:xb,y:b.y-hb},{x:xb+3*z1,y:b.y-hb-2*z1},{x:xa+3*z0,y:a.y-ha-2*z0}],'#f3e4cb');}
  for(let i=0;i<26;i++){const distance=mod(i*12-travel*25,312)+5,z0=Math.sqrt(4/(distance+4)),z1=Math.sqrt(4/distance),a=road(w,h,z0,bend),b=road(w,h,z1,bend);poly(ctx,[{x:a.x+a.half,y:a.y},{x:b.x+b.half,y:b.y},{x:b.x+b.half,y:b.y-h*.075*z1*z1},{x:a.x+a.half,y:a.y-h*.075*z0*z0}],'#b55d43');}
  // Posts are sampled in world distance, so they approach smoothly instead of popping upward.
  for(let i=0;i<34;i++){const distance=mod(i*7-travel*25,238)+4,z=Math.sqrt(4/distance);if(z>1)continue;const r=road(w,h,z,bend),x=r.x+r.half,base=r.y-h*.075*z*z,top=base-h*.17*z*z;if(x>w+20)continue;ctx.strokeStyle='#615d4ddd';ctx.lineWidth=.5+z*2;ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,top);ctx.stroke();}
  for(let row=1;row<=5;row++){ctx.beginPath();for(let i=0;i<=64;i++){const z=i/64,r=road(w,h,z,bend),x=r.x+r.half,y=r.y-h*(.075+row*.034)*z*z;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle='#625d4f66';ctx.lineWidth=.6;ctx.stroke();}
  // Fast ground detail streams toward the camera, with no forward motion while paused.
  for(let i=0;i<140;i++){const distance=mod(i*1.73-travel*25,180)+4,z=Math.sqrt(4/distance);if(z>1)continue;const r=road(w,h,z,bend),u=Math.sin(i*17.3)*.92,x=r.x+u*r.half,end=road(w,h,Math.min(1,z+.008+z*.017),bend);ctx.strokeStyle=i%2?'#e3b57e55':'#4c2e2144';ctx.lineWidth=.5+z;ctx.beginPath();ctx.moveTo(x,r.y);ctx.lineTo(end.x+u*end.half,end.y);ctx.stroke();}
  const haze=ctx.createLinearGradient(0,H,0,H+h*.15);haze.addColorStop(0,'#dfbe8b66');haze.addColorStop(1,'#dca57100');ctx.fillStyle=haze;ctx.fillRect(0,H,w,h*.15);
 }
 function dust(s,c,bend){if(!['racing','finish'].includes(s.mode))return;const {ctx,time}=s,boost=!c.gold&&s.race?.boost>0;ctx.save();for(let j=0;j<(s.reduced?6:30);j++){const t=mod(time*(boost?1.7:1.2)+j*.137+(c.gold?.3:0),1),side=j%2?1:-1,x=c.x+side*c.size*(.27+t*.25)+t*bend*c.size*.3,y=c.y+c.size*t*.56,r=c.size*(.025+t*.095);ctx.globalAlpha=(1-t)*.14;ctx.fillStyle=j%3?'#d6ab7f':'#e3c39b';ctx.beginPath();ctx.ellipse(x,y,r*1.6,r*.7,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
 // Rear-facing wheels show their tread, not a flat spinning hub. Scroll the
 // original tyre texture inside the tyre footprint and roll its cross grooves.
 // The phase follows travelled distance, so pausing freezes it naturally.
 api.wheelPhase=(travel,gold=false)=>mod(travel*2.8+(gold?.21:0),1);
 function wheels(s,c,dw,dh,rect,custom){
  const {ctx,gear}=s,running=['racing','finish'].includes(s.mode)&&!s.reduced,phase=running?api.wheelPhase(s.travel||0,c.gold):0;
  const model=custom?({rally:[.38,.075,.18],buggy:[.37,.15,.25],stock:[.39,.055,.17],rocket:[.39,.10,.20]}[gear?.model]||[.37,.15,.25]):null;
  for(const side of [-1,1]){
   const width=custom?model[1]*c.size:dw*.275,height=custom?model[2]*c.size:dh*.395,x=custom?side*model[0]*c.size:side*dw*.35,y=custom?-height*.52:-dh*.205;
   ctx.save();ctx.beginPath();ctx.ellipse(x,y,width*.5,height*.5,side*-.045,0,Math.PI*2);ctx.clip();
   if(!custom&&running){const sx=rect.x+rect.w*(side<0?.01:.715),sy=rect.y+rect.h*.60,sw=rect.w*.275,sh=rect.h*.395,first=sh*(1-phase),top=y-height*.5;ctx.drawImage(c.gold?images.gold:images.cars,sx,sy+sh*phase,sw,first,x-width*.5,top,width,height*(1-phase));if(phase>0)ctx.drawImage(c.gold?images.gold:images.cars,sx,sy,sw,sh*phase,x-width*.5,top+height*(1-phase),width,height*phase);}
   // Stronger, curved cross tread remains visible at phone resolution and on
   // every store vehicle. It does not repaint the body or change the silhouette.
    if(running)for(let k=-1;k<10;k++){const yy=y-height*.5+(k+phase)*height/7,alternating=(k&1)===0;ctx.strokeStyle=alternating?'#17110ddd':'#43362cdd';ctx.lineWidth=Math.max(1.4,width*.075);ctx.beginPath();ctx.moveTo(x-width*.54,yy);ctx.quadraticCurveTo(x,yy-height*.055,x+width*.54,yy+height*.025);ctx.stroke();ctx.strokeStyle=alternating?'#e5c696a8':'#b8976e88';ctx.lineWidth=Math.max(.8,width*.028);ctx.beginPath();ctx.moveTo(x-width*.50,yy+height*.035);ctx.lineTo(x+width*.50,yy+height*.06);ctx.stroke();}
    if(running){const markerY=y-height*.36+phase*height*.72,marker=ctx.createLinearGradient(x-width*.45,markerY,x+width*.45,markerY);marker.addColorStop(0,'#fff2c000');marker.addColorStop(.5,'#fff0bdc7');marker.addColorStop(1,'#fff2c000');ctx.strokeStyle=marker;ctx.lineWidth=Math.max(1,width*.035);ctx.beginPath();ctx.moveTo(x-width*.45,markerY);ctx.lineTo(x+width*.45,markerY+height*.03);ctx.stroke();}
   const shade=ctx.createLinearGradient(x-width*.5,y,x+width*.5,y);shade.addColorStop(0,'#130e0a70');shade.addColorStop(.35,'#f2dfbc09');shade.addColorStop(.65,'#ffffff05');shade.addColorStop(1,'#130e0a70');ctx.fillStyle=shade;ctx.fillRect(x-width*.5,y-height*.5,width,height);ctx.restore();
   if(running&&!s.paused&&!s.reduced){const contactY=y+height*.48,pulse=.45+.35*Math.sin(phase*Math.PI*2);ctx.globalAlpha=pulse;ctx.fillStyle='#d5a477';ctx.beginPath();ctx.ellipse(x,c.gold?contactY:contactY+1,width*.52,height*.08,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
   }
  if(s.canvas){s.canvas.dataset[c.gold?'paceWheelPhase':'wheelPhase']=phase.toFixed(3);if(!c.gold){s.canvas.dataset.wheels=s.paused?'paused':running?'rolling':'still';s.canvas.dataset.wheelGear=custom?'equipped':'stock';s.canvas.dataset.wheelCues='tread-highlight-contact';s.canvas.dataset.wheelContact=(.45+.35*Math.sin(phase*Math.PI*2)).toFixed(3);}}
 }
 function car(s,c,bend){const {ctx,time,gear}=s,drift=bend>.4,frame=0,rect=rects[frame];
  if(!api.carsReady){s.legacyDrawCar(c.x,c.y,c.size,c.gold,-bend);return;}
  ctx.save();ctx.translate(c.x,c.y+(s.reduced?0:(Math.sin(time*12+(c.gold?2:0))*.6+Math.sin(time*23)*.2)*c.size*.003));ctx.rotate(s.reduced?0:-bend*.16+(c.gold?-.008:.008));ctx.fillStyle='#24170eb3';ctx.beginPath();ctx.ellipse(0,2,c.size*.39,c.size*.075,0,0,Math.PI*2);ctx.fill();
  const scale=Math.min(c.size/rect.w,c.size*1.10/rect.h),dw=rect.w*scale,dh=rect.h*scale;let custom=false;
  if(!c.gold&&gear?.atlas&&window.ArcadeArt)custom=window.ArcadeArt.draw(ctx,'sprint',images.cars,false,0,0,0,1,1,-c.size/2,-c.size*1.1,c.size,c.size*1.1,gear);
  if(!custom)ctx.drawImage(c.gold?images.gold:images.cars,rect.x,rect.y,rect.w,rect.h,-dw/2,-dh,dw,dh);
  wheels(s,c,dw,dh,rect,custom);
  if(!c.gold&&s.race?.boost>0){ctx.globalCompositeOperation='screen';for(const side of [-1,1]){const x=side*c.size*.13,y=-c.size*.06,g=ctx.createLinearGradient(x,y,x,y+c.size*.5);g.addColorStop(0,'#fff4a7');g.addColorStop(.25,'#ffa52a');g.addColorStop(1,'#ff5b0a00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-c.size*.035,y);ctx.quadraticCurveTo(x+c.size*.05,y+c.size*.23,x,y+c.size*(.43+Math.sin(time*39)*.04));ctx.lineTo(x+c.size*.035,y);ctx.fill();}ctx.globalCompositeOperation='source-over';}
  if(!c.gold&&gear?.trim?.id?.endsWith('neon')){ctx.strokeStyle=gear.trim.color;ctx.shadowColor=gear.trim.color;ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(0,-c.size*.10,c.size*.36,c.size*.09,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}ctx.restore();
  const text=c.gold?'GOLD PACE':'YOU',font=clamp(s.w*.01,8,11),y=c.y-dh-13;ctx.font='900 '+font+'px system-ui';ctx.textAlign='center';const lw=ctx.measureText(text).width+18;ctx.fillStyle=c.gold?'#edbf50':'#132e3be8';ctx.beginPath();(ctx.roundRect||ctx.rect).call(ctx,c.x-lw/2,y-font,lw,font+9,7);ctx.fill();ctx.fillStyle=c.gold?'#3d2e15':'#fff4d0';ctx.fillText(text,c.x,y+2);
 }
 function rewards(s){const {ctx,w,h}=s;for(const f of s.sparks){if(!s.paused){f.life-=s.dt;f.x+=f.vx*s.dt;f.y+=f.vy*s.dt;}if(f.life<=0)continue;const t=clamp(1-f.life/1.1,0,1),ease=t*t*(3-2*t);ctx.save();ctx.globalAlpha=clamp(f.life,0,1);if(f.coin){const x=w*.7+(210-w*.7)*ease+Math.sin(f.vx+t*5)*20,y=h*.73+(35-h*.73)*ease-Math.sin(t*Math.PI)*50;ctx.translate(x,y);ctx.scale(.4+.6*Math.abs(Math.cos(t*8+f.vx)),1);ctx.shadowColor='#ffc83d';ctx.shadowBlur=10;ctx.fillStyle='#ffd554';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1a6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.stroke();}else{ctx.fillStyle='#ffe2a1';ctx.fillRect(f.x,f.y,2,2);}ctx.restore();}}
 api.draw=s=>{if(s.w<1||s.h<1)return false;const v=s.reduced?{...s,time:0,travel:0}:s,bend=curve(v.travel),cars=layout(s.w,s.h,s.visualGap,bend).sort((a,b)=>a.y-b.y);s.ctx.save();track(v,bend);for(const c of cars){dust(v,c,bend);car(v,c,bend);}rewards(s);if(s.race?.boost>0&&!s.reduced){const g=s.ctx.createRadialGradient(s.w*.5,s.h*.6,s.w*.2,s.w*.5,s.h*.5,s.w*.8);g.addColorStop(0,'#ffad1900');g.addColorStop(1,'#ffa32635');s.ctx.fillStyle=g;s.ctx.fillRect(0,0,s.w,s.h);}s.ctx.restore();if(s.canvas){s.canvas.dataset.renderer='dirt-cinema';s.canvas.dataset.cars='2';s.canvas.dataset.art=api.carsReady?'generated':'compatible';}return true;};
})();
