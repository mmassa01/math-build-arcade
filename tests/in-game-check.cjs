// The first 90 seconds of real play each day is the official fluency check,
// and a game deck never runs out of cards.
const assert=require('node:assert/strict'),fs=require('node:fs');
const factory=require('../dist/practice-pathways.js').create;
const BASE=new Date(2026,10,10,9).getTime(),DAY=86400000;
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}
function learner(pathway='add',data=new Map()){
  let now=BASE;
  const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const api=factory(storage,()=>now,()=>.47);
  api.setPathway(pathway);
  return{api,data,advance:ms=>{now+=ms;},setDay:n=>{now=BASE+n*DAY;},reload:()=>{const again=factory(storage,()=>now,()=>.47);return again;}};
}
// Play `cards` cards: `answerMs` on screen, `gapMs` of animation before the next.
function play(l,run,cards,{answerMs=1500,gapMs=300,wrong=()=>false,timeout=()=>false}={}){
  const seen=[];
  for(let i=0;i<cards;i++){
    const q=run.next();assert(q,'card '+i+' was issued');seen.push(q);
    l.advance(answerMs);
    const miss=wrong(i,q),late=timeout(i,q);
    assert(run.record(q,!miss&&!late,late?3000:answerMs,{timeout:late}).accepted);
    l.advance(gapMs);
  }
  return seen;
}
const official=(l,p)=>l.api.exportRecord().checks.filter(c=>c.pathway===p&&c.official);

test('a game deck never runs out, even after every scheduled fact is cleared',()=>{
  const l=learner('mul');const total=l.api.stats().total;
  const run=l.api.begin({endless:true});
  play(l,run,total+60,{answerMs:900,gapMs:100});
  assert.equal(l.api.stats().remaining,0,'every scheduled fact was cleared today');
  assert(run.next(),'play continues with review cards');
  assert.equal(l.api.progress().find(p=>p.id==='mul').practicePercent,25,'same-day repeats never add a second milestone');
});

test('a classic finite run still ends when the scheduled facts are done',()=>{
  const l=learner('div'),run=l.api.begin();let q,n=0;
  while((q=run.next())&&n++<2000)run.record(q,true,900);
  assert.equal(run.next(),null);
});

test('a missed fact comes straight back, spaced by a few other cards',()=>{
  const l=learner('add'),run=l.api.begin({endless:true});
  const first=run.next();l.advance(1000);run.record(first,false,1000);
  const ids=[];for(let i=0;i<5;i++){const q=run.next();ids.push(q.id);l.advance(1000);run.record(q,true,1000);}
  const at=ids.indexOf(first.id);
  assert(at>=1&&at<=4,'returned after '+at+' other cards');
});

test('yesterday’s missed facts lead the next session',()=>{
  const l=learner('sub');let run=l.api.begin({endless:true});
  const missed=play(l,run,6,{wrong:()=>true}).map(q=>q.id);
  l.setDay(1);run=l.api.begin({endless:true});
  const opening=play(l,run,new Set(missed).size).map(q=>q.id);
  assert.deepEqual([...new Set(opening)].sort(),[...new Set(missed)].sort());
});

test('the first 90 seconds of play becomes the official check, then play is practice',()=>{
  const l=learner('add'),run=l.api.begin({endless:true});
  play(l,run,49);                                   // 49 x 1.8 s = 88.2 s
  assert.equal(official(l,'add').length,0,'no score before 90 seconds of play');
  assert(l.api.checkStatus().remainingMs>0&&l.api.checkStatus().remainingMs<3000);
  play(l,run,2);
  const [check]=official(l,'add');
  assert(check&&check.source==='game'&&check.valid&&check.passed);
  assert.equal(check.correct,check.attempts);assert(check.correct>=30);
  play(l,run,60);
  assert.equal(official(l,'add').length,1,'later play the same day is practice, not a second score');
  assert.equal(l.api.progress().find(p=>p.id==='add').checks.passes,1);
});

