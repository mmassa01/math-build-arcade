// Dead time between a student's answer and the next readable card cuts how many facts fit in a session.
// Drive each engine on a 60 fps simulated clock and measure answer -> next card for correct and wrong answers.
const assert=require('node:assert/strict');
const dist=require('node:path').join(__dirname,'../dist/');
const {Match}=require(dist+'pong/engine.js'),{Engine}=require(dist+'subway/engine.js'),{Game}=require(dist+'invaders/engine.js'),{Flight}=require(dist+'dragon/encounters.js');
const FRAME=1/60,BOUND=1.0,THINK=.5;
const seeded=(seed=7)=>()=>(seed=(seed*16807)%2147483647)/2147483647;
const round=x=>Math.round(x*1000)/1000;

// Generic: wait THINK seconds on a fresh card, answer, then tick until the next card is shown with a fresh window.
function gaps({make,tick,card,ready,answer,correct,wrong,count=12,pattern}){
  const game=make(),out={correct:[],wrong:[]};let guard=0;
  for(let n=0;n<count;n++){
    while(!ready(game)){tick(game,FRAME);if(++guard>1e6)throw new Error('never ready')}
    const shown=card(game);for(let t=0;t<THINK-1e-9;t+=FRAME)tick(game,FRAME);
    assert.equal(card(game),shown,'card stays put while the student is thinking');
    const right=pattern(n);answer(game,right?correct(game):wrong(game));
    let gap=0;while(!(ready(game)&&card(game)!==shown)){tick(game,FRAME);gap+=FRAME;if(gap>10)throw new Error('next card never came')}
    out[right?'correct':'wrong'].push(round(gap));
  }
  return out;
}
const alternate=n=>n%5!==4; // four correct in a row also exercises the four-coin Skyrail trail and the Pong power shot

const pong=gaps({
  make:()=>{const m=new Match({random:seeded(),continuous:true});m.answer(0,m.question.answer);return m},
  tick:(m,s)=>m.update(s*1000),card:m=>m.question,
  ready:m=>m.turn===0&&['serve','flight'].includes(m.phase)&&m.elapsed===0,
  answer:(m,v)=>m.answer(0,v),correct:m=>m.question.answer,wrong:m=>m.question.answer+1,pattern:alternate,count:15});
const subway=gaps({
  make:()=>{const e=new Engine({random:seeded()});e.start('play','mul',10,true);return e},
  tick:(e,s)=>e.tick(s),card:e=>e.card,ready:e=>e.phase==='thinking'&&e.elapsed===0,
  answer:(e,v)=>e.answer(v),correct:e=>e.card.answer,wrong:e=>e.card.answer+1,pattern:alternate,count:15});
const invaders=gaps({
  make:()=>new Game({random:seeded(),timed:true}),
  tick:(g,s)=>g.update(s),card:g=>g.question,ready:g=>!g.pending&&g.cooldown===0&&g.questionElapsed===0,
  answer:(g,v)=>g.answer(v),correct:g=>g.question.answer,wrong:g=>g.question.answer+1,pattern:alternate,count:15});
const dragon=gaps({
  make:()=>new Flight({random:seeded(),timed:true}),
  tick:(f,s)=>f.update(s),card:f=>f.question,ready:f=>!f.ready&&f.elapsed===0,
  answer:(f,v)=>f.answer(v),correct:f=>f.question.answer,wrong:f=>f.question.answer+1,pattern:alternate,count:15});

const report={pong,subway,invaders,dragon};
for(const [name,{correct,wrong}] of Object.entries(report)){
  assert(correct.length&&wrong.length,name+' measured both outcomes');
  const worstCorrect=Math.max(...correct),worstWrong=Math.max(...wrong),bestWrong=Math.min(...wrong);
  assert(worstCorrect<=BOUND+1e-9,name+' correct answer reaches the next card within '+BOUND+' s (got '+worstCorrect+')');
  assert(worstWrong<=BOUND+1e-9,name+' wrong answer reaches the next card within '+BOUND+' s (got '+worstWrong+')');
  assert(worstCorrect<=bestWrong+1e-9,name+' a correct answer never waits longer than a wrong one ('+worstCorrect+' vs '+bestWrong+')');
}

// Pong: the ball hurries only after a reply; the answer window itself is still the full 3 s.
{const m=new Match({random:()=>.4});m.answer(0,m.question.answer);while(m.turn!==0)m.update(10);
 assert.equal(m.flightSeconds,3);m.update(2900);assert.equal(m.phase,'flight','no reply: the ball still takes the whole 3-second window');assert(Math.abs(m.progress-2900/3000)<1e-9);
 const late=new Match({random:()=>.4});late.answer(0,late.question.answer);while(late.turn!==0)late.update(10);late.update(2900);const q=late.question;late.answer(0,late.question.answer);late.update(100);assert.notEqual(late.question,q,'a reply near the deadline still lands by the end of the window');
 const quick=new Match({random:()=>.4});quick.answer(0,quick.question.answer);while(quick.turn!==0)quick.update(10);quick.update(400);const p0=quick.progress;quick.answer(0,quick.question.answer);quick.update(150);assert(quick.progress>p0&&quick.progress<1,'ball visibly travels the rest of the way');assert.equal(quick.coins[0],10,'serve paid once');quick.update(200);assert.equal(quick.coins[0],20,'the return pays 10 at contact');assert.equal(quick.turn,1);assert(quick.progress<.1,'computer return starts from the paddle');
 const paused=new Match({random:()=>.4});paused.answer(0,paused.question.answer);while(paused.turn!==0)paused.update(10);paused.update(500);paused.answer(0,paused.question.answer);const frozen=paused.progress;paused.update(0);assert.equal(paused.progress,frozen,'no time passing means no ball motion');}

// Skyrail: every coin is still collected and the card is credited exactly once.
{const events=[],e=new Engine({random:()=>.45,emit:(type,data)=>events.push({type,...data})});e.start('play','mul',10,true);for(let i=0;i<20;i++)e.tick(FRAME);const coins=e.coinTrail.length;e.answer(e.card.answer);while(e.phase!=='thinking')e.tick(FRAME);
 assert.equal(events.filter(x=>x.type==='coin').length,coins,'all trail coins are collected');assert.equal(events.filter(x=>x.type==='reward').length,1);assert.equal(events.find(x=>x.type==='reward').amount,10);assert.equal(e.coins,10);
 const demo=new Engine({random:()=>.45,emit:(type)=>assert.notEqual(type,'reward','demo never emits rewards')});demo.start('demo','mul',10,true);for(let i=0;i<600;i++)demo.tick(FRAME);}

console.log('PASS answer to next card gap (s, 60 fps): '+Object.entries(report).map(([n,r])=>n+' correct '+Math.min(...r.correct)+'-'+Math.max(...r.correct)+' wrong '+Math.min(...r.wrong)+'-'+Math.max(...r.wrong)).join('; '));
