// Guards the phone and short-landscape bug where a stacked +, − or × fact (top number,
// operator row, answer rule) was taller than the space between the "CURRENT CARD" tag and the
// 3-second bar, so the top number sat under the tag and the rule ran into the bar.
// The card height is fixed, so the stack must fit between the tag and the bar. Sibling of
// division-timer-clearance.cjs, which guards the same band for long-division cards.
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('dist/number-entry.css','utf8');
const marker='/* Stacked fact clearance.';
const at=css.indexOf(marker);
assert(at>0,'stacked fact clearance block exists in the shared console stylesheet');
const block=css.slice(at);
const stacked='.number-problem:not(.number-division)';
// The block must come after the three-pile font contract and the division block so it wins
// the cascade without touching either.
assert(css.indexOf('/* Division timer clearance.')>0&&css.indexOf('/* Division timer clearance.')<at,'division clearance is kept and precedes the stacked block');
assert(css.lastIndexOf('.numeric-host.three-pile-host .card-console-card .number-problem,')<at,'three-pile font contract is overridden by the later clearance block');
assert(!/\.workbench|flashcard-workbench/.test(block),'castle, seed and car shop keep their own card layout');
for(const line of block.split('\n').filter(l=>/^\s*\./.test(l)))assert(line.includes(stacked),'every stacked rule excludes division cards: '+line.slice(0,70));

const media=(query)=>{const i=block.indexOf(query);assert(i>0,query+' stacked tokens exist');return block.slice(i,block.indexOf('\n}',i));};
const tokens=['stack-top','stack-bottom','stack-font','stack-rule-gap'];
function read(source){const out={};for(const name of tokens){const m=source.match(new RegExp('--'+name+':(\\d+)px'));if(m)out[name]=+m[1];}return out;}
const timerBottom=(source)=>{const m=source.match(/:has\(\.number-problem:not\(\.number-division\)\) \.card-console-timer\{bottom:(\d+)px\}/);return m?+m[1]:8;};
function assertWired(source,name){
  assert(source.includes('.numeric-host.three-pile-host .card-console-card:has('+stacked+'){'),name+': card rule beats the three-pile host');
  assert(source.includes('justify-content:center!important;padding:var(--stack-top) 0 var(--stack-bottom)!important'),name+': card reserves the band between tag and bar');
  assert(source.includes('.numeric-host.three-pile-host .card-console-card '+stacked+'{font-size:var(--stack-font)!important;line-height:1!important;padding:0 5px!important;margin:0 auto!important}'),name+': stack size beats the three-pile font contract and drops its vertical padding');
  assert(source.includes(stacked+' .number-bottom{padding-bottom:var(--stack-rule-gap)}'),name+': gap above the answer rule comes from the token');
}
// Shared presentation contract: card heights, tag offsets, and the 3px answer rule.
assert(css.includes('--arc-card-height:112px')&&css.includes('--arc-card-height:82px')&&css.includes('--arc-card-height:72px'));
assert(css.includes('.numeric-host.three-pile-host .card-console-tag{font:600 7px/1 system-ui,sans-serif!important;top:7px!important'));
assert(css.includes('.numeric-host.three-pile-host .card-console-tag{font-size:7px!important;top:5px!important'));
assert(css.includes('.number-bottom{display:flex;justify-content:space-between;gap:.55ch;border-bottom:3px solid currentColor;padding-bottom:4px}'));
assert(css.includes('.card-console-timer{position:absolute;bottom:8px;left:10px;right:10px;height:3px'));
const border=1,tagFont=7,timerHeight=3,rule=3,rows=2;
function check(s){
  const contentTop=border+s.top,contentBottom=s.card-border-s.bottom;
  const tagBottom=border+s.tagTop+tagFont,timerTop=s.card-border-s.timer-timerHeight;
  const stack=rows*s.font*s.line+s.ruleGap+rule+s.padBottom;
  // The stack is flex-centred in the band; when taller it overflows equally above and below.
  const band=contentBottom-contentTop,stackTop=contentTop+(band-stack)/2,ruleBottom=stackTop+stack-s.padBottom;
  return{topGap:stackTop-tagBottom,bottomGap:timerTop-ruleBottom,stack,band};
}
const phoneBlock=media('@media(max-width:650px)'),landBlock=media('@media(max-height:600px) and (min-width:650px)');
const sizes=[
  {name:'phone',card:82,tagTop:7,source:phoneBlock,legacy:{font:25,timer:8}},
  {name:'short landscape',card:72,tagTop:5,source:landBlock,legacy:{font:23,timer:8}}
];
for(const s of sizes){
  assertWired(s.source,s.name);
  const t=read(s.source);for(const name of tokens)assert(Number.isFinite(t[name]),s.name+' defines --'+name);
  const fixed=check({card:s.card,tagTop:s.tagTop,top:t['stack-top'],bottom:t['stack-bottom'],font:t['stack-font'],line:1,ruleGap:t['stack-rule-gap'],padBottom:0,timer:timerBottom(s.source)});
  assert(fixed.stack<=fixed.band,s.name+': two rows + rule ('+fixed.stack+'px) fit the '+fixed.band+'px band');
  assert(fixed.topGap>=1,s.name+': top number starts below the card tag (gap '+fixed.topGap+'px)');
  assert(fixed.bottomGap>=2,s.name+': answer rule ends above the timer bar (gap '+fixed.bottomGap+'px)');
  assert(t['stack-font']>=21,s.name+': stacked digits stay readable');
  // The same model reproduces the reported overlap from the pre-fix contract (three-pile font
  // at line-height 1.05, 4px rule gap, 3px problem padding, unpadded card, timer at 8px).
  const before=check({card:s.card,tagTop:s.tagTop,top:0,bottom:0,font:s.legacy.font,line:1.05,ruleGap:4,padBottom:3,timer:s.legacy.timer});
  assert(before.topGap<0,s.name+': model detects the original tag overlap');
}
// Desktop and tablet keep the existing 112px card geometry, which already clears.
const desktop=check({card:112,tagTop:7,top:0,bottom:0,font:30,line:1.05,ruleGap:4,padBottom:3,timer:8});
assert(desktop.topGap>=4&&desktop.bottomGap>=8,'desktop card needs no clearance override');
assert(!block.slice(0,block.indexOf('@media')).includes('{'),'no stacked override outside the phone and short-landscape queries');
console.log('stacked card clearance: +, − and × stacks clear the tag and 3-second bar at phone and short-landscape card heights');
