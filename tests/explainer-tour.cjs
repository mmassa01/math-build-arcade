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
assert.match(index,/id="explainerAudio"[^>]+explainer\/fluency-arcade-podcast\.mp3\?v=explainer-14/);
assert.match(index,/explainer\.js\?v=explainer-14/);
assert.match(index,/explainer\.css\?v=explainer-13/);
assert.match(index,/id="explainerStageNext"/);
assert.match(index,/id="explainerSeek"[^>]+max="524\.856"/);
assert.match(index,/id="explainerDuration">08:45/);
assert.doesNotMatch(index,/15:09|909\.072/);
assert.ok(fs.statSync(audio).size>10_000_000,'podcast audio should be the complete episode');

for(const name of ['Horse Race','Wave Riders Ignition','Skyrail Subway Run','Dirt Track Championship','Castle in the Clouds','Seed of Genius','Neon Auto Shop','Ping-Pong Rally','Star Defenders','Dragon Sky Quest','What should I teach next?','What does Maya need?','A district view of growth']){
  assert.ok(script.includes(name),'missing tour chapter: '+name);
}
const gameRoutes=['races/horse.html','wave/index.html','races/subway.html','dirt/index.html','castle/index.html','seed/index.html','hangar/index.html','pong/index.html','invaders/index.html','dragon/index.html'];
for(const route of [...gameRoutes,'educators/','district.html']){
  assert.ok(script.includes(route),'missing tour route: '+route);
}
for(const route of gameRoutes.filter(route=>!['races/horse.html','seed/index.html'].includes(route))){
  assert.equal(script.split(route).length-1,1,'gameplay route should appear once in the tour: '+route);
}
assert.equal(script.split('races/horse.html').length-1,4,'Horse Race appears in the montage, continues through the measurement explanation, and returns at the close');
assert.equal(script.split('seed/index.html').length-1,2,'Seed appears twice because both gameplay and growth footage are shown');
assert.match(script,/action:'#demo'/);
assert.match(script,/action:'#horseDemo'/);
assert.match(script,/action:'#previewVideo'/);
assert.match(script,/title:'What should I teach next\?'[^\n]+focus:'#teachTitle'[^\n]+transition:'fade'/);
assert.match(script,/title:'What does Maya need\?'[^\n]+focus:'#studentTitle'[^\n]+transition:'fade'/);
assert.match(script,/target\.closest\('\.card'\)/);
assert.match(script,/doc\.querySelector\('\.sampleLabel'\)/);
assert.match(script,/frame\.contentWindow\.scrollTo/);
assert.match(script,/focusScene\(focus,activeStage\)/);
assert.match(script,/at:117[^\n]+wave\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:121[^\n]+castle\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:124[^\n]+hangar\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:128[^\n]+invaders\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:465[^\n]+races\/horse\.html[^\n]+action:'#horseDemo'[^\n]+transition:'fade'/);
assert.match(script,/at:518[^\n]+tourStage=1[^\n]+continuation:true/);
assert.match(script,/chapterCount=scenes\.reduce/);
assert.match(script,/chapterFor\(index\)/);
assert.match(script,/params\.get\('tourStage'\)==='1'/);
assert.match(script,/audio\.play\(\)/);
assert.match(script,/audio\.pause\(\)/);
assert.match(script,/if\(frameReady\(standbyStage\)\)finishStageLoad\(token,standbyStage\)/);
assert.match(script,/else loading\.hidden=true/);
assert.match(script,/function settleTransition\(\)/);
assert.match(script,/transition==='fade'/);
assert.match(script,/prefers-reduced-motion: reduce/);
assert.match(script,/audio\.duration\|\|524\.856/);
assert.match(script,/duration\.textContent=format\(Math\.ceil\(total\)\)/);
assert.match(script,/location\.hostname==='127\.0\.0\.1'/);
assert.match(script,/params\.has\('tourScene'\)/);
assert.match(index,/Live demos, fictional reports, no progress saved/);
assert.match(style,/100dvh/);
assert.match(style,/@media\(max-width:700px\)/);
assert.match(style,/@media\(max-height:560px\) and \(orientation:landscape\)/);
assert.match(style,/\.explainerStage\.is-incoming/);
assert.match(style,/@keyframes explainerFadeIn/);

console.log('Explainer tour is wired to authentic demos, fictional reports, persistent audio, and responsive controls.');
