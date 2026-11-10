const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../dist');
const pages=['races/horse.html','wave/index.html','races/subway.html','dirt/index.html','invaders/index.html','dragon/index.html','pong/index.html','seed/index.html','castle/index.html','hangar/index.html'];
let refs=0;
for(const page of pages){const file=path.join(root,page),html=fs.readFileSync(file,'utf8');assert.ok(/number-entry\.css/.test(html),page+' shared card styles');assert.ok(/number-entry\.js/.test(html),page+' shared typed entry');for(const m of html.matchAll(/<(script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi)){const url=m[2].split(/[?#]/)[0];if(!url||/^(https?:|data:|blob:|\/\/|#)/.test(url))continue;const target=url.startsWith('/')?path.join(root,url):path.resolve(path.dirname(file),url);assert.ok(target.startsWith(root+path.sep),'Local reference stays inside distribution');assert.ok(fs.existsSync(target),page+' missing '+url);refs++;}}
console.log('PASS all ten game entry pages: shared card assets and '+refs+' local script/style/image references exist');
