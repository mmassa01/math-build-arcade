// The coin label drawn over a defeated rival must match what the wallet is paid.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const texts=[];const gradient=()=>({addColorStop(){}});
const ctx=new Proxy({createLinearGradient:gradient,createRadialGradient:gradient,getImageData:()=>({data:new Uint8ClampedArray(256).fill(255)}),fillText:(t)=>texts.push(String(t))},{get:(o,k)=>o[k]||(()=>{})});
const scope={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=this.naturalHeight=8}},document:{createElement:()=>({getContext:()=>ctx,width:8,height:8})},Math,WeakMap,Uint8ClampedArray};
vm.createContext(scope);vm.runInContext(fs.readFileSync('dist/dragon/cinema.js','utf8'),scope);const art=scope.window.DragonCinema;
const sprite={complete:true,naturalWidth:8,naturalHeight:8};
function labels(ring){texts.length=0;art.draw({ctx,canvas:{dataset:{}},w:390,h:500,time:3,game:{x:.5,targetX:.5,active:true,enemies:[],shots:[]},paused:false,reduced:false,dt:.016,world:sprite,dragon:sprite,equippedDragon:null,power:1,flash:0,particles:[],rings:[{x:.4,z:.4,life:1,...ring}],victoryFlight:-1});return texts.filter(t=>/^\+\d+$/.test(t))}
assert.deepEqual(labels({coins:10,power:false}),['+10']);
assert.deepEqual(labels({coins:10,power:true}),['+10'],'a power shot still shows the 10 actually paid');
assert.deepEqual(labels({coins:0,power:true}),[],'extra power-shot targets pay nothing and show no coin label');
assert.deepEqual(labels({coins:0,power:false}),[],'demo rings pay nothing and show no coin label');
const flight=fs.readFileSync('dist/dragon/flight3d.mjs','utf8'),game=fs.readFileSync('dist/dragon/game.js','utf8');
assert(!/'\+(?:25|50)'/.test(flight),'the 3D scene no longer invents +25/+50');
assert(/ring\.coins>0\?'\+'\+ring\.coins/.test(flight),'the 3D scene labels the ring with its paid amount');
assert(game.includes('power:e.power,coins:demo?0:(e.coins||0)})'),'rings carry the amount the wallet receives (none in demo)');
assert(/amount:e\.coins/.test(game),'the wallet is paid from the same event amount');
assert(game.includes("!demo&&e.coins>0?'RIVAL '+e.passed+' • +'+e.coins+' COINS'"),'the rival banner names coins only when they are paid');
console.log('PASS dragon reward label: shown coins match the 10 paid, nothing shown for unpaid targets or demo');
