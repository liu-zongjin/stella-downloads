(() => {
  const root = document.querySelector('[data-walkthrough]');
  if (!root) return;
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const steps = [...root.querySelectorAll('[data-step]')];
  const toggle = root.querySelector('[data-toggle]');
  const captions = ['点击对应系统的复制按钮', '打开本机助手，粘贴并发送', '查看进度，按需确认', '等待验证结果'];
  const durations = [2300, 6200, 2800, 2200];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = motion.matches, timer, remaining = durations[0], startedAt = 0;
  function stopTimer() {
    if (timer) { clearTimeout(timer); timer = null; remaining = Math.max(0, remaining - (performance.now() - startedAt)); }
  }
  function schedule() {
    stopTimer();
    if (!paused && !document.hidden) {
      startedAt = performance.now();
      timer = setTimeout(() => { timer = null; show((index + 1) % scenes.length); }, remaining);
    }
  }
  function show(next) {
    stopTimer();
    if (next === index && !scenes[next].hidden) { scenes[next].hidden = true; void scenes[next].offsetWidth; }
    index = next;
    remaining = durations[index];
    scenes.forEach((scene, i) => { scene.hidden = i !== index; scene.style.setProperty('--scene-duration', durations[i] + 'ms'); });
    steps.forEach((step, i) => { if (i === index) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current'); });
    root.querySelector('[data-counter]').textContent = `0${index + 1} / 04`;
    root.querySelector('[data-caption]').textContent = captions[index];
    schedule();
  }
  function updateToggle() {
    root.dataset.paused = String(paused || document.hidden);
    toggle.textContent = paused ? '播放演示' : '暂停演示';
    toggle.setAttribute('aria-pressed', String(paused));
  }
  steps.forEach((step, i) => step.addEventListener('click', () => { paused = motion.matches; updateToggle(); show(i); }));
  root.querySelector('[data-next]').addEventListener('click', () => { paused = motion.matches; updateToggle(); show((index + 1) % scenes.length); });
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); schedule(); });
  document.addEventListener('visibilitychange', () => { updateToggle(); schedule(); });
  motion.addEventListener?.('change', event => { if (event.matches) { paused = true; updateToggle(); schedule(); } });
  updateToggle(); show(0);
})();
