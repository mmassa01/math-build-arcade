// Shared card behaviours for round 2: answer box on the card with a pad that never moves, a
// large miss correction with a pausable hold (holdMs), the mash guard, a covered card while
// paused, discard for a fresh card on resume, the global idle hold and the Start/3-2-1 gate.
const assert=require('node:assert/strict');
let T=0;const timers=[];let nextId=1;
global.setTimeout=(fn,ms=0)=>{const t={id:nextId++,at:T+Math.max(0,ms),fn};timers.push(t);return t.id;};
global.clearTimeout=id=>{const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);};
Object.defineProperty(globalThis,'performance',{value:{now:()=>T},configurable:true,writable:true});
function advance(ms){const end=T+ms;for(;;){timers.sort((a,b)=>a.at-b.at||a.id-b.id);const t=timers[0];if(!t||t.at>end)break;timers.shift();T=t.at;t.fn();}T=end;}
const animations=[];
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.listeners={};this.style={setProperty(k,v){this[k]=v;}};this.hidden=false;this.disabled=false;this.value='';this.isConnected=true;this.className='';this._text='';const values=new Set();this.classList={values,add:(...a)=>a.forEach(v=>values.add(v)),remove:(...a)=>a.forEach(v=>values.delete(v)),toggle:(v,on)=>{if(on===undefined)on=!values.has(v);if(on)values.add(v);else values.delete(v);return on;},contains:v=>values.has(v)};}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...a){for(const n of a){if(n.parentNode){const p=n.parentNode;p.children=p.children.filter(c=>c!==n);}this.children.push(n);n.parentNode=this;}}
 replaceChildren(...a){for(const n of this.children)n.parentNode=null;this.children=[];this._text='';this.append(...a);}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}addEventListener(k,f){this.listeners[k]=f;}getClientRects(){return this.hidden?[]:[{}];}focus(){document.activeElement=this;}
 getBoundingClientRect(){return{left:200,top:100,width:200,height:120};}
 cloneNode(deep){const c=new Element(this.tagName);c.className=this.className;c._text=this._text;c.attrs={...this.attrs};if(deep)c.append(...this.children.map(n=>n.cloneNode(true)));return c;}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;this.isConnected=false;}
 animate(frames,options){let done;const a={frames,options,paused:false,finished:new Promise(r=>done=r),pause(){this.paused=true;},play(){this.paused=false;},cancel(){done();}};animations.push(a);return a;}
}
const docListeners={};const body=new Element('body');
global.document={hidden:false,activeElement:null,body,createElement:t=>new Element(t),querySelector:()=>null,addEventListener:(t,f)=>{(docListeners[t]=docListeners[t]||[]).push(f);}};
global.matchMedia=()=>({matches:false});
const discarded=[];global.ArcadeLearning={discard:q=>{discarded.push(q);return true;}};
const API=require('../dist/number-entry.js');
const has=(node,cls)=>String(node.className||'').split(' ').includes(cls)||!!node.classList?.contains(cls);const find=(node,cls)=>{if(has(node,cls))return node;for(const c of node.children||[]){const f=find(c,cls);if(f)return f;}return null;};
const hide=on=>{document.hidden=on;for(const f of docListeners.visibilitychange||[])f();};

// Answer box on the card; the pad keeps the same parent and siblings for every operation.
const host=new Element(),answers=[],w=API.mount(host,{onAnswer:v=>answers.push(v)});const problem=w.card.children[1],pad=find(w.root,'number-pad'),row=find(w.root,'number-answer-row');
assert(find(w.root,'card-console-dock').children.includes(w.arena),'arena and answer row share one dock');
const layout=()=>[pad.parentNode,row.children.map(c=>c.className).join('|')];
w.set({id:'mul:12:3',text:'12 × 3',answer:36});assert.equal(w.input.parentNode.className,'number-answer-slot');assert.equal(w.input.parentNode.parentNode,problem,'answer box is on the card');const stacked=layout();
w.set({id:'div:56:8',text:'56 ÷ 8',answer:7});assert.equal(w.input.parentNode.className,'division-quotient');assert.deepEqual(layout(),stacked,'division keeps the pad exactly where it was');
assert.equal(find(w.root,'number-work').children.map(c=>c.className).join(),'number-hint','the hint stays beside the pad (text unchanged)');
assert.equal(API.vertical(new Element(),'7 + 5').slot.className,'number-answer-slot','static vertical() reserves the slot so the card does not grow when the input arrives');

