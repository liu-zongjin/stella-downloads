/* Device hints only recommend a download; the installer checks actual OS support. */
(async () => {
  const nav = window.navigator;
  const ua = nav.userAgent || '';
  const platform = (nav.userAgentData && nav.userAgentData.platform) || nav.platform || '';
  let kind = /Windows|Win32|Win64/i.test(platform + ' ' + ua) ? 'windows' : /Mac/i.test(platform + ' ' + ua) && nav.maxTouchPoints < 2 ? 'mac' : 'unknown';
  let architecture = '', bitness = '';
  if (nav.userAgentData && nav.userAgentData.getHighEntropyValues) {
    try {
      const values = await nav.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
      architecture = values.architecture || ''; bitness = values.bitness || '';
    } catch (_) { /* Keep manual choices available when browser hints are hidden. */ }
  }
  if (kind === 'windows') {
    const version = ua.match(/Windows NT ([\d.]+)/i);
    if (/arm|aarch/i.test(architecture + ' ' + ua)) kind = 'windows-arm';
    else if (version && Number(version[1]) < 10) kind = 'windows-old';
    else if (bitness === '32') kind = 'windows-32';
    else if ((/x86/i.test(architecture) && bitness === '64') || /Win64|WOW64|x64|AMD64/i.test(ua)) kind = 'windows';
    else kind = 'windows-unknown';
  }
  if (kind === 'mac') {
    if (/arm/i.test(architecture)) kind = 'arm';
    else if (/x86/i.test(architecture)) kind = 'intel';
    else {
      try {
        const gl = document.createElement('canvas').getContext('webgl');
        const extension = gl && gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : '';
        if (/Apple M\d|Apple GPU/i.test(renderer)) kind = 'arm';
        else if (/Intel|Radeon|AMD|NVIDIA/i.test(renderer)) kind = 'intel';
      } catch (_) { /* Privacy settings may hide the graphics device. */ }
    }
  }
  const link = document.querySelector('[data-platform-link="' + kind + '"]');
  let note = '请选择设备版本；所有手动下载入口均保留。';
  if (link) {
    const card = link.closest('[data-platform]');
    card.classList.add('is-recommended');
    card.querySelector('.platform-tag').textContent += ' · 为你推荐';
    const labels = {arm: 'Apple 芯片 Mac 版', intel: 'Intel Mac 版', windows: 'Windows 离线安装包'};
    note = '推荐 ' + labels[kind] + ' · ' + (kind === 'windows' ? '1.1.7 测试版' : '1.1.5') + ' · ' + (kind === 'windows' ? 'Windows 10 1809+ / Windows 11 · Intel / AMD 64 位' : 'macOS 12+');
    document.querySelectorAll('[data-download]').forEach(button => { button.href = link.href; button.textContent = '下载与安装 · ' + labels[kind] + ' ↗'; });
  } else if (kind === 'mac') note = '请在「关于本机」确认芯片，再选择 Apple 芯片版或 Intel 版。';
  else if (kind === 'windows-arm' || kind === 'windows-32') note = 'Windows 版适用于 Intel / AMD 64 位电脑；ARM 和 32 位系统暂不支持。';
  else if (kind === 'windows-old') note = 'Windows 版要求 Windows 10 1809 或更新版本，请先升级系统。';
  else if (kind === 'windows-unknown') note = '已识别 Windows，请在系统设置中确认是 Intel / AMD 64 位后选择 Windows 引导器。';
  document.querySelectorAll('[data-device-note]').forEach(element => { element.textContent = note; });
  const offlineShortcut = document.querySelector('[data-windows-offline-shortcut]');
  if (offlineShortcut) offlineShortcut.hidden = !kind.startsWith('windows');
  document.documentElement.dataset.downloadRecommendation = kind;
})();
