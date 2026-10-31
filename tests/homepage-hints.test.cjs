const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../docs/downloads-20261021.js'),'utf8');
function setup({kind,cardText}){
  const notes=[],buttons=[];
  const tag={textContent:'ARM'};
  const card={classList:{add(){}},querySelector(selector){return selector==='.platform-tag'?tag:selector==='p'?{textContent:cardText}:null;}};
  const link={href:'download.html?platform='+kind,closest:()=>card};
  const document={
    querySelector(selector){return selector==='[data-platform-link="'+kind+'"]'?link:null;},
    querySelectorAll(selector){
      if(selector==='[data-download]')return buttons;
      if(selector==='[data-device-note]')return notes;
      return [];
    },
    createTextNode:text=>({text}),
    createElement:()=>({attributes:{},setAttribute(name,value){this.attributes[name]=value;},textContent:''}),
    documentElement:{dataset:{}}
  };
  const button={href:'download.html',children:[],replaceChildren(...children){this.children=children;}};
  buttons.push(button);
  notes.push({textContent:''});
  const navigator={userAgent:'Mozilla/5.0',platform:'MacIntel',maxTouchPoints:0,
    userAgentData:{platform:kind==='windows'?'Windows':'macOS',getHighEntropyValues:async()=>({architecture:kind==='windows'?'x86':'arm',bitness:'64'})}};
  vm.runInNewContext(source,{window:{navigator},document,navigator,setTimeout});
  return {notes,buttons,button,link,tag,card};
}
test('homepage readme note follows the platform card instead of a hardcoded version',async()=>{
  const state=setup({kind:'arm',cardText:'9.9.9 · macOS 12+'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(state.notes[0].textContent,'推荐 Apple 芯片 Mac 版 · 9.9.9 · macOS 12+');
  assert.equal(state.button.href,'download.html?platform=arm');
  assert.equal(state.button.children[0].text,'下载与安装 · Apple 芯片 Mac 版 ');
  assert.equal(state.button.children[1].textContent,'↗');
  assert.equal(state.button.children[1].attributes['aria-hidden'],'true');
});
test('windows recommendation drops the redundant development notice but keeps requirements',async()=>{
  const state=setup({kind:'windows',cardText:'测试版 · 仍在开发中 · Windows 10 / 11 · 64 位'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(state.notes[0].textContent,'推荐 Windows 离线安装包 · 测试版 · Windows 10 / 11 · 64 位');
  assert.equal(state.button.children[0].text,'下载与安装 · Windows 离线安装包 ');
});
