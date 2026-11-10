/* Art-only horse race renderer. Race position, answers, timing and rewards stay with the existing game. */
(() => {
  'use strict';
  const FRAMES=8,COLS=4,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const variants=new Map(),actors=new Map();
  let sheet=null,crop=null,last=0,clock=0,distance=0,race=null,scene=null,previousCorrect=0,surge=0;
  const api=window.HorseRaceCinema={loaded:false,frames:FRAMES};
  const frameAt=phase=>Math.floor(((phase%1)+1)%1*FRAMES);
  api.frameAt=frameAt;
  // Fit the actual sprite height and its label above the lane's feet plane.
  // A minimum vw width used to cut the pace horse's head off on short stages.
  api.fitDimensions=(width,height,aspect=.64)=>{
    const phone=width<=700,ratio=Number.isFinite(aspect)&&aspect>0?aspect:.64;
    return [false,true].map(pace=>{const feet=height*(pace?(phone?.64:.65):(phone?.89:.88)),cap=Math.min(width*(pace?(phone?.44:.25):(phone?.48:.28)),pace?315:350),fitted=Math.max(1,Math.min(cap,(feet-34)/ratio));return {pace,width:fitted,height:fitted*ratio,feet,labelTop:feet-fitted*ratio*.97-18};});
  };
  function rgb(hex){return /^#[0-9a-f]{6}$/i.test(hex||'')?[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)):null;}
  // Preserve light/shadow detail when applying the student's selected coat and racing silks.
  function tintPixel(r,g,b,a,x,y,look){
    if(a<40)return [r,g,b,a];
    let target=null,light=1;
    if(r>65&&r>g*1.2&&r>b*1.45&&y>.28){target=rgb(look.coat);light=(r*.45+g*.4+b*.15)/115;}
    if(g>r*1.25&&b>r*1.2&&y<.48){target=rgb(y<.24&&look.helmet==='gold'?'#e5b83f':look.silk);light=(g*.65+b*.35)/135;}
    if(look.blanket&&r>170&&g>160&&b>125&&x>.43&&x<.59&&y>.39&&y<.62){target=rgb(look.blanket==='gold'?'#ebbf4a':look.silk);light=(r+g+b)/650;}
    if(look.wraps==='silk'&&y>.68&&r>165&&Math.abs(r-g)<35&&Math.abs(g-b)<45){target=rgb(look.silk);light=(r+g+b)/630;}
    return target?[...target.map(c=>clamp(Math.round(c*light),0,255)),a]:[r,g,b,a];
  }
  api.tintPixel=tintPixel;
  function variant(look){
    const key=JSON.stringify(look);if(variants.has(key))return variants.get(key);
    const c=document.createElement('canvas');c.width=sheet.naturalWidth;c.height=sheet.naturalHeight;
    const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(sheet,0,0);
    const pixels=cx.getImageData(0,0,c.width,c.height),p=pixels.data,cw=c.width/COLS,ch=c.height/2;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(p[i+3]<40)continue;const out=tintPixel(p[i],p[i+1],p[i+2],p[i+3],(x%cw)/cw,(y%ch)/ch,look);for(let k=0;k<3;k++)p[i+k]=out[k];}
    cx.putImageData(pixels,0,0);variants.set(key,c);if(variants.size>4)variants.delete(variants.keys().next().value);return c;
  }
  function prepare(image){
    const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(image,0,0);
    const p=cx.getImageData(0,0,c.width,c.height).data,cw=c.width/COLS,ch=c.height/2;let min=ch,max=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(p[(y*c.width+x)*4+3]>100){min=Math.min(min,y%ch);max=Math.max(max,y%ch);}
    crop={cw,ch,y:Math.max(0,min-6),h:Math.min(ch,max+7)-Math.max(0,min-6)};sheet=image;api.loaded=true;
  }
  const image=new Image();image.onload=()=>{try{prepare(image)}catch{api.error='Horse artwork could not be prepared';}};image.onerror=()=>{api.error='Horse artwork unavailable; original racer retained';};image.src='horse-art/gallop-hd-v37.webp';
  // Pair the panorama with its reflection. Every tile boundary then shares identical edge pixels.
  const course=new Image();course.onload=()=>{try{
    const tile=document.createElement('canvas');tile.width=course.naturalWidth*2;tile.height=course.naturalHeight;const cx=tile.getContext('2d');cx.drawImage(course,0,0);cx.save();cx.translate(tile.width,0);cx.scale(-1,1);cx.drawImage(course,0,0);cx.restore();
    tile.toBlob(blob=>{if(blob){api.courseUrl=URL.createObjectURL(blob);api.seamlessCourse=true;}},'image/webp',.92);
  }catch{/* The original backdrop remains available if texture preparation fails. */}};course.src='horse-art/championship-course-v37.webp';
  function lookFor(index){
    const st=stableOf(K.sid),gear=gearFor(st);
    if(index)return {coat:'#756c62',silk:'#266a91',helmet:'plain',blanket:'solid',wraps:'none'};
    return {coat:st.coat||'#B5651D',silk:st.silk||'#f2b705',helmet:gear.helmet,blanket:gear.blanket,wraps:gear.wraps};
  }
  function bind(){
    const track=document.querySelector('.track2');if(!track)return;
    track.classList.add('championship-track');
    if(!track.querySelector('.cinema-scene')){
      scene=document.createElement('div');scene.className='cinema-scene';scene.setAttribute('aria-hidden','true');scene.innerHTML='<div class="cinema-panorama"></div><div class="cinema-dirt"></div><div class="cinema-near-rail"></div><div class="cinema-distance-marker"><b>200</b><span></span></div>';
      track.prepend(scene);
      const sign=track.querySelector('.course-sign');if(sign)sign.innerHTML='TIGER DOWNS <small>THE CHAMPIONSHIP COURSE</small>';
    }
    if(!api.loaded)return;
    const box=track.getBoundingClientRect?.(),fits=api.fitDimensions(track.clientWidth||box?.width||900,track.clientHeight||box?.height||400,crop.h/crop.cw+24/640);
    for(const [index,id]of ['me','gh'].entries()){
      const runner=document.getElementById(id),svg=runner?.querySelector('svg.mascot');
      if(!runner||!svg||!svg.classList.contains('horse')){actors.delete(id);continue;}
      let actor=actors.get(id);if(actor?.runner!==runner){
        const canvas=document.createElement('canvas');canvas.className='horse-film';canvas.width=640;canvas.height=Math.ceil(640*crop.h/crop.cw)+24;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',index?'Galloping pace horse':'Your galloping racehorse');runner.append(canvas);runner.classList.add('cinema-racer');
        actor={runner,canvas,ctx:canvas.getContext('2d'),index,phase:index*.38,rate:1,key:'',frame:-1};actors.set(id,actor);
      }
      const look=lookFor(index),key=JSON.stringify(look);if(key!==actor.key){actor.art=variant(look);actor.key=key;actor.frame=-1;actor.canvas.dataset.coat=look.coat;actor.canvas.dataset.silk=look.silk;}
      runner.style.width=fits[index].width.toFixed(2)+'px';actor.canvas.dataset.fittedWidth=String(Math.round(fits[index].width));
    }
  }
  function draw(actor,frame,air){
    const {ctx,canvas}=actor,w=canvas.width,h=w*crop.h/crop.cw;ctx.clearRect(0,0,w,canvas.height);
    ctx.save();ctx.fillStyle='#352413';ctx.globalAlpha=.24;ctx.beginPath();ctx.ellipse(w*.51,h+2,w*(air?.24:.29),9,0,0,Math.PI*2);ctx.fill();ctx.restore();
    if(!reduced)for(let i=0;i<8;i++){const t=((clock*(1.6+actor.rate*.4)+i*.127)%1),x=60-t*70+(i%3)*35,y=h-2-t*t*26;ctx.fillStyle='rgba(242,202,139,'+((1-t)*.25)+')';ctx.beginPath();ctx.ellipse(x,y,4+t*12,2+t*6,0,0,Math.PI*2);ctx.fill();}
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(actor.art,(frame%COLS)*crop.cw,Math.floor(frame/COLS)*crop.ch+crop.y,crop.cw,crop.h,0,0,w,h);
    actor.canvas.dataset.frame=String(frame);actor.frame=frame;
  }
  function tick(now){
    const dt=Math.min(.05,Math.max(0,(now-last)/1000||0));last=now;
    const active=typeof K!=='undefined'&&K.stage==='race'&&K.R&&!K.R.finished;
    if(active){
      if(race!==K.R){race=K.R;clock=distance=previousCorrect=surge=0;actors.clear();}
      bind();const state=window.HorseRaceStatus?.()||{},paused=state.paused||document.hidden;
      const correct=K.R.res.filter(r=>r.status==='correct').length;
      if(correct>previousCorrect){surge=.8;previousCorrect=correct;}if(!paused){clock+=dt;surge=Math.max(0,surge-dt);}
      const lastAnswer=K.R.res.at(-1),target=lastAnswer?.status==='correct'?clamp(2.7/Math.max(.8,lastAnswer.rt||3),.85,1.35):.88;
      if(!paused&&!reduced)distance+=dt*(110+target*75);
      for(const actor of actors.values()){
        if(!paused&&!reduced){actor.rate+=((actor.index?1:target)-actor.rate)*(1-Math.exp(-dt*3));actor.phase+=dt*actor.rate/.78;}
        const frame=reduced?0:frameAt(actor.phase);if(actor.frame<0||(!paused&&!reduced))draw(actor,frame,[1,4,5].includes(frame));actor.runner.classList.toggle('cinema-surge',!actor.index&&surge>0&&!reduced);
      }
      if(scene){
        if(api.courseUrl&&scene.dataset.course!==api.courseUrl){scene.style.setProperty('--horse-course','url("'+api.courseUrl+'")');scene.dataset.course=api.courseUrl;}
        const height=scene.clientHeight||400,tile=height*(api.seamlessCourse?6:3);
        scene.querySelector('.cinema-panorama').style.backgroundPositionX=-(distance*.18%tile)+'px';scene.querySelector('.cinema-dirt').style.backgroundPositionX=-(distance%tile)+'px';
        scene.querySelector('.cinema-near-rail').style.backgroundPositionX=-(distance*1.7%180)+'px';
        const marker=scene.querySelector('.cinema-distance-marker');marker.style.left=((1-(distance%1800)/1800)*140-20)+'%';
        scene.classList.toggle('cinema-paused',paused||reduced);
      }
      const gapNode=document.querySelector('.race-skill');if(gapNode)gapNode.setAttribute('aria-live','off');
    }else actors.clear();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
