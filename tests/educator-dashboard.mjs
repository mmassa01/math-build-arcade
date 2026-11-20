// The teacher and district report pages: fictional label, local relative assets only,
// no access to a player's own browser save, and the old preview files are gone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const read=file=>fs.readFileSync(path.join(dist,file),'utf8');
const pages=['educators/index.html','district.html'];
const scripts={};

for(const page of pages){
  const html=read(page),dir=path.dirname(path.join(dist,page));
  assert(html.includes('Sample data · fictional students'),page+' carries the fictional-data label');
  assert(/<div class="sampleBar"[^>]*>\s*<strong>Sample data · fictional students<\/strong>/.test(html),page+' shows the label in the persistent bar');
  assert(/invented/.test(html)&&/not connected/.test(html),page+' says the data is invented and not connected');
  assert(/<html lang="en">/.test(html)&&/<h1>/.test(html)&&/<main id="main">/.test(html)&&/class="skip"/.test(html),page+' has a language, one main heading, a main landmark and a skip link');
  assert(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html),page+' has no inline script');
  const urls=[...html.matchAll(/<(?:script|link|a|img)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
  assert(urls.length>=10);
  for(const url of urls){
    if(url.startsWith('#'))continue;
    assert(!/^(?:[a-z]+:|\/)/i.test(url),page+' uses only relative local URLs: '+url);
    const target=path.resolve(dir,url.split(/[?#]/)[0]);
    assert(target===dist||target.startsWith(dist+path.sep),page+' stays inside dist: '+url);
    assert(fs.existsSync(target)&&(fs.statSync(target).isFile()||fs.existsSync(path.join(target,'index.html'))),page+' references an existing file: '+url);
  }
  scripts[page]=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>path.relative(dist,path.resolve(dir,m[1].split('?')[0])).replace(/\\/g,'/'));
  assert.deepEqual(scripts[page].slice(0,6),['reporting/isolate.js','practice-pathways.js','reporting/summary.js','reporting/sample-data.js','reporting/sample.js','reporting/ui.js'],page+' installs the empty store before the engine, then the reporting modules');
}
assert.deepEqual(scripts['educators/index.html'].slice(6),['educators/teacher.js']);assert.deepEqual(scripts['district.html'].slice(6),['reporting/district.js']);
assert(read('educators/index.html').includes('What should I teach next?'),'the teacher page leads with its question');
assert(read('district.html').includes('href="educators/"')&&read('educators/index.html').includes('href="../district.html"'),'the two reports link to each other');
assert(read('reporting/district.js').includes('educators/index.html?class=')&&read('educators/teacher.js').includes("q.get('student')"),'district drills down into the teacher report by query parameters');
assert(/href="educators\/"/.test(read('index.html')),'the arcade still links to the reports');

// Nothing the report pages own may touch browser storage, the player save key or the network.
const owned=['district.html','educators/index.html','educators/teacher.js','reporting/district.js','reporting/ui.js','reporting/summary.js','reporting/sample.js','reporting/isolate.js'];
for(const file of owned){const source=read(file);
  for(const banned of ['localStorage','sessionStorage','indexedDB','mathArcadePathways','mathArcadePractice','document.cookie','fetch(','XMLHttpRequest','sendBeacon','WebSocket'])assert(!source.includes(banned),file+' must not use '+banned);
  assert(!/https?:\/\//.test(source.replace(/http:\/\/www\.w3\.org\/\S*/g,'')),file+' loads nothing from the network');}
const css=read('reporting/reports.css');assert(!/https?:|@import/.test(css));assert(css.includes("url('../LilitaOne-Regular.ttf')")&&fs.existsSync(path.join(dist,'LilitaOne-Regular.ttf')));
assert(css.includes('@media print')&&css.includes(':focus-visible')&&css.includes('prefers-reduced-motion'),'print, focus and reduced-motion styles exist');
for(const key of ['finished','onPace','behind','atRisk','notStarted'])assert(css.includes('.pace-'+key)&&css.includes('--'+key+':'),'pace status '+key+' has a colour and a shape');

// Load the page scripts the way a browser would, with a browser store that records every touch.
const touched=[];
const store={getItem(k){touched.push('get '+k);return null;},setItem(k){touched.push('set '+k);},removeItem(k){touched.push('remove '+k);}};
const win={};Object.defineProperty(win,'localStorage',{get(){touched.push('localStorage');return store;}});Object.defineProperty(win,'sessionStorage',{get(){touched.push('sessionStorage');return store;}});
win.window=win;win.console=console;const context=vm.createContext(win);
for(const file of scripts['district.html'].slice(0,5))vm.runInContext(read(file),context,{filename:file});
const R=context.ArcadeReporting,sample=context.ArcadeReportingSample.load();
const one=R.summarize(sample.students[0].record,sample.students[0].roster,{today:sample.today});
assert.equal(one.facts.total,61);assert.equal(sample.students.length>=250,true);assert.equal(sample.fictional,true);
assert.deepEqual(touched,[],'the report scripts never open the browser’s own storage');
assert.equal(context.ArcadePractice.stats().storageAvailable,true);assert.equal(Object.isFrozen(context.ArcadeStorage),true);

// The outdated preview is gone and nothing still points at it.
const removed=['district.js','district-model.js','district.css','educators/dashboard.mjs','educators/dashboard.css','educators/model.mjs','educators/sample-data.mjs','educators/adapter.mjs','educators/bootstrap.mjs','educators/contract.d.ts','educators/schema.sql','educators/integration-kit.zip','educators/layout-qa.html'];
for(const file of removed)assert(!fs.existsSync(path.join(dist,file)),file+' was removed');
const everything=[];(function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(/\.(?:html|js|mjs|css|md)$/.test(e.name)&&fs.statSync(f).size<3e6)everything.push(f);}})(dist);
for(const file of everything){const source=fs.readFileSync(file,'utf8');
  for(const name of ['district-model.js','dashboard.mjs','dashboard.css','integration-kit','schema.sql','layout-qa.html','bootstrap.mjs','adapter.mjs','sample-data.mjs'])assert(!source.includes(name),path.relative(dist,file)+' still mentions '+name);
}
for(const file of [...owned,'reporting/sample-data.js','reporting/reports.css','educators/integration.md'])assert(!/Todd Grant|McIntosh/i.test(read(file)),file+' still contains a real-looking school or district name');
for(const stale of ['599','four attempts','Five trophies earned','GRADES 6 THROUGH 12'])for(const file of [...pages,'educators/integration.md'])assert(!read(file).includes(stale),file+' still states the old rule: '+stale);

// The integration note covers what the platform team needs.
const note=read('educators/integration.md');
for(const needle of ['fictional sample data only','mathArcadePathways.v2','exportRecord()','days','misses','checks[].missed','responses: []','2027-04-26','2027-05-10','90%','60%','first 3 days','own roster','Authorization is the host','Not recorded','tools/generate-report-sample.cjs','ArcadeReporting.summarize'])assert(note.includes(needle),'integration note mentions '+needle);

console.log('PASS educator reporting pages: fictional label on both pages, '+owned.length+' report files with relative local assets and no storage or network access, engine loaded behind an empty store, outdated preview removed, integration note current');
