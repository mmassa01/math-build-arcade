const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const prefix=fs.readFileSync('tests/timed-rounds.cjs','utf8').split('(async()=>')[0],scope={require,console};
vm.createContext(scope);vm.runInContext(prefix+';this.makeHarness=harness;',scope);

(async()=>{
 for(const name of ['dirt','wave']){
  const good=scope.makeHarness(name);good.start(120);good.run('count=0;loop(1);frame=1;answer(race.question.answer)');good.step(.75);
  assert(good.run('visualGap')>.85,name+' catches up a correct-answer presentation after a 750ms frame');
  const bad=scope.makeHarness(name);bad.start(120);bad.run('count=0;loop(1);frame=1;answer(race.question.answer+100)');bad.step(.75);
  assert(bad.run('visualGap')<-.55,name+' catches up a wrong-answer presentation after a 750ms frame');
  const firstSession=good.run('session');good.run('particles.push({life:1});sparks.push({life:1});start(false)');
  assert.notEqual(good.run('session'),firstSession,name+' creates a fresh repeated-session id');
  assert.equal(JSON.stringify(good.run('[visualGap,responseMomentum,travel,particles.length,sparks.length,race.correct]')),JSON.stringify([0,0,0,0,0,0]),name+' restart clears presentation and transient state');
 }

 const horse=scope.makeHarness('horse');await new Promise(setImmediate);horse.start(120);horse.step(.01);horse.answer();horse.step(.75);
 assert(horse.scope.HorsePacePresentation().gap>.85,'horse catches up a correct-answer presentation after a 750ms frame');

 horse.start(120);horse.run('var cardShows=0;var countedShow=showItem;showItem=function(...args){cardShows++;return countedShow(...args)}');
 horse.answer();horse.node('horsePause').onclick();horse.node('horsePause').onclick();
 assert.equal(horse.run('cardShows'),1,'resume during feedback advances to the next card once');
 horse.flush();assert.equal(horse.run('cardShows'),1,'stale feedback callback cannot redraw the active card');

 const rewardsBeforeDemo=horse.messages.filter(m=>m.type==='arcade-reward').length;
 horse.events.message({origin:'https://test',source:horse.scope.parent,data:{type:'arcade-command',action:'demo'}});
 horse.run('K.R.start=performance.now()-5000;answer(K.R.items[K.R.i].answer)');
 assert.equal(horse.run('K.R.res.at(-1).status'),'correct','demo render stall does not create an accidental timeout');
 assert.equal(horse.messages.filter(m=>m.type==='arcade-reward').length,rewardsBeforeDemo,'demo stall does not add a saved reward');
 horse.start(120);horse.run('K.R.start=performance.now()-5000;answer(K.R.items[K.R.i].answer)');
 assert.equal(horse.run('K.R.res.at(-1).status'),'incorrect','real play keeps the three-second deadline after a stall');

 const horseHtml=fs.readFileSync('dist/races/horse.html','utf8'),horseJs=fs.readFileSync('dist/races/horse-standalone.js','utf8'),raceJs=fs.readFileSync('dist/dirt/game.js','utf8');
 assert.match(horseHtml,/@media\(max-height:500px\) and \(min-width:601px\)/,'horse has a short-landscape layout');
 assert.match(horseHtml,/\.race-stage \.track2\{height:210px!important;min-height:150px!important;max-height:210px!important/,'short landscape caps the track and reserves room for the answer dock');
 assert.match(horseHtml,/\.race-stage \.qcard\{min-height:96px!important/,'short landscape keeps the full answer dock in view');
 assert.match(horseHtml,/\.cbtn\{min-height:44px/,'short-landscape answer cards keep a full touch target');
 assert.match(horseJs,/Math\.abs\(latestGap\)<\.18\?'Side by side'/,'horse status changes at the same threshold as its visible lead');
 assert.equal((raceJs.match(/Math\.abs\((?:gap|race\.gap)\)<\.18/g)||[]).length,2,'Dirt and Wave status and banner match their visible lead threshold');
 console.log('PASS race hardening: low-FPS presentation catch-up, fresh restarts, Horse feedback callback guard, demo stall safety, honest real deadline, aligned labels, short-landscape cards');
})().catch(error=>{console.error(error);process.exitCode=1});
