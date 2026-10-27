const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../docs/analytics-20261021.js'),'utf8');
function setup({dnt=false,blocked=false,path="/stella-downloads/",hash="#updates"}={}){
 const calls=[],handlers={},buttons={},saved=new Map(),session=new Map();
 const store=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
 const button={textContent:'',setAttribute(){},addEventListener:(name,fn)=>buttons[name]=fn};
 const document={hidden:false,referrer:'https://www.google.com/search?q=private',getElementById:id=>id==='analytics-toggle'?button:{},querySelectorAll:()=>[],addEventListener:(name,fn)=>handlers[name]=fn};
 const window={document,doNotTrack:null,innerHeight:900,addEventListener(){}};
 if(blocked){Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});Object.defineProperty(window,'sessionStorage',{get(){throw Error('blocked');}});}
 else{window.localStorage=store(saved);window.sessionStorage=store(session);}
 vm.runInNewContext(source,{window,document,navigator:{doNotTrack:dnt?'1':'0'},location:{hash,pathname:path,hostname:'liu-zongjin.github.io',href:'https://liu-zongjin.github.io'+path+hash},crypto:require('node:crypto').webcrypto,fetch:async(url,options)=>{calls.push({url,...options,event:JSON.parse(options.body)});return {};},AbortSignal,URL,Date,Set,JSON});
 const click=(href='https://github.com/liu-zongjin/stella-downloads/releases/download/v1/Stella-macOS-Intel-1.1.5.dmg',target='')=>handlers.click({target:{closest:()=>({href,dataset:{downloadTarget:target},hasAttribute:name=>name==='data-quark-download'&&!!target,closest:()=>({id:'download'})})}});
 return {calls,buttons,handlers,click,button,saved,document};
}
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
