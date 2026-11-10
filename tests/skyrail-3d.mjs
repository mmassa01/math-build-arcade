import assert from 'node:assert/strict';
import * as T from '../dist/store/vendor/three.module.min.js';
import {createTrain,createRunner,poseRunner,worldZ,LANE_WIDTH,ROOF_HEIGHT} from '../dist/subway/models.mjs';
import fs from 'node:fs';
for(const color of [0,1,2]){
 const train=createTrain(color,44),bounds=new T.Box3().setFromObject(train);let count=0;
 train.traverse(m=>{if(!m.isMesh)return;count++;for(const value of m.geometry.attributes.position.array)assert(Number.isFinite(value));assert(m.geometry.attributes.normal);});
 assert(count<18,'batched train has a bounded draw-call budget');assert(bounds.max.y>=ROOF_HEIGHT-.1);assert(bounds.max.z>43);assert(bounds.max.x-bounds.min.x>2.5);assert(bounds.max.z-bounds.min.z>40,'train remains a full volume, not a flattened picture');
}
for(const model of ['runner','bunny','robot','dino','astro']){
 const runner=createRunner({model}),pose=runner.userData.limbs;for(let i=0;i<120;i++){poseRunner(runner,i/60,{jump:i>60,bank:.5});runner.updateMatrixWorld(true);runner.traverse(o=>{for(const n of o.matrixWorld.elements)assert(Number.isFinite(n));});}
 assert(pose.some(p=>Math.abs(p.knee.rotation.x)>1),'jointed knees bend into a jump');assert.equal(pose.length,2);
}
assert.equal(worldZ(1),0,'player crossing and train collision coordinates agree');assert(worldZ(.2)>worldZ(.8),'distant coins and trains approach toward the camera');assert.equal(LANE_WIDTH,3.5);
for(const path of ['dist/races/subway.html','dist/subway/skyrail-3d.mjs','dist/subway/models.mjs'])assert(fs.existsSync(path));
console.log('PASS Skyrail 3D: finite model geometry, solid train dimensions, bounded draw calls, five articulated runner outfits, jointed running/jumping, physical roof and depth mapping.');
