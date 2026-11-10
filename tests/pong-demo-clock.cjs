const fs=require('node:fs'),assert=require('node:assert/strict');
let source=fs.readFileSync(__dirname+'/new-game-bridges.cjs','utf8');source=source.slice(0,source.indexOf("const p=harness('pong')"));
const harness=new Function('require','__dirname',source+';return harness;')(require,__dirname);
for(const step of [100,250,750])for(const initialStall of [0,2000]){
 const h=harness('pong');h.run("start(true);var powers=[];var misses=[];var oldDrain=match.drain.bind(match);match.drain=function(){var events=oldDrain();for(var event of events){if(event.type==='power')powers.push(match.time);if(event.type==='wrong')misses.push({time:match.time,timeout:Boolean(event.timeout)});}return events;};");
 for(let now=initialStall||step;now<80000;now+=step)h.run('loop('+now+')');
 assert.equal(h.run('powers.length'),4,'demo keeps building power on the authoritative game clock');assert(h.run('powers[0]')<=12000,'first power remains early even with low FPS and an initial loading stall');assert.equal(h.run('misses.filter(e=>e.timeout).length'),0,'slow frames never create unintended demo timeouts');assert.equal(h.run('misses.length'),1,'only the deliberately demonstrated miss ends the rally');assert.equal(h.run('match.score[0]'),11);assert.equal(h.run('match.phase'),'finished');assert.equal(h.messages.filter(m=>m.type==='arcade-reward'||m.type==='arcade-complete').length,0,'demo cannot award real currency or completion');
}
console.log('PASS Pong demo clock:100/250/750ms frames, initial2s loading stall, early power, no accidental timeouts, planned final miss and zero saved rewards');
