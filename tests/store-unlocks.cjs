// Learning unlocks store items, coins buy them, and every round ends with
// one shared results screen.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {create}=require('../dist/economy.js');
const practice=require('../dist/practice-pathways.js').create;
let tests=0;
function test(name,fn){fn();tests++;console.log('PASS '+name);}
function shop(data=new Map()){return{E:create({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}),data};}
const paid=E=>E.catalog.filter(i=>i.price),top=E=>Math.max(...E.catalog.map(i=>i.price));

test('coins alone never unlock anything',()=>{
  const {E}=shop();
  for(let i=0;i<1000;i++)E.reward(100,'r'+i);
  assert.equal(E.getState().coins,100000);
  assert.deepEqual(E.getState().unlocked.sort(),E.catalog.filter(i=>!i.price).map(i=>i.id).sort(),'only the free starters are open');
  for(const item of paid(E))assert.equal(E.purchase(item.id).reason,'locked',item.id);
});

test('items open steadily as facts are confirmed, cheapest first, the same share for every grade',()=>{
  for(const total of [61,271,469]){
    const {E}=shop(),ladder=paid(E).filter(i=>i.price<top(E));
    assert.deepEqual(E.setJourney(0,total,false),[]);
    let opened=0,lastPrice=0;const firstAt=[];
    for(let confirmed=1;confirmed<=total;confirmed++){
      const fresh=E.setJourney(confirmed,total,false);
      for(const id of fresh){const price=E.catalog.find(i=>i.id===id).price;assert(price>=lastPrice,'cheaper items open first');lastPrice=price;}
      if(fresh.length&&!firstAt.length)firstAt.push(confirmed);
      opened+=fresh.length;
      if(confirmed===Math.floor(total/2))assert(opened>ladder.length*.4&&opened<ladder.length*.6,'about half are open half-way: '+opened+' of '+ladder.length);
    }
    assert(firstAt[0]<=Math.ceil(total*.03),'the first item opens within the first 3% ('+firstAt[0]+' of '+total+')');
    assert.equal(opened,ladder.length,'every ordinary item is open before the end');
  }
});

test('the top items open only when the whole game is won',()=>{
  const {E}=shop(),best=paid(E).filter(i=>i.price===top(E));
  assert(best.length>=5);
  E.setJourney(469,469,false);
  for(const item of best){assert.equal(E.unlockInfo(item.id).win,true);assert.equal(E.purchase(item.id).reason,'locked');}
  assert.deepEqual(E.setJourney(469,469,true).sort(),best.map(i=>i.id).sort());
  assert.equal(E.nextUnlock(),null,'nothing is left to unlock after the win');
});

test('an unlocked item still has to be bought with coins, and stays unlocked',()=>{
  const {E,data}=shop(),item=paid(E).sort((a,b)=>a.price-b.price)[0];
  const need=E.unlockInfo(item.id);assert.equal(need.unlocked,false);
  E.setJourney(0,100,false);
  const info=E.nextUnlock();assert.equal(info.id,item.id);assert.equal(info.factsNeeded,3);
  assert(E.setJourney(3,100,false).includes(item.id));
  assert(E.getState().pendingUnlocks.includes(item.id));
  assert.equal(E.purchase(item.id).reason,'insufficient-coins');
  E.reward(100,'a');E.reward(100,'b');E.reward(100,'c');for(let i=0;i<Math.ceil(item.price/100);i++)E.reward(100,'x'+i);
  const before=E.getState().coins;assert(E.purchase(item.id).ok);assert.equal(E.getState().coins,before-item.price);
  const other=paid(E).filter(i=>i.id!==item.id).sort((a,b)=>a.price-b.price)[0];
  E.setJourney(40,100,false);assert(E.getState().unlocked.includes(other.id));
  E.setJourney(0,100,false);assert(E.getState().unlocked.includes(other.id),'a later slip does not re-lock it');
  const again=shop(data).E;assert(again.getState().unlocked.includes(other.id),'unlocks survive a reload');
  assert.equal(again.getState().journey.total,100);
});

