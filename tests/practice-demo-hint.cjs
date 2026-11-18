// The shared practice client used to pin a "<SKILL> PATHWAY" pill (id gradePracticeHint) to the
// bottom centre of every game. On phones it sat on top of each game's own bottom row (Castle's
// Watch demo / Pause / Restart, keypad keys, footers), and no fixed spot is free in all ten
// games. The arcade room bar and the game toolbars now name the practiced skill, so the client
// adds no floating element in play or in demo. Every game labels its own demo instead; Horse
// Race was the one game without a label, so its toolbar title now says so. Demo isolation (no
// saved progress) must be unaffected.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{create}=require('../dist/practice.js');
const read=file=>fs.readFileSync(file,'utf8');
let writes=0;const saved={};
const service=create({getItem:k=>saved[k],setItem:(k,v)=>{saved[k]=v;writes++}},()=>Date.UTC(2026,9,15,12),()=>.2);
service.setGrade(3);
function child(){
  const added=[];let time=0;
  const make=()=>({id:'',textContent:'',style:{cssText:''},isConnected:false,setAttribute(){},append(){},focus(){},remove(){this.isConnected=false}});
  const document={hidden:false,readyState:'complete',body:{append(n){n.isConnected=true;added.push(n)}},getElementById:id=>added.find(n=>n.id===id&&n.isConnected)||null,createElement:make,addEventListener(){},dispatchEvent(){}};
  const window={},parent={location:{origin:'https://arcade.test'},ArcadePractice:service,postMessage(){}};
  const scope={window,parent,document,location:{origin:'https://arcade.test'},performance:{now:()=>time},Date,CustomEvent:class{constructor(type){this.type=type}},setTimeout:()=>1,clearTimeout(){},console};
  vm.createContext(scope);vm.runInContext(read('dist/practice-client.js'),scope);
  return{api:window.ArcadeLearning,added,tick:ms=>{time+=ms}};
}
const game=child();
assert(game.api.active,'client is attached to the arcade practice service');
assert.equal(game.api.begin(false),true);
assert.equal(game.added.length,0,'normal play adds no floating pill over the game');
assert.equal(game.api.begin(true),true);
assert.equal(game.added.length,0,'demo adds no floating pill over the game controls either');

// Demo answers still save nothing.
const before=writes,remaining=service.stats().remaining;
const q=game.api.next();game.tick(500);
assert(game.api.record(q,true).accepted);
assert.equal(writes,before,'demo answers are not written to storage');
assert.equal(service.stats().remaining,remaining,'demo answers do not change practice progress');

const client=read('dist/practice-client.js');
assert(!client.includes('gradePracticeHint')&&!client.includes(" PATHWAY'")&&!/position:fixed;bottom/.test(client),'the bottom-centre pathway pill is gone from the shared client');
// The skill is still named where it cannot cover controls: the room bar and the setup tag.
assert(client.includes("tag.textContent='Practicing: '+name"),'setup screens still name the practiced skill');
assert(read('dist/index.html').includes('id="roomSkill"'),'the arcade room bar still names the practiced skill');

// Each game carries its own demo label, so removing the pill leaves no unlabeled demo.
const own={
  'wave/index.html':/DEMO • /,'dirt/index.html':/DEMO • /,
  'invaders/index.html':/DEMO • NO COINS EARNED/,'dragon/index.html':/DEMO • NO COINS EARNED/,'pong/game.js':/DEMO · /,
  'castle/index.html':/Demo: every cleared card/,'seed/index.html':/Demo: every cleared card/,'hangar/index.html':/Demo: every cleared card/,
  'subway/game.js':/Stop demo/
};
for(const [file,label] of Object.entries(own))assert(label.test(read('dist/'+file)),file+' labels its own demo');
const horseJs=read('dist/races/horse-standalone.js'),horseCss=read('dist/races/horse-cinema.css');
assert(horseJs.includes("automated=mode!=='play';"),'horse demo flag comes from the requested mode');
assert(horseJs.includes("document.body.classList.toggle('horse-demo',automated);"),'horse marks demo and video runs on the body, and clears the mark when play begins');
assert(/\.horse-cinematic\.horse-demo \.horse-controls::before\{content:'DEMO \\2022  COINS ARE NOT SAVED'/.test(horseCss),'horse toolbar title becomes the demo label');
assert(horseCss.indexOf(".horse-controls::before{content:'TIGER DOWNS / RACE DAY'")<horseCss.indexOf('.horse-demo .horse-controls::before'),'demo label follows and overrides the normal toolbar title');
console.log('practice demo hint: no floating pill in play or demo, every game labels its own demo, demo still saves nothing');
