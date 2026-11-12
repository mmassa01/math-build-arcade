const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const index=read('dist/index.html');
const script=read('dist/explainer.js');
const style=read('dist/explainer.css');
const audio=path.join(root,'dist/explainer/fluency-arcade-podcast.mp3');

assert.match(index,/id="openExplainer"/);
assert.match(index,/id="explainerDialog"/);
assert.match(index,/id="explainerAudio"[^>]+explainer\/fluency-arcade-podcast\.mp3/);
assert.match(index,/explainer\.js\?v=explainer-12/);
assert.match(index,/explainer\.css\?v=explainer-12/);
assert.match(index,/id="explainerStageNext"/);
assert.ok(fs.statSync(audio).size>20_000_000,'podcast audio should be the complete episode');

for(const name of ['Horse Race','Wave Riders Ignition','Skyrail Subway Run','Dirt Track Championship','Castle in the Clouds','Seed of Genius','Neon Auto Shop','Ping-Pong Rally','Star Defenders','Dragon Sky Quest','Teacher report','Student detail','District report']){
  assert.ok(script.includes(name),'missing tour chapter: '+name);
}
const gameRoutes=['races/horse.html','wave/index.html','races/subway.html','dirt/index.html','castle/index.html','seed/index.html','hangar/index.html','pong/index.html','invaders/index.html','dragon/index.html'];
for(const route of [...gameRoutes,'educators/','district.html']){
  assert.ok(script.includes(route),'missing tour route: '+route);
}
for(const route of gameRoutes.filter(route=>!['races/horse.html','seed/index.html'].includes(route))){
  assert.equal(script.split(route).length-1,1,'gameplay route should appear once in the tour: '+route);
}
assert.equal(script.split('races/horse.html').length-1,2,'Horse Race returns when the closing narration returns to Maya at Tiger Downs');
assert.equal(script.split('seed/index.html').length-1,2,'Seed appears twice because both gameplay and growth footage are shown');
assert.match(script,/action:'#demo'/);
assert.match(script,/action:'#horseDemo'/);
assert.match(script,/action:'#previewVideo'/);
assert.match(script,/title:'Student detail'[^\n]+focus:'#studentTitle'/);
assert.match(script,/target\.closest\('\.card'\)/);
assert.match(script,/doc\.querySelector\('\.sampleLabel'\)/);
assert.match(script,/frame\.contentWindow\.scrollTo/);
assert.match(script,/focusScene\(focus,activeStage\)/);
assert.match(script,/at:300[^\n]+wave\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:322[^\n]+castle\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:346[^\n]+hangar\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:370[^\n]+invaders\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:811[^\n]+races\/horse\.html[^\n]+action:'#horseDemo'[^\n]+continuation:true/);
assert.match(script,/at:900[^\n]+tourStage=1[^\n]+continuation:true/);
assert.match(script,/chapterCount=scenes\.reduce/);
assert.match(script,/chapterFor\(index\)/);
assert.match(script,/params\.get\('tourStage'\)==='1'/);
assert.match(script,/audio\.play\(\)/);
assert.match(script,/audio\.pause\(\)/);
assert.match(script,/if\(frameReady\(standbyStage\)\)finishStageLoad\(token,standbyStage\)/);
assert.match(script,/else loading\.hidden=true/);
assert.match(script,/location\.hostname==='127\.0\.0\.1'/);
assert.match(script,/params\.has\('tourScene'\)/);
assert.match(index,/Live demos, fictional reports, no progress saved/);
assert.match(style,/100dvh/);
assert.match(style,/@media\(max-width:700px\)/);
assert.match(style,/@media\(max-height:560px\) and \(orientation:landscape\)/);

console.log('Explainer tour is wired to authentic demos, fictional reports, persistent audio, and responsive controls.');
