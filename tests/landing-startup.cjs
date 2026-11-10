const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const create=require('../dist/practice-pathways.js').create;
for(const hash of ['', '#dragon','#pong','#horse','#seed','#castle','#hangar','#subway','#sprint','#jetski','#invaders']){
 const nodes={},opens=[],routes=[];let writes=0;const P=create({getItem(){return null},setItem(){writes++}},()=>new Date(2026,10,3,12).getTime(),()=>.47);
 const baseline=writes;function node(id){return nodes[id]||(nodes[id]={hidden:id==='room',value:'',children:[],setAttribute(){},querySelectorAll(){return[]},addEventListener(){},showModal(){opens.push(id)},close(){},focus(){}})}
 const scope={window:{ArcadePractice:P,addEventListener(){}},document:{getElementById:node,addEventListener(){}},worlds:Object.fromEntries(['dragon','pong','horse','seed','castle','hangar','subway','sprint','jetski','invaders'].map(k=>[k,{}])),location:{hash,pathname:'/',search:'?v=landing-52'},history:{replaceState(_a,_b,url){routes.push(url)}},openWorld:(...a)=>opens.push(a),command(){},home(){},selected:null,Date,Math,Number,JSON,setInterval(){return 1},clearInterval(){}};
 vm.createContext(scope);vm.runInContext(fs.readFileSync('dist/pathway-ui.js','utf8'),scope);
 assert.deepEqual(opens,[],'no game or check automatically opens for '+hash);assert.equal(node('room').hidden,true);assert.equal(writes,baseline,'saved progress unchanged');assert.equal(routes.length,hash?1:0);if(hash)assert.equal(routes[0],'/?v=landing-52');
 node('checkButton').onclick();assert.deepEqual(opens,['checkDialog'],'explicit check button still works');
 scope.openWorld('pong','demo');assert.equal(opens.at(-1)[1],'demo','demo navigation preserved');
 console.log('PASS landing-first startup '+(hash||'root')+', unchanged progress, explicit check and demo navigation');
}