// Correct answers are not slowed: holdMs 0 and the card flies at once.
w.set({id:'add:4:4',text:'4 + 4',answer:8});w.setEnabled(true);w.key('8');assert.deepEqual(answers,[8]);assert(w.resolve(true));assert.equal(w.holdMs,0);assert(!w.holding);assert.equal(animations.length,1,'correct card flies immediately');

// A miss shows the whole fact large, stops the timer bar, then flies after 1.5 s.
w.set({id:'mul:12:3',text:'12 × 3',answer:36},undefined,true);w.setRemaining(2);w.setEnabled(true);w.key('3');w.key('5');assert(w.resolve(false));
assert.equal(w.holdMs,1500);assert(w.holding);assert(has(problem,'number-correction'));assert.equal(problem.getAttribute('aria-label'),'12 × 3 = 36');assert.equal(find(problem,'correction-answer').textContent,'36');assert.equal(find(problem,'correction-left').textContent,'12 × 3 =');assert(!find(problem,'correction-note'),'one miss is a normal hold');
const bar=w.card.children[2].children[0],frozen=bar.style.transform;w.setRemaining(0.4);assert.equal(bar.style.transform,frozen,'timer bar is stopped during the correction');
assert.equal(animations.length,1,'the missed card waits on the table');advance(1499);assert(w.holding);advance(1);assert(!w.holding);assert.equal(animations.length,2,'then flies to the practice pile');assert.equal(w.root.getAttribute('data-practice'),'1');
w.setRemaining(1.5);assert.equal(bar.style.transform,'scaleX(0.5)','timer bar follows the game again after the hold');

// Division correction reads "56 ÷ 8 = 7"; the hold freezes while paused or hidden.
w.set({id:'div:56:8',text:'56 ÷ 8',answer:7},undefined,true);w.resolve(false,{timeout:true});assert.equal(problem.getAttribute('aria-label'),'56 ÷ 8 = 7');assert(!problem.classList.contains('number-division'));
advance(500);w.setPaused(true);advance(5000);assert(w.holding,'pause freezes the correction hold');assert(Math.abs(w.holdLeft-1000)<1);assert(!problem.classList.contains('number-covered'),'a resolved card is not covered');w.setPaused(false);advance(400);hide(true);advance(9000);assert(w.holding,'a hidden page freezes the hold');hide(false);advance(599);assert(w.holding);advance(1);assert(!w.holding);
let after=0;w.afterHold(()=>after++);assert.equal(after,1,'afterHold runs at once when nothing is held');
w.set({id:'add:1:1',text:'1 + 1',answer:2},undefined,true);w.resolve(false,{timeout:true});w.afterHold(()=>after++);advance(1500);assert.equal(after,2,'afterHold runs when the correction ends');
w.set({id:'add:1:2',text:'1 + 2',answer:3},undefined,true);w.resolve(false,{timeout:true});const flown=animations.length;w.set({id:'add:2:2',text:'2 + 2',answer:4});assert(!w.holding,'a new card ends an unfinished hold');assert.equal(animations.length,flown+1,'and the missed card still reaches the pile');

// Mash guard: three wrong answers in a row (timeouts do not count) hold 2.5 s with a note.
const mash=new Element(),m=API.mount(mash);const miss=(q,opts)=>{m.set(q,undefined,true);m.resolve(false,opts);const ms=m.holdMs;m.finishHold();return ms;};
assert.equal(miss({text:'3 + 4',answer:7}),1500);assert.equal(miss({text:'3 + 5',answer:8},{timeout:true}),1500);assert.equal(miss({text:'3 + 6',answer:9}),1500);assert.equal(m.mashCount,2,'a timeout does not count as mashing');
m.set({text:'2 + 6',answer:8},undefined,true);m.resolve(false);assert.equal(m.holdMs,2500,'third wrong answer in a row holds longer');assert(has(m.root,'is-mash-hold'));assert.equal(find(m.card.children[1],'correction-note').textContent,'Look at the answer');m.setEnabled(true);m.key('1');assert.equal(m.input.value,'','input is locked during the hold');m.finishHold();
assert.equal(miss({text:'2 + 7',answer:9}),2500,'mashing keeps the long hold');m.set({text:'1 + 1',answer:2},undefined,true);m.resolve(true);assert.equal(m.holdMs,0);assert.equal(miss({text:'1 + 2',answer:3}),1500,'a correct answer ends the run');
assert.deepEqual(API.correction,{missMs:1500,mashMs:2500,mashAfter:3});

