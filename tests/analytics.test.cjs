const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../docs/analytics-20261031.js'),'utf8');
function setup({dnt=false,blocked=false,path="/stella-downloads/",hash="#updates",statuses=[]}={}){
 let now=Date.now();class TestDate extends Date{static now(){return now;}}
 const calls=[],timers=[],handlers={},buttons={},saved=new Map(),session=new Map();
 const store=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
 const button={textContent:'',setAttribute(){},addEventListener:(name,fn)=>buttons[name]=fn};
 const player={listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}};
 const chapterButtons=['00','01','02','03','04','05','06','07'].map(value=>({dataset:{seek:'1'},querySelector:()=>({textContent:value})}));
 const document={hidden:false,referrer:'https://www.google.com/search?q=private',getElementById:id=>id==='analytics-toggle'?button:{},querySelector:selector=>selector==='video#player'?player:null,querySelectorAll:selector=>selector==='.chapter[data-seek]'?chapterButtons:[],addEventListener:(name,fn)=>handlers[name]=fn};
 const window={document,doNotTrack:null,innerHeight:900,addEventListener(){}};
 if(blocked){Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});Object.defineProperty(window,'sessionStorage',{get(){throw Error('blocked');}});}
 else{window.localStorage=store(saved);window.sessionStorage=store(session);}
 vm.runInNewContext(source,{setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},window,document,navigator:{doNotTrack:dnt?'1':'0'},location:{hash,pathname:path,hostname:'liu-zongjin.github.io',href:'https://liu-zongjin.github.io'+path+hash},crypto:require('node:crypto').webcrypto,fetch:async(url,options)=>{calls.push({url,...options,event:JSON.parse(options.body)});return {status:statuses.shift()||204};},AbortSignal,URL,Date:TestDate,Set,JSON});
 const emit=targets=>handlers.click({target:{closest:selector=>targets[selector]||null}});
 const click=(href='https://github.com/liu-zongjin/stella-downloads/releases/download/v1/Stella-macOS-Intel-1.1.5.dmg',target='')=>{
   const anchor={href,dataset:{downloadTarget:target},hasAttribute:name=>name==='data-quark-download'&&!!target,closest:selector=>selector==='section[id]'?{id:'download'}:null};
   emit({'a[href]':anchor});
 };
 const copy=platform=>emit({'[data-copy-prompt]':{dataset:{copyPrompt:'source-prompt-'+platform}}});
 const tab=value=>handlers['stella:platform-changed']({detail:value});
 const chapter=value=>emit({'.chapter[data-seek]':{querySelector:()=>({textContent:value})}});
 const assistant=href=>emit({'.source-chips a[href]':{href}});
 const hashLink=hash=>tab(hash.slice(1));
 const play=()=>player.listeners.play?.();
 return {advance:ms=>{now+=ms;timers.shift()?.();},calls,buttons,handlers,click,copy,tab,chapter,assistant,hashLink,play,button,saved,document};
}
const interactionKeys='detail,event_id,kind,page,session_id,visitor_id';
test('pageview includes deep landing, only source hostname, no queries; download captures target',()=>{
 const state=setup();assert.equal(state.calls.length,1);assert.equal(state.calls[0].event.section,'updates');assert.equal(state.calls[0].event.referrer,'www.google.com');
 assert.equal(state.calls[0].credentials,'omit');state.click();assert.equal(state.calls[1].event.target,'intel');assert.equal(state.calls[1].event.kind,'download');
 assert.equal(state.calls[1].event.visitor_id,state.calls[0].event.visitor_id);assert.equal(state.calls[1].event.session_id,state.calls[0].event.session_id);
 assert.ok(!JSON.stringify(state.calls).includes('private'));
});
test('DNT suppresses collection and cannot be overridden by the toggle',()=>{
 const state=setup({dnt:true});state.click();state.buttons.click();assert.equal(state.calls.length,0);assert.equal(state.saved.size,0);
});
test('opt-out stops collection and clears identifiers; re-enable starts a fresh anonymous visitor',()=>{
 const state=setup(),visitor=state.calls[0].event.visitor_id;state.buttons.click();state.click();assert.equal(state.calls.length,1);assert.equal(state.saved.has('stella.website.visitor'),false);
 state.buttons.click();assert.equal(state.calls.length,2);assert.notEqual(state.calls[1].event.visitor_id,visitor);
});
test('storage blocking cannot break the site and opt-out works in memory',()=>{
 const state=setup({blocked:true});assert.equal(state.calls.length,1);state.buttons.click();state.click();state.handlers.visibilitychange();assert.equal(state.calls.length,1);
});
test('hidden pages do not emit events',()=>{
 const state=setup();state.document.hidden=true;state.click();assert.equal(state.calls.length,1);
});
test('independent download guide records its own landing and channels without query data',()=>{
 const state=setup({path:'/stella-downloads/download.html',hash:'#windows'});
 assert.equal(state.calls[0].event.section,'download-guide');
 state.click('https://pan.quark.cn/s/abc123?private=ignored','windows');
 state.click('https://github.com/liu-zongjin/stella-downloads/releases/download/v1/Stella-Windows-1.1.7-test.1-offline-complete.zip');
 state.click('https://github.com/liu-zongjin/stella-downloads/releases/download/v1/Stella-Windows-1.1.6-setup.exe');
 assert.deepEqual(state.calls.slice(1).map(c=>[c.event.section,c.event.target,c.event.channel]),[
  ['download-guide','windows','quark'],['download-guide','windows','github'],['download-guide','windows','github']]);
 assert.ok(!JSON.stringify(state.calls).includes('private'));
 state.click('https://github.com/liu-zongjin/stella-downloads/releases/download/v1/browser-component.zip');
 state.click('https://github.com/liu-zongjin/stella-downloads/releases/download/v1/Stella-Windows-backend.zip');
 assert.equal(state.calls.length,4);
});
test('video page records its own landing, one play per visit and chapter numbers without page text',()=>{
 const state=setup({path:'/stella-downloads/watch.html',hash:''});
 assert.equal(state.calls[0].event.section,'watch');
 state.play();state.play();state.chapter('03');
 assert.deepEqual(state.calls.slice(1).map(c=>[c.event.kind,c.event.page,c.event.detail]),[['video','watch','play'],['chapter','watch','03']]);
 assert.ok(state.calls.slice(1).every(c=>Object.keys(c.event).sort().join(',')===interactionKeys));
 assert.ok(!JSON.stringify(state.calls).includes('文书'));
});
test('source install copies, platform tabs and assistant links are recorded as allowlisted interactions',()=>{
 const state=setup({path:'/stella-downloads/download.html',hash:''});
 state.copy('mac');state.copy('windows');
 state.tab('intel');state.tab('intel');state.tab('windows');
 state.assistant('https://www.workbuddy.cn/');state.assistant('https://www.deepseek.com/harness/');state.assistant('https://www.trae.cn/');state.assistant('https://example.com/private');
 const interactions=state.calls.filter(c=>c.event.kind!=='pageview');
 assert.deepEqual(interactions.map(c=>[c.event.kind,c.event.detail]),[['copy','mac'],['copy','windows'],['tab','intel'],['tab','windows'],['assistant','workbuddy'],['assistant','deepseek'],['assistant','trae']]);
 assert.ok(interactions.every(c=>Object.keys(c.event).sort().join(',')===interactionKeys));
 assert.ok(!JSON.stringify(interactions).includes('private'));
});
test('in-page platform links count as tab selections once per target',()=>{
 const state=setup({path:'/stella-downloads/download.html',hash:''});
 state.hashLink('#windows');state.hashLink('#windows');state.hashLink('#arm');
 assert.deepEqual(state.calls.filter(c=>c.event.kind==='tab').map(c=>c.event.detail),['windows','arm']);
});
test('opt-out and hidden tabs also suppress interaction events',()=>{
 const state=setup({path:'/stella-downloads/download.html',hash:''});
 assert.equal(state.calls.length,1);
 state.buttons.click();state.copy('mac');state.tab('arm');state.chapter('00');state.play();
 assert.equal(state.calls.length,1);
 state.buttons.click();state.copy('mac');
 assert.equal(state.calls.length,3);assert.equal(state.calls[2].event.kind,'copy');
 state.document.hidden=true;state.tab('intel');
 assert.equal(state.calls.length,3);
});

test('copy success is separate from attempts and survives immediate page hiding',()=>{
 const state=setup({path:'/stella-downloads/download.html',hash:''});
 state.copy('mac');state.document.hidden=true;state.handlers['stella:copy-success']({detail:'mac'});
 assert.deepEqual(state.calls.slice(1).map(c=>c.event.kind),['copy','copy_success']);
});

test('transient delivery failures retry the same event at most three times',async()=>{
 const state=setup({statuses:[503,503,503]});
 const flush=()=>new Promise(setImmediate);
 await flush();state.advance(5000);await flush();state.advance(30000);await flush();state.advance(30000);await flush();
 assert.equal(state.calls.length,3);assert.equal(new Set(state.calls.map(c=>c.event.event_id)).size,1);
});
test('opting out clears failed delivery retries',async()=>{
 const state=setup({statuses:[503]});await new Promise(setImmediate);
 state.buttons.click();state.advance(30000);await new Promise(setImmediate);assert.equal(state.calls.length,1);
});
