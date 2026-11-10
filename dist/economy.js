(function (root, factory) {
  'use strict';
  var storage = null;
  try { storage = root && root.localStorage; } catch (e) {}
  var api = factory(storage);
  if (typeof module === 'object' && module.exports) { module.exports = api; module.exports.create = factory; }
  if (root) root.ArcadeEconomy = api;
}(typeof window !== 'undefined' ? window : null, function (storage) {
  'use strict';
  var KEY = 'mathArcadeProfile.v1';
  var groups = {
    dragon: ['Skyfire', 'Frostwing', 'Stormfire', 'Obsidian Ember', 'Sunforge Sovereign'],
    car: ['Pocket Racer', 'Rally Rocket', 'Turbo Comet', 'Neon Supercar', 'Galaxy Hypercar'],
    horse: ['Meadow Pony', 'Trail Blazer', 'Golden Galloper', 'Starlight Stallion', 'Royal Champion'],
    jetski: ['Wave Rider', 'Reef Rocket', 'Ocean Bolt', 'Neon Splash', 'Storm Racer'],
    subway: ['Starter Sneakers', 'Speed Kicks', 'Rocket Runners', 'Neon Skates', 'Galaxy Hoverboard']
  };
  var icons = {dragon:'🐉',car:'🏎️', horse:'🐎', jetski:'🌊', subway:'👟'};
  var prices = [0, 500, 1000, 2000, 3500];
  var catalog = [];
  Object.keys(groups).forEach(function (category) {
    groups[category].forEach(function (name, tier) {
      catalog.push(Object.freeze({id: category + '-' + tier, category:category, name:name, tier:tier, price:prices[tier], unlockAt:prices[tier], icon:icons[category]}));
    });
  });
  var restored = typeof window !== 'undefined' && window.ArcadeCatalog;
  if(!restored && typeof require==='function')try{restored=require('./store/catalog.js')}catch(e){}
  if(restored)catalog=restored.map(function(v){return Object.freeze(v)});
  Object.freeze(catalog);
  function safeInt(n) { return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function item(id) { return catalog.find(function (v) { return v.id === id; }); }
  function fresh() { return {version:1, coins:0, lifetimeEarned:0, owned:catalog.filter(function(v){return !v.price;}).map(function(v){return v.id;}), loadout:{}, equipped:{dragon:'dragon-0',car:'car-0',horse:'horse-0',jetski:'jetski-0',subway:'subway-0'}, rewardIds:[], trophies:[], pendingUnlocks:[]}; }
  function clean(raw) {
    var out = fresh();
    if (!raw || raw.version !== 1) return out;
    out.coins = safeInt(raw.coins);
    out.lifetimeEarned = Math.max(safeInt(raw.lifetimeEarned), out.coins);
    if (Array.isArray(raw.owned)) raw.owned.forEach(function(id){if(item(id) && out.owned.indexOf(id)<0) out.owned.push(id);});
    Object.keys(groups).forEach(function(category){var id=raw.equipped && raw.equipped[category]; if(item(id) && item(id).category===category && out.owned.indexOf(id)>=0) out.equipped[category]=id;});
    if(raw.loadout)Object.keys(raw.loadout).forEach(function(key){var v=item(raw.loadout[key]);if(v && v.slot!=='skin' && key===v.category+':'+v.slot && out.owned.indexOf(v.id)>=0)out.loadout[key]=v.id;});
    if(Array.isArray(raw.rewardIds)) out.rewardIds=Array.from(new Set(raw.rewardIds.filter(function(v){return typeof v==='string' && v.length>0 && v.length<=200;})));
    if(Array.isArray(raw.trophies)) out.trophies=Array.from(new Set(raw.trophies.filter(function(v){return typeof v==='string' && v.length>0 && v.length<=100;})));
    if(Array.isArray(raw.pendingUnlocks)) out.pendingUnlocks=Array.from(new Set(raw.pendingUnlocks.filter(function(id){var v=item(id);return v && v.price && v.unlockAt<=out.lifetimeEarned && out.owned.indexOf(id)<0;})));
    return out;
  }
  var state;
  try {state=clean(JSON.parse(storage && storage.getItem(KEY)));} catch (e) {state=fresh();}
  function save() {try {if(storage) storage.setItem(KEY,JSON.stringify(state));} catch(e) {} }
  function getState() {
    var result=copy(state);
    result.unlocked=catalog.filter(function(v){return v.unlockAt<=state.lifetimeEarned;}).map(function(v){return v.id;});
    return result;
  }
  function reward(amount,id) {
    if(!Number.isSafeInteger(amount) || amount<=0 || typeof id!=='string' || !id.length || id.length>200) return {ok:false,reason:'invalid-reward',state:getState(),unlocked:[]};
    if(state.rewardIds.indexOf(id)>=0) return {ok:false,reason:'duplicate',state:getState(),unlocked:[]};
    if(!Number.isSafeInteger(state.coins+amount) || !Number.isSafeInteger(state.lifetimeEarned+amount)) return {ok:false,reason:'invalid-reward',state:getState(),unlocked:[]};
    var before=state.lifetimeEarned;
    state.coins+=amount; state.lifetimeEarned+=amount; state.rewardIds.push(id);
    var unlocked=catalog.filter(function(v){return v.price && v.unlockAt>before && v.unlockAt<=state.lifetimeEarned && state.owned.indexOf(v.id)<0;}).map(function(v){return v.id;});
    unlocked.forEach(function(id){if(state.pendingUnlocks.indexOf(id)<0) state.pendingUnlocks.push(id);});
    save(); return {ok:true,amount:amount,unlocked:unlocked,state:getState()};
  }
  function complete(game) {
    if(typeof game!=='string' || !game.length || game.length>100) return {ok:false,reason:'invalid-game',state:getState()};
    var earned=state.trophies.indexOf(game)<0;
    if(earned) {state.trophies.push(game); save();}
    return {ok:true,earned:earned,trophy:game,state:getState()};
  }
  function equipItem(v){
    if(!v.slot || v.slot==='skin'){state.equipped[v.category]=v.id;if(v.category==='horse')Object.keys(state.loadout).forEach(function(k){if(k.startsWith('horse:'))delete state.loadout[k]})}
    else {state.loadout[v.category+':'+v.slot]=v.id;if(v.category==='horse'&&v.slot!=='ride'&&item(state.loadout['horse:ride'])?.ride==='moto')delete state.loadout['horse:ride'];}
  }
  function gear(category, preview){
    var base=item(state.equipped[category]), chosen=typeof preview==='string'?item(preview):preview;
    if(chosen && chosen.category===category && chosen.slot==='skin')base=chosen;
    if(!base)return null;
    var result=copy(base), extra=Object.keys(state.loadout).map(function(k){return item(state.loadout[k])}).filter(function(v){return v&&v.category===category});
    if(chosen && chosen.category===category && chosen.slot!=='skin')extra=extra.filter(function(v){return v.slot!==chosen.slot}).concat([chosen]);
    if(category==='horse'){
      if(chosen?.slot==='skin')extra=[];
      else if(chosen && chosen.slot!=='ride')extra=extra.filter(function(v){return v.slot!=='ride'});
      result.ride='horse';result.coat=base.coat||'#B5651D';result.silk=base.silk||'#C8102E';result.equip=copy(base.equip||{blanket:'blanket:solid',helmet:'helmet:plain',mane:'mane:plain',tail:'tail:none',wraps:'wraps:none',trail:'trail:dust',victory:'victory:hop'});
      extra.forEach(function(v){if(v.slot==='ride'){result.ride=v.ride;if(v.ride==='moto'){result.bikeStyle=v.bikeStyle||'trail';result.bikeColor=v.color||'#e34924';result.name=v.name;result.rideId=v.id;}}else if(v.slot==='silk')result.silk=v.color;else result.equip[v.slot]=v.gearId});
      if(result.ride==='moto'){result.silk=result.bikeColor;result.equip={};}
      result.color=result.silk;
    }else{result.color=base.color||'#3a9ee8';result.trim=extra.find(function(v){return v.slot==='trim'})||null;}
    return result;
  }
  function purchase(id) {
    var v=item(id);
    if(!v) return {ok:false,reason:'unknown-item',state:getState()};
    if(state.owned.indexOf(id)>=0) return {ok:false,reason:'already-owned',state:getState()};
    if(v.unlockAt>state.lifetimeEarned) return {ok:false,reason:'locked',state:getState()};
    if(v.price>state.coins) return {ok:false,reason:'insufficient-coins',state:getState()};
    state.coins-=v.price; state.owned.push(id); equipItem(v);
    state.pendingUnlocks=state.pendingUnlocks.filter(function(x){return x!==id;}); save();
    return {ok:true,item:copy(v),state:getState()};
  }
  function equip(id) {
    var v=item(id);
    if(!v || state.owned.indexOf(id)<0) return {ok:false,reason:'not-owned',state:getState()};
    equipItem(v); save(); return {ok:true,item:copy(v),state:getState()};
  }
  function acknowledgeUnlocks(ids) {
    var acknowledged=Array.isArray(ids) ? ids : state.pendingUnlocks.slice();
    state.pendingUnlocks=state.pendingUnlocks.filter(function(id){return acknowledged.indexOf(id)<0;}); save(); return getState();
  }
  return {catalog:catalog,gear:gear,getState:getState,reward:reward,complete:complete,purchase:purchase,equip:equip,acknowledgeUnlocks:acknowledgeUnlocks};
}));
