// Idle "Still there?" guard in the shared practice client. Unanswered timeouts are held back:
// an answer records them first (in order), a third timeout in a row discards them, pauses the
// games and shows one big resume button. Nothing from an idle stretch reaches the service, so a
// class demo with nobody answering no longer reports "0 correct, 0%".
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const factory=require('../dist/practice-pathways.js').create;
const source=fs.readFileSync('dist/practice-client.js','utf8');
let time=0;
function service(){const data=new Map(),api=factory({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},()=>new Date(2026,10,19,9).getTime()+time,()=>.31);api.setGrade(3);api.setPathway('mixed');const log=[];const svc=Object.create(api);svc.begin=o=>{const run=api.begin(o),record=run.record;run.record=(q,c,ms,opts={})=>{const r=record(q,c,ms,opts);if(r.accepted)log.push({id:q.id,correct:!!c,timeout:!!opts.timeout,demo:!!o?.demo});return r;};return run;};return{api,svc,log,data};}
function child(svc){const created=[],events=[],listeners={},messages=[],holds=[];
 const make=tag=>{const n={tagName:String(tag).toUpperCase(),id:'',style:{},children:[],attrs:{},isConnected:false,textContent:'',append(...a){for(const c of a){this.children.push(c);c.parentNode=this;c.isConnected=this.isConnected;}},setAttribute(k,v){this.attrs[k]=String(v);},focus(){document.activeElement=this;},remove(){this.isConnected=false;}};created.push(n);return n;};
 const body=make('body');body.isConnected=true;const connect=n=>{n.isConnected=true;for(const c of n.children)connect(c);};body.append=function(...a){for(const c of a){this.children.push(c);connect(c);}};
 const document={hidden:false,readyState:'complete',body,activeElement:null,getElementById:id=>created.find(n=>n.id===id&&n.isConnected)||null,createElement:make,addEventListener:(t,f)=>listeners[t]=f,dispatchEvent:e=>{events.push(e.type);listeners[e.type]?.(e);}};
 const window={addEventListener:(t,f)=>listeners['window:'+t]=f,ArcadeNumberEntry:{hold:(reason,on)=>holds.push([reason,on])}};
 const parent={location:{origin:'https://arcade.test'},ArcadePractice:svc,postMessage:m=>messages.push(m)};
 const s={window,parent,document,location:{origin:'https://arcade.test'},performance:{now:()=>time},Date,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},setTimeout:()=>0,clearTimeout(){},console};
 vm.createContext(s);vm.runInContext(source,s);return{api:window.ArcadeLearning,document,events,listeners,holds,messages};}
const card=(c)=>{const q=c.api.next();time+=200;return q;};
const timeout=(c,q)=>{time+=3000;return c.api.record(q,false,3000,{timeout:true});};

// 1. Two timeouts then an answer: the timeouts are recorded first, in order, then the answer.
{const s=service(),c=child(s.svc);c.api.begin(false);const a=card(c),b=card(c),d=card(c);
 const held=timeout(c,a);assert.equal(held.accepted,true,'a held timeout reads as accepted to the game');assert.equal(held.held,true);assert.equal(held.correct,false,'a held timeout never pays');assert.equal(s.log.length,0,'held timeouts do not reach the service');
 timeout(c,b);assert.equal(c.api.held,2);assert.equal(c.api.idle,false);
 assert(c.api.record(d,true,900).accepted);assert.deepEqual(s.log.map(r=>[r.id,r.timeout]),[[a.id,true],[b.id,true],[d.id,false]],'answer flushes held timeouts first, in order');assert.equal(c.api.held,0);
 assert.equal(c.api.record(a,false,3000,{timeout:true}).accepted,false,'a flushed timeout cannot be recorded twice');}

// 2. A wrong answer also proves someone is there.
{const s=service(),c=child(s.svc);c.api.begin(false);const a=card(c),b=card(c);timeout(c,a);c.api.record(b,false,1200);assert.deepEqual(s.log.map(r=>[r.id,r.correct,r.timeout]),[[a.id,false,true],[b.id,false,false]]);}

