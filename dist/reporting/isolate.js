// The report pages load the practice engine only for each grade's fact bank and rules.
// This empty stand-in store is installed first so the engine never opens the browser's
// own player save: the reports show fictional sample data and nothing else.
window.ArcadeStorage=Object.freeze({getItem:function(){return null;},setItem:function(){},removeItem:function(){}});
