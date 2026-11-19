// Geometry of the round-2 card. The live card is about twice the old size, the answer box is on
// the card for every operation and the pad sits beside the card. This models the content band
// (between the card tag and the 3-second bar) at every size token and checks a stacked fact
// with its answer box and a long-division house both fit, and that division cannot move the pad.
// Browser measurements at 1280x800, 1024x768, 768x1024, 390x844, 360x740, 844x390 and 740x360
// confirmed the same clearances (see the round-2 report); this test guards the tokens.
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('dist/number-entry.css','utf8');
const at=css.indexOf('/* Round 2 card.');assert(at>0,'round-2 card block exists');
assert(at<css.indexOf('/* Division timer clearance.')&&at<css.indexOf('/* Stacked fact clearance.'),'round-2 block sits before the clearance blocks, which keep their own contracts');
const block=css.slice(at,css.indexOf('/* Division timer clearance.'));
const P='.numeric-host.three-pile-host>.number-entry.shared-card-console';
// Specificity: the card rule must beat the later clearance rules (0,5,0) and per-game console rules.
assert(block.includes(P+' .card-console-center>.card-console-card,.workbench.flashcard-workbench.flashcard-workbench>.arena>.center>.card{'),'card rule is scoped above the clearance blocks');
assert(block.includes(P+' .card-console-card>.number-problem,'),'problem font rule is scoped above the clearance blocks');
const names=['r2-card-h','r2-font','r2-input-h','r2-input-font','r2-key-h','r2-tag','r2-foot','r2-tag-font'];
function tokens(src){const out={};for(const n of names){const m=src.match(new RegExp('--'+n+':(\\d+)px'));if(m)out[n]=+m[1];}return out;}
const rootRule=q=>{const i=block.indexOf(q);assert(i>=0,q+' tokens exist');return block.slice(i,block.indexOf('}}',i));};
const base=tokens(block.slice(0,block.indexOf('@media')));
const sizes={
 'desktop/tablet':base,
 phone:{...base,...tokens(rootRule('@media(max-width:650px){:root{'))},
 'small phone':{...base,...tokens(rootRule('@media(max-width:650px){:root{')),...tokens(rootRule('@media(max-width:380px){:root{'))},
 'short landscape':{...base,...tokens(rootRule('@media(max-height:600px) and (min-width:650px){:root{'))},
 'very short landscape':{...base,...tokens(rootRule('@media(max-height:600px) and (min-width:650px){:root{')),...tokens(rootRule('@media(max-height:420px) and (min-width:650px){:root{'))}
};
const border=1,tagTop=6,timerBottom=6,timerHeight=3,rule=3,ruleGap=3,slotGap=4,quotientGap=4,housePad=3;
for(const [name,t] of Object.entries(sizes)){
 for(const n of names)assert(Number.isFinite(t[n]),name+' defines --'+n);
 const band=t['r2-card-h']-2*border-t['r2-tag']-t['r2-foot'];
 const stacked=2*t['r2-font']+ruleGap+rule+slotGap+t['r2-input-h'];
 const division=t['r2-input-h']+quotientGap+t['r2-font']+rule+housePad;
 assert(stacked<=band,name+': stacked fact + answer box ('+stacked+'px) fits the '+band+'px band');
 assert(division<=band,name+': division house + answer box ('+division+'px) fits the '+band+'px band');
 assert(tagTop+t['r2-tag-font']<=t['r2-tag'],name+': the card tag sits inside the reserved top band');
 assert(timerBottom+timerHeight<=t['r2-foot'],name+': the timer bar sits inside the reserved bottom band');
}
assert(base['r2-font']>=50&&sizes.phone['r2-font']>=38,'digits are about twice the old 30px desktop / 24px phone size');
assert(base['r2-card-h']>=200&&sizes.phone['r2-card-h']>=160,'the card is about twice the old 112px / 82px height');
assert(sizes['very short landscape']['r2-font']>=28,'short landscape digits stay well above the old 21px');
assert(sizes.phone['r2-key-h']>=44,'phone keys keep a 44px touch height');
// The pad never moves on division cards: the only division rule in the answer row hides the hint's
// line (it keeps its height) and the answer row has no division-specific layout.
const divisionLines=block.split('\n').filter(l=>l.includes('has-division'));
assert.equal(divisionLines.length,1,'one division rule in the round-2 block');
assert(/\.has-division \.number-answer-row>\.number-work[^{]*\{visibility:hidden!important\}/.test(divisionLines[0]),'division only hides the hint line, keeping its space');
const widget=fs.readFileSync('dist/number-entry.js','utf8');
assert(widget.includes("shape.slot.replaceChildren(input)")&&widget.includes("shape.quotient.replaceChildren(input)"),'answer box goes on the card for stacked and division facts');
// Horse Race short landscape: its chips, track and console fit so the bottom pad row is on screen.
assert(block.includes('body.horse-cinematic .race-wrap>.track2{min-height:62px!important}'));
assert(block.includes('body.horse-cinematic .horse-controls{flex-wrap:nowrap!important'));
console.log('PASS round-2 card geometry: stacked and division facts with their answer box clear the tag and timer bar at every size, digits and card about doubled, pad fixed on division cards, Horse short landscape fits');
