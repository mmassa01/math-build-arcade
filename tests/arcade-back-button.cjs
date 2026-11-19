// Browser Back from a game returns cleanly to the hub, and Forward/Back stay consistent.
// Models the joint session history: a frame navigation that is not a replace adds an entry
// that Back would walk the iframe through (blank room, then the previous game under the wrong title).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {create:createPathways}=require('../dist/practice-pathways.js');
const {create:createEconomy}=require('../dist/economy.js');
const read=f=>fs.readFileSync(f,'utf8');
function arcade(){
  const nodes=new Map(),listeners={},timers=new Map();let timerId=0;
  const joint={entries:[{kind:'top',state:null,url:'/'}],index:0};const queued=[];
  const frame={url:'about:blank'};
  const frameNavigate=(url,replace)=>{frame.url=url;if(!replace){joint.entries.splice(joint.index+1);joint.entries.push({kind:'frame',url,top:topEntry()});joint.index++}};
  const frameWindow={postMessage(){},location:{replace(url){frameNavigate(url,true)}}};
  function topEntry(){for(let i=joint.index;i>=0;i--)if(joint.entries[i].kind==='top')return joint.entries[i];}
  function node(id){if(nodes.has(id))return nodes.get(id);const n={id,hidden:id==='room'||id==='loading'||id==='roomSkillPick',open:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},children:[],options:[],textContent:'',innerHTML:'',value:id==='cardScroll'?'0':'',querySelectorAll(){return[]},querySelector(){return null},addEventListener(){},setAttribute(){},append(c){this.children.push(c)},replaceChildren(...c){this.children=c},remove(){},showModal(){this.open=true},close(){this.open=false},focus(){},getBoundingClientRect(){return{top:0,right:100,bottom:100,left:0}}};
    if(id==='game'){n.contentWindow=frameWindow;Object.defineProperty(n,'src',{get:()=>frame.url,set:url=>frameNavigate(url,false)})}nodes.set(id,n);return n}
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const E=createEconomy(storage),P=createPathways(storage,()=>new Date(2026,10,18,12).getTime(),()=>.4);P.setGrade(3);
  const location={origin:'https://arcade.test',pathname:'/',search:'',get hash(){const u=topEntry().url;return u.includes('#')?u.slice(u.indexOf('#')):''}};
  const history={get state(){return topEntry().state},pushState(state,_t,url){joint.entries.splice(joint.index+1);joint.entries.push({kind:'top',state,url});joint.index++},replaceState(state,_t,url){const t=topEntry();t.state=state;t.url=url},back(){queued.push(-1)},forward(){queued.push(1)}};
  const traverse=delta=>{const before=topEntry();const target=joint.entries[joint.index+delta];if(!target)return;joint.index+=delta;
    if(target.kind==='frame')frame.url=target.url;else if(joint.entries[joint.index-delta]?.kind==='frame'&&target===before){frame.url=joint.entries.slice(0,joint.index+1).reverse().find(e=>e.kind==='frame')?.url||'about:blank'}
    if(topEntry()!==before)listeners.popstate?.forEach(f=>f({state:topEntry().state}))};
  const flush=()=>{while(queued.length)traverse(queued.shift());for(const [id,f]of [...timers]){timers.delete(id);f()}};
  const document={body:{style:{},append(){}},baseURI:'https://arcade.test/',getElementById:node,querySelector(s){return s==='.adventures'?{after(){}}:null},querySelectorAll(){return[]},createElement:tag=>({tag,style:{},remove(){}}),addEventListener(){}};
  const window={ArcadeEconomy:E,ArcadePractice:P,addEventListener(t,f){(listeners[t]||=[]).push(f)}};
  const scope={window,document,location,history,ArcadeShop:{render(){}},Image:class{},ResizeObserver:class{observe(){}},matchMedia:()=>({matches:false}),innerWidth:1200,innerHeight:800,requestAnimationFrame(){},setTimeout(f){const id=++timerId;timers.set(id,f);return id},clearTimeout(id){timers.delete(id)},setInterval(){return 1},clearInterval(){},Blob:class{},URL,console,Math,Number,JSON,Date};
  vm.createContext(scope);vm.runInContext(read('dist/arcade.js'),scope);vm.runInContext(read('dist/pathway-ui.js'),scope);
  return{node,frame,joint,run:c=>vm.runInContext(c,scope),userBack(){traverse(-1);flush()},userForward(){traverse(1);flush()},flush,location};
}
const a=arcade();
a.run("openWorld('dragon')");a.flush();
assert.equal(a.node('room').hidden,false);assert.match(a.frame.url,/dragon\/index\.html/);assert.equal(a.location.hash,'#dragon');
a.run("home()");a.flush();assert.equal(a.node('room').hidden,true);assert.equal(a.location.hash,'','the hub button returns to a clean URL');
a.run("openWorld('pong')");a.flush();assert.equal(a.node('roomTitle').textContent,'Ping-Pong Rally');
assert(!a.joint.entries.some(e=>e.kind==='frame'),'game frames never add browser history entries');
a.userBack();
assert.equal(a.node('room').hidden,true,'Back from a game closes the room');assert.equal(a.location.hash,'');assert.equal(a.run('selected'),null);
assert.equal(a.frame.url,'about:blank','the closed room unloads its game');
a.userForward();
assert.equal(a.node('room').hidden,false,'Forward reopens the same game');assert.equal(a.node('roomTitle').textContent,'Ping-Pong Rally');assert.match(a.frame.url,/pong\/index\.html/);
a.userBack();assert.equal(a.node('room').hidden,true);
a.userBack();assert.equal(a.node('room').hidden,true,'Back past the hub never reopens an older game in the room');
// Switching the skill inside a room reloads the game without adding history.
a.run("openWorld('castle')");a.flush();const depth=a.joint.entries.length;a.run("switchPathway(window.ArcadePractice.getPathway()==='add'?'sub':'add')");a.flush();
assert.equal(a.joint.entries.length,depth,'a skill switch inside the room adds no history');a.userBack();assert.equal(a.node('room').hidden,true);
console.log('PASS arcade Back button: Back closes the room to the hub, Forward reopens the same game, frames add no history');
