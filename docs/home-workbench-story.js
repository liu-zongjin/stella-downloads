(() => {
  const root = document.querySelector('[data-workbench-story]');
  const api = window.StellaScrollPreview;
  if (!root || !api || !('IntersectionObserver' in window) || !window.CSS?.supports('position', 'sticky')) return;

  const stage = root.querySelector('.wb-pinned');
  const screen = root.querySelector('.wb-viewport');
  const frame = screen.querySelector('iframe');
  const nextSection = document.getElementById('product-story');
  const viewControls = root.querySelector('.wb-switch');
  const views = [...viewControls.querySelectorAll('button')];
  const motion = matchMedia('(min-width: 740px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
  let value = 0;
  let currentView = 'knowledge';
  let width = 0;
  let height = 0;
  let pinnedTop = 0;

  const ease = value => value * value * (3 - 2 * value);

  function renderHandoff(progress) {
    const handoff = progress >= .79 && width > 0 && height > 0;
    stage.classList.toggle('is-handoff', handoff);
    viewControls.inert = handoff;
    if (!handoff) return;

    const viewport = document.documentElement;
    const zoom = ease(api.ramp(progress, .79, .95));
    const cover = 1.075 * Math.max(viewport.clientWidth / width, viewport.clientHeight / height);
    const top = pinnedTop + (viewport.clientHeight / 2 - height / 2 - pinnedTop) * zoom;
    const nextTop = nextSection.getBoundingClientRect().top / viewport.clientHeight;
    // Keep a full-viewport frame before blending into the guide as it scrolls underneath.
    const blend = 1 - api.ramp(nextTop, .08, .82);
    const opacity = 1 - ease(api.ramp(blend, .12, 1));

    stage.style.setProperty('--wb-window-top', `${top}px`);
    stage.style.setProperty('--wb-window-zoom', 1 + (cover - 1) * zoom);
    stage.style.setProperty('--wb-window-opacity', opacity);
    stage.style.setProperty('--wb-window-tint', ease(api.ramp(blend, 0, .74)));
    stage.style.setProperty('--wb-window-edge', 1 - zoom);
    stage.style.setProperty('--wb-controls-opacity', 1 - ease(api.ramp(progress, .79, .86)));
    stage.classList.toggle('is-handoff-done', opacity === 0);
  }

  function render(progress) {
    value = motion.matches ? progress : 0;
    frame.contentWindow?.setWorkbenchProgress?.(value);
    stage.style.setProperty('--wb-story-progress', value);
    renderHandoff(value);
  }

  const refresh = api.track(root, stage, render);

  function measure() {
    width = screen.clientWidth;
    height = screen.clientHeight;
    pinnedTop = (parseFloat(getComputedStyle(stage).top) || 0) + screen.clientTop;
    screen.style.setProperty('--wb-scale', width / 1600);
    screen.style.setProperty('--wb-window-width', `${width}px`);
    screen.style.setProperty('--wb-window-height', `${height}px`);
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
