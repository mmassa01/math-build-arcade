// Every game pays the same amount for the same work: exactly 10 coins for each
// correctly answered card in play mode, and nothing for wrong answers, time-outs or demos.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const COINS=10;
const sum=list=>list.reduce((n,x)=>n+x,0);

// ---------- engines ----------
{
 const {Race}=require('../dist/dirt/engine.js');
 const race=new Race({random:()=>.3,laps:3}),events=[];
 for(let i=0;i<24;i++){assert(race.answer(race.question.answer).correct);events.push(...race.drain());if(race.active)race.update(.3)}
 assert.equal(race.correct,24);assert.equal(race.won,true);
 assert.equal(race.coins,COINS*24,'dirt/wave engine: 24 correct cards, including nitro and the win, pay 240');
 const correct=events.filter(e=>e.type==='correct');
 assert.equal(correct.length,24);assert(correct.some(e=>e.power),'nitro still fires');assert(correct.every(e=>e.coins===COINS));
 const miss=new Race({random:()=>.3});miss.answer(miss.question.answer+100);miss.update(.3);miss.update(3.2);miss.update(.3);
 assert.equal(miss.attempts,2);assert.equal(miss.coins,0,'dirt/wave engine: wrong and timed-out cards pay nothing');
 assert(!miss.drain().some(e=>e.coins));
}
{
 const {Engine}=require('../dist/subway/engine.js');
 const make=()=>{const events=[];return{events,e:new Engine({random:()=>.45,emit:(type,data)=>events.push({type,...data})})}};
 const advance=(e,seconds)=>{for(let t=0;t<seconds;t+=.05)e.tick(.05)};
 const {e,events}=make();e.start('play');
 for(let i=0;i<8;i++){e.answer(e.card.answer);advance(e,2.6)}
 const rewards=events.filter(x=>x.type==='reward');
 assert.equal(e.mastered,8);assert.equal(rewards.length,8);assert(rewards.every(r=>r.amount===COINS));
 assert.equal(new Set(rewards.map(r=>r.id)).size,8,'subway reward ids are unique');
 assert.equal(e.coins,COINS*8,'subway engine: 8 correct cards pay 80');
 assert.equal(events.filter(x=>x.type==='route'&&x.superJump).length,2,'super jump trails still appear');
 assert(events.filter(x=>x.type==='coin').length>=8*3+2,'the coin trail animation is still collected coin by coin');
 assert(events.filter(x=>x.type==='land').every(x=>x.amount===COINS),'landing feedback shows what was paid');
 const bad=make();bad.e.start('play');bad.e.answer(bad.e.card.answer+1);advance(bad.e,1.4);advance(bad.e,3.1);advance(bad.e,1.4);
 assert.equal(bad.e.hearts,1);assert.equal(bad.e.coins,0);assert.equal(bad.events.filter(x=>x.type==='reward').length,0,'subway: wrong and timed-out cards pay nothing');
 const demo=make();demo.e.start('demo');advance(demo.e,130);
 assert.equal(demo.e.phase,'won');assert.equal(demo.events.filter(x=>x.type==='reward').length,0,'subway demo emits no reward');
}
{
 const {Match}=require('../dist/pong/engine.js');
 const m=new Match({random:()=>.4}),events=[];let cards=0;
 assert(m.answer(0,m.question.answer).correct);cards++;events.push(...m.drain());
 for(let n=0;n<11;n++){m.update(m.flightSeconds*1000);assert.equal(m.turn,0);assert(m.answer(0,m.question.answer).correct);cards++;m.update(m.flightSeconds*1000);events.push(...m.drain())}
 const earned=events.filter(e=>e.type==='earn');
 assert.equal(cards,12);assert.equal(earned.length,12);assert(earned.every(e=>e.coins===COINS&&e.player===0));
 assert(events.some(e=>e.type==='power'),'power shots still launch');
 assert.equal(m.coins[0],COINS*12,'pong engine: one serve and eleven returns pay 120');assert.equal(m.coins[1],0,'the computer earns nothing');
 m.update(m.flightSeconds*1000);m.answer(0,m.question.answer+1);m.update(m.flightSeconds*1000);
 const after=m.drain();assert.equal(m.phase,'finished');assert(!after.some(e=>e.type==='earn'));assert(after.filter(e=>e.type==='point').every(e=>!e.coins));
 assert.equal(m.coins[0],COINS*12,'pong engine: a missed return pays nothing');
 const serve=new Match({random:()=>.4});serve.answer(0,serve.question.answer+1);serve.update(240);serve.update(3000);serve.update(240);
 assert.equal(serve.coins[0],0);assert(!serve.drain().some(e=>e.type==='earn'),'pong engine: wrong and timed-out serves pay nothing');
 const duel=new Match({mode:'duel',random:()=>.4,goal:1});duel.answer(0,duel.question.answer);duel.update(3000);
 assert.equal(duel.phase,'finished');assert.deepEqual(duel.coins,[COINS,0],'duel: only the correct card pays; winning the point adds nothing');
}
{
 const {Game}=require('../dist/invaders/engine.js');
 const g=new Game({random:()=>.3,timed:true}),events=[];let cards=0;
 for(let i=0;i<60;i++){assert(g.answer(g.question.answer));cards++;g.update(.56);events.push(...g.drain())}
 assert.equal(g.correct,60);assert.equal(g.coins,COINS*60,'invaders engine: 60 correct cards pay 600 whatever they destroy');
 const fire=events.filter(e=>e.type==='fire');
 assert.equal(fire.length,60);assert(fire.every(e=>e.coins===COINS));assert(fire.some(e=>e.beam),'super laser still fires');
 const destroyed=events.filter(e=>e.type==='destroy');
 assert(destroyed.length>60,'super lasers still destroy several aliens');assert(destroyed.some(e=>e.alien.boss),'motherships are still destroyed');
 assert(destroyed.every(e=>!e.coins),'aliens and motherships carry no separate bounty');
 const bad=new Game({random:()=>.3});assert.equal(bad.answer(bad.question.answer+100),false);bad.update(.56);bad.update(3.1);bad.update(.56);
 assert.equal(bad.coins,0);assert(!bad.drain().some(e=>e.coins),'invaders engine: wrong and timed-out cards pay nothing');
}
for(const file of ['encounters.js','engine.js']){
 const {Flight}=require('../dist/dragon/'+file);
 const f=new Flight({random:()=>.3}),passes=[];let cards=0;
 while(f.active&&cards<20){assert(f.answer(f.question.answer));cards++;f.update(.9);passes.push(...f.drain().filter(e=>e.type==='pass'))}
 assert.equal(f.passed,12);assert.equal(cards,8,'two infernos shorten the flight to eight cards');
 assert(passes.some(e=>e.power),'inferno still tags several rivals');
 assert.equal(sum(passes.map(e=>e.coins)),COINS*8);assert.equal(passes.filter(e=>e.coins===COINS).length,8);
 assert.equal(f.coins,COINS*8,'dragon '+file+': 8 correct cards pay 80, with no inferno or victory bonus');
 const bad=new Flight({random:()=>.3});bad.answer(bad.question.answer+100);bad.update(1.2);bad.update(3.1);bad.update(1.2);
 assert.equal(bad.passed,0);assert.equal(bad.coins,0,'dragon '+file+': wrong and timed-out cards pay nothing');
}

