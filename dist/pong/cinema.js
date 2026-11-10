/* Perspective table-tennis presentation. The existing match engine owns every answer and hit. */
(() => {
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
 const api=window.PongCinema={version:56,paddleStyle:'horizontal-textured',contactStyle:'squash-ring',powerBallStyle:'white-hot-compact'},art={};
 const CONTACT_Y=.91,TABLE_LENGTH=2.74,TABLE_WIDTH=1.525;
 function load(name,path,callback){const img=new Image();art[name]=img;img.onload=()=>{try{callback?.(img)}catch{api[name+'Error']=true}};img.onerror=()=>{api[name+'Error']=true};img.src=path;}
 load('arena','art/arena-v39.webp');
 function camera(w,h){
  const blend=clamp((w/h-.8)/1,0,1),cy=3.5-blend*1.3,cz=-2.6-blend*.4,dy=.76-cy,dz=1.35-cz,length=Math.hypot(dy,dz),fy=dy/length,fz=dz/length;
  const raw=(x,y,z)=>{const yy=y-cy,zz=z-cz,d=Math.max(.1,yy*fy+zz*fz);return{x:x/d,y:-(yy*fz-zz*fy)/d,depth:d};};
  const corners=[raw(-.7625,.76,0),raw(.7625,.76,0),raw(.7625,.76,2.74),raw(-.7625,.76,2.74)],ys=corners.map(p=>p.y),xs=corners.map(p=>p.x),scale=Math.min(w*.85/(Math.max(...xs)-Math.min(...xs)),h*.56/(Math.max(...ys)-Math.min(...ys))),oy=h*.56-(Math.min(...ys)+Math.max(...ys))/2*scale;
  const project=(x,y,z)=>{const p=raw(x,y,z);return{x:w/2+p.x*scale,y:oy+p.y*scale,depth:p.depth,scale:scale/p.depth};};
  return {project,scale,nearWidth:project(.7625,.76,0).x-project(-.7625,.76,0).x};
 }
 api.camera=camera;
 function contactWorld(coord=.5,side=0){return{x:(coord-.5)*TABLE_WIDTH,y:CONTACT_Y,z:side?TABLE_LENGTH:0};}
 function paddlePose(c,coord=.5,side=0){const world=contactWorld(coord,side),screen=c.project(world.x,world.y,world.z),diameter=clamp(screen.scale*.25,30,164);return{world,screen,rx:diameter*.52,ry:diameter*.24,angle:0,handleDirection:side?-1:1};}
 api.contactWorld=contactWorld;api.paddlePose=paddlePose;
 function flight(t){
  // The receiver-side bounce is at 72% of the flight, then the ball rises into the paddle.
  t=clamp(t,0,1);if(t<=.72){const u=t/.72;return .15*(1-u)+.35*Math.sin(Math.PI*u);}
  const u=(t-.72)/.28;return .55*u-.4*u*u;
 }
 api.flightHeight=flight;
 function ballWorld(match,now,pointAt){
  const m=match;
  if(m?.phase==='flight'){const p=m.progress;return{x:(lerp(m.shotFrom,m.shotTo,p)-.5)*1.525,y:.76+flight(p),z:(m.turn===1?p:1-p)*2.74,t:p};}
  if(m&&['finished','point'].includes(m.phase)&&m.lastPoint){const fall=clamp((now-pointAt)/600,0,1),far=m.lastPoint.loser===1;return{x:(m.lastPoint.x-.5)*1.525,y:.91-fall*.7,z:far?2.8+fall*.4:-.06-fall*.4,t:1};}
  return{...contactWorld(m?.paddles?.[0]??.5,0),t:0};
 }
 api.ballWorld=ballWorld;
 function trailWorld(match){
  if(match?.phase!=='flight'||match.progress<=0)return[];
  const powered=Boolean(match.shotPowered),count=powered?16:7,step=(powered?.017:.005),points=[];
  // Never clamp many samples onto the same launch point. A tail grows behind the ball.
  for(let i=1;i<=count;i++){const t=match.progress-i*step;if(t<=0)break;points.push({x:(lerp(match.shotFrom,match.shotTo,t)-.5)*TABLE_WIDTH,y:.76+flight(t),z:(match.turn===1?t:1-t)*TABLE_LENGTH,t,age:i/count});}
  return points;
 }
 api.trailWorld=trailWorld;
 function polygon(ctx,points,fill){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}}
 function line(ctx,points,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
 function background(s){
  const {ctx,w,h}=s,img=art.arena;
  if(img?.complete&&img.naturalWidth){const width=Math.max(w,h*img.naturalWidth/img.naturalHeight);ctx.drawImage(img,(w-width)/2,0,width,h);}else{const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#052e39');bg.addColorStop(.5,'#103e47');bg.addColorStop(1,'#7e493b');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}
  const shade=ctx.createRadialGradient(w*.5,h*.55,h*.12,w*.5,h*.5,Math.max(w,h)*.8);shade.addColorStop(0,'#052e3900');shade.addColorStop(1,'#00111f88');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
 }
 function table(s,c){
  const {ctx,w,h}=s,p=c.project;
  // Contact shadows, legs, cross-bracing and a layered edge keep the table anchored to the floor.
  const shadow=p(0,.02,1.35);ctx.save();ctx.globalAlpha=.45;ctx.fillStyle='#080d14';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,c.nearWidth*.57,h*.08,0,0,Math.PI*2);ctx.fill();ctx.restore();
  for(const z of [.26,2.48])for(const side of [-1,1]){
   const x=side*.62;polygon(ctx,[p(x-.035,.735,z),p(x+.035,.735,z),p(x+.055,.06,z+.04),p(x-.025,.06,z+.04)],'#16242c');line(ctx,[p(x,.10,z),p(x,.69,z)],'#596c73',2);
   const foot=p(x,.045,z+.04);ctx.fillStyle='#14212a';ctx.beginPath();ctx.ellipse(foot.x,foot.y,Math.max(2,c.nearWidth*.015),Math.max(2,c.nearWidth*.008),0,0,Math.PI*2);ctx.fill();
  }
  line(ctx,[p(-.62,.22,.26),p(.62,.22,2.48)],'#293c45',Math.max(2,c.nearWidth*.008));line(ctx,[p(.62,.22,.26),p(-.62,.22,2.48)],'#3e5055',Math.max(2,c.nearWidth*.008));
  const a=p(-.7625,.76,0),b=p(.7625,.76,0),d=p(-.7625,.76,2.74),e=p(.7625,.76,2.74),frontA=p(-.7625,.71,0),frontB=p(.7625,.71,0);
  polygon(ctx,[a,b,frontB,frontA],'#121b2b');polygon(ctx,[b,e,p(.7625,.71,2.74),frontB],'#122337');
  const paint=ctx.createLinearGradient(w*.24,a.y,w*.7,d.y);paint.addColorStop(0,'#1947ba');paint.addColorStop(.3,'#215bc5');paint.addColorStop(.75,'#123b9c');paint.addColorStop(1,'#153e9d');polygon(ctx,[a,b,e,d],paint);
  ctx.save();polygon(ctx,[a,b,e,d]);ctx.clip();
  const gloss=ctx.createRadialGradient(w*.35,h*.47,0,w*.38,h*.47,c.nearWidth*.8);gloss.addColorStop(0,'#78b4f333');gloss.addColorStop(1,'#9edbff00');ctx.fillStyle=gloss;ctx.fillRect(0,0,w,h);
  // Fine matte finish rather than a flat solid fill.
  for(let i=0;i<440;i++){const u=((i*.618033)%1-.5)*1.525,z=(i*.381966%1)*2.74,q=p(u,.761,z);ctx.fillStyle=i%2?'#b7d4ff13':'#041b591c';ctx.fillRect(q.x,q.y,.6+(i%3)*.3,.6);}
  ctx.restore();
  for(const side of [-1,1])polygon(ctx,[p(side*.7625,.762,0),p(side*(.7625-.02),.762,0),p(side*(.7625-.02),.762,2.74),p(side*.7625,.762,2.74)],'#f6f4df');
  for(const z of [0,2.74])polygon(ctx,[p(-.7625,.762,z),p(.7625,.762,z),p(.7625,.762,z+(z===0?.02:-.02)),p(-.7625,.762,z+(z===0?.02:-.02))],'#f5f2dc');
  polygon(ctx,[p(-.002,.762,0),p(.002,.762,0),p(.002,.762,2.74),p(-.002,.762,2.74)],'#d9e7f8');
  line(ctx,[frontA,frontB],'#6b859c',1.2);
 }
 function net(s,c){
  const {ctx}=s,p=c.project;
  polygon(ctx,[p(-.82,.76,1.37),p(.82,.76,1.37),p(.82,.9125,1.37),p(-.82,.9125,1.37)],'#031426aa');
  for(let i=0;i<=48;i++){const x=lerp(-.82,.82,i/48);line(ctx,[p(x,.76,1.37),p(x,.9125,1.37)],'#06101bbd',.7);}
  for(let i=0;i<=7;i++){const y=.76+i/7*.1525;line(ctx,[p(-.82,y,1.37),p(.82,y,1.37)],'#94b2be67',.65);}
  line(ctx,[p(-.83,.9125,1.37),p(.83,.9125,1.37)],'#eeeada',Math.max(2,c.nearWidth*.005));
  for(const side of [-1,1]){const x=side*.835;line(ctx,[p(x,.72,1.37),p(x,.94,1.37)],'#10202d',Math.max(4,c.nearWidth*.009));line(ctx,[p(x-.012,.73,1.37),p(x-.012,.94,1.37)],'#b9d5d2',1);}
 }
 function paddle(s,c,side){
  const {ctx,match}=s,pose=paddlePose(c,match?.paddles?.[side]??.5,side),{rx,ry,handleDirection:direction}=pose;
  ctx.save();ctx.translate(pose.screen.x,pose.screen.y);
  // Both horizontal faces share the ball's exact contact center. Only the handle points away.
  ctx.shadowColor='#04152988';ctx.shadowBlur=7;ctx.shadowOffsetY=5;
  const wood=ctx.createLinearGradient(-rx*.12,0,rx*.12,0);wood.addColorStop(0,'#684129');wood.addColorStop(.35,'#c69861');wood.addColorStop(.55,'#ead1a1');wood.addColorStop(1,'#75422b');
  ctx.fillStyle=wood;ctx.beginPath();ctx.roundRect(-rx*.115,direction>0?ry*.6:-ry-rx*.7,rx*.23,ry*.4+rx*.7,rx*.06);ctx.fill();
  ctx.fillStyle='#ddb47b';ctx.beginPath();ctx.ellipse(0,3,rx+2,ry+2,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  const rubber=ctx.createRadialGradient(-rx*.3,-ry*.5,1,0,0,rx);rubber.addColorStop(0,side?'#42505b':'#fa6d56');rubber.addColorStop(1,side?'#101b24':'#ad2636');ctx.fillStyle=rubber;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();
  // Clean material texture, not a flattened photograph with an embedded diagonal handle.
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,rx*.98,ry*.96,0,0,Math.PI*2);ctx.clip();
  const step=Math.max(3,rx*.08);ctx.fillStyle=side?'#b6c5d51c':'#4a11182a';ctx.beginPath();
  for(let row=-ry;row<=ry;row+=step)for(let col=-rx;col<=rx;col+=step){const dx=col+((Math.round((row+ry)/step)%2)*step*.5);if(dx*dx/(rx*rx)+row*row/(ry*ry)<.94){ctx.moveTo(dx+step*.16,row);ctx.arc(dx,row,step*.16,0,Math.PI*2);}}
  ctx.fill();const sheen=ctx.createLinearGradient(0,-ry,0,ry);sheen.addColorStop(0,'#ffffff30');sheen.addColorStop(.35,'#ffffff08');sheen.addColorStop(1,'#ffffff00');ctx.fillStyle=sheen;ctx.fillRect(-rx,-ry,rx*2,ry*2);ctx.restore();
  ctx.strokeStyle=side?'#8796a66e':'#ffb29b8c';ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,Math.PI,Math.PI*2);ctx.stroke();
  if(!side&&match?.charge?.[0]>=2){ctx.strokeStyle='#ffd775aa';ctx.shadowColor='#ffac3b';ctx.shadowBlur=15;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,rx+2,ry+2,0,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
 }
 function ball(s,c,b){
  const {ctx,match}=s,p=c.project,q=p(b.x,b.y,b.z),ground=p(b.x,.765,b.z),powered=Boolean(match?.shotPowered&&match.phase==='flight'),radius=clamp(q.scale*.022,3.8,13),height=b.y-.76;
  ctx.save();ctx.fillStyle='#061a354f';ctx.beginPath();ctx.ellipse(ground.x,ground.y,radius*(1.1+height),radius*.35,0,0,Math.PI*2);ctx.fill();
  if(match?.phase==='flight'&&!s.reduced){
   const points=trailWorld(match);
   for(let i=points.length-1;i>=0;i--){const w=points[i],v=p(w.x,w.y,w.z),size=radius*(powered?.84:.7)*(1-w.age*.76);ctx.globalAlpha=(1-w.age)*(powered?.64:.12);ctx.fillStyle=powered?(w.age>.68?'#ff6a24':w.age>.34?'#ffc34d':'#fff8c7'):'#f2f9ff';ctx.beginPath();ctx.arc(v.x,v.y,Math.max(.2,size),0,Math.PI*2);ctx.fill();
    if(powered&&i%4===0){ctx.globalAlpha=(1-w.age)*.68;ctx.fillStyle='#fffbe8';ctx.beginPath();ctx.arc(v.x+Math.sin(match.time*.02+i*2)*size*.42,v.y+Math.cos(match.time*.018+i)*size*.3,Math.max(.6,size*.12),0,Math.PI*2);ctx.fill();}}
   ctx.globalAlpha=1;
  }
  ctx.shadowColor=powered?'#ffb42b':'#f5fbff';ctx.shadowBlur=powered?13:3;
  if(powered){const glow=ctx.createRadialGradient(q.x,q.y,radius*.35,q.x,q.y,radius*1.9);glow.addColorStop(0,'#fffdeccc');glow.addColorStop(.42,'#ffd15f88');glow.addColorStop(.74,'#ff812b44');glow.addColorStop(1,'#ff4c0000');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(q.x,q.y,radius*1.9,0,Math.PI*2);ctx.fill();}
  const sphere=ctx.createRadialGradient(q.x-radius*.3,q.y-radius*.4,0,q.x,q.y,radius);sphere.addColorStop(0,'#ffffff');sphere.addColorStop(.5,powered?'#fffef2':'#fffdf1');sphere.addColorStop(.82,powered?'#ffd66a':'#e1e9e9');sphere.addColorStop(1,powered?'#ff8d2d':'#9baeb8');ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(q.x,q.y,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle=powered?'#fff8d9cc':'#a6b2b94f';ctx.lineWidth=powered?1.1:.6;ctx.beginPath();ctx.ellipse(q.x,q.y,radius*.6,radius*.93,match?.time*.003||0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 function impacts(s,c){
  const {ctx,match}=s;
  for(const hit of s.impacts){const world=hit.world||contactWorld(hit.position??.5,hit.side),q=c.project(world.x,world.y,world.z),fresh=clamp((hit.life-(hit.power?.72:.37))/.28,0,1);ctx.save();ctx.globalAlpha=Math.max(0,hit.life);if(fresh>0){ctx.globalAlpha=fresh*(hit.power?.82:.68);ctx.fillStyle=hit.power?'#fff2a8':'#f7fbff';ctx.beginPath();ctx.ellipse(q.x,q.y,12+fresh*8,3.2+fresh*2.4,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=Math.max(0,hit.life);ctx.strokeStyle=hit.power?'#ffce65':'#eff0cb';ctx.lineWidth=hit.power?2:1.4;ctx.beginPath();ctx.ellipse(q.x,q.y,10+(1-hit.life)*35,5+(1-hit.life)*13,0,0,Math.PI*2);ctx.stroke();ctx.restore();if(!s.paused)hit.life-=s.dt*.0015;}
  if(match?.phase==='flight'&&Math.abs(match.progress-.72)<.022){const b=ballWorld(match,s.now,s.pointAt),q=c.project(b.x,.765,b.z);ctx.strokeStyle='#ffd586aa';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(q.x,q.y,8,3,0,0,Math.PI*2);ctx.stroke();}
 }
 api.draw=s=>{
  if(s.w<1||s.h<1)return false;const c=camera(s.w,s.h),ctx=s.ctx,b=ballWorld(s.match,s.now,s.pointAt);ctx.save();background(s);table(s,c);paddle(s,c,1);
  if(b.z>=1.37)ball(s,c,b);net(s,c);if(b.z>=.12&&b.z<1.37)ball(s,c,b);paddle(s,c,0);if(b.z<.12)ball(s,c,b);impacts(s,c);ctx.restore();
  s.canvas.dataset.renderer='pingpong-cinema';s.canvas.dataset.players='1';s.canvas.dataset.art=art.arena?.complete?'generated-arena':'compatible';s.canvas.dataset.paddle=api.paddleStyle;return true;
 };
})();
