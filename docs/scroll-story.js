(() => {
  'use strict';

  const layout = document.querySelector('[data-scroll-story]');
  if (!layout || !('IntersectionObserver' in window) || !window.CSS?.supports('position', 'sticky')) return;

  const guide = layout.closest('.scroll-story');
  const introSlot = guide.querySelector('.story-intro-slot');
  const intro = introSlot.querySelector('.story-intro');
  const primaryHeader = document.querySelector('.site-header');
  const primaryNav = primaryHeader.querySelector('.header-inner');
  const canPin = matchMedia('screen and (min-width: 1000px) and (min-height: 690px) and (prefers-reduced-motion: no-preference)');
  const links = [...intro.querySelectorAll('.story-nav a')];
  const visual = layout.querySelector('.story-visual');
  const screen = visual.querySelector('.story-screen');
  const caption = visual.querySelector('[data-story-caption]');
  const kind = visual.querySelector('[data-story-kind]');
  const note = visual.querySelector('[data-story-note]');
  const view = visual.querySelector('[data-story-view]');
  const original = visual.querySelector('[data-story-original]');
  const progress = visual.querySelector('.story-progress');

  let scenes;
  let active = -1;
  let frame = 0;
  let inView = false;
  let fullImage = false;
  let screenWidth = 0;
  let screenHeight = 0;
  let directionY = window.scrollY;
  let scrollingDown = true;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function prepareScenes() {
    // Static figures provide the same content when pinning or motion is unavailable.
    scenes = [...layout.querySelectorAll('.story-scene')].map(section => {
      const figure = section.querySelector('.story-figure');
      const art = figure.querySelector('.story-art').cloneNode(true);
      const image = art.querySelector('img');
      const url = image?.getAttribute('src');
      const aspect = image ? image.width / image.height : 1;
      const viewport = image ? document.createElement('div') : null;
      const focus = figure.dataset.focus?.split(' ').map(Number);
      const delivery = section.hasAttribute('data-story-delivery') ? {
        beats: [...section.querySelectorAll('[data-delivery-step]')],
        models: [...art.querySelectorAll('.delivery-model')],
        words: [...art.querySelectorAll('.delivery-morph span')],
        route: [...art.querySelectorAll('.delivery-route li')],
        current: -1,
        morphTimer: 0
      } : null;
      if (delivery) {
        delivery.syncIndex = delivery.beats.findIndex(beat => beat.dataset.deliveryStep === 'sync');
        delivery.verifyIndex = delivery.beats.findIndex(beat => beat.dataset.deliveryStep === 'verify');
      }

      if (viewport) {
        image.alt = '';
        image.removeAttribute('src');
        viewport.className = 'story-image-viewport';
        viewport.append(image);
        art.append(viewport);
      }

      return {
        section, art, image, url, aspect, viewport, focus, delivery,
        zoom: Number(figure.dataset.zoom || 1),
        note: figure.querySelector('.story-figure-note')?.textContent,
        steps: [...art.querySelectorAll('.story-flow li')],
        step: -1,
        title: figure.querySelector('figcaption').firstChild.textContent.trim(),
        kind: figure.querySelector('figcaption span').textContent,
        chapter: section.parentElement.id,
        segment: document.createElement('span')
      };
    });

    screen.append(...scenes.map(scene => scene.art));
    progress.append(...scenes.map(scene => scene.segment));
  }

  function measureFocus(scene) {
    if (!scene.focus) return;
    const width = Math.min(screenWidth, screenHeight * scene.aspect);
    const [x, y] = scene.focus;
    scene.focusX = width * (0.5 - x / 100);
    scene.focusY = width / scene.aspect * (0.5 - y / 100);
  }

  function show(index) {
    if (index === active) return;
    active = index;
    const current = scenes[index];
    current.step = -1;
    if (current.delivery) current.delivery.current = -1;

    scenes.forEach(({ art, segment, section }, i) => {
      art.classList.toggle('is-current', i === index);
      if (i !== index) section.classList.remove('is-current');
      segment.classList.toggle('is-past', i < index);
      segment.classList.toggle('is-current', i === index);
    });

    links.forEach(link => {
      if (link.hash === '#' + current.chapter) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    caption.textContent = current.title;
    kind.textContent = current.kind;
    note.textContent = current.note || '继续滚动，查看流程的下一步。';
    view.hidden = !current.focus;
    original.hidden = !current.image;
    if (current.url) original.href = current.url;
    measureFocus(current);

    // Only the current screenshot and its immediate neighbors are needed.
    scenes.slice(Math.max(0, index - 1), index + 2).forEach(({ image, url }) => {
      if (image && !image.hasAttribute('src')) image.src = url;
    });
  }

  function renderFocus(scene, progress) {
    const { viewport, zoom, focusX, focusY } = scene;
    const ramp = fullImage ? 0 : clamp((progress - 0.18) / 0.5, 0, 1);
    const scale = 1 + (zoom - 1) * ramp * ramp * (3 - 2 * ramp);
    const marginX = screenWidth * (scale - 1) / 2;
    const marginY = screenHeight * (scale - 1) / 2;
    const panX = clamp(focusX * scale, -marginX, marginX);
    const panY = clamp(focusY * scale, -marginY, marginY);

    viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  function renderFlow(scene, progress) {
    const step = Math.min(scene.steps.length - 1, Math.floor(progress * scene.steps.length));
    if (step === scene.step) return;
    scene.step = step;
    scene.steps.forEach((item, i) => {
      item.classList.toggle('is-current', i === step);
      item.classList.toggle('is-past', i < step);
    });
    note.textContent = scene.steps[step].querySelector('strong').textContent + ' · ' +
      scene.steps[step].querySelector('span').textContent;
  }

  function renderDelivery({ delivery, art }, line) {
    const { beats, models, words, route } = delivery;
    let phase = 0;
    let bounds = beats[0].getBoundingClientRect();

    for (let i = 1; i < beats.length && line >= bounds.bottom; i++) {
      const next = beats[i].getBoundingClientRect();
      if (next.top > line) break;
      phase = i;
      bounds = next;
    }

    const depth = clamp((line - bounds.top) / bounds.height, 0, 1);
    const syncIndex = delivery.syncIndex;
    const verifyIndex = delivery.verifyIndex;

    if (phase !== delivery.current) {
      const previous = delivery.current;
      delivery.current = phase;
      const morph = previous !== -1 && Math.abs(phase - previous) === 1;

      clearTimeout(delivery.morphTimer);
      art.classList.toggle('is-morphing', morph);
      if (morph) {
        // Let a word finish changing even if the user pauses on the step boundary.
        delivery.morphTimer = setTimeout(() => art.classList.remove('is-morphing'), 440);
      }

      models.forEach((model, i) => model.classList.toggle('is-current', i === phase));
      words.forEach((word, i) => {
        word.classList.toggle('is-current', i === phase);
        word.classList.toggle('is-previous', morph && i === previous);
      });
      route.forEach((step, i) => {
        step.classList.toggle('is-past', i < phase);
        step.classList.toggle('is-current', i === phase);
      });
      note.textContent = models[phase].dataset.deliveryCaption;
    }

    art.style.setProperty('--delivery-received', phase === 0 ? clamp(depth * 3, 0, 1) : 1);
    art.style.setProperty('--delivery-phone-shift', phase > 0 ? '-4px' : '0px');
    const syncProgress = phase === syncIndex ? clamp((depth + 0.12) / 0.78, 0, 1) : Number(phase > syncIndex);
    art.style.setProperty('--delivery-sync-progress', syncProgress);
    art.style.setProperty('--delivery-listed', clamp((syncProgress - 0.30) * 1.5, 0, 1));
    art.classList.toggle('is-synced', syncProgress >= 0.68);
    art.style.setProperty('--delivery-completion', clamp((depth - 0.08) / 0.62, 0, 1));
    art.classList.toggle('is-verified', phase > verifyIndex || (phase === verifyIndex && depth >= 0.64));
  }

  function updateNavigation() {
    const y = Math.max(0, window.scrollY);
    if (Math.abs(y - directionY) >= 5) {
      scrollingDown = y > directionY;
      directionY = y;
    }

    const headerHeight = primaryHeader.offsetHeight;
    const docked = introSlot.getBoundingClientRect().top <= headerHeight &&
      guide.getBoundingClientRect().bottom > headerHeight;
    const visible = docked && scrollingDown;
    intro.classList.toggle('is-docked', docked);
    intro.classList.toggle('is-visible', visible);
    intro.inert = docked && !visible;
    primaryHeader.classList.toggle('is-story-nav-hidden', visible);
    primaryNav.inert = visible;
  }

  function measureNavigation() {
    const height = `${intro.offsetHeight}px`;
    guide.style.setProperty('--story-nav-height', height);
    if (!intro.classList.contains('is-docked')) introSlot.style.setProperty('--story-intro-space', height);
    queueUpdate();
  }

  function update() {
    frame = 0;
    updateNavigation();
    if (!canPin.matches || !inView) return;

    const line = Math.min(Math.round(document.documentElement.clientHeight * 0.48), 475);
    // Most frames stay in the same scene; cross a boundary before checking the other text blocks.
    let bounds = scenes[active].section.getBoundingClientRect();
    if (line < bounds.top || line >= bounds.bottom) {
      const next = scenes.findIndex(({ section }) => {
        bounds = section.getBoundingClientRect();
        return bounds.top <= line && line < bounds.bottom;
      });
      if (next === -1) return;
      show(next);
    }

    const scene = scenes[active];
    scene.section.classList.add('is-current');
    const progress = clamp((line - bounds.top) / bounds.height, 0, 1);
    scene.segment.style.setProperty('--scene-progress', progress);
    if (scene.focus) renderFocus(scene, progress);
    if (scene.delivery) renderDelivery(scene, line);
    if (scene.steps.length) renderFlow(scene, progress);
  }

  function queueUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function measureScreen() {
    if (!canPin.matches) return;
    screenWidth = screen.clientWidth;
    screenHeight = screen.clientHeight;
    measureFocus(scenes[active]);
    queueUpdate();
  }

  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    queueUpdate();
  }, { rootMargin: '120px 0px' });

  function syncLayout() {
    layout.classList.toggle('is-pinned', canPin.matches);
    visual.hidden = !canPin.matches;

    if (!canPin.matches) {
      visibility.disconnect();
      inView = false;
      links.forEach(link => link.removeAttribute('aria-current'));
      return;
    }

    if (!scenes) prepareScenes();
    active = -1;
    show(0);
    measureScreen();
    visibility.observe(layout);
  }

  view.addEventListener('click', () => {
    fullImage = !fullImage;
    view.setAttribute('aria-pressed', String(fullImage));
    queueUpdate();
  });
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', measureScreen);
  window.addEventListener('resize', measureNavigation);
  window.addEventListener('pageshow', queueUpdate);
  if ('ResizeObserver' in window) {
    new ResizeObserver(measureScreen).observe(screen);
    new ResizeObserver(measureNavigation).observe(intro);
  }
  canPin.addEventListener('change', syncLayout);
  measureNavigation();
  syncLayout();
})();