// ---------- real game scripts bridged to the arcade shell ----------
function harness(name){
 const nodes={},messages=[],listeners={},writes=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 function node(id){return nodes[id]||(nodes[id]={children:[],classList:{toggle(){},add(){},remove(){}},style:{},dataset:{},lastChild:{textContent:''},value:({operation:'add',range:'10',seconds:'3',laps:'3',pace:'20'})[id]||'',getContext:()=>ctx,getBoundingClientRect:()=>({width:390,height:430}),setAttribute(){},addEventListener(){},replaceChildren(...v){this.children=v},showModal(){this.open=true},close(){this.open=false}})}
 const parent={postMessage(m){messages.push(m)}};
 const scope={parent,window:{addEventListener(type,fn){listeners[type]=fn}},location:{origin:'https://arcade.test'},document:{body:{dataset:{game:name==='wave'?'jetski':'sprint'},classList:{toggle(){}}},getElementById:node,querySelector:node,createElement:()=>node('b'+Math.random()),addEventListener(){}},Image:function(){this.complete=false;this.naturalWidth=0},ResizeObserver:class{observe(){}},performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout(f){f()},clearTimeout(){},localStorage:{getItem:()=>null,setItem:(k,v)=>writes.push(v)},Math,console};
 const folder=name==='wave'?'dirt':name;
 scope[{dirt:'DirtEngine',pong:'PongEngine',dragon:'DragonEngine',invaders:'DefenderEngine'}[folder]]=require('../dist/'+folder+'/'+(folder==='dragon'?'encounters.js':'engine.js'));
 scope.ArcadeNumberEntry=scope.window.ArcadeNumberEntry=require('./number-entry-fixture.cjs');
 vm.createContext(scope);vm.runInContext(read('dist/'+folder+'/game.js'),scope);
 const rewards=()=>messages.filter(m=>m.type==='arcade-reward');
 return{run:code=>vm.runInContext(code,scope),messages,rewards,writes,listeners,parent,node,
  command(action){listeners.message({origin:'https://arcade.test',source:parent,data:{type:'arcade-command',action}})}};
}
function expectRewards(h,label,cards){
 const rewards=h.rewards();
 assert.equal(rewards.length,cards,label+': one reward message per correct card');
 assert(rewards.every(m=>m.amount===COINS&&Number.isInteger(m.amount)),label+': every reward is exactly 10');
 assert(rewards.every(m=>typeof m.id==='string'&&m.id.length>0),label+': every reward has a string id');
 assert.equal(new Set(rewards.map(m=>m.id)).size,cards,label+': reward ids are unique');
 assert.equal(sum(rewards.map(m=>m.amount)),COINS*cards,label+': '+cards+' correct cards pay '+COINS*cards);
 assert.equal(h.writes.length,0,label+': embedded play never writes a private wallet');
}
function expectSilentDemo(h,label,frames){
 h.command('demo');for(let ms=100;ms<frames;ms+=100)h.run('loop('+ms+')');
 assert.equal(h.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,label+': demo pays nothing and completes nothing');
}
for(const name of ['dirt','wave']){
 const demo=harness(name);expectSilentDemo(demo,name,85000);assert.equal(demo.run('race.correct'),24,name+' demo really answered cards');
 const h=harness(name);h.run('start(false);count=0;loop(1)');
 h.run('answer(race.question.answer)');assert.equal(h.node('banner').textContent,'+10 COINS • FULL THROTTLE',name+': feedback names the amount paid');
 h.run('race.update(.3);events();question();for(let i=0;i<8;i++){answer(race.question.answer);race.update(.3);events();question()}');
 assert.equal(h.run('race.correct'),9);expectRewards(h,name,9);
 assert.equal(h.run('wallet'),COINS*9,name+': the HUD wallet matches what was paid');
 h.run('answer(race.question.answer+100);race.update(.3);events();question();race.update(3.2);events();question()');
 assert.equal(h.run('race.attempts'),11);expectRewards(h,name+' after a wrong and a timed-out card',9);
}
{
 const demo=harness('pong');expectSilentDemo(demo,'pong',70000);assert(demo.run('match.score[0]')>0,'pong demo really returned shots');
 const h=harness('pong');h.run('start(false);choose(0,match.question.answer);');
 h.run('for(let i=0;i<6;i++){match.update(match.flightSeconds*1000);handleEvents();choose(0,match.question.answer);match.update(match.flightSeconds*1000);handleEvents()}');
 assert.equal(h.run('match.score[0]'),6);expectRewards(h,'pong',7);
 assert.equal(h.run('wallet[0]'),COINS*7,'pong: the HUD wallet matches what was paid');
 h.run('match.update(match.flightSeconds*1000);handleEvents();choose(0,match.question.answer+1);match.update(match.flightSeconds*1000);handleEvents()');
 assert.equal(h.run('match.phase'),'finished');expectRewards(h,'pong after a missed return',7);
 assert(h.node('finalStats').textContent.includes('earned 70 coins'),'pong summary reports what was paid');
}
{
 const demo=harness('invaders');expectSilentDemo(demo,'invaders',150000);assert(demo.run('game.correct')>0,'invaders demo really answered cards');
 const h=harness('invaders');h.run('start(false);for(let i=0;i<16;i++){answer(game.question.answer);game.update(.56);events()}');
 assert.equal(h.run('game.correct'),16);assert(h.run('game.kills')>16,'super lasers destroyed extra aliens');expectRewards(h,'invaders',16);
 assert.equal(h.run('wallet'),COINS*16,'invaders: the HUD wallet matches what was paid');
 h.run('answer(game.question.answer+100);game.update(.56);events();game.update(3.1);events();game.update(.56);events()');
 expectRewards(h,'invaders after a wrong and a timed-out card',16);
}
{
 const demo=harness('dragon');expectSilentDemo(demo,'dragon',60000);assert.equal(demo.run('game.passed'),12,'dragon demo really finished');
 const h=harness('dragon');h.run('start(false);var cards=0;while(game.active&&cards<20){answer(game.question.answer);cards++;game.update(.9);events()}');
 assert.equal(h.run('cards'),8);assert.equal(h.run('game.passed'),12);expectRewards(h,'dragon',8);
 assert.equal(h.run('wallet'),COINS*8,'dragon: the HUD wallet matches what was paid');
 assert(h.node('summary').textContent.includes('earned 80 coins'),'dragon summary reports what was paid');
 assert.equal(h.messages.filter(m=>m.type==='arcade-complete').length,1,'the victory still completes once, with no extra coins');
 const bad=harness('dragon');bad.run('start(false);answer(game.question.answer+100);game.update(1.2);events();game.update(3.1);events()');
 expectRewards(bad,'dragon after a wrong and a timed-out card',0);
}
{
 // Subway's real game script, embedded.
 const nodes={},listeners={},messages=[],writes=[],timers=[];let frame;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 function node(id){return nodes[id]||(nodes[id]={children:[],style:{},classList:{add(){},remove(){}},value:({operation:'mixed',speed:'7'})[id]||'',getContext:()=>ctx,getBoundingClientRect:()=>({width:390,height:430}),replaceChildren(){this.children=[]},append(v){this.children.push(v)}})}
 const parent={postMessage:m=>messages.push(m)};
 const scope={parent,window:{addEventListener:(k,f)=>listeners[k]=f},location:{origin:'https://arcade.test'},document:{getElementById:node,createElement:()=>node('b'+Math.random()),addEventListener(){}},Image:function(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024},performance:{now:()=>0},requestAnimationFrame:f=>frame=f,devicePixelRatio:1,setTimeout:f=>{timers.push(f);return timers.length},clearTimeout(){},localStorage:{getItem:()=>null,setItem:(...v)=>writes.push(v)},Math,SubwayEngine:require('../dist/subway/engine.js')};
 scope.ArcadeNumberEntry=scope.window.ArcadeNumberEntry=require('./number-entry-fixture.cjs');
 vm.createContext(scope);vm.runInContext(read('dist/subway/game.js').replace('const engine=new SubwayEngine.Engine','const engine=window.testEngine=new SubwayEngine.Engine'),scope);
 const send=data=>listeners.message({origin:'https://arcade.test',source:parent,data});
 let t=0;const run=ms=>{for(const end=t+ms;t<end;t+=100)frame(t)};
 send({type:'arcade-command',action:'play'});const e=scope.window.testEngine;run(100);
 for(let i=0;i<5;i++){assert.equal(e.phase,'thinking');e.answer(e.card.answer);run(3000)}
 const rewards=messages.filter(m=>m.type==='arcade-reward');
 assert.equal(e.mastered,5);assert.equal(rewards.length,5);assert(rewards.every(m=>m.amount===COINS&&typeof m.id==='string'));
 assert.equal(new Set(rewards.map(m=>m.id)).size,5);assert.equal(node('runCoins').textContent,COINS*5,'subway: the run total matches what was paid');
 e.answer(e.card.answer+1);run(1500);run(4600);
 assert.equal(messages.filter(m=>m.type==='arcade-reward').length,5,'subway: wrong and timed-out cards pay nothing');assert.equal(writes.length,0);
}

