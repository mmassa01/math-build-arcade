const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
// Reuse the real runtime and DOM harness from the timer regression suite.
const source=fs.readFileSync('tests/timed-rounds.cjs','utf8').split('(async()=>')[0];
const moduleScope={require,console};vm.createContext(moduleScope);vm.runInContext(source+';this.createHarness=harness;',moduleScope);
const h=moduleScope.createHarness('dirt');h.run('start(true)');let goldLeads=false,playerLeads=false,powers=0,wasBoost=false;
for(let i=0;i<1700;i++){h.step(.05);const gap=h.run('visualGap'),boost=h.run('race.boost>0');goldLeads||=gap<-.1;playerLeads||=gap>.1;if(boost&&!wasBoost)powers++;wasBoost=boost;}
assert(goldLeads&&playerLeads,'demo visibly demonstrates catching and overtaking');assert(powers>=2,'demo demonstrates multiple nitro boosts');assert.equal(h.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0);assert.equal(h.run('mode'),'results');console.log('PASS dirt demo: gold leads, player passes, repeated nitro, completed demonstration, zero saved coins');
