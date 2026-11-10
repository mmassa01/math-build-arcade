// Read-only regression gate. Does not launch a browser or establish visual/GPU approval.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const tests=[
 'number-entry.cjs','number-entry-dom.cjs','shared-card-console.cjs',
 'building-card-motion.cjs','fixed-card-deadlines.cjs','timed-rounds.cjs',
 'shared-remaining-games.cjs','native-build-playback.cjs','new-game-bridges.cjs',
 'pathway-game-integration.cjs','dirt-engine.cjs','dirt-wave-runtime.cjs',
 'dirt-cinema.cjs','wave-cinema.cjs','subway-engine.cjs','subway-runtime.cjs',
 'skyrail-renderer-bridge.cjs','skyrail-3d.mjs','pong-cinema.cjs',
 'dragon-chase-demo.cjs','landing-startup.cjs','educator-dashboard.mjs',
 'card-presentation-contract.cjs','game-entry-assets.cjs','pong-review.cjs',
 'skyrail-clearance.mjs','racing-presentation.cjs','action-impact-sync.cjs',
 'subway-launch-clock.cjs','race-countdown.cjs','newshared-engine-games.cjs',
 'pong-demo-clock.cjs','race-demo-clock.cjs','demo-low-fps.cjs'
];
let failures=0;
for(const file of tests){
 const result=spawnSync(process.execPath,[path.join('tests',file)],{cwd:root,encoding:'utf8',timeout:60000});
 const passed=result.status===0&&!result.error;
 console.log(`${passed?'PASS':'FAIL'} ${file}`);
 if(!passed){failures++;console.error(result.error?.message||result.stderr||result.stdout||'No failure detail');}
}
console.log(`${tests.length-failures}/${tests.length} read-only suites passed. Real layout and native-device visual gates are separate.`);
process.exitCode=failures?1:0;
