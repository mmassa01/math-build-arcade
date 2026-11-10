(function(root,factory){if(typeof module==='object')module.exports=factory();else root.DragonMotion=factory();})(typeof window==='object'?window:this,()=>{
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 class Glide{
  constructor(){this.reset();}
  reset(){this.x=0;this.roll=0;this.velocity=0;this.yaw=0;this.heave=0;this.lastTime=0;this.initialized=false;}
  update({time=0,dt=0,game,paused=false,reduced=false}={}){
   if(time<this.lastTime-.1)this.reset();this.lastTime=time;
   if(reduced){this.x=((game?.x??.5)-.5)*8;this.roll=this.yaw=this.heave=this.velocity=0;return this;}
   const destination=((game?.x??.5)-.5)*8+Math.sin(time*.52)*1.55;
   if(!this.initialized){this.x=destination;this.initialized=true;}
   if(paused)return this;let remain=clamp(dt,0,.15);
   while(remain>1e-8){const step=Math.min(remain,1/120);remain-=step;const old=this.x;this.x+=(destination-this.x)*(1-Math.exp(-step*2.5));const velocity=(this.x-old)/step;this.velocity+=(velocity-this.velocity)*(1-Math.exp(-step*5));
    const desired=clamp(-this.velocity*.18-Math.cos(time*.52)*.13,-.43,.43);this.roll+=(desired-this.roll)*(1-Math.exp(-step*3.6));this.yaw+=(-this.roll*.33-this.yaw)*(1-Math.exp(-step*2.4));
   }this.heave=Math.sin(time*.85)*.23;return this;
  }
 }
 return {Glide};
});
