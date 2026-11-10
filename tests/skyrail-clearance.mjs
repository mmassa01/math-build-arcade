import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as T from '../dist/store/vendor/three.module.min.js';
import {createRunner,poseRunner,createTrain,ROOF_HEIGHT,STATION_CLEARANCE} from '../dist/subway/models.mjs';
const require=createRequire(import.meta.url),{Engine}=require('../dist/subway/engine.js');
let maxHeight=0;
for(const dt of [.008,.033,.1,.25]){
 const engine=new Engine({random:()=>.3});engine.start('demo');let previous=engine.height;
 for(let time=0;time<160;time+=dt){engine.tick(dt);maxHeight=Math.max(maxHeight,engine.height);assert(Number.isFinite(engine.height));assert(Math.abs(engine.height-previous)<8*dt+.012,'height follows a bounded continuous jump, not a ground-to-roof teleport');previous=engine.height;
  for(const train of engine.trains)if(Math.abs(engine.lane-train.lane)<.51&&train.z>=1&&train.z-train.length<=1)assert(engine.height>=1-1e-6,'runner cannot intersect a train body below its roof');
 }
 assert.equal(engine.mastered,24,'full demo still finishes with every coin route');
}
for(const [from,to]of [[-1,1],[1,-1],[0,1],[0,-1]]){
 const engine=new Engine({random:()=>.3});engine.start();engine.trains=[];engine.lane=from;engine.targetLane=to;
 const lane=from===0?to:0;engine.spawnTrain(lane,1.18);engine.coinTrail.forEach(c=>c.lane=to);engine.answer(engine.card.answer);let previous=engine.lane;
 for(let i=0;i<500;i++){engine.tick(.008);assert(Math.abs(engine.lane-previous)<=.045,'lane motion stays eased without teleporting');previous=engine.lane;for(const train of engine.trains)if(Math.abs(engine.lane-train.lane)<.51&&train.z>=1&&train.z-train.length<=1)assert(engine.height>=1-1e-6,'swept lane transfer clears occupied roof');}
}
for(const model of ['runner','bunny','robot','dino','astro']){
 const runner=createRunner({model});let top=0;
 for(let i=0;i<120;i++){poseRunner(runner,i/60,{jump:i%2===0,bank:.5,land:i%9===0});const bounds=new T.Box3().setFromObject(runner);top=Math.max(top,bounds.max.y);}
 assert(.18+maxHeight*ROOF_HEIGHT+top<STATION_CLEARANCE-.2,model+' clears overhead beams and light bars even at maximum legal jump');
}
const trainBounds=new T.Box3().setFromObject(createTrain(0,44));assert(trainBounds.max.y<=ROOF_HEIGHT+.01,'visible rooftop fixtures do not penetrate the running plane');
console.log('PASS Skyrail clearance: no train-body penetration, continuous swept lane transfers, bounded jumps at 8/33/100/250ms, all five outfits clear station aperture, rooftop fixtures below landing plane, complete demo');
