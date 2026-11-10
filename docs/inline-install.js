(() => {
  const frame = document.querySelector('.inline-install-frame');
  if (!frame) return;
  let observer;
  frame.addEventListener('load', () => {
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.documentElement.classList.contains('embedded-guide')) return;
      const resize = () => { frame.style.height = `${Math.ceil(doc.querySelector("main").getBoundingClientRect().bottom + frame.contentWindow.scrollY)}px`; };
      if (observer) observer.disconnect();
      observer = new ResizeObserver(resize);
      observer.observe(doc.body);
      resize();
    } catch (_) { /* The independent guide link remains available. */ }
  });
})();
