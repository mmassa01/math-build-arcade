const assert=require('node:assert/strict'),fs=require('node:fs');
for(const name of ['seed','castle','hangar']){
 const html=fs.readFileSync(`dist/${name}/index.html`,'utf8');
 assert(html.includes("cancelCardMotion();haltVideo();active=false"),name+' stops media when its demo is stopped');
 assert(html.includes("numberEntry?.setEnabled(false);$('answerChoices').style.visibility='hidden'"),name+' disables stale demo answers');
 assert(html.includes('.workbench.flashcard-workbench .footer .small')&&html.includes('height:40px!important;min-height:40px!important;max-height:40px!important'),name+' has phone-sized primary controls');
 assert(html.includes('.workbench.flashcard-workbench .preview{height:36px!important'),name+' has a larger phone video target');
}
const dragon=fs.readFileSync('dist/dragon/game.js','utf8'),invaders=fs.readFileSync('dist/invaders/game.js','utf8');
assert(dragon.includes("paused?'Resume flight':'Pause flight'"),'Dragon announces the current pause action');
assert(invaders.includes("paused?'Resume mission':'Pause mission'"),'Invaders announces the current pause action');
const subway=fs.readFileSync('dist/subway/style.css','utf8');
assert(subway.includes('@media(max-height:550px) and (min-width:700px)'),'Subway has a short-landscape layout');
assert(subway.includes('.settings>button,.tuning summary{height:36px;min-height:36px'),'Subway short-landscape settings controls are 36px tall');
assert(subway.includes('footer button{height:36px;min-height:36px;padding:0 10px}'),'Subway short-landscape utility controls are 36px tall');
console.log('PASS owned game hardening: demo cleanup, pause semantics, and touch controls');
