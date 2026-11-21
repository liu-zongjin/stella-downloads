(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!Element.prototype.animate) return;

  const app = document.querySelector('.workbench-app');
  const toolbar = app.querySelector('.workbench-toolbar');
  const anchor = toolbar.querySelector('.assist-island-anchor');
  const shell = anchor.querySelector('.assist-island-shell');
  const trigger = shell.querySelector('.assist-island-trigger');
  const menu = shell.querySelector('.tools-popup');
  const menuContent = menu.querySelector('.workbench-menu-content');
  const cards = [...document.querySelectorAll('.workbench-card')].map(card => ({
    card, images: [...card.querySelectorAll('[data-bg]')]
  }));

  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const transition = (value, start, end) => ease(clamp((value - start) / (end - start)));
  const menuStart = .44;
  const menuOpen = .68;

  // Preserve the dimensions and shape easing used by the source app's efficiency-center shell.
  const menuWidth = 1120;
  const menuHeight = 691;
  const closed = { width: '120px', height: '30px', borderRadius: '20px' };
  const expanded = { width: `${menuWidth}px`, height: `${menuHeight}px`, borderRadius: '20px' };
  const morphOptions = { duration: 200, easing: 'cubic-bezier(.2,.88,.2,1)', fill: 'both' };
  const opening = shell.animate([closed, expanded], morphOptions);
  const openingMenu = menuContent.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 140, easing: 'ease', fill: 'both' });

  const animations = [opening, openingMenu];
  animations.forEach(animation => animation.cancel());

  let menuMode;
  let menuFocus;
  let requestedImages = false;

  function seek(animation, time) {
    if (animation.playState === 'idle') animation.pause();
    animation.currentTime = time;
  }

  function setMenu(progress) {
    const active = progress >= menuStart;
    if (active !== menuMode) {
      menuMode = active;
      toolbar.classList.toggle('has-menu', active);
      shell.classList.toggle('is-open', active);
      shell.classList.toggle('show-trigger', !active);
      menu.classList.toggle('show', active);
      trigger.setAttribute('aria-expanded', String(active));
    }
    if (!active) {
      animations.forEach(animation => animation.cancel());
      return;
    }
    const time = clamp((progress - menuStart) / (menuOpen - menuStart)) * 360;
    seek(opening, time);
    seek(openingMenu, time);
  }

  function focusMenu(amount) {
    if (!amount) {
      if (menuFocus) {
        app.style.removeProperty('transform');
        menuFocus = undefined;
      }
      return;
    }

    // Frame the fully expanded menu while it stays anchored to the original toolbar button.
    if (!menuFocus) {
      const bounds = anchor.getBoundingClientRect();
      const scale = .94 * Math.min(innerWidth / menuWidth, innerHeight / menuHeight);
      menuFocus = {
        scale,
        x: innerWidth / 2 - (bounds.right - menuWidth / 2) * scale,
        y: innerHeight / 2 - (bounds.top + menuHeight / 2) * scale
      };
    }
    const scale = 1 + (menuFocus.scale - 1) * amount;
    app.style.transform = `translate(${menuFocus.x * amount}px, ${menuFocus.y * amount}px) scale(${scale})`;
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
    focusMenu(transition(progress, .52, menuOpen));
  };

  window.setWorkbenchProgress(0);
})();
