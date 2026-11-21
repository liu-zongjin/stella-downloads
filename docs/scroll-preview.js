(() => {
  const clamp = value => Math.min(1, Math.max(0, value));
  const ramp = (value, start, end) => clamp((value - start) / (end - start));

  function track(section, stage, render) {
    let frame = 0;
    let visible = false;

    function update() {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(stage).top) || 0;
      render(clamp((top - bounds.top) / Math.max(1, bounds.height - stage.offsetHeight)));
    }

    function queue() {
      if (visible && !frame) frame = requestAnimationFrame(update);
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!frame) frame = requestAnimationFrame(update);
    }, { rootMargin: '160px 0px' });
    observer.observe(section);
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('pageshow', queue);
    update();
    return update;
  }

  window.StellaScrollPreview = { track, ramp };
})();
