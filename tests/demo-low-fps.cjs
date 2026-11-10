const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const prefix=fs.readFileSync('tests/new-game-bridges.cjs','utf8').split("const p=harness('pong')")[0],scope={require,console,__dirname};vm.createContext(scope);vm.runInContext(prefix+';this.makeHarness=harness;',scope);
for(const name of ['dragon','invaders'])for(const cadence of [100,250,750]){
 const h=scope.makeHarness(name);h.run("start(true);var recorded=[];var actualDrain=game.drain.bind(game);game.drain=function(){const es=actualDrain();es.forEach(e=>recorded.push({...e,at:game.time??elapsed}));return es;}");
 // Simulate an expensive first paint, then sustained slow rendering.
 h.run('loop(2000)');for(let now=2000+cadence;now<=6000;now+=cadence)h.run('loop('+now+')');
 assert(h.run("recorded.some(e=>e.type==='pass'||e.type==='destroy')"),name+' produces an early visible hit after a delayed first paint');
 for(let now=6000+cadence;now<180000;now+=cadence)h.run('loop('+now+')');
 if(name==='dragon'){
  assert.equal(h.run('game.passed'),12);assert.equal(h.run('game.active'),false);
  assert.equal(h.run("recorded.filter(e=>e.type==='wrong').length"),1,'only the scripted wrong answer');
  assert.equal(h.run("recorded.filter(e=>e.type==='miss').length"),1,'only the scripted timeout');
  assert(h.run("recorded.find(e=>e.type==='dash').at")<8,'inferno appears early on authoritative flight time');
 }else{
  assert(h.run('game.kills')>=40);assert.equal(h.run('game.running'),false);
  assert.equal(h.run("recorded.filter(e=>e.type==='wrong'&&e.timeout).length"),0,'slow rendering creates no accidental demo timeouts');
  assert(h.run("recorded.some(e=>e.type==='fire'&&e.beam)"),'laser combo still appears');
 }
 assert.equal(h.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,'demo cannot award saved coins or trophies');assert.equal(h.writes.length,0);
}
for(const name of ['dragon','invaders']){const h=scope.makeHarness(name);h.run('start(false);loop(2000);loop(3000)');assert.equal(h.run('game.coins'),0);assert(h.run(name==='dragon'?'game.ready':'game.pending'),'real play still times out after actual three seconds');}
console.log('PASS low-FPS demos: 100/250/750ms frames plus 2s initial paint, early hits/power, intentional misses only, full Dragon and Star demo completion, zero saved rewards, unchanged real-play deadlines');