// 3. Three timeouts in a row: discarded, games paused, overlay shown, nothing counted.
{const s=service(),c=child(s.svc);c.api.begin(false);const a=card(c),b=card(c),d=card(c);timeout(c,a);timeout(c,b);const onScreen=card(c);const third=timeout(c,d);
 assert.equal(third.accepted,false);assert.equal(third.reason,'idle');assert.equal(s.log.length,0,'idle timeouts are never recorded');assert.equal(c.api.idle,true);
 assert(c.events.includes('arcade-idle-pause'),'games are told to pause');assert.deepEqual(c.holds.at(-1),['idle',true],'every number pad is held');
 const overlay=c.document.getElementById('arcadeIdle');assert(overlay,'Still there? overlay is shown');assert.equal(overlay.attrs.role,'dialog');const button=c.document.getElementById('arcadeIdleResume');assert(button&&typeof button.onclick==='function','overlay has one big resume button');assert.equal(c.document.activeElement,button,'resume button takes focus');
 assert.equal(c.api.record(onScreen,true,500).reason,'discarded','the card on screen when the student left is discarded too');
 const during=card(c);assert.equal(c.api.record(during,false,3000,{timeout:true}).accepted,false,'cards dealt behind the overlay are not counted');assert.equal(s.log.length,0);
 assert.equal(s.api.stats().clearedToday,0);const today=JSON.stringify([...s.data.values()]);assert(!/"cards":[1-9]/.test(today),'the daily log has no cards from the idle stretch');
 button.onclick();assert.equal(c.api.idle,false);assert(c.events.includes('arcade-idle-resume'));assert.deepEqual(c.holds.at(-1),['idle',false]);assert.equal(c.document.getElementById('arcadeIdle'),null,'overlay closes');
 const fresh=card(c);assert(c.api.record(fresh,true,800).accepted,'a fresh card after resume counts');assert.deepEqual(s.log.map(r=>r.id),[fresh.id]);
 assert.equal(c.api.resumeIdle(),false,'resume is idempotent');}

// 4. Discard: a paused card is abandoned without recording; held timeouts are kept as real misses.
{const s=service(),c=child(s.svc);c.api.begin(false);const a=card(c),b=card(c);timeout(c,a);assert(c.api.discard(b));assert.deepEqual(s.log.map(r=>r.id),[a.id],'a pause is a person: held timeouts are recorded');assert.equal(c.api.record(b,true,400).reason,'discarded');assert.equal(c.api.discard(b),false,'discard is idempotent');
 const next=card(c);assert(c.api.record(next,true,600).accepted);assert.equal(s.log.length,2);}

// 5. A discarded fact is not lost: the service only reserves it for the current run.
{const s=service(),c=child(s.svc);c.api.begin(false);const a=card(c);c.api.discard(a);c.api.begin(false);const seen=new Set();for(let i=0;i<400&&!seen.has(a.id);i++){const q=card(c);seen.add(q.id);c.api.record(q,true,700);}assert(seen.has(a.id),'a discarded fact is dealt again in a later run');}

// 6. A new run or leaving the page records fewer-than-three held timeouts as ordinary misses.
{const s=service(),c=child(s.svc);c.api.begin(false);const a=card(c),b=card(c);timeout(c,a);timeout(c,b);c.api.begin(false);assert.deepEqual(s.log.map(r=>r.id),[a.id,b.id],'begin flushes held timeouts');
 const d=card(c);timeout(c,d);c.listeners['window:pagehide']();assert.deepEqual(s.log.map(r=>r.id),[a.id,b.id,d.id],'pagehide flushes held timeouts');
 const e=card(c);timeout(c,e);c.api.flush();assert.equal(s.log.at(-1).id,e.id,'games can flush at game over');}

// 7. Demo never holds, never shows the overlay, and never saves.
{const s=service(),c=child(s.svc),before=JSON.stringify([...s.data]);c.api.begin(true);for(let i=0;i<5;i++)timeout(c,card(c));assert.equal(c.api.idle,false);assert.equal(c.document.getElementById('arcadeIdle'),null,'no overlay in demo');assert(s.log.every(r=>r.demo),'demo results stay in the demo run');assert.equal(JSON.stringify([...s.data]),before,'demo writes nothing');}

console.log('PASS idle pause: held timeouts flush in order on an answer, three in a row are discarded with a Still there? overlay and pause/resume events, discard abandons a paused card, demo is untouched');
