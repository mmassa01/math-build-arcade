// Guards the coach-reported bug where the long-division card (quotient box, divisor and
// bracketed dividend) was pushed down onto the 3-second timer bar in every shared-console game.
// The card height is fixed, so the division stack must fit between the card tag and the bar.
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('dist/number-entry.css','utf8');
const marker='/* Division timer clearance.';
const at=css.indexOf(marker);
assert(at>0,'division timer clearance block exists in the shared console stylesheet');
const block=css.slice(at);
// The clearance block must come after every legacy division rule so it wins the cascade.
assert(css.lastIndexOf(':has(.number-division){padding-top')<at,'legacy padding-top pushes are overridden by the later clearance block');
assert(block.includes('justify-content:center!important;padding:var(--div-top) 0 var(--div-bottom)!important'),'division card reserves a band above the timer instead of only padding the top');
assert(block.includes('.numeric-host.three-pile-host .card-console-card .number-problem.number-division{font-size:var(--div-font)!important;line-height:1!important'),'division size beats the three-pile font contract');
assert(block.includes('.number-division .division-quotient{min-height:0}'),'quotient row is sized by its answer box, not a 28px floor');
assert(!/\.workbench|flashcard-workbench/.test(block),'castle, seed and car shop keep their own card layout');

const tokens=['div-top','div-bottom','div-font','div-input','div-input-gap','div-house-pad'];
function read(source){const out={};for(const name of tokens){const m=source.match(new RegExp('--'+name+':(?:var\\(--arc-card-font,)?(\\d+)px'));if(m)out[name]=+m[1];}return out;}
const base=read(block);
const media=(query)=>{const i=block.indexOf(query);assert(i>0,query+' division tokens exist');return block.slice(i,block.indexOf('\n}',i));};
const phoneBlock=media('@media(max-width:650px)'),landBlock=media('@media(max-height:600px) and (min-width:650px)');
const timerBottom=(source,fallback)=>{const m=source.match(/:has\(\.number-division\) \.card-console-timer\{bottom:(\d+)px\}/);return m?+m[1]:fallback;};
const baseTimer=timerBottom(block.slice(0,block.indexOf('@media')),8);
// Card heights and three-pile tag offsets come from the shared presentation contract.
assert(css.includes('--arc-card-height:112px')&&css.includes('--arc-card-height:82px')&&css.includes('--arc-card-height:72px'));
assert(css.includes('.numeric-host.three-pile-host .card-console-tag{font:600 7px/1 system-ui,sans-serif!important;top:7px!important'));
assert(css.includes('.numeric-host.three-pile-host .card-console-tag{font-size:7px!important;top:5px!important'));
const sizes=[
  {name:'desktop/tablet',card:112,tagTop:7,t:base,timer:baseTimer},
  {name:'phone',card:82,tagTop:7,t:{...base,...read(phoneBlock)},timer:timerBottom(phoneBlock,baseTimer)},
  {name:'short landscape',card:72,tagTop:5,t:{...base,...read(landBlock)},timer:timerBottom(landBlock,baseTimer)}
];
const border=1,tagFont=7,timerHeight=3,houseRule=3;
for(const s of sizes){
  const t=s.t;for(const name of tokens)assert(Number.isFinite(t[name]),s.name+' defines --'+name);
  const contentTop=border+t['div-top'],contentBottom=s.card-border-t['div-bottom'];
  const tagBottom=border+s.tagTop+tagFont,timerTop=s.card-border-s.timer-timerHeight;
  const stack=t['div-input']+t['div-input-gap']+t['div-font']+houseRule+t['div-house-pad'];
  assert(contentTop>=tagBottom,s.name+': division content starts below the card tag');
  assert(contentBottom<timerTop,s.name+': division content band ends above the timer bar');
  assert(stack<=contentBottom-contentTop,s.name+': quotient box + bracket ('+stack+'px) fits the '+(contentBottom-contentTop)+'px band');
  assert(t['div-font']>=21,s.name+': division digits stay readable');
}
console.log('division timer clearance: long-division stack clears the tag and 3-second bar at desktop, phone and short-landscape card heights');
