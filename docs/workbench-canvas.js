(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  const app = document.querySelector('.workbench-app');
  const toolbar = app.querySelector('.workbench-toolbar');
  const shell = toolbar.querySelector('.assist-island-shell');
  const trigger = shell.querySelector('.assist-island-trigger');
  const menu = shell.querySelector('.tools-popup');
  const cards = [...app.querySelectorAll('.workbench-card')].map(card => ({
    card, images: [...card.querySelectorAll('[data-bg]')]
  }));

  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const transition = (value, start, end) => ease(clamp((value - start) / (end - start)));

  let menuMode;
  let requestedImages = false;

  function setMenu(progress) {
    const revealed = transition(progress, .44, .56) * (1 - transition(progress, .76, .88));
    const active = revealed > 0;
    if (active !== menuMode) {
      menuMode = active;
      toolbar.classList.toggle('has-menu', active);
      shell.classList.toggle('is-open', active);
      menu.classList.toggle('show', active);
      trigger.setAttribute('aria-expanded', String(active));
    }
    app.style.setProperty('--menu-reveal', revealed);
  }

  window.selectWorkbenchView = view => {
    cards.forEach(({ card }) => { card.hidden = card.dataset.workbenchView !== view; });
  };

  window.setWorkbenchProgress = progress => {
    if (motion.matches) progress = 0;

    if (progress > .025 && !requestedImages) {
      cards.forEach(({ images }) => images.forEach(image => { image.src = image.dataset.src; }));
      requestedImages = true;
    }

    const layers = [
      transition(progress, .06, .145),
      transition(progress, .18, .265),
      transition(progress, .31, .40)
    ];
    cards.forEach(({ images }) => images.forEach((image, i) => {
      image.style.opacity = layers[i];
    }));
    setMenu(progress);
  };

  window.setWorkbenchProgress(0);
})();
