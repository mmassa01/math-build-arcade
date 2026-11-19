// Horse Race records a real personal best per race length, shows it on the next race, and never saves in demo.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const prefix=fs.readFileSync('tests/timed-rounds.cjs','utf8').split('(async()=>')[0],scope={require,console};
vm.createContext(scope);vm.runInContext(prefix+';this.makeHarness=harness;',scope);
(async()=>{
 const horse=scope.makeHarness('horse');const store=new Map();
 horse.scope.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 await new Promise(setImmediate);
 const chip=()=>horse.node('.best-chip b').textContent;
 const play=(mode,correct)=>{horse.events.message({origin:'https://test',source:horse.scope.parent,data:{type:'arcade-command',action:mode}});
  for(let i=0;i<correct;i++){horse.run('answer(K.R.items[K.R.i].answer)');horse.flush()}
  horse.run('answer(-1)');horse.flush();horse.run('finishRace()');return horse.node('app').innerHTML};
 horse.round.select.value='120';
 play('play',0);assert.equal(chip(),'0','a first race starts with no best');
 const first=play('play',5);assert.match(first,/New personal best: 5/);
 assert.equal(JSON.parse(store.get('horseRacePersonalBest.v1'))['timed-120'],5,'the best is saved for this race length');
 horse.events.message({origin:'https://test',source:horse.scope.parent,data:{type:'arcade-command',action:'play'}});
 assert.equal(chip(),'5','the next race shows the saved personal best');
 const lower=play('play',2);assert.doesNotMatch(lower,/New personal best/);assert.equal(JSON.parse(store.get('horseRacePersonalBest.v1'))['timed-120'],5,'a lower score keeps the best');
 const demo=play('demo',9);assert.doesNotMatch(demo,/New personal best/);assert.equal(JSON.parse(store.get('horseRacePersonalBest.v1'))['timed-120'],5,'demo never saves a best');
 horse.round.select.value='180';horse.round.select.onchange?.();
 assert.equal(chip(),'0','each race length keeps its own best');
 store.set('horseRacePersonalBest.v1','{broken');horse.round.select.value='120';horse.round.select.onchange?.();assert.equal(chip(),'0','a malformed save recovers to zero');
 play('play',3);assert.equal(JSON.parse(store.get('horseRacePersonalBest.v1'))['timed-120'],3,'recovery overwrites the malformed value');
 horse.scope.localStorage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
 assert.doesNotThrow(()=>play('play',4),'blocked storage cannot break the race');
 console.log('PASS horse personal best: saved per race length, shown next race, demo never saves, malformed and blocked storage recover');
})().catch(e=>{console.error(e);process.exitCode=1});
