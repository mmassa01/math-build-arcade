import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shoreAlpha,panelPose,SHORE_PANELS} from '../dist/dragon/photo-shores.mjs';
for(const p of SHORE_PANELS){const a=panelPose(p,0),b=panelPose(p,20);for(const n of [a.x,a.y,a.z,a.width,a.height,b.z])assert(Number.isFinite(n));assert(Math.abs(a.z-b.z)<=14);const waterFoot=a.y+(.5-(.605-.26)/.357)*a.height;assert(Math.abs(waterFoot+3.4)<1e-6,'photographic shore sits exactly on the water plane');assert(Math.abs(p.x)-p.width/2>=10,'open lake through the middle');}
for(let i=0;i<10000;i++){const u=(i%100)/99,y=Math.floor(i/100)/99,a=shoreAlpha(u,y);assert(a>=0&&a<=1);if(u>.36&&u<.64)assert.equal(a,0);if(y<.26||y>.617)assert.equal(a,0);}
assert(shoreAlpha(.1,.55)>.95,'real forest pixels retained');assert.equal(shoreAlpha(.5,.5),0,'center stays clear');assert.equal(shoreAlpha(.1,.2),0,'sky removed');assert.equal(shoreAlpha(.1,.8),0,'photo water does not cover animated water');
// Retained v48 photo-mask utility regression. Active v49 terrain is covered by dragon-coast-world.mjs.
console.log('PASS retained photographic mask utilities: clear channel, soft masks and exact water contact');
