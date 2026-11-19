(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ArcadeNumberEntry=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const motion=Object.freeze({
 card:Object.freeze({duration:220,easing:'cubic-bezier(.22,.7,.3,1)',fill:'forwards'}),
 recycle:Object.freeze({duration:380,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'})
});
function digitCount(answer){return /^\d+$/.test(String(answer))?String(answer).length:0;}
class Buffer{
 constructor(){this.reset(null);}
 reset(answer){this.expected=Number(answer);this.length=answer===null?0:digitCount(answer);this.value='';this.complete=false;}
 key(key){if(this.complete||!this.length)return null;if(key==='Backspace'){this.value=this.value.slice(0,-1);return null;}if(key==='Clear'||key==='Escape'){this.value='';return null;}if(!/^\d$/.test(key))return null;this.value+=key;return this.check();}
 replace(value){if(this.complete||!/^\d*$/.test(value)||value.length>this.length)return null;this.value=value;return this.check();}
 check(){if(this.value.length!==this.length)return null;this.complete=true;return{value:Number(this.value),correct:Number(this.value)===this.expected};}
}
function wrong(answer){return(Number(answer)+1)%Math.pow(10,digitCount(answer));}
function parse(text){const m=String(text||'').match(/^\s*(\d+)\s*([+×x*÷/−-])\s*(\d+)/);return m?{top:m[1],operator:({'x':'×','*':'×','/':'÷','-':'−'})[m[2]]||m[2],bottom:m[3]}:null;}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
// Stacked facts reserve an answer slot under the rule, so the answer box sits on the card for
// every operation (division already puts it above the bracket) and the pad never moves.
function vertical(node,text){node.replaceChildren();node.classList.add('number-problem');node.classList.remove('number-division','number-correction','number-covered');node.setAttribute('role','math');node.setAttribute('aria-label',String(text||'').replace(/\s*=.*$/,''));const p=parse(text);if(!p){node.textContent=text||'Ready?';return null;}if(p.operator==='÷'){node.classList.add('number-division');const quotient=el('span','division-quotient','?');node.append(quotient,el('span','division-divisor',p.bottom),el('span','division-dividend',p.top));return{division:true,quotient};}const top=el('span','number-top',p.top),bottom=el('span','number-bottom'),slot=el('span','number-answer-slot');bottom.append(el('span','number-op',p.operator),el('span','number-operand',p.bottom));node.append(top,bottom,slot);return{division:false,slot};}
// The whole fact, written left to right, for the correction shown after a miss.
function correctionText(text,answer){const p=parse(text);const left=p?`${p.top} ${p.operator} ${p.bottom}`:String(text||'').replace(/\s*=.*$/,'').trim();return{left,answer:String(answer),text:`${left} = ${answer}`};}
// A moving card leaves its themed parent. Freeze its painted presentation before
// doing so, otherwise ancestor-dependent fonts and !important heights jump.
function freezeAppearance(source,clone){
 const rect=source.getBoundingClientRect?.();
 const put=(node,key,value)=>{if(node.style?.setProperty)node.style.setProperty(key,value,'important');else if(node.style)node.style[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;};
 if(rect){put(clone,'width',rect.width+'px');put(clone,'height',rect.height+'px');put(clone,'min-height','0');put(clone,'max-height','none');put(clone,'min-width','0');put(clone,'max-width','none');}
 if(typeof getComputedStyle!=='function')return clone;
 const sources=[source,...Array.from(source.querySelectorAll?.('*')||[])],copies=[clone,...Array.from(clone.querySelectorAll?.('*')||[])];
 for(let i=0;i<Math.min(sources.length,copies.length);i++){const s=getComputedStyle(sources[i]);for(const key of ['font-family','font-size','font-weight','font-style','line-height','letter-spacing','color','text-shadow']){const value=s.getPropertyValue(key);if(value)put(copies[i],key,value);}}
 const s=getComputedStyle(source);for(const key of ['background','border','border-radius','box-shadow','--ink','--accent']){const value=s.getPropertyValue(key);if(value)put(clone,key,value);}
 return clone;
}
function makeArena(box,work,problem,pad){const meta=el('div','card-console-meta');meta.append(el('span','card-console-context','YOUR FACTS · YOUR ADVENTURE'),el('span','card-console-duration','3 seconds per card'));const arena=el('div','card-console-arena');function pile(kind,title){const wrap=el('div','card-console-pile '+kind),stack=el('div','card-pile-stack'),count=el('span','card-pile-count','0');stack.append(count);wrap.append(el('h2','card-pile-label',title),stack);return{wrap,stack,count};}const left=pile('cleared','★ CLEARED'),right=pile('practice','↻ PRACTICE'),middle=el('div','card-console-center'),card=el('div','card-console-card'),tag=el('span','card-console-tag','CURRENT CARD · 3 SECONDS'),track=el('div','card-console-timer'),bar=el('i','card-console-bar');track.setAttribute('role','progressbar');track.setAttribute('aria-label','Time remaining on this card');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','3');track.append(bar);card.append(tag,problem,track);middle.append(card);arena.append(left.wrap,middle,right.wrap);const row=el('div','number-answer-row');row.append(work,pad);const dock=el('div','card-console-dock');dock.append(arena,row);box.replaceChildren(meta,dock);box.classList.add('shared-card-console');return{arena,card,left,right,bar,dock};}
// Miss correction. After a wrong answer or a timeout the card shows the whole fact large for
// missMs with the timer bar stopped, then flies to the practice pile. After mashAfter wrong
// answers in a row (timeouts neither count nor break the run) the hold grows to mashMs with
// "Look at the answer". widget.holdMs tells the game how long to wait; correct answers are 0.
const correction=Object.freeze({missMs:1500,mashMs:2500,mashAfter:3});
const clock=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
// A countdown that only advances while it is allowed to run (not paused, page visible).
function pausableTimer(ms,done){let left=Math.max(0,ms),at=0,id=null,over=false;const fire=()=>{id=null;over=true;done();};return{get left(){return id?Math.max(0,left-(clock()-at)):left;},get over(){return over;},run(){if(over||id)return;at=clock();id=setTimeout(fire,left);},stop(){if(!id)return;left=Math.max(0,left-(clock()-at));clearTimeout(id);id=null;},cancel(){over=true;clearTimeout(id);id=null;},finish(){if(over)return;this.cancel();done();}};}
// Global holds (for example the idle "Still there?" overlay) pause and cover every widget and
// start gate on the page without touching each game's own setPaused calls.
const holds=new Set(),gates=new Set();
function refreshAll(){for(const w of widgets)w.sync?.();for(const g of gates)g.sync();}
function hold(reason,on=true){if(on)holds.add(String(reason));else holds.delete(String(reason));refreshAll();return holds.size>0;}
const hosts=new WeakMap(),widgets=new Set();let keyboardInstalled=false;
function mount(host,{source=null,externalProblem=false,canAnswer=()=>true,onAnswer=()=>{}}={}){
 if(!host)return null;let w=hosts.get(host);if(w){w.attach();return w;}
 const buffer=new Buffer(),box=document.createElement('div'),work=document.createElement('div'),problem=document.createElement('div'),input=document.createElement('input'),hint=document.createElement('span'),pad=document.createElement('div');
 box.className='number-entry'+(externalProblem?' external-problem':'');work.className='number-work';pad.className='number-pad';pad.setAttribute('role','group');pad.setAttribute('aria-label','Number pad');input.type='text';input.inputMode='none';input.autocomplete='off';input.spellcheck=false;input.className='number-input';input.setAttribute('aria-label','Type your answer');input.setAttribute('autocapitalize','off');input.setAttribute('data-lpignore','true');hint.className='number-hint';hint.textContent='Type your answer';if(!externalProblem)work.append(problem);work.append(input,hint);box.append(work,pad);
 if(externalProblem){const row=el('div','number-answer-row');row.append(work,pad);box.replaceChildren(row);}const board=externalProblem?null:makeArena(box,work,problem,pad),cleared=new Set(),practice=new Set(),flights=new Set();let generation=0,presentation=0,resolved=false;
 let current=null,enabled=false,ownPaused=false,submit=onAnswer,gate=canAnswer,blank=false,holdTimer=null,holdMs=0,mash=0,waiters=[];
 const face=()=>externalProblem?source:problem;
 const isPaused=()=>ownPaused||holds.size>0;
 function factKey(q){return String(q?.id||q?.question?.id||q?.text||q?.prompt||presentation);}
 function learningQuestion(q){return q&&(q.token||q.attemptId)?q:q?.question&&(q.question.token||q.question.attemptId)?q.question:null;}
 function counts(){if(board){board.left.count.textContent=String(cleared.size);board.right.count.textContent=String(practice.size);board.left.stack.classList.toggle('filled',cleared.size>0);board.right.stack.classList.toggle('filled',practice.size>0);}box.setAttribute('data-cleared',String(cleared.size));box.setAttribute('data-practice',String(practice.size));}
 function cancelFlights(){for(const f of flights){f.animation?.cancel?.();f.clone.remove?.();}flights.clear();}
 function fly(correct){if(!board?.card?.cloneNode||!board.card.getBoundingClientRect||!document.body?.append)return;const from=board.card.getBoundingClientRect(),to=(correct?board.left:board.right).stack.getBoundingClientRect();if(!from.width||!from.height||!to.width||!to.height)return;const clone=board.card.cloneNode(true);clone.classList.add('number-flying-card');clone.setAttribute('aria-hidden','true');clone.style.cssText=`position:fixed;left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;transform-origin:0 0;pointer-events:none;margin:0;z-index:10000;`;freezeAppearance(board.card,clone);document.body.append(clone);board.card.classList.add('card-is-flying');const f={clone,animation:null};flights.add(f);if(!clone.animate){clone.remove?.();flights.delete(f);board.card.classList.remove('card-is-flying');return;}const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;f.animation=clone.animate([{transform:'translate3d(0,0,0) scale(1,1)',opacity:1},{transform:`translate3d(${to.left-from.left}px,${to.top-from.top}px,0) scale(${to.width/from.width},${to.height/from.height})`,opacity:1}],{...motion.card,duration:reduced?0:motion.card.duration});if(isPaused())f.animation.pause?.();Promise.resolve(f.animation.finished).catch(()=>{}).then(()=>{clone.remove?.();flights.delete(f);});}
 const available=()=>enabled&&!isPaused()&&!buffer.complete&&gate()&&!document.hidden&&box.isConnected&&!host.hidden;
 function paint(){input.value=buffer.value;input.style.setProperty('--answer-digits',Math.max(1,buffer.length));input.setAttribute('aria-label',`Your answer, ${buffer.length||1} digit${buffer.length===1?'':'s'}`);input.maxLength=buffer.length||1;input.placeholder='?';hint.textContent=buffer.complete?(Number(buffer.value)===buffer.expected?'✓ Correct':`Answer: ${buffer.expected}`):buffer.length?`Type ${buffer.length} digit${buffer.length===1?'':'s'} · checks automatically`:'Type your answer';}
 function accept(result){paint();if(!result)return;box.classList.toggle('is-correct',result.correct);box.classList.toggle('is-wrong',!result.correct);w.setEnabled(false);submit(result.value);}
 function key(k){if(!available())return;accept(buffer.key(k));}
 // Cover the live problem (and its answer box) while paused, so a paused card cannot be read.
 function cover(){const node=face();if(!node?.classList)return;const on=isPaused()&&(blank||!!current&&!resolved);node.classList.toggle('number-covered',on);if(on)node.setAttribute('data-cover','Paused');box.classList.toggle('is-paused',isPaused());}
 function showCorrection(q,long){const node=face();if(!node?.replaceChildren)return;const c=correctionText(q?.text||q?.prompt||'',buffer.expected);node.replaceChildren();node.classList.remove('number-division','number-covered');node.classList.add('number-correction');node.setAttribute('aria-label',c.text);const fact=el('span','correction-fact');fact.append(el('span','correction-left',c.left+' ='),el('b','correction-answer',c.answer));node.append(fact);if(long)node.append(el('span','correction-note','Look at the answer'));}
 function endHold(flyCard){if(!holdTimer)return;const t=holdTimer;holdTimer=null;t.cancel();box.classList.remove('is-holding','is-mash-hold');board?.card.classList.remove('is-holding');if(flyCard&&board){counts();fly(false);}const list=waiters;waiters=[];for(const f of list){try{f();}catch(e){setTimeout(()=>{throw e;});}}}
 function sync(){const motionPaused=isPaused();for(const f of flights){try{motionPaused?f.animation?.pause?.():f.animation?.play?.();}catch{}}if(holdTimer){if(motionPaused||document.hidden)holdTimer.stop();else holdTimer.run();}w.setEnabled(enabled);cover();}
 for(const k of ['1','2','3','4','5','6','7','8','9','Clear','0','Backspace']){const b=document.createElement('button');b.type='button';b.className='number-key';b.textContent=k==='Backspace'?'⌫':k;b.setAttribute('aria-label',k==='Backspace'?'Delete last digit':k==='Clear'?'Clear answer':k);if(k==='Clear'||k==='Backspace')b.classList.add('number-edit');b.addEventListener('pointerdown',e=>e.preventDefault());b.onclick=()=>key(k);pad.append(b);}
 input.addEventListener('input',()=>{if(!available()){paint();return;}const value=input.value;const result=buffer.replace(value);accept(result);});input.addEventListener('paste',e=>{e.preventDefault();if(!available())return;const value=e.clipboardData?.getData('text').trim()||'';accept(buffer.replace(value));});
 w={host,root:box,input,buffer,card:board?.card,arena:board?.arena,correction,
  get visibleReady(){return flights.size===0&&!holdTimer;},
  get counts(){return{cleared:cleared.size,practice:practice.size};},
  // Milliseconds the last resolve() asked the game to wait before its next card (0 = correct).
  get holdMs(){return holdMs;},
  // True while the correction is on the card. Games keep their clocks stopped while this is true.
  get holding(){return!!holdTimer;},
  get holdLeft(){return holdTimer?holdTimer.left:0;},
  get paused(){return isPaused();},
  get mashCount(){return mash;},
  attach(){if(box.parentNode!==host)host.replaceChildren(box);host.classList.add('numeric-host');if(board)host.classList.add('three-pile-host');host.setAttribute('aria-label','Type the answer using your keyboard or the number pad');if(source&&!externalProblem){source.classList.add('number-source');source.setAttribute('aria-hidden','true');}},
  set(question,callback=submit,force=false){w.attach();submit=callback;if(current===question&&!force)return;endHold(true);current=question;resolved=false;blank=false;presentation++;box.setAttribute('data-presentation',String(presentation));box.setAttribute('data-card-key',factKey(question));buffer.reset(question?.answer??null);board?.card.classList.remove('card-is-flying');box.classList.remove('is-correct','is-wrong');const text=question?.text||question?.prompt||'';if(source)source.textContent=text;work.replaceChildren(input,hint);const shape=vertical(externalProblem?source:problem,text);box.classList.toggle('has-division',!!shape?.division);if(shape?.division)shape.quotient.replaceChildren(input);else if(shape?.slot)shape.slot.replaceChildren(input);paint();w.setRemaining(3);w.setEnabled(false);cover();},
  setEnabled(value){const was=enabled,paused=isPaused();enabled=!!value&&buffer.length>0&&!buffer.complete;input.disabled=!enabled||paused;for(const b of pad.children)b.disabled=!enabled||paused;box.classList.toggle('is-disabled',!enabled||paused);if(enabled&&!paused&&!was&&!document.hidden&&box.isConnected&&!document.querySelector('dialog[open]'))input.focus({preventScroll:true});},
  setPaused(value){ownPaused=!!value;sync();},
  resolve(correct,{timeout=false}={}){if(resolved||!current)return false;resolved=true;buffer.complete=true;w.setEnabled(false);box.classList.toggle('is-correct',!!correct);box.classList.toggle('is-wrong',!correct);if(timeout)hint.textContent=`Time's up · Answer: ${buffer.expected}`;const key=factKey(current);if(correct){mash=0;holdMs=0;practice.delete(key);cleared.add(key);if(board){counts();fly(true);}else counts();cover();return true;}if(!timeout)mash++;const long=mash>=correction.mashAfter;holdMs=long?correction.mashMs:correction.missMs;if(!cleared.has(key))practice.add(key);showCorrection(current,long);box.classList.add('is-holding');box.classList.toggle('is-mash-hold',long);board?.card.classList.add('is-holding');holdTimer=pausableTimer(holdMs,()=>endHold(true));if(!board)counts();cover();sync();return true;},
  // Ends the correction early (for example on game over). The missed card still flies.
  finishHold(){endHold(true);},
  // Runs fn once the correction hold is over (immediately when there is none).
  afterHold(fn){if(typeof fn!=='function')return()=>{};if(!holdTimer){fn();return()=>{};}waiters.push(fn);return()=>{waiters=waiters.filter(f=>f!==fn);};},
  // Abandons the live card without recording it (pause, idle). The face stays covered while
  // paused; the game deals a fresh card on resume. Returns the abandoned card or null.
  discard(){const q=current;if(!q||resolved)return null;resolved=true;buffer.complete=true;current=null;blank=true;try{const api=typeof ArcadeLearning!=='undefined'?ArcadeLearning:globalThis.ArcadeLearning;const lq=learningQuestion(q);if(lq)api?.discard?.(lq);}catch{}buffer.reset(null);paint();const node=face();if(node)vertical(node,'');box.classList.remove('has-division','is-correct','is-wrong');w.setEnabled(false);w.setRemaining(3);cover();return q;},
  setRemaining(seconds){if(!board||holdTimer)return;const n=Math.max(0,Math.min(3,Number(seconds)||0));board.bar.style.transform=`scaleX(${n/3})`;board.bar.parentNode?.setAttribute('aria-valuenow',n.toFixed(1));},
  reset(){generation++;waiters=[];if(holdTimer){holdTimer.cancel();holdTimer=null;}box.classList.remove('is-holding','is-mash-hold','is-correct','is-wrong');board?.card.classList.remove('is-holding');holdMs=0;mash=0;cancelFlights();ownPaused=false;current=null;resolved=false;blank=false;cleared.clear();practice.clear();counts();board?.card.classList.remove('card-is-flying');buffer.reset(null);paint();w.setEnabled(false);w.setRemaining(3);cover();},
  showDemo(value){buffer.value=String(value).padStart(buffer.length,'0');paint();},key,clear(){buffer.value='';paint();},sync};
 hosts.set(host,w);widgets.add(w);w.attach();counts();paint();w.setEnabled(false);
 if(!keyboardInstalled){keyboardInstalled=true;document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.repeat)return;if(!/^\d$/.test(e.key)&&!['Backspace','Delete','Escape','Enter'].includes(e.key))return;for(const item of widgets){if(!item.root.isConnected){widgets.delete(item);continue;}if(item!==w&&!item.root.getClientRects().length)continue;const focused=document.activeElement;if(focused&&/^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)&&focused!==item.input)continue;if(e.key==='Enter'&&focused&&/^(BUTTON|SUMMARY|A)$/.test(focused.tagName))continue;if(item.input.disabled||!item.root.getClientRects().length)continue;e.preventDefault();e.stopImmediatePropagation();if(e.key!=='Enter')item.key(e.key==='Delete'?'Clear':e.key);break;}},true);document.addEventListener('visibilitychange',refreshAll);}
 return w;
}
// Start gate. Shows a Start button over the answer area, then a 3-2-1 count, then calls
// onStart. The count stops while the game reports paused, while the page is hidden and while a
// global hold (idle overlay) is up. Games call it before their first card and after a skill
// switch, and deal no card until onStart runs.
function startGate(host,{onStart=()=>{},title='Ready?',button='Start',count=3,isPaused=()=>false,auto=false}={}){
 if(host)for(const g of gates)if(g.host===host)g.cancel();
 const inside=!!host&&typeof host.getClientRects==='function'&&host.getClientRects().length>0&&!host.hidden,target=inside?host:document.body;
 const wrap=el('div','number-start-gate'+(inside?'':' is-fixed')),panel=el('div','start-gate-card'),label=el('div','start-gate-title',title),btn=el('button','start-gate-button',button),digit=el('div','start-gate-count');
 btn.type='button';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-label',title);digit.setAttribute('aria-live','assertive');panel.append(label,btn,digit);wrap.append(panel);if(inside)host.classList.add('has-start-gate');target.append(wrap);
 let phase='ready',elapsed=0,last=0,timer=null,own=false,shown=null;
 const stopped=()=>own||holds.size>0||!!document.hidden||!!isPaused();
 function show(n){if(shown===n)return;shown=n;digit.textContent=String(n);digit.classList.remove('pop');void digit.offsetWidth;digit.classList.add('pop');}
 function tick(){timer=null;if(phase!=='count')return;const t=clock(),paused=stopped();if(!paused)elapsed+=t-last;last=t;wrap.classList.toggle('is-paused',paused);label.textContent=paused?'Paused':title;const left=Math.ceil(count-elapsed/1000);if(left<=0){finish();return;}show(left);timer=setTimeout(tick,50);}
 function begin(){if(phase!=='ready')return;phase='count';wrap.classList.add('is-counting');btn.hidden=true;elapsed=0;last=clock();if(count<=0){finish();return;}show(count);timer=setTimeout(tick,50);}
 function close(){clearTimeout(timer);timer=null;wrap.remove();if(inside)host.classList.remove('has-start-gate');gates.delete(g);}
 function finish(){if(phase==='done')return;phase='done';close();onStart();}
 const g={host,get phase(){return phase;},get root(){return wrap;},start:begin,skip:finish,cancel(){if(phase==='done')return;phase='done';close();},setPaused(v){own=!!v;g.sync();},sync(){wrap.classList.toggle('is-paused',stopped());if(phase==='count'){last=clock();if(!timer)timer=setTimeout(tick,50);}}};
 btn.onclick=begin;gates.add(g);if(auto)begin();else try{btn.focus({preventScroll:true});}catch{}
 return g;
}
return{Buffer,digitCount,wrong,parse,vertical,correctionText,freezeAppearance,motion,correction,mount,hold,startGate};
});
