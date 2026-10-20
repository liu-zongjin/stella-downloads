/* Recommendation is local to this browser. Ambiguous Mac user agents never imply Intel. */
(async () => {
  const nav = window.navigator;
  const ua = nav.userAgent || '';
  const platform = (nav.userAgentData && nav.userAgentData.platform) || nav.platform || '';
  let kind = /Windows|Win32|Win64/i.test(platform + ' ' + ua) ? 'windows' : /Mac/i.test(platform + ' ' + ua) && nav.maxTouchPoints < 2 ? 'mac' : 'unknown';
  let architecture = '';
  if (nav.userAgentData && nav.userAgentData.getHighEntropyValues) {
    try {
      const values = await nav.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
      architecture = values.architecture || '';
    } catch (_) { /* Manual download choices remain visible. */ }
  }
  if (kind === 'mac') {
    if (/arm/i.test(architecture)) kind = 'arm';
    else if (/x86/i.test(architecture)) kind = 'intel';
    else {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        const extension = gl && gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : '';
        if (/Apple M\d|Apple GPU/i.test(renderer)) kind = 'arm';
        else if (/Intel|Radeon|AMD|NVIDIA/i.test(renderer)) kind = 'intel';
      } catch (_) { /* Browser privacy settings may hide the renderer. */ }
    }
  }
  const link = document.querySelector('[data-platform-link="' + kind + '"]');
  let note = '请选择设备版本；所有手动下载入口均保留。';
  if (link) {
    const card = link.closest('[data-platform]');
    card.classList.add('is-recommended');
    card.querySelector('.platform-tag').textContent += ' · 为你推荐';
    note = kind === 'arm' ? '推荐 Apple 芯片 Mac 版 · 1.1.5 · macOS 12+' : '推荐 Intel Mac 版 · 1.1.5 · macOS 12+';
    document.querySelectorAll('[data-download]').forEach(button => {
      button.href = link.href;
      button.textContent = kind === 'arm' ? '下载 Apple 芯片 Mac 版 ↗' : '下载 Intel Mac 版 ↗';
    });
  } else if (kind === 'mac') note = '请在「关于本机」确认芯片，再选择 Apple 芯片版或 Intel 版。';
  else if (kind === 'windows') note = /arm/i.test(architecture) ? '当前 Windows 方案仅面向 Intel / AMD 64 位；ARM 设备暂不支持。' : '已识别 Windows；正式引导器下载通道仍在准备。';
  document.querySelectorAll('[data-device-note]').forEach(element => { element.textContent = note; });
  document.documentElement.dataset.downloadRecommendation = kind;
})();
