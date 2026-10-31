(() => {
 const nodes = [...document.querySelectorAll('[data-windows-beta]')];
 if (!nodes.length) return;

 const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
 const isWindows = /windows|win32|win64|wince/i.test(navigator.userAgent || '') || /windows/i.test(platform);

 // 提示默认隐藏，仅确认是 Windows 设备时显示，其他系统不会看到测试版说明。
 nodes.forEach(node => {
  if (isWindows) {
   node.hidden = false;
   node.removeAttribute('hidden');
  } else {
   node.hidden = true;
   node.setAttribute('hidden', '');
  }
 });
})();
