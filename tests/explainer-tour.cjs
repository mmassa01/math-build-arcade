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
assert.match(index,/explainer\.js\?v=explainer-9/);
assert.match(index,/explainer\.css\?v=explainer-9/);
assert.match(index,/id="explainerStageNext"/);
assert.ok(fs.statSync(audio).size>20_000_000,'podcast audio should be the complete episode');

for(const name of ['Dragon Sky Quest','Skyrail Subway Run','Ping-Pong Rally','Seed of Genius','Teacher report','Student detail','District report']){
  assert.ok(script.includes(name),'missing tour chapter: '+name);
}
for(const route of ['dragon/index.html','races/subway.html','pong/index.html','seed/index.html','educators/','district.html']){
  assert.ok(script.includes(route),'missing tour route: '+route);
}
assert.match(script,/action:'#demo'/);
assert.match(script,/action:'#previewVideo'/);
assert.match(script,/at:300[^\n]+pong\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:322[^\n]+seed\/index\.html[^\n]+continuation:true/);
assert.match(script,/at:370[^\n]+races\/subway\.html[^\n]+continuation:true/);
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
