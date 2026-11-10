const assert=require('node:assert/strict'),fs=require('node:fs');
let source=fs.readFileSync(__dirname+'/newshared-engine-games.cjs','utf8');
source=source.slice(0,source.indexOf("for(const name of ['dirt','dragon','invaders','pong'])"));
source=source.replace("require('../dist/practice.js')","require('../dist/practice-pathways.js')").replace('grade=3,demo=false','grade=3,pathway=\'mixed\',demo=false').replace('practice.setGrade(grade);','practice.setPathway(pathway);');
const harness=new Function('require','__dirname',source+';return harness;')(require,__dirname);
for(const pathway of ['add','sub','mul','div','mixed'])for(const game of ['dirt','dragon','invaders','pong']){
  const h=harness(game,{pathway}),q=h.e.question;
  assert(q.id&&q.token&&q.choices.length===4);
  if(pathway!=='mixed')assert.equal(q.op,pathway);
  if(game==='pong')h.e.answer(0,q.answer);else h.e.answer(q.answer);
  assert.equal(h.logs.length,1);assert(h.logs[0].result.accepted&&h.logs[0].result.fluent);
  assert.equal(h.practice.exportRecord().facts[q.id].stage,1);
  const demo=harness(game,{pathway,demo:true}),before=demo.writes;
  if(game==='pong')demo.e.answer(0,demo.e.question.answer);else demo.e.answer(demo.e.question.answer);
  assert.equal(demo.writes,before);
  console.log('PASS '+game+' / '+pathway+': real pathway bank, accepted answer, one milestone, isolated demo');
}
const {Engine}=require('../dist/subway/engine.js'),factory=require('../dist/practice-pathways.js').create;
for(const pathway of ['add','sub','mul','div','mixed']){let now=1000,run;const p=factory({getItem(){return null;},setItem(){}},()=>now,()=>.3);p.setPathway(pathway);const learning={active:true,begin(demo){run=p.begin({demo});},next(){return run.next();},record(...args){return run.record(...args);}};const engine=new Engine({learning,random:()=>.3});engine.start('play','mixed',7,true);const q=engine.card.question;if(pathway!=='mixed')assert.equal(q.op,pathway);engine.answer(q.answer);assert.equal(p.exportRecord().facts[q.id].stage,1);console.log('PASS subway / '+pathway+': real pathway bank and shared fact milestone');}
console.log('PASS 25 game/pathway integrations');
