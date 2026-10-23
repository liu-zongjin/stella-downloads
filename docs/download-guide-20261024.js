(() => {
 const tabs=[...document.querySelectorAll('[data-tab]')], panels=[...document.querySelectorAll('[data-panel]')];
 const allowed=new Set(tabs.map(t=>t.dataset.tab));
 function choose(key,update){if(!allowed.has(key))key='arm';tabs.forEach(t=>{const active=t.dataset.tab===key;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});panels.forEach(p=>p.hidden=p.dataset.panel!==key);if(update){const url=new URL(location.href);url.searchParams.set('platform',key);url.hash='';history.replaceState(null,'',url);}}
 document.querySelector('.platform-tabs').setAttribute('role','tablist');
 tabs.forEach(t=>{t.setAttribute('role','tab');t.setAttribute('aria-controls',t.dataset.tab);t.addEventListener('click',e=>{e.preventDefault();choose(t.dataset.tab,true);});t.addEventListener('keydown',e=>{let i=tabs.indexOf(t);if(e.key==='ArrowRight')i=(i+1)%tabs.length;else if(e.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();tabs[i].focus();choose(tabs[i].dataset.tab,true);});});
 panels.forEach(p=>p.setAttribute('role','tabpanel'));
 const read=()=>new URL(location.href).searchParams.get('platform')||location.hash.slice(1)||(/Windows/i.test(navigator.userAgent)?'windows':'arm');
 choose(read(),false);window.addEventListener('popstate',()=>choose(read(),false));window.addEventListener('hashchange',()=>choose(read(),false));
})();
