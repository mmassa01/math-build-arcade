// Shared drawing helpers for the report pages: pace chips, bars, SVG charts, sortable
// tables, tooltips and CSV download. Plain DOM and inline SVG; no libraries.
(function(root){
  'use strict';
  const R=root.ArcadeReporting;
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function day(s,style){if(!s)return'—';const d=new Date(s+'T00:00:00Z'),base=MONTHS[d.getUTCMonth()]+' '+d.getUTCDate();return style==='long'?DAYS[d.getUTCDay()]+', '+base+', '+d.getUTCFullYear():style==='year'?base+', '+d.getUTCFullYear():base;}
  function ago(n){return n==null?'Never':n===0?'Today':n===1?'Yesterday':n+' days ago';}
  const num=(v,digits)=>v==null?'—':Number(v).toLocaleString('en-US',{maximumFractionDigits:digits==null?1:digits});
  const pct=v=>v==null?'—':Math.round(v)+'%';
  const plural=(n,one,many)=>n+' '+(n===1?one:(many||one+'s'));

  function paceChip(status){return'<span class="pace pace-'+esc(status)+'"><i aria-hidden="true"></i>'+esc(R.PACE_LABEL[status]||status)+'</span>';}
  function paceText(counts){return R.PACE.filter(p=>counts[p.key]).map(p=>counts[p.key]+' '+p.label.toLowerCase()).join(', ')||'no students';}
  // A 100% stacked bar of the five pace statuses. Counts are printed when a segment is wide enough.
  function paceStack(counts,options){
    const o=options||{},total=R.PACE.reduce((n,p)=>n+(counts[p.key]||0),0);
    if(!total)return'<div class="stack" role="img" aria-label="No students"></div>';
    return'<div class="stack" role="img" style="--h:'+(o.height||26)+'px" aria-label="'+esc(paceText(counts))+'">'+R.PACE.filter(p=>counts[p.key]).map(p=>{const share=counts[p.key]/total*100;
      return'<span class="key-'+p.key+'" style="flex:'+counts[p.key]+' 1 0" data-tip="'+esc('<b>'+p.label+'</b>'+plural(counts[p.key],'student')+' · '+Math.round(share)+'%')+'">'+(o.numbers!==false&&share>=(o.minShare||9)?counts[p.key]:'')+'</span>';}).join('')+'</div>';
  }
  function paceLegend(counts){return'<ul class="legend">'+R.PACE.map(p=>'<li class="key key-'+p.key+'"><i aria-hidden="true"></i><span>'+esc(p.label)+(counts?' <b>'+(counts[p.key]||0)+'</b>':'')+'</span></li>').join('')+'</ul>';}
  function bar(value,options){const o=options||{},v=Math.max(0,Math.min(100,Number(value)||0));
    return'<span class="bar'+(o.thin?' thin':'')+(v>=100?' done':'')+'"><span class="track" aria-hidden="true"><i style="width:'+v+'%'+(o.color?';background:'+o.color:'')+'"></i></span><b>'+esc(o.label!=null?o.label:Math.round(v)+'%')+'</b></span>';}
  function dots(on,of){let out='<span class="dots" aria-hidden="true">';for(let i=0;i<of;i++)out+='<i'+(i<on?' class="on"':'')+'></i>';return out+'</span><span class="sr">'+on+' of '+of+'</span>';}

  // ---- tooltips: anything with data-tip (HTML already escaped by the caller)
  let tipBox=null;
  function showTip(html,x,y){if(!tipBox){tipBox=document.createElement('div');tipBox.className='tip';tipBox.setAttribute('role','presentation');document.body.append(tipBox);}
    tipBox.innerHTML=html;tipBox.hidden=false;const w=tipBox.offsetWidth,h=tipBox.offsetHeight;
    tipBox.style.left=Math.max(6,Math.min(root.innerWidth-w-6,x-w/2))+'px';tipBox.style.top=(y-h-12<6?y+16:y-h-12)+'px';}
  function hideTip(){if(tipBox)tipBox.hidden=true;}
  function wireTips(){
    const at=e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(!t)return hideTip();const r=t.getBoundingClientRect();showTip(t.getAttribute('data-tip'),e.clientX||r.left+r.width/2,e.clientY||r.top);};
    document.addEventListener('mouseover',at);document.addEventListener('mousemove',e=>{if(e.target.closest&&e.target.closest('[data-tip]'))at(e);});
    document.addEventListener('focusin',at);document.addEventListener('mouseout',e=>{if(!e.relatedTarget||!e.relatedTarget.closest||!e.relatedTarget.closest('[data-tip]'))hideTip();});
    document.addEventListener('focusout',hideTip);document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();});root.addEventListener('scroll',hideTip,{passive:true});
  }

  // ---- charts. Each chart redraws at the width of its container so text never shrinks.
  const mounted=new Set();let observer=null;
  function mount(el,draw){
    if(!el)return;el.__draw=()=>{const w=Math.max(260,Math.floor(el.clientWidth||600));if(el.__w===w)return;el.__w=w;draw(el,w);};
    el.__w=0;el.__draw();mounted.add(el);
    if(!observer&&root.ResizeObserver)observer=new ResizeObserver(entries=>{for(const e of entries)if(e.target.isConnected&&e.target.__draw)e.target.__draw();});
    if(observer)observer.observe(el);
  }
  root.addEventListener('resize',()=>{for(const el of [...mounted]){if(!el.isConnected){mounted.delete(el);if(observer)observer.unobserve(el);}else el.__draw();}});
  const niceMax=v=>{if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return(n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;};
  const DASH={dash:'6 5',dot:'2 5'};

  // cfg: {height,x:{min,max,ticks:[{v,label}]},y:{max,format},series:[{name,color,style,points:[[x,y]],step,endLabel}],marks:[{x,label}],tip:x=>html,label}
  function lineChart(el,cfg){
    mount(el,(node,W)=>{
      const H=cfg.height||240,m={l:44,r:cfg.rightPad||18,t:cfg.marks&&cfg.marks.length?26:12,b:30},pw=W-m.l-m.r,ph=H-m.t-m.b;
      const yMax=cfg.y&&cfg.y.max?cfg.y.max:niceMax(Math.max(1,...cfg.series.flatMap(s=>s.points.map(p=>p[1])))),fmt=cfg.y&&cfg.y.format||(v=>v);
      const X=v=>m.l+(cfg.x.max===cfg.x.min?0:(v-cfg.x.min)/(cfg.x.max-cfg.x.min))*pw,Y=v=>m.t+ph-Math.min(1,v/yMax)*ph;
      let s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(cfg.label||'Chart')+'">';
      for(let i=0;i<=4;i++){const v=yMax*i/4,y=Y(v);s+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y+'" y2="'+y+'" stroke="var(--grid)" stroke-width="1"/><text x="'+(m.l-8)+'" y="'+(y+4)+'" text-anchor="end">'+esc(fmt(v))+'</text>';}
      let lastTick=-1e9;for(const t of cfg.x.ticks||[]){const x=X(t.v);if(x-lastTick<54)continue;lastTick=x;s+='<text x="'+x+'" y="'+(H-9)+'" text-anchor="'+(x>W-m.r-24?'end':x<m.l+20?'start':'middle')+'">'+esc(t.label)+'</text>';}
      for(const mark of cfg.marks||[]){if(mark.x<cfg.x.min||mark.x>cfg.x.max)continue;const x=X(mark.x);s+='<line x1="'+x+'" x2="'+x+'" y1="'+(m.t-4)+'" y2="'+(m.t+ph)+'" stroke="#6b6976" stroke-width="1" stroke-dasharray="3 3"/><text class="lab" x="'+x+'" y="'+(m.t-9)+'" text-anchor="'+(x>W-m.r-40?'end':x<m.l+40?'start':'middle')+'">'+esc(mark.label)+'</text>';}
      // end labels are nudged apart so close lines stay readable
      const ends=cfg.series.filter(l=>l.endLabel&&l.points.length).map(l=>({l,y:Y(l.points[l.points.length-1][1])})).sort((a,b)=>a.y-b.y);
      for(let i=1;i<ends.length;i++)if(ends[i].y-ends[i-1].y<15)ends[i].y=ends[i-1].y+15;
      for(let i=ends.length-1;i>=0;i--){const max=m.t+ph-(ends.length-1-i)*15;if(ends[i].y>max)ends[i].y=max;}
      for(const line of cfg.series){if(!line.points.length)continue;let d='';line.points.forEach((p,i)=>{const x=X(p[0]),y=Y(p[1]);if(!i)d+='M'+x+' '+y;else if(line.step)d+='H'+x+'V'+y;else d+='L'+x+' '+y;});
        s+='<path d="'+d+'" fill="none" stroke="'+line.color+'" stroke-width="'+(line.style?2:2.5)+'" stroke-linejoin="round" stroke-linecap="round"'+(line.style?' stroke-dasharray="'+DASH[line.style]+'"':'')+'/>';
        if(line.endDot!==false&&!line.style){const p=line.points[line.points.length-1];s+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="4.5" fill="'+line.color+'" stroke="var(--surface)" stroke-width="2"/>';}
        if(line.endLabel){const p=line.points[line.points.length-1];s+='<text class="lab" x="'+(X(p[0])+9)+'" y="'+(ends.find(e=>e.l===line).y+4)+'">'+esc(line.endLabel)+'</text>';}}
      s+='<line class="cross" x1="0" x2="0" y1="'+m.t+'" y2="'+(m.t+ph)+'" stroke="#1b1a22" stroke-width="1" visibility="hidden"/><rect class="hit" x="'+m.l+'" y="'+m.t+'" width="'+pw+'" height="'+ph+'"/></svg>';
      node.innerHTML=s;
      if(!cfg.tip)return;
      const svg=node.querySelector('svg'),cross=svg.querySelector('.cross'),xs=[...new Set(cfg.series.flatMap(l=>l.points.map(p=>p[0])))].sort((a,b)=>a-b);
      const move=e=>{const box=svg.getBoundingClientRect(),v=cfg.x.min+(e.clientX-box.left-m.l)/pw*(cfg.x.max-cfg.x.min);let best=xs[0];for(const x of xs)if(Math.abs(x-v)<Math.abs(best-v))best=x;
        cross.setAttribute('x1',X(best));cross.setAttribute('x2',X(best));cross.setAttribute('visibility','visible');showTip(cfg.tip(best),box.left+X(best),e.clientY);};
      svg.querySelector('.hit').addEventListener('mousemove',move);svg.querySelector('.hit').addEventListener('mouseleave',()=>{cross.setAttribute('visibility','hidden');hideTip();});
    });
  }
  // cfg: {height,bars:[{label,value,tip}],format,color,label,max}
  function barChart(el,cfg){
    mount(el,(node,W)=>{
      const H=cfg.height||220,m={l:44,r:10,t:20,b:30},pw=W-m.l-m.r,ph=H-m.t-m.b,n=cfg.bars.length||1,fmt=cfg.format||(v=>v);
      const yMax=cfg.max||niceMax(Math.max(1,...cfg.bars.map(b=>b.value))),step=pw/n,bw=Math.min(46,Math.max(6,step-8)),Y=v=>m.t+ph-Math.min(1,v/yMax)*ph;
      let s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(cfg.label||'Chart')+'">';
      for(let i=0;i<=4;i++){const v=yMax*i/4,y=Y(v);s+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y+'" y2="'+y+'" stroke="var(--grid)" stroke-width="1"/><text x="'+(m.l-8)+'" y="'+(y+4)+'" text-anchor="end">'+esc(fmt(v))+'</text>';}
      const every=Math.ceil(54/step);
      cfg.bars.forEach((b,i)=>{const x=m.l+step*i+(step-bw)/2,y=Y(b.value),h=m.t+ph-y,r=Math.min(4,h,bw/2);
        if(h>0)s+='<path d="M'+x+' '+(m.t+ph)+'V'+(y+r)+'Q'+x+' '+y+' '+(x+r)+' '+y+'H'+(x+bw-r)+'Q'+(x+bw)+' '+y+' '+(x+bw)+' '+(y+r)+'V'+(m.t+ph)+'Z" fill="'+(cfg.color||'var(--series-1)')+'"/>';
        if(step>=40)s+='<text class="lab" x="'+(x+bw/2)+'" y="'+(y-5)+'" text-anchor="middle">'+esc(fmt(b.value))+'</text>';
        if((n-1-i)%every===0)s+='<text x="'+(x+bw/2)+'" y="'+(H-9)+'" text-anchor="middle">'+esc(b.label)+'</text>';
        s+='<rect x="'+(m.l+step*i)+'" y="'+m.t+'" width="'+step+'" height="'+ph+'" fill="transparent" tabindex="-1" data-tip="'+esc(b.tip||b.label+': '+fmt(b.value))+'"/>';});
      node.innerHTML=s+'</svg>';
    });
  }
  function chartKey(items){return'<ul class="chartKey">'+items.map(i=>'<li><i class="'+(i.style||'')+'" style="--c:'+i.color+'" aria-hidden="true"></i>'+esc(i.name)+'</li>').join('')+'</ul>';}

  // ---- sortable tables. columns: [{key,label,num,sort:row=>value,cell:row=>html,cls,csv:row=>value,csvOnly}]
  function table(host,cfg){
    const state={key:cfg.sortKey||null,dir:cfg.sortDir||1},shown=cfg.columns.filter(c=>!c.csvOnly);
    function rows(){const col=cfg.columns.find(c=>c.key===state.key),list=[...cfg.rows];
      if(col&&col.sort)list.sort((a,b)=>{const x=col.sort(a),y=col.sort(b),c=typeof x==='string'||typeof y==='string'?String(x).localeCompare(String(y),'en',{numeric:true}):(x==null?-Infinity:x)-(y==null?-Infinity:y);return c*state.dir;});
      else if(cfg.defaultOrder)list.sort(cfg.defaultOrder);return list;}
    function draw(focusKey){
      host.innerHTML='<div class="tableWrap" tabindex="0" role="region" aria-label="'+esc(cfg.caption)+'"><table><caption>'+esc(cfg.caption)+(cfg.hint?' <span class="noPrint">'+esc(cfg.hint)+'</span>':'')+'</caption><thead><tr>'+shown.map(c=>'<th scope="col" class="'+(c.num?'num ':'')+(c.cls||'')+'"'+(c.sort?' aria-sort="'+(state.key===c.key?(state.dir>0?'ascending':'descending'):'none')+'"':'')+'>'+(c.sort?'<button type="button" class="sortBtn" data-sort="'+esc(c.key)+'">'+esc(c.label)+'</button>':esc(c.label))+'</th>').join('')+'</tr></thead><tbody>'+
        rows().map(r=>'<tr>'+shown.map((c,i)=>i===0?'<th scope="row" class="'+(c.cls||'')+'">'+c.cell(r)+'</th>':'<td class="'+(c.num?'num ':'')+(c.cls||'')+'">'+c.cell(r)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
      if(focusKey){const b=host.querySelector('[data-sort="'+focusKey+'"]');if(b)b.focus();}
    }
    host.addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b||!host.contains(b))return;const key=b.getAttribute('data-sort'),col=cfg.columns.find(c=>c.key===key);
      if(state.key===key)state.dir=-state.dir;else{state.key=key;state.dir=col.first||1;}draw(key);});
    draw();
    return{rows,csv:()=>R.csv([cfg.columns.filter(c=>c.csv).map(c=>c.csvLabel||c.label),...rows().map(r=>cfg.columns.filter(c=>c.csv).map(c=>c.csv(r)))])};
  }
  function download(name,text){const url=URL.createObjectURL(new Blob(['﻿'+text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}

  root.ArcadeReportUI={esc,day,ago,num,pct,plural,paceChip,paceText,paceStack,paceLegend,bar,dots,lineChart,barChart,chartKey,table,download,wireTips,showTip,hideTip};
})(window);