test('damaged unlock data is ignored',()=>{
  for(const bad of [{unlockedIds:'x',journey:7},{unlockedIds:[1,null,'missing-item','car-0'],journey:{confirmed:-3,total:'a',won:'yes'}}]){
    const {E}=shop(new Map([['mathArcadeProfile.v1',JSON.stringify({version:1,coins:50,...bad})]]));
    assert.equal(E.getState().coins,50);assert.deepEqual(E.getState().unlockedIds,[]);
    assert.deepEqual(E.getState().journey,{confirmed:0,total:0,won:false});
    assert.equal(E.unlockInfo(paid(E)[0].id).factsNeeded,null,'no count is shown until the journey is known');
  }
});

test('the engine reports what happened in the round just played',()=>{
  let now=new Date(2026,10,10,9).getTime();
  const data=new Map(),api=practice({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},()=>now,()=>.47);
  api.setPathway('add');
  const play=(cards,wrongEvery=0)=>{const run=api.begin({endless:true});for(let i=0;i<cards;i++){const q=run.next();now+=1200;run.record(q,!(wrongEvery&&i%wrongEvery===0),1200);}};
  play(10,5);
  // Two cards were missed and came back the same day: right the second time, but no step forward.
  assert.deepEqual(api.roundSummary(),{answered:10,correct:8,steps:6,confirmed:0});
  now+=86400000;play(81);now+=86400000;play(81);
  const third=api.roundSummary();assert.equal(third.answered,81);assert(third.confirmed>0&&third.confirmed<=third.steps,'facts confirmed on the third day are counted');
  const demo=api.begin({demo:true,endless:true});demo.record(demo.next(),true,900);
  assert.equal(api.roundSummary().answered,81,'demo play is not counted');
});

test('the shell shows one results screen and no longer opens the Store by itself',()=>{
  const shell=fs.readFileSync('dist/arcade.js','utf8'),page=fs.readFileSync('dist/index.html','utf8'),ui=fs.readFileSync('dist/store/ui.js','utf8');
  assert(page.includes('id="resultsDialog"')&&page.includes('id="resultsAgain"')&&page.includes('id="resultsHome"')&&page.includes('id="resultsStore"'));
  assert(shell.includes('function showResults()')&&shell.includes("selected==='castle'?13500:900"));
  assert(!shell.includes('showStore(true)'),'the Store is opened only by the student');
  assert(shell.includes("if(!selected||mode!=='play'"),'results are never shown for demo or video');
  assert(shell.includes('E.setJourney(all.mastered,all.total,paths.every(p=>p.earned))'));
  assert(ui.includes('lockText(E.unlockInfo(i.id))')&&!ui.includes('more earned coins to unlock'));
});

test('results screen stays short, Escape keeps the student in the room, and late coins are still paid',()=>{
  const shell=fs.readFileSync('dist/arcade.js','utf8');
  assert(shell.includes("!$('resultsDialog').open&&!$('room').hidden)home()"),'Escape on the results screen does not leave the game');
  assert(shell.includes("opened.slice(0,2)"),'many unlocks are summarised in one line');
  const {Match}=require('../dist/pong/engine.js');
  const match=new Match({random:()=>.4,continuous:true});
  match.answer(0,match.question.answer);match.drain();
  let guard=0;while(!(match.phase==='flight'&&match.turn===0)&&guard++<1000)match.update(10);
  match.drain();match.answer(0,match.question.answer);const before=match.coins[0];
  match.finish();
  assert.equal(match.coins[0],before+10,'a correct answer still in flight when the clock ends is paid');
  assert.equal(match.drain().filter(e=>e.type==='earn').length,1);
  for(const game of ['castle','seed','hangar'])assert(!fs.readFileSync('dist/'+game+'/index.html','utf8').includes('earned+=reward;awardMastered(card)'),game+' counts each card once');
  const cinema=fs.readFileSync('dist/dragon/cinema.js','utf8');
  assert(!cinema.includes("'+25'")&&!cinema.includes("'+50'"),'dragon shows the amount it pays');
});

console.log('PASS store unlocks: '+tests+' checks');