test('95% accuracy and 30 correct are both required; time-outs count as misses',()=>{
  const sloppy=learner('add');play(sloppy,sloppy.api.begin({endless:true}),55,{wrong:i=>i%10===0});
  assert.equal(official(sloppy,'add')[0].passed,false,'about 90% accuracy does not pass');
  const slow=learner('add');play(slow,slow.api.begin({endless:true}),40,{answerMs:2900,gapMs:900});
  const s=official(slow,'add')[0];assert(s.correct<30&&!s.passed,'accurate but too few answers does not pass');
  const timed=learner('add');play(timed,timed.api.begin({endless:true}),55,{timeout:i=>i%8===0});
  assert.equal(official(timed,'add')[0].passed,false,'time-outs count against accuracy');
});

test('paused or idle time is not charged to the check',()=>{
  const l=learner('add'),run=l.api.begin({endless:true});
  play(l,run,10,{gapMs:10*60*1000});                 // ten minutes away between cards
  const s=l.api.checkStatus();
  assert.equal(s.elapsedMs,1500+9*(1500+1500),'each gap counts at most 1.5 seconds');
});

test('the check carries into the next round, the next game and a reload',()=>{
  const l=learner('mul');
  play(l,l.api.begin({endless:true}),20);            // game one ends early
  const partial=l.api.checkStatus().elapsedMs;assert(partial>0&&partial<90000);
  l.advance(5*60*1000);
  const reloaded=factory({getItem:k=>l.data.get(k)||null,setItem:(k,v)=>l.data.set(k,v)},()=>BASE+6*60*1000,()=>.47);
  assert.equal(reloaded.checkStatus().elapsedMs,partial,'progress survives leaving the game');
  play(l,l.api.begin({endless:true}),40);            // a different game, same day
  assert.equal(official(l,'mul').length,1);
});

test('each pathway has its own check and a new day starts a new one',()=>{
  const l=learner('add');play(l,l.api.begin({endless:true}),20);
  l.api.setPathway('sub');assert.equal(l.api.checkStatus().elapsedMs,0);
  l.api.setPathway('add');assert(l.api.checkStatus().elapsedMs>0,'switching pathways keeps the partial check');
  l.setDay(1);play(l,l.api.begin({endless:true}),5);
  assert(l.api.checkStatus().elapsedMs<10000,'yesterday’s partial check does not carry to a new day');
});

test('demo play never counts toward the check or the record',()=>{
  const l=learner('add'),before=l.data.get('mathArcadePathways.v2');
  play(l,l.api.begin({demo:true,endless:true}),80);
  assert.equal(l.data.get('mathArcadePathways.v2'),before);
  assert.equal(l.api.checkStatus().elapsedMs,0);assert.equal(official(l,'add').length,0);
});

test('mixed still needs seven correct and 90% in every operation',()=>{
  const l=learner('mixed');play(l,l.api.begin({endless:true}),60,{wrong:(i,q)=>q.op==='div'&&i%3===0});
  const c=official(l,'mixed')[0];assert(c&&!c.balanced&&!c.passed);
});

test('three seconds is the one speed rule for a milestone',()=>{
  const l=learner('add'),run=l.api.begin({endless:true});
  assert.equal(l.api.rules.limitMs,3000);
  const q=run.next();assert.equal(run.record(q,true,3001).fluent,false);
  const q2=run.next();assert.equal(run.record(q2,true,3000).fluent,true);
});

test('a damaged saved partial check is ignored, not fatal',()=>{
  const key='mathArcadePathways.v2';
  for(const bad of [{add:7},{add:{day:'x',elapsed:5,responses:[]}},{add:{day:'2026-11-10',elapsed:-4,responses:'no'}},[1,2]]){
    const data=new Map([[key,JSON.stringify({version:2,pathway:'add',facts:{},checks:[],trophies:{},gameChecks:bad})]]);
    const l=learner('add',data);assert.equal(l.api.checkStatus().elapsedMs,0);
    play(l,l.api.begin({endless:true}),3);
  }
});

test('games ask for the endless deck and no separate check stands in front of Play',()=>{
  const client=fs.readFileSync('dist/practice-client.js','utf8'),ui=fs.readFileSync('dist/pathway-ui.js','utf8'),page=fs.readFileSync('dist/index.html','utf8');
  assert(client.includes('service.begin({demo,endless:true})'));
  assert(!/openWorld\s*=|command\s*=\s*function/.test(ui));
  assert(page.includes('<button id="checkButton" hidden>'),'the separate check button is not offered');
  assert(page.includes('id="roomCheck"'),'the room shows the check countdown');
});

console.log('PASS in-game check: '+tests+' checks');
