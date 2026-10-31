/* Anonymous, content-free website statistics. No cookies, fingerprint or URL queries. */
(() => {
'use strict';
const endpoint='https://stella-admin.pages.dev/v1/website-events';
const sections=new Set(['home','cases','knowledge','office','updates','install','questions','download','platform-downloads','download-guide','watch','agent-install','film','chapters']);
const path=location.pathname||new URL(location.href).pathname;
const downloadGuide=/\/download\.html$/.test(path);
const watchPage=/\/watch\.html$/.test(path);
const page=downloadGuide?'download-guide':watchPage?'watch':'home';
const sectionName=id=>downloadGuide&&id==='download'?'download-guide':id;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const read=(store,key)=>{try{return store.getItem(key);}catch{return null;}};
const write=(store,key,value)=>{try{store.setItem(key,value);}catch{/* Storage-disabled browsers use memory-only IDs. */}};
let local,session;
try{local=window.localStorage;}catch{}try{session=window.sessionStorage;}catch{}
const storageRead=(store,key)=>store?read(store,key):null;
const storageWrite=(store,key,value)=>{if(store)write(store,key,value);};
const respectPrivacy=()=>navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl===true;
let memoryOptout=false;
const disabled=()=>memoryOptout||respectPrivacy()||storageRead(local,'stella.website.optout')==='1';
const toggle=document.getElementById('analytics-toggle'),note=document.getElementById('analytics-note');
let visitor=storageRead(local,'stella.website.visitor'),sessionId='',last=0;
let started=false,observer=null,pvSent=false;
const seen=new Set();
function updateToggle(){if(toggle){toggle.textContent=disabled()?'匿名访问统计：已关闭':'关闭匿名访问统计';toggle.setAttribute('aria-pressed',String(disabled()));}if(note)note.textContent=respectPrivacy()?'已遵循浏览器的隐私偏好，不发送访问统计。':'仅统计匿名访问、来源域名、粗略地区、设备类型、区块浏览、安装指引与视频互动、下载点击，保留 90 天；不使用 Cookie，不保存 IP 或完整网址。';}
function getSession(){
  let saved;
  try{saved=JSON.parse(storageRead(session,'stella.website.session'));}catch{}
  if(saved && UUID.test(saved.id) && Number.isFinite(saved.at) && saved.at<=Date.now() && Date.now()-saved.at<1800000){sessionId=saved.id;last=saved.at;}
  if(!UUID.test(sessionId)||Date.now()-last>=1800000)sessionId=crypto.randomUUID();
  last=Date.now();storageWrite(session,'stella.website.session',JSON.stringify({id:sessionId,at:last}));return sessionId;
}
let referrer='';
try{const url=new URL(document.referrer);if(['https:','http:'].includes(url.protocol)&&url.hostname!==location.hostname)referrer=url.hostname.toLowerCase();}catch{}
function send(kind,section='home',target='',channel=''){
  section=sectionName(section);
  if(disabled()||document.hidden)return;
  try{
    const body=JSON.stringify({event_id:crypto.randomUUID(),visitor_id:visitor,session_id:getSession(),kind,section:sections.has(section)?section:'home',target,referrer,...(kind==='download'?{channel}:{})});
    fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body,keepalive:true,signal:typeof AbortSignal!=='undefined' && typeof AbortSignal.timeout==='function'?AbortSignal.timeout(8000):undefined}).catch(()=>{});
  }catch{/* Analytics failure must never block the website or downloads. */}
}
function sendInteraction(kind,detail){
  if(page==='home'||disabled()||document.hidden||!detail)return;
  if(!UUID.test(visitor))visitor=crypto.randomUUID();
  try{
    const body=JSON.stringify({event_id:crypto.randomUUID(),visitor_id:visitor,session_id:getSession(),kind,page,detail});
    fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body,keepalive:true,signal:typeof AbortSignal!=='undefined' && typeof AbortSignal.timeout==='function'?AbortSignal.timeout(8000):undefined}).catch(()=>{});
  }catch{/* Interaction analytics must never block the page. */}
}
function visibleSections(){
  if(!observer || disabled() || document.hidden)return;
  for(const el of document.querySelectorAll('section[id],#platform-downloads')){
    if(!sections.has(el.id)||seen.has(el.id))continue;
    const rect=el.getBoundingClientRect();
    if(rect.bottom>0 && rect.top<window.innerHeight){seen.add(el.id);send('section',el.id);}
  }
}
function start(){
  if(disabled()||document.hidden)return;
  if(!UUID.test(visitor)){visitor=crypto.randomUUID();storageWrite(local,'stella.website.visitor',visitor);}
  if(!pvSent){send('pageview',page==='home'?(location.hash.slice(1)||'home'):page);pvSent=true;}
  if(started){visibleSections();return;}started=true;
  if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{if(disabled()||document.hidden)return;for(const entry of entries){if(entry.isIntersecting&&!seen.has(entry.target.id)){seen.add(entry.target.id);send('section',entry.target.id);}}},{threshold:0});
    for(const el of document.querySelectorAll('section[id],#platform-downloads'))if(sections.has(el.id))observer.observe(el);
  }
}
const assistantHosts=[['workbuddy.cn','workbuddy'],['doubao.com','doubao'],['qwenwork.cn','qwen'],['lingma.aliyun.com','lingma'],['trae.cn','trae']];
function assistantName(anchor){
  let host='';try{host=new URL(anchor.href,location.href).hostname.toLowerCase();}catch{return '';}
  const match=assistantHosts.find(([domain])=>host===domain||host.endsWith('.'+domain));
  return match?match[1]:'';
}
let lastTab=(()=>{const value=(new URL(location.href).searchParams.get('platform')||location.hash.slice(1)||'').toLowerCase();return ['arm','intel','windows'].includes(value)?value:'';})();
toggle?.addEventListener('click',()=>{
  if(respectPrivacy()){updateToggle();return;}
  const optout=!disabled();storageWrite(local,'stella.website.optout',optout?'1':'0');
  // Keep opt-out effective even when persistent storage is blocked.
  memoryOptout=optout;
  if(optout){try{local?.removeItem('stella.website.visitor');session?.removeItem('stella.website.session');}catch{}visitor=null;sessionId='';}
  else{seen.clear();pvSent=false;lastTab='';start();}updateToggle();
});
document.addEventListener('click',event=>{
  if(disabled())return;
  const copy=event.target.closest?.('[data-copy-prompt]');
  if(copy){
    const id=copy.dataset.copyPrompt||'';
    if(/mac$/i.test(id))sendInteraction('copy','mac');
    else if(/windows$/i.test(id))sendInteraction('copy','windows');
  }
  const tab=event.target.closest?.('[data-tab]');
  const hashTab=tab||(downloadGuide?event.target.closest?.('a[href="#arm"],a[href="#intel"],a[href="#windows"]'):null);
  const tabValue=tab?tab.dataset.tab:(hashTab?(hashTab.getAttribute('href')||'').slice(1):'');
  if(tabValue&&['arm','intel','windows'].includes(tabValue)&&tabValue!==lastTab){lastTab=tabValue;sendInteraction('tab',tabValue);}
  const chapter=event.target.closest?.('.chapter[data-seek]');
  if(chapter&&watchPage){
    const value=(chapter.querySelector('span')?.textContent||'').trim();
    if(/^0[0-7]$/.test(value))sendInteraction('chapter',value);
  }
  const chip=event.target.closest?.('.source-chips a[href]');
  if(chip){const name=assistantName(chip);if(name)sendInteraction('assistant',name);}
  const anchor=event.target.closest?.('a[href]');if(!anchor)return;
  let url;try{url=new URL(anchor.href,location.href);}catch{return;}
  if((anchor.hasAttribute('data-quark-download')||anchor.hasAttribute('data-quark-offline'))&&url.hostname==='pan.quark.cn'&&/^\/s\/[a-z0-9]+\/?$/i.test(url.pathname)){
    const target=anchor.dataset.downloadTarget||(anchor.hasAttribute('data-quark-offline')?'windows':'');
    if(['arm','intel','windows'].includes(target))send('download',anchor.closest('section[id]')?.id||'download',target,'quark');return;
  }
  if(url.hostname!=='github.com'||!url.pathname.startsWith('/liu-zongjin/stella-downloads/releases/download/'))return;
  const file=url.pathname.split('/').pop();
  const target=/^Stella.*(?:AppleSilicon).*\.(?:dmg|zip)$/i.test(file)?'arm':/^Stella.*Intel.*\.(?:dmg|zip)$/i.test(file)?'intel':/^Stella-Windows.*(?:-setup\.exe|-offline(?:-complete)?\.zip)$/i.test(file)?'windows':'';
  if(target)send('download',anchor.closest('section[id]')?.id||'download',target,'github');
},true);
const player=document.querySelector('video#player');
if(player&&watchPage){
  let playSent=false;
  player.addEventListener('play',()=>{if(playSent)return;playSent=true;sendInteraction('video','play');});
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!disabled())start();});
window.addEventListener('storage',event=>{if(event.key==='stella.website.optout'){memoryOptout=event.newValue==='1';if(memoryOptout){visitor=null;sessionId='';seen.clear();pvSent=false;}updateToggle();if(!disabled())start();}});
updateToggle();if(!disabled())start();
})();
