const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const testDir=path.join(root,'tests');
const skip=new Set(['number-entry-fixture.cjs','release-gate.cjs']);
const tests=fs.readdirSync(testDir).filter(file=>/\.(?:cjs|mjs)$/.test(file)&&!skip.has(file)).sort();
const syntax=[];
const html=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.(?:js|mjs)$/.test(entry.name))syntax.push(file);else if(/\.html$/.test(entry.name))html.push(file)}}
walk(path.join(root,'dist'));

let failures=0;
for(const file of syntax){
  const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8',timeout:30000});
  if(result.status!==0||result.error){failures++;console.error('FAIL syntax '+path.relative(root,file));console.error(result.error?.message||result.stderr||result.stdout);}
}
let inlineScripts=0;
for(const file of html){
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    const attributes=match[1],script=match[2];
    if(/\bsrc\s*=/i.test(attributes)||/\btype\s*=\s*["'](?!module|text\/javascript|application\/javascript)/i.test(attributes)||!script.trim())continue;
    inlineScripts++;
    const args=/\btype\s*=\s*["']module["']/i.test(attributes)?['--input-type=module','--check','-']:['--check','-'];
    const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',input:script,timeout:30000});
    if(result.status!==0||result.error){failures++;console.error('FAIL inline syntax '+path.relative(root,file)+' script '+inlineScripts);console.error(result.error?.message||result.stderr||result.stdout);}
  }
}
if(!failures)console.log('PASS production syntax: '+syntax.length+' JavaScript modules and '+inlineScripts+' inline HTML scripts');

const fatal=/\b(?:UnhandledPromiseRejection|uncaught exception|unhandled rejection)\b/i;
for(const file of tests){
  const result=spawnSync(process.execPath,[path.join(testDir,file)],{cwd:root,encoding:'utf8',timeout:120000});
  const output=(result.stdout||'')+(result.stderr||'');
  const passed=result.status===0&&!result.error&&!result.stderr.trim()&&!fatal.test(output);
  console.log((passed?'PASS ':'FAIL ')+file);
  if(!passed){failures++;console.error(result.error?.message||result.stderr||result.stdout||'No failure detail');}
}

console.log((failures?'FAIL ':'PASS ')+'release gate: '+tests.length+' suites, '+syntax.length+' production scripts, '+inlineScripts+' inline scripts, '+failures+' failures');
process.exitCode=failures?1:0;
