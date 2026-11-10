(()=>{
const baseURL=new URL('../',document.currentScript.src);const RaceStore={equipped:()=>window.arcadeGear||null};const cache=new Map();
function sprite(game,img,gold=false,preview=null){if(gold||img.complete===false||!img.width)return img;const skin=preview||RaceStore.equipped(game);if(!skin||skin.id.endsWith('classic'))return img;const key=skin.id+':'+(img.src||'crop:'+game);if(cache.has(key))return cache.get(key);try{const c=document.createElement('canvas');c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0);const p=cx.getImageData(0,0,c.width,c.height),d=p.data,t=skin.color.match(/\w\w/g).map(x=>parseInt(x,16));for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);if(d[i+3]<20||max-min<28)continue;const clothing=b>r*1.12&&b>g*.94;if(!clothing)continue;const light=max/255;d[i]=Math.round(t[0]*light);d[i+1]=Math.round(t[1]*light);d[i+2]=Math.round(t[2]*light)}cx.putImageData(p,0,0);cache.set(key,c);return c}catch{return img}}
function badge(game,x,y,size){const trim=RaceStore.equipped(game,'trim');if(!trim||trim.id.endsWith('none'))return;ctx.save();if(trim.id.endsWith('neon')){ctx.strokeStyle=trim.color;ctx.lineWidth=3;ctx.shadowColor=trim.color;ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(x,y-size*.30,size*.40,size*.18,0,0,Math.PI*2);ctx.stroke()}else{ctx.font='bold '+Math.max(18,size*.18)+'px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffdf61';ctx.fillText('★',x+size*.38,y-size*.50)}ctx.restore()}
const atlases=new Map();
const boundsCache=new WeakMap();
function frameBounds(art,columns,rows){
 if(boundsCache.has(art))return boundsCache.get(art);
 const width=art.naturalWidth||art.width,height=art.naturalHeight||art.height;
 const c=document.createElement('canvas');c.width=width;c.height=height;
 const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(art,0,0);
 const data=cx.getImageData(0,0,width,height).data,cw=width/columns,ch=height/rows,rects=[];
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x0=Math.floor(col*cw),y0=Math.floor(row*ch),countsX=new Uint16Array(Math.ceil(cw)),countsY=new Uint16Array(Math.ceil(ch));
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((y0+y)*width+x0+x)*4+3]>180){countsX[x]++;countsY[y]++}
  let left=0,right=countsX.length-1,top=0,bottom=countsY.length-1;
  while(left<right&&countsX[left]<4)left++;while(right>left&&countsX[right]<4)right--;
  while(top<bottom&&countsY[top]<4)top++;while(bottom>top&&countsY[bottom]<4)bottom--;
  rects.push({x:x0+left,y:y0+top,w:right-left+1,h:bottom-top+1});
 }
 boundsCache.set(art,rects);return rects;
}
function atlas(item){
 if(!item?.atlas)return null;
 if(!atlases.has(item.atlas)){
  const image=new Image(),entry={ready:false};atlases.set(item.atlas,entry);
  const fail=()=>{if(entry.ready)return;entry.failed=true;clearTimeout(timeout);window.dispatchEvent(new Event('race-art-ready'))};const timeout=setTimeout(fail,15000);image.onload=()=>{try{
   const sprite=document.createElement('canvas'),rows=item.single?1:item.game==='subway'?4:2;
   sprite.width=Math.min(1024,image.naturalWidth);
   sprite.height=Math.round(image.naturalHeight*sprite.width/image.naturalWidth/rows)*rows;
   sprite.getContext('2d').drawImage(image,0,0,sprite.width,sprite.height);
   entry.sprite=sprite;entry.ready=true;entry.failed=false;clearTimeout(timeout);window.dispatchEvent(new Event('race-art-ready'));}catch{fail()}
  };
  image.onerror=fail;
  image.src=new URL(item.atlas,baseURL).href;
 }
 const entry=atlases.get(item.atlas);return entry.ready?entry.sprite:null;
}
function draw(context,game,image,gold,frame,sx,sy,sw,sh,dx,dy,dw,dh,preview=null){
 const item=preview||RaceStore.equipped(game),art=gold?null:atlas(item);
 if(!art){if(item?.atlas&&!gold)return false;context.drawImage(sprite(game,image,gold,preview),sx,sy,sw,sh,dx,dy,dw,dh);return true}
 const columns=item.single?1:game==='subway'?4:2,rows=item.single?1:game==='subway'?4:2;
 const cw=(art.naturalWidth||art.width)/columns,ch=(art.naturalHeight||art.height)/rows;
 const col=item.single?0:game==='subway'?Math.floor(frame/3)%4:item.index%2;
 const row=item.single?0:game==='subway'?item.index:Math.floor(item.index/2);
 const rect=frameBounds(art,columns,rows)[row*columns+col];
 const scale=Math.min(dw/rect.w,dh/rect.h),width=rect.w*scale,height=rect.h*scale;
 context.drawImage(art,rect.x,rect.y,rect.w,rect.h,dx+(dw-width)/2,dy+dh-height,width,height);
 return true;
}
if(['sprint','jetski','subway'].includes(window.CONNECTED_GAME))atlas(RaceStore.equipped(window.CONNECTED_GAME));
function wheels(context,size,clock){
 const item=RaceStore.equipped('sprint');if(!item?.model)return false;if(!atlas(item))return true;
 const [offset,width,height]={rally:[.38,.075,.18],buggy:[.37,.15,.25],stock:[.39,.055,.17],rocket:[.39,.10,.20]}[item.model];
 for(const side of [-1,1]){const x=side*offset*size,y=-height*size;
  context.save();context.beginPath();(context.roundRect||context.rect).call(context,x-width*size/2,y,width*size,height*size,4);context.clip();
  context.strokeStyle='#14182066';context.lineWidth=Math.max(1,size*.009);
  for(let i=-1;i<6;i++){const ry=y+((i+clock%1)/5)*height*size;context.beginPath();context.moveTo(x-width*size/2,ry);context.lineTo(x+width*size/2,ry+size*.015);context.stroke()}
  context.restore();
 }return true;
}
function status(item){const entry=item?.atlas&&atlases.get(item.atlas);return entry?.failed?'error':entry?.ready||!item?.atlas?'ready':'loading'}
const activeGame=window.CONNECTED_GAME;
if(['sprint','jetski','subway'].includes(activeGame)){
 const item=RaceStore.equipped(activeGame),arena=document.querySelector('.arena');
 if(item?.atlas&&arena){
  const label=document.createElement('div');label.setAttribute('role','status');label.style.cssText='position:absolute;inset:0;display:grid;place-items:center;background:#13243b99;color:white;font:bold 20px system-ui;z-index:3;pointer-events:none';arena.appendChild(label);
  const update=()=>{const state=status(item);label.textContent=state==='error'?'Racer artwork could not load. Refresh to retry.':'Loading '+item.name+'…';label.hidden=state==='ready';if(state==='ready')label.remove()};
  window.addEventListener('race-art-ready',update);update();
 }
}
window.ArcadeArt={sprite,badge,draw,atlas,wheels,status};
})();
