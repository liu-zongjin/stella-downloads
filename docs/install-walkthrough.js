(() => {
  const root = document.querySelector('[data-walkthrough]');
  if (!root) return;
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const steps = [...root.querySelectorAll('[data-step]')];
  const toggle = root.querySelector('[data-toggle]');
  const captions = ['点击对应系统的复制按钮', '粘贴到本机 AI 助手并发送', '查看进度，按需确认', '等待验证结果'];
  const durations = [5500, 15500, 8500, 6500];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = motion.matches, timer;
  function schedule() {
    clearTimeout(timer);
    if (!paused && !document.hidden) timer = setTimeout(() => show((index + 1) % scenes.length), durations[index]);
  }
  function show(next) {
    if (next === index && !scenes[next].hidden) { scenes[next].hidden = true; void scenes[next].offsetWidth; }
    index = next;
    scenes.forEach((scene, i) => { scene.hidden = i !== index; });
    steps.forEach((step, i) => { if (i === index) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current'); });
    root.querySelector('[data-counter]').textContent = `0${index + 1} / 04`;
    root.querySelector('[data-caption]').textContent = captions[index];
    schedule();
  }
  function updateToggle() {
    root.dataset.paused = String(paused);
    toggle.textContent = paused ? '播放演示' : '暂停演示';
    toggle.setAttribute('aria-pressed', String(paused));
  }
  steps.forEach((step, i) => step.addEventListener('click', () => { paused = motion.matches; updateToggle(); show(i); }));
  root.querySelector('[data-next]').addEventListener('click', () => { paused = motion.matches; updateToggle(); show((index + 1) % scenes.length); });
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener?.('change', event => { if (event.matches) { paused = true; updateToggle(); schedule(); } });
  updateToggle(); show(0);
})();
