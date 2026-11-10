// Regression coverage for the student-playthrough review fixes.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}

test('Pong: a correct answer anywhere inside the three-second window returns the ball',()=>{
  const {Match}=require('../dist/pong/engine.js');
  for(const late of [500,1900,2500,2900]){
    let seed=late;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const match=new Match({random});
    let returns=0,guard=0;
    while(match.phase!=='finished'&&returns<12&&guard++<20000){
      if(['serve','flight'].includes(match.phase)&&match.turn===0&&!match.reply){
        if(match.elapsed>=late){assert(match.answer(0,match.question.answer).accepted!==false,'in-window answer accepted');returns++;}
      }
      match.update(10);
    }
    assert.notEqual(match.phase,'finished','answering correctly at '+late+' ms never ends the rally');
    assert(returns>=12,'rally continued at '+late+' ms');
  }
});

test('Pong: a wrong answer still ends the solo rally',()=>{
  const {Match}=require('../dist/pong/engine.js');
  const match=new Match({random:()=>.4});
  let guard=0;
  while(match.phase==='serve'&&guard++<1000){if(!match.reply)match.answer(0,match.question.answer);match.update(10);}
  guard=0;
  while(match.phase!=='finished'&&guard++<20000){
    if(match.phase==='flight'&&match.turn===0&&!match.reply)match.answer(0,match.question.answer+1);
    match.update(10);
  }
  assert.equal(match.phase,'finished');
});

test('Pong and Dragon: the "review complete" placeholder card cannot time out',()=>{
  const {Match}=require('../dist/pong/engine.js');
  const match=new Match({random:()=>.4});
  match.question={completed:true,text:'Review complete',answer:NaN};
  const before=match.phase;for(let i=0;i<500;i++)match.update(16);
  assert.equal(match.phase,before,'pong waits for the practice-complete overlay');
  assert(!match.drain().some(e=>e.timeout),'pong records no timeout on the placeholder');

  const {Flight}=require('../dist/dragon/encounters.js');
  const flight=new Flight({random:()=>.3});
  flight.question={completed:true,text:'Review complete',answer:NaN};
  for(let i=0;i<400;i++)flight.update(.016);
  assert.equal(flight.hearts,3,'dragon keeps every heart on the placeholder');
  assert(!flight.drain().some(e=>e.type==='miss'),'dragon records no miss on the placeholder');
  const normal=new Flight({random:()=>.3});normal.update(3);
  assert.equal(normal.hearts,2,'a real card still times out at three seconds');
});

test('Economy: reward ids stay bounded and duplicates are still rejected',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const economy=require('../dist/economy.js').create(storage);
  for(let i=0;i<5200;i++)assert(economy.reward(1,'session:'+i).ok);
  const state=economy.getState();
  assert.equal(state.coins,5200,'no coins are lost when the id list is trimmed');
  assert(state.rewardIds.length<=5000,'saved reward ids are bounded');
  assert.equal(economy.reward(1,'session:5199').ok,false,'recent duplicate rejected');
  assert.equal(economy.getState().coins,5200);
});

test('Pathways: a damaged check entry does not discard earned trophies',()=>{
  const factory=require('../dist/practice-pathways.js').create;
  const source=read('dist/practice-pathways.js');
  const key=source.match(/'(mathArcadePathways\.v\d+)'/)[1];
  const data=new Map([[key,JSON.stringify({version:2,pathway:'add',facts:{},checks:[null,7,'x'],trophies:{add:'2026-10-01'}})]]);
  const api=factory({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},()=>new Date(2026,10,10,12).getTime(),()=>.47);
  assert(api.progress().find(p=>p.id==='add').earned,'trophy survives the malformed entry');
});

test('Build games: the final card always reaches the finished build',()=>{
  for(const [game,end]of [['castle',29.8],['seed',19.93],['hangar',17.8]]){
    const source=read('dist/'+game+'/index.html');
    const body=source.slice(source.indexOf('function growthTime(ratio){'));
    const growthTime=new Function('total',body.slice(0,body.indexOf('\nfunction ')>0?body.indexOf('\nfunction '):body.indexOf('}function ')+1)+';return growthTime;');
    for(const total of [1,2,24,60])assert.equal(growthTime(total)(1),end,game+' completes at '+end+' with '+total+' cards');
    assert.equal(growthTime(60)(0),0);
    assert(growthTime(60)(1/60)<growthTime(60)(.5),game+' growth still progresses');
  }
});

test('Castle posts completion before the closing tour so the trophy cannot be lost',()=>{
  const castle=read('dist/castle/index.html');
  assert(castle.indexOf('arcadeFinish();await detailTour(gen)')>0);
});

test('Every game freezes when the arcade opens the Store over it',()=>{
  const shell=read('dist/arcade.js');
  assert(shell.includes("send({type:'arcade-pause'})"),'shell asks the game to pause');
  for(const file of ['dist/dragon/game.js','dist/invaders/game.js','dist/pong/game.js','dist/dirt/game.js','dist/subway/game.js','dist/races/horse-standalone.js','dist/castle/index.html','dist/seed/index.html','dist/hangar/index.html']){
    const source=read(file),at=source.indexOf("type==='arcade-pause'");
    assert(at>0,file+' handles arcade-pause');
    const guard=source.lastIndexOf('source!==parent',at);
    assert(guard>0&&at-guard<400,file+' checks the message source before pausing');
  }
});

test('Fluency check cannot keep running after its dialog is dismissed',()=>{
  const ui=read('dist/pathway-ui.js'),shell=read('dist/arcade.js');
  assert(/checkDialog'\)\.addEventListener\('close'/.test(ui),'closing the dialog ends the check');
  assert(shell.includes("d.id==='checkDialog'"),'backdrop taps use the interrupted-check path');
  assert(!/openWorld\s*=|command\s*=\s*function/.test(ui),'Play opens the game directly; the check is never forced in front of it');
  assert(ui.includes("$('checkButton').onclick=()=>intro()"),'the check still starts from its own button');
});

test('Dirt and Wave can resume after a pause during the finish sequence',()=>{
  const dirt=read('dist/dirt/game.js');
  assert(dirt.includes("if(race?.active||mode==='finish')setRacePaused(!paused)"));
  assert(!dirt.includes("$('resume').hidden=!race?.active;"));
});

test('Horse Race restarts with a visible card and survives blocked storage',()=>{
  const horse=read('dist/races/horse-standalone.js');
  assert(!horse.includes('K.R.mounted=true;nextItem();timer=setInterval('),'restart re-shows the current card');
  assert(read('dist/races/horse.html').includes('try{window.RaceStorage=localStorage}catch'));
});

test('Subway falls back to the 2D view if the 3D module cannot load',()=>{
  assert(read('dist/races/subway.html').includes("return import('../subway/game.js"));
});

test('Build games pay a correct card at answer time and post completion immediately',()=>{
  for(const game of ['castle','seed','hangar']){
    const source=read('dist/'+game+'/index.html');
    assert(source.includes('if(ok){awardMastered(card);celebrate(reward)}'),game+' pays before the card flies, so switching to Video cannot drop the coins');
    assert(!/setTimeout\([^)]*arcadeFinish\(\)/.test(source),game+' does not delay arcade-complete');
  }
});

console.log('PASS student review fixes: '+tests+' checks');