// Paused: the live card is covered, then discarded without recording; resume deals fresh.
const p=API.mount(new Element()),face=p.card.children[1],live={id:'mul:7:8',text:'7 × 8',answer:56,token:'run:1',attemptId:'run:1'};
p.set(live);p.setEnabled(true);p.setPaused(true);assert(face.classList.contains('number-covered'),'paused card is covered');assert.equal(face.getAttribute('data-cover'),'Paused');p.key('5');assert.equal(p.input.value,'','paused card takes no input');
assert.equal(p.discard(),live,'discard returns the abandoned card');assert.deepEqual(discarded,[live],'the learning service is told not to count it');assert(face.classList.contains('number-covered'),'blank face stays covered while paused');assert.equal(p.discard(),null,'discard is idempotent');assert(!p.resolve(false),'an abandoned card cannot be resolved later');assert(!p.holding);
const wrapped={question:{id:'add:1:3',token:'run:2'},text:'1 + 3',answer:4};p.set(wrapped);p.discard();assert.equal(discarded.at(-1),wrapped.question,'cards that wrap a learning question discard that question');
p.setPaused(false);assert(!face.classList.contains('number-covered'));const fresh={id:'add:2:5',text:'2 + 5',answer:7};p.set(fresh);p.setEnabled(true);p.key('7');assert.equal(p.input.value,'7','fresh card after resume works');

// Global idle hold covers and locks every widget without touching the game's own pause flag.
const g=API.mount(new Element());g.set({id:'add:3:3',text:'3 + 3',answer:6});g.setEnabled(true);API.hold('idle',true);assert(g.paused);assert(g.card.children[1].classList.contains('number-covered'));g.setPaused(false);g.key('6');assert.equal(g.input.value,'','game unpausing cannot bypass the idle hold');API.hold('idle',false);g.key('6');assert.equal(g.input.value,'6');

// Start gate: Start, then 3-2-1 that stops while paused or hidden, then onStart once.
const gateHost=new Element();let started=0,paused=false;const gate=API.startGate(gateHost,{onStart:()=>started++,isPaused:()=>paused});const root=gate.root,btn=find(root,'start-gate-button'),count=find(root,'start-gate-count');
assert(gateHost.classList.contains('has-start-gate'));assert.equal(btn.textContent,'Start');assert.equal(document.activeElement,btn,'Start takes focus');advance(10000);assert.equal(started,0,'nothing starts before Start is pressed');assert.equal(gate.phase,'ready');
btn.onclick();assert.equal(count.textContent,'3');advance(1050);assert.equal(count.textContent,'2');paused=true;advance(5000);assert.equal(count.textContent,'2','game pause stops the count');assert(root.classList.contains('is-paused'));paused=false;advance(1000);assert.equal(count.textContent,'1');hide(true);advance(5000);assert.equal(started,0,'hidden page stops the count');hide(false);API.hold('idle',true);advance(5000);assert.equal(started,0,'idle hold stops the count');API.hold('idle',false);advance(1100);assert.equal(started,1);assert.equal(gate.phase,'done');assert(!gateHost.classList.contains('has-start-gate'));assert(!root.isConnected,'gate removes itself');advance(5000);assert.equal(started,1,'onStart runs once');
const g2=API.startGate(gateHost,{onStart:()=>started++});const g3=API.startGate(gateHost,{onStart:()=>started++,auto:true});assert.equal(g2.phase,'done','a second gate on the same host replaces the first');advance(3100);assert.equal(started,2);g3.cancel();
const g4=API.startGate(gateHost,{onStart:()=>started++});g4.start();g4.cancel();advance(4000);assert.equal(started,2,'cancel stops a gate for good');
const hiddenHost=new Element();hiddenHost.hidden=true;const g5=API.startGate(hiddenHost,{onStart:()=>started++,count:0});assert(has(g5.root,'is-fixed'),'a hidden host gets a full-screen gate');find(g5.root,'start-gate-button').onclick();assert.equal(started,3,'count 0 starts at once');

w.reset();m.reset();p.reset();g.reset();
console.log('PASS round-2 card: answer box on the card with a fixed pad, 1.5 s miss correction with a stopped bar and pausable hold, 2.5 s mash guard, covered pause, discard, idle hold and the Start/3-2-1 gate');
