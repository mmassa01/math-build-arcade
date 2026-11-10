const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const loaded=[],draws=[],equipped=[];let fallback=0;
const gradient=()=>({addColorStop(){}});
const context=new Proxy({createLinearGradient:gradient,createRadialGradient:gradient,measureText:t=>({width:t.length*6}),getImageData:()=>({data:new Uint8ClampedArray(8*8*4).fill(255)})},{get:(o,k)=>o[k]||((...args)=>{if(['translate','scale','ellipse','arc','rect','roundRect','moveTo','lineTo','fillRect','drawImage'].includes(k)){const nums=k==='drawImage'?args.slice(1):args;assert(nums.every(Number.isFinite),k+' uses finite geometry');}if(k==='drawImage')draws.push(args);})});
const scope={window:{ArcadeArt:{draw(...args){equipped.push(args.at(-1));return true;}}},Image:class{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=8;loaded.push(this)}},document:{createElement:()=>({width:8,height:8,getContext:()=>context})},Math,Map,Uint8ClampedArray};vm.createContext(scope);vm.runInContext(fs.readFileSync('dist/wave/cinema.js','utf8'),scope);
const art=scope.window.WaveCinema,race={correct:2,boost:0},canvas={dataset:{}},spark={x:200,y:250,vx:4,vy:-40,coin:true,life:1.1};
const base={ctx:context,canvas,w:390,h:430,time:2,travel:1,turn:.4,visualGap:0,gear:null,race,mode:'racing',paused:false,reduced:false,dt:.016,bridgePhase:.5,sparks:[spark],flash:.2,stadium:loaded[0],legacyDrawCar:()=>fallback++};
assert(art.draw(base));assert.equal(fallback,2,'original artwork remains available while new art loads');
loaded.find(i=>i.src.includes('rider')).onload();loaded.find(i=>i.src.includes('ocean')).onload();assert(art.riderReady&&art.waterReady);
for(const [i,r]of art.spriteRects().entries()){const x=i%2*4,y=Math.floor(i/2)*4;assert(r.x>=x&&r.x+r.w<=x+4);assert(r.y>=y&&r.y+r.h<=y+4,'banking poses never sample across sprite-sheet rows');}
const before=JSON.stringify(race);for(const w of [350,390,768,1200])for(const h of [240,430,700])for(const gap of [-20,0,20]){
 const boats=art.layout(w,h,gap,.6);assert.equal(boats.length,2);const player=boats.find(b=>!b.gold),pace=boats.find(b=>b.gold);
 assert(Math.abs(player.x-pace.x)>(player.size+pace.size)*.49,'boat silhouettes stay in separate lanes');
 for(const b of boats){assert(b.x-b.size/2>=0);assert(b.x+b.size/2<=w);assert(b.y<=h);}
 if(gap>0)assert(player.y<pace.y,'faster answers visibly move the player ahead');if(gap<0)assert(player.y>pace.y,'pace rider visibly moves ahead when the student is slower');
 art.draw({...base,w,h,visualGap:gap,bridgePhase:Math.abs(gap)/20*1.22});
}
assert.equal(JSON.stringify(race),before,'graphics do not mutate the race engine');assert.equal(canvas.dataset.renderer,'wave-cinema');assert.equal(canvas.dataset.boats,'2');assert(draws.length>100,'water and craft use real image assets');
const exact={id:'jetski-4',name:'Neptune X',atlas:'store/ski-future.png',single:true};art.draw({...base,gear:exact});assert(equipped.includes(exact),'the original selected Neptune X is passed unchanged to its existing artwork renderer');
spark.life=.7;art.draw({...base,paused:true});assert.equal(spark.life,.7,'pause freezes coin effects');art.draw({...base,reduced:true});assert.equal(JSON.stringify(race),before);
for(const f of ['rider-poses-v38.webp','ocean-surface-v38.webp','foam-wake-v38.webp'])assert(fs.statSync('dist/wave/art/'+f).size>10000);
console.log('PASS Wave cinema: image assets, finite water/bridge geometry, separate boats, visible passing, original Neptune X, paused effects, reduced motion and unchanged race state.');
