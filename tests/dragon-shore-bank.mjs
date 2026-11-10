import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {shoreHeight,coastAt,pineGeometry,forestRecords,photoShoreMaterial} from '../dist/dragon/forest-shore.mjs';
import {terrainGeometry} from '../dist/dragon/landscape-hd.mjs';
import * as T from '../dist/store/vendor/three.module.min.js';
const require=createRequire(import.meta.url),{Glide}=require('../dist/dragon/flight-motion.js');
for(let z=0;z<780;z+=13){assert(shoreHeight(0,z)<-3.4);assert(coastAt(z)>42);assert(shoreHeight(165,z)<75,'nearby shores no longer become giant folded walls');assert(Math.abs(shoreHeight(120,z)-shoreHeight(120,z+780))<1e-8);}
let previous;for(let z=0;z<780;z+=.25){const y=shoreHeight(95,z);if(previous!==undefined)assert(Math.abs(y-previous)<.5,'no high-frequency accordion ridges');previous=y;}
const trees=forestRecords();assert(trees.length>3000,'dense forest');assert(pineGeometry().attributes.uv,'needle texture coordinates, not solid cones');for(const r of trees){assert.equal(r.y,shoreHeight(r.x,r.z));assert(r.y<=35);assert(Math.abs(r.x)>coastAt(r.z));}
const m=new T.MeshBasicMaterial();photoShoreMaterial(m,{});const shader={vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <map_fragment>'};m.onBeforeCompile(shader);assert(shader.fragmentShader.includes('texture2D(map'));assert(!shader.fragmentShader.includes('sin(shorePos.x'),'no periodic rock striping');
for(const side of [-1,1]){const g=terrainGeometry(side,0);for(const n of g.attributes.position.array)assert(Number.isFinite(n));}
const glide=new Glide();let last=0,positive=0,negative=0;for(let i=0;i<1200;i++){const t=i/60,g={x:t<3?.8:t<6?.2:.5};const a=glide.update({time:t,dt:1/60,game:g});assert(Number.isFinite(a.x)&&Number.isFinite(a.roll));assert(Math.abs(a.roll)<=.43);assert(Math.abs(a.roll-last)<.05,'no roll snap');if(a.roll>.1)positive++;if(a.roll<-.1)negative++;last=a.roll;}assert(positive>20&&negative>20,'banks in both directions');const snap={x:glide.x,roll:glide.roll};glide.update({time:20,dt:1,game:{x:.1},paused:true});assert.equal(glide.x,snap.x);assert.equal(glide.roll,snap.roll);glide.update({time:21,dt:.1,game:{x:.8},reduced:true});assert.equal(glide.roll,0);
const atRate=rate=>{const p=new Glide();for(let i=0;i<rate*5;i++)p.update({time:i/rate,dt:1/rate,game:{x:.8}});return p;};const a=atRate(30),b=atRate(60);assert(Math.abs(a.x-b.x)<.025);assert(Math.abs(a.roll-b.roll)<.015);
assert(fs.readFileSync('dist/dragon/index.html','utf8').includes('flight-motion.js'));assert(fs.readFileSync('dist/dragon/game.js','utf8').includes('motion,world'));console.log('PASS natural low shore geometry, photographic surface, dense needle-textured forest, grounded foliage, smooth left/right bank, pause, reduced motion and frame-rate consistency');
