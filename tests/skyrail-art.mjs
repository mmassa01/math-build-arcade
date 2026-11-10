import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/store/vendor/three.module.min.js';
import {SkyrailScene} from '../dist/subway/skyrail-3d.mjs';
import {createRunner,poseRunner} from '../dist/subway/models.mjs';

globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
const view=Object.create(SkyrailScene.prototype);view.scene=new T.Scene();view.buildWorld();
view.scene.updateMatrixWorld(true);
assert.equal(view.city.length,28);
for(const building of view.city){
 const wallBounds=new T.Box3().setFromObject(building.wall);
 assert.equal(wallBounds.min.y,view.cityGroundTop,'every facade rests on the continuous city foundation');
 const uv=building.wall.geometry.attributes.uv;for(const n of uv.array)assert(n>=0&&n<=1,'building uses normalized UVs for the generated facade atlas');
}
const ground=view.scene.getObjectByName('grounded-city');assert(ground);
const bounds=new T.Box3().setFromObject(ground);assert(bounds.min.z<-100&&bounds.max.z>500,'city land covers the whole recycling range');
for(const station of view.stations)station.traverse(o=>{if(o.geometry?.type==='PlaneGeometry'){assert(o.geometry.parameters.width<=3,'station signs stay out of the central view');assert(o.position.y>7);}});
// Exercise asynchronous atlas binding without requiring a GPU or network.
const original=T.TextureLoader.prototype.load;let requested;
T.TextureLoader.prototype.load=function(url,ready){requested=url;ready(new T.Texture());};
view.renderer={capabilities:{getMaxAnisotropy:()=>8}};view.loadCityArt();T.TextureLoader.prototype.load=original;
assert(requested.endsWith('/art/harbor-facades-v1.webp'));assert(view.cityArtLoaded);
for(const b of view.city){assert(b.wall.material.map);assert.equal(b.wall.material.map.repeat.x,1/3);assert.equal(b.wall.material.map.repeat.y,b.floors/4);}
const retained=view.city[0].wall.material;
T.TextureLoader.prototype.load=function(url,ready,progress,failed){failed(new Error('offline'));};
assert.doesNotThrow(()=>view.loadCityArt());assert.equal(view.cityArtLoaded,false);assert.equal(view.city[0].wall.material,retained,'failed downloads do not block or erase the scene');T.TextureLoader.prototype.load=original;
assert(fs.statSync('dist/subway/art/harbor-facades-v1.webp').size>10000);
const runner=createRunner();assert(runner.userData.limbs[0].hip.children.some(o=>o.geometry?.type==='CapsuleGeometry'));
poseRunner(runner,1,{jump:true});assert.equal(runner.userData.limbs[0].hip.rotation.x,-.65,'movement pivots and jump pose are preserved');
console.log('PASS Skyrail art: grounded city, normalized facade UVs, generated atlas loading, small raised signs, rounded runner with original motion.');