// ---------- games that cannot be driven here: assert on the shipped source ----------
{
 const horse=read('dist/races/horse-standalone.js');
 assert(horse.includes("if(ok&&!automated)send({type:'arcade-reward',amount:10,id:run+':'+index,game:'horse'})"),'horse pays 10 once per correct card, never in demo');
 assert.equal(horse.split("type:'arcade-reward'").length-1,1,'horse has a single coin source');
 assert(horse.includes("right*10+' coins earned"),'horse summary reports 10 per correct card');
 assert.equal(horse.split('10 COINS EACH').length-1,3);assert(!/\b25\b[^;]{0,12}COINS|25 coins/i.test(horse));
 for(const game of ['castle','seed','hangar']){
  const source=read('dist/'+game+'/index.html');
  assert(/\bCARD_REWARD=10,/.test(source),game+' pays 10 per card');
  assert.deepEqual([...new Set(source.match(/\breward=[^,;]+/g))],['reward=CARD_REWARD'],game+' never changes the card reward');
  assert(source.includes("function awardMastered(card){if(demo)return;"),game+' pays nothing in demo');
  assert(source.includes("if(arcadeAwarded.has(id))return;arcadeAwarded.add(id);earned+=reward;if(arcadeEmbedded)arcadePost({type:'arcade-reward',amount:reward,id});else{tokens+=reward;"),game+' pays once per card, embedded or standalone, and counts it in the summary');
  assert.equal(source.split("type:'arcade-reward'").length-1,1,game+' has a single coin source');
  assert(source.includes('`+${reward} coins · '),game+' feedback names the amount paid');
 }
 // No game script may post a fixed reward other than 10.
 const scripts=['races/horse-standalone.js','races/standalone.js','dirt/game.js','subway/game.js','pong/game.js','invaders/game.js','dragon/game.js','castle/index.html','seed/index.html','hangar/index.html'];
 for(const file of scripts)for(const match of read('dist/'+file).matchAll(/type:'arcade-reward',amount:([^,}]+)/g))assert(['10','e.coins','data.amount','reward'].includes(match[1]),file+' posts an unexpected reward amount '+match[1]);
 for(const file of ['dirt/engine.js','subway/engine.js','pong/engine.js','invaders/engine.js','dragon/encounters.js','dragon/engine.js'])assert(!/coins\+=(?!10\b)|coins:(?:15|25|50|75|100)\b|\*25\b/.test(read('dist/'+file).replace(/this\.coins\+=(?:coins|amount);/g,'')),file+' has no coin source other than 10 per card');
 assert(read('dist/subway/engine.js').includes('const amount=10;this.coins+=amount;'),'subway pays a flat 10 per landed card');
 for(const file of ['dragon/encounters.js','dragon/engine.js'])assert(read('dist/'+file).includes('const coins=shot.coins||0;this.coins+=coins;'),file+' pays only the coins carried by the card');
 assert(read('dist/dirt/index.html').includes('Every correct answer earns 10 coins.'));assert(read('dist/wave/index.html').includes('Every correct answer earns 10 coins.'));
 assert(read('dist/invaders/index.html').includes('10 coins per correct answer'));assert(read('dist/pong/index.html').includes('Earn 10 coins for every correct answer.'));
}
console.log('PASS uniform coins: every drivable game pays exactly 10 per correct card with unique ids, nothing for wrong, timed-out or demo cards; horse and the three build games pinned by source');
