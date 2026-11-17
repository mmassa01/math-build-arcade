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
assert.match(index,/id="explainerAudio"[^>]+explainer\/fluency-arcade-podcast\.mp3\?v=explainer-16/);
assert.match(index,/explainer\.js\?v=explainer-17/);
assert.match(index,/explainer\.css\?v=explainer-14/);
assert.match(index,/id="explainerStageNext"/);
assert.match(index,/id="explainerSeek"[^>]+max="533\.856"/);
assert.match(index,/id="explainerDuration">08:54/);
assert.doesNotMatch(index,/15:09|909\.072/);
assert.ok(fs.statSync(audio).size>10_000_000,'podcast audio should be the complete episode');

for(const name of ['Horse Race','Wave Riders Ignition','Skyrail Subway Run','Dirt Track Championship','Castle in the Clouds','Seed of Genius','Neon Auto Shop','Ping-Pong Rally','Star Defenders','Dragon Sky Quest','What should I teach next?','What does Maya need?','A district view of growth']){
  assert.ok(script.includes(name),'missing tour chapter: '+name);
}
const gameRoutes=['races/horse.html','wave/index.html','races/subway.html','dirt/index.html','castle/index.html','seed/index.html','hangar/index.html','pong/index.html','invaders/index.html','dragon/index.html'];
for(const route of [...gameRoutes,'educators/','district.html']){
  assert.ok(script.includes(route),'missing tour route: '+route);
}
for(const route of gameRoutes.filter(route=>!['races/horse.html','seed/index.html','dragon/index.html','races/subway.html'].includes(route))){
  assert.equal(script.split(route).length-1,1,'gameplay route should appear once in the tour: '+route);
}
assert.equal(script.split('races/horse.html').length-1,3,'Horse Race appears in the montage and twice at the close so its result screen does not linger');
assert.equal(script.split('seed/index.html').length-1,2,'Seed appears twice because both gameplay and growth footage are shown');
assert.equal(script.split('dragon/index.html').length-1,2,'Dragon replaces the long middle Horse Race stretch');
assert.equal(script.split('races/subway.html').length-1,2,'Subway shares the middle measurement explanation');
assert.match(script,/command:'demo'/);
assert.match(script,/command:'video'/);
assert.match(script,/title:'What should I teach next\?'[^\n]+focus:'#teachTitle'[^\n]+transition:'fade'/);
assert.match(script,/title:'What does Maya need\?'[^\n]+focus:'#studentTitle'[^\n]+transition:'fade'/);
assert.match(script,/target\.closest\('\.card'\)/);
assert.match(script,/doc\.querySelector\('\.sampleLabel'\)/);
assert.match(script,/frame\.contentWindow\.scrollTo/);
assert.match(script,/focusScene\(focus,activeStage\)/);
assert.match(script,/at:122[^\n]+wave\/index\.html[^\n]+command:'demo'[^\n]+transition:'fade'[^\n]+continuation:true/);
assert.match(script,/at:127[^\n]+castle\/index\.html[^\n]+command:'demo'[^\n]+transition:'fade'[^\n]+continuation:true/);
assert.match(script,/at:131[^\n]+hangar\/index\.html[^\n]+command:'demo'[^\n]+transition:'fade'[^\n]+continuation:true/);
assert.match(script,/at:136[^\n]+invaders\/index\.html[^\n]+command:'demo'[^\n]+transition:'fade'[^\n]+continuation:true/);
assert.match(script,/at:169[^\n]+dragon\/index\.html[^\n]+command:'demo'[^\n]+transition:'fade'/);
assert.match(script,/at:198[^\n]+races\/subway\.html[^\n]+command:'demo'[^\n]+transition:'fade'/);
assert.match(script,/at:474[^\n]+races\/horse\.html[^\n]+command:'demo'[^\n]+transition:'fade'/);
assert.match(script,/at:485[^\n]+races\/horse\.html[^\n]+command:'demo'[^\n]+continuation:true/);
assert.match(script,/at:527[^\n]+tourStage=1[^\n]+continuation:true/);
assert.match(script,/chapterCount=scenes\.reduce/);
assert.match(script,/chapterFor\(index\)/);
assert.match(script,/params\.get\('tourStage'\)==='1'/);
assert.match(script,/audio\.play\(\)/);
assert.match(script,/audio\.pause\(\)/);
assert.match(script,/if\(frameReady\(standbyStage\)\)finishStageLoad\(token,standbyStage\)/);
assert.match(script,/else loading\.hidden=true/);
assert.match(script,/function settleTransition\(\)/);
assert.match(script,/function runCommand\(command,frame=activeStage\)/);
assert.match(script,/postMessage\(\{type:'arcade-command',action:command\}/);
assert.match(script,/event\.data\.type!=='arcade-ready'/);
assert.match(script,/pendingReadyPrime\(\)/);
assert.match(script,/stagePrimeTimer=setTimeout\(prime,500\)/);
assert.match(script,/stageRevealTimer=setTimeout\(reveal,600\)/);
assert.match(script,/stageRevealTimer=setTimeout\(reveal,1100\)/);
assert.match(script,/transition==='fade'/);
assert.match(script,/prefers-reduced-motion: reduce/);
assert.match(script,/audio\.duration\|\|533\.856/);
assert.match(script,/duration\.textContent=format\(Math\.ceil\(total\)\)/);
assert.match(script,/location\.hostname==='127\.0\.0\.1'/);
assert.match(script,/params\.has\('tourScene'\)/);
assert.match(index,/Live demos, fictional reports, no progress saved/);
assert.match(style,/100dvh/);
assert.match(style,/@media\(max-width:700px\)/);
assert.match(style,/@media\(max-height:560px\) and \(orientation:landscape\)/);
assert.match(style,/\.explainerStage\.is-incoming/);
assert.match(style,/\.explainerStage\.is-preparing/);
assert.match(style,/explainerFadeIn \.65s/);
assert.match(style,/@keyframes explainerFadeIn/);

console.log('Explainer tour is wired to authentic demos, fictional reports, persistent audio, and responsive controls.');
