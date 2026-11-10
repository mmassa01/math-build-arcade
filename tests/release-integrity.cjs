const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../dist');
const read=file=>fs.readFileSync(file,'utf8');
const clean=url=>url.split(/[?#]/)[0].trim();
const external=url=>!url||/^(?:[a-z]+:|\/\/|#)/i.test(url);
const resolveLocal=(owner,url)=>url.startsWith('/')?path.join(root,url):path.resolve(path.dirname(owner),url);

const arcadeFile=path.join(root,'arcade.js');
const arcade=read(arcadeFile);
const worldBlock=arcade.match(/const worlds=\{([\s\S]*?)\};\s*let selected=/);
assert(worldBlock,'production world registry is present');
const routes=[...worldBlock[1].matchAll(/(?:^|,)(\w+):\{[\s\S]*?src:'([^']+)'/g)].map(([,key,src])=>({key,src:clean(src)}));
assert.deepEqual(routes.map(v=>v.key),['horse','jetski','subway','sprint','castle','seed','hangar','pong','invaders','dragon']);
for(const {key,src} of routes){
  const target=path.join(root,src);
  assert(target.startsWith(root+path.sep),key+' route remains inside the distribution');
  assert(fs.existsSync(target),key+' production route exists: '+src);
}

const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else files.push(file);
  }
}
walk(root);

let references=0;
const missing=[];
for(const file of files.filter(v=>/\.(?:html|css)$/i.test(v))){
  const source=read(file);
  const urls=[];
  if(file.endsWith('.html')){
    for(const match of source.matchAll(/<(?:script|link|img|source|video|audio|iframe)\b[^>]*?\b(?:src|href|poster)=["']([^"']+)["']/gi))urls.push(match[1]);
    for(const match of source.matchAll(/<a\b[^>]*?\bhref=["']([^"']+)["']/gi))urls.push(match[1]);
  }else{
    for(const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi))urls.push(match[1]);
    for(const match of source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/gi))urls.push(match[1]);
  }
  for(const raw of urls){
    const url=clean(raw);
    if(external(url)||url.includes('${')||url.includes('{{'))continue;
    const target=resolveLocal(file,decodeURIComponent(url));
    assert(target===root||target.startsWith(root+path.sep),path.relative(root,file)+' reference escapes dist: '+url);
    const present=fs.existsSync(target)||fs.existsSync(path.join(target,'index.html'));
    if(!present)missing.push(path.relative(root,file)+' -> '+url);
    references++;
  }
}
assert.deepEqual(missing,[],'missing local assets:\n'+missing.join('\n'));

const inbound=[
  ['horse','races/horse-standalone.js'],
  ['jetski','dirt/game.js'],
  ['subway','subway/game.js'],
  ['sprint','dirt/game.js'],
  ['castle','castle/index.html'],
  ['seed','seed/index.html'],
  ['hangar','hangar/index.html'],
  ['pong','pong/game.js'],
  ['invaders','invaders/game.js'],
  ['dragon','dragon/game.js']
];
for(const [game,relative] of inbound){
  const source=read(path.join(root,relative));
  assert(/addEventListener\(['"]message['"]/.test(source),game+' receives parent commands');
  assert(/\.origin\s*!==\s*location\.origin/.test(source),game+' rejects foreign message origins');
  assert(/\.source\s*!==\s*parent/.test(source),game+' rejects commands from non-parent windows');
}

console.log('PASS release integrity: 10 registered production routes, '+references+' local HTML/CSS assets, and parent message guards for every game');
