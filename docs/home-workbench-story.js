(() => {
  const root = document.querySelector('[data-workbench-story]');
  const api = window.StellaScrollPreview;
  if (!root || !api || !('IntersectionObserver' in window) || !window.CSS?.supports('position', 'sticky')) return;

  const stage = root.querySelector('.wb-pinned');
  const screen = root.querySelector('.wb-viewport');
  const frame = screen.querySelector('iframe');
  const viewControls = root.querySelector('.wb-switch');
  const views = [...viewControls.querySelectorAll('button')];
  const motion = matchMedia('(min-width: 740px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
  let value = 0;
  let currentView = 'knowledge';

  const ease = value => value * value * (3 - 2 * value);

  function renderHandoff(progress) {
    const closing = ease(api.ramp(progress, .88, 1));
    stage.style.setProperty('--wb-exit', closing);
  }

  function render(progress) {
    value = motion.matches ? progress : 0;
    frame.contentWindow?.setWorkbenchProgress?.(value);
    stage.style.setProperty('--wb-story-progress', value);
    renderHandoff(value);
  }

  const refresh = api.track(root, stage, render);

  function measure() {
    screen.style.setProperty('--wb-scale', screen.clientWidth / 1600);
    renderHandoff(value);
  }

  function sync() {
    root.classList.toggle('is-scroll-workbench', motion.matches);
    measure();
    refresh();
  }

  function applyView() {
    const preview = frame.contentWindow;
    if (typeof preview?.selectWorkbenchView !== 'function') return;
    preview.selectWorkbenchView(currentView);
    viewControls.hidden = false;
    views.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.wbView === currentView));
    });
  }

  views.forEach(button => button.addEventListener('click', () => {
    currentView = button.dataset.wbView;
    applyView();
  }));
  frame.addEventListener('load', () => {
    applyView();
    render(value);
  });
  applyView();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(screen);
  window.addEventListener('resize', measure, { passive: true });
  motion.addEventListener('change', sync);
  sync();
})();
