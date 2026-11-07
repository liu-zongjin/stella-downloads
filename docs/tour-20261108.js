/* Stella 官网 · 工作台轮播与更多板块导览（2026-11-08） */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. 首页：法律知识工作台 / 案件管理工作台 自动轮播 */
  const car = document.querySelector('[data-wb-carousel]');
  if (car) {
    const slides = Array.from(car.querySelectorAll('[data-wb-slide]'));
    const tabs = Array.from(car.querySelectorAll('[data-wb-target]'));
    const play = car.querySelector('[data-wb-toggle]');
    const bar = car.querySelector('.wb-progress i');
    const DURATION = 5000;
    let index = 0, timer = null, manuallyPaused = reduceMotion, hovering = false;

    function resetBar() {
      if (!bar) return;
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    }
    function sync() {
      const idle = manuallyPaused || hovering;
      clearInterval(timer);
      timer = null;
      if (!idle && !reduceMotion) timer = setInterval(() => show(index + 1), DURATION);
      car.classList.toggle('is-paused', idle);
      if (play) {
        play.textContent = manuallyPaused ? '▶' : '❚❚';
        play.setAttribute('aria-label', manuallyPaused ? '继续自动切换' : '暂停自动切换');
        play.setAttribute('aria-pressed', String(!manuallyPaused));
      }
    }
    function show(next) {
      index = (next + slides.length) % slides.length;
      const key = slides[index].dataset.wbSlide;
      slides.forEach(s => {
        const on = s.dataset.wbSlide === key;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
      });
      tabs.forEach(t => {
        const on = t.dataset.wbTarget === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      resetBar();
      sync();
    }

    tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));
    if (play) play.addEventListener('click', () => { manuallyPaused = !manuallyPaused; resetBar(); sync(); });
    car.addEventListener('mouseenter', () => { hovering = true; sync(); });
    car.addEventListener('mouseleave', () => { hovering = false; sync(); });
    car.querySelector('.wb-tabs')?.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      show(index + (e.key === 'ArrowRight' ? 1 : -1));
      tabs[index].focus();
    });
    let startX = null;
    car.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearInterval(timer); timer = null; } else sync();
    });
    sync();
  }

  /* 2. 更多板块：点击切换实机截图与说明 */
  const tour = document.querySelector('[data-tour]');
  if (tour) {
    const tabs = Array.from(tour.querySelectorAll('[data-tour-target]'));
    const frames = Array.from(tour.querySelectorAll('[data-tour-panel]'));
    const caption = tour.querySelector('.tour-caption');
    const idxEl = tour.querySelector('[data-tour-index]');
    const titleEl = tour.querySelector('[data-tour-title]');
    const copyEl = tour.querySelector('[data-tour-copy]');
    const tagsEl = tour.querySelector('[data-tour-tags]');
    const dots = Array.from(tour.querySelectorAll('[data-tour-dot]'));
    const autoBtn = tour.querySelector('[data-tour-toggle]');
    const autoLabel = tour.querySelector('[data-tour-toggle-label]');
    let current = 0, autoTimer = null, playing = false, hovering = false;

    function schedule() {
      clearInterval(autoTimer);
      autoTimer = null;
      if (playing && !hovering && !reduceMotion) autoTimer = setInterval(() => select(current + 1), 4500);
    }
    function select(i) {
      current = (i + tabs.length) % tabs.length;
      const key = tabs[current].dataset.tourTarget;
      tabs.forEach((t, n) => {
        const on = n === current;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      frames.forEach(f => {
        const on = f.dataset.tourPanel === key;
        f.classList.toggle('is-active', on);
        f.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach((d, n) => d.classList.toggle('is-active', n === current));
      const d = tabs[current].dataset;
      if (idxEl) idxEl.textContent = d.index || '';
      if (titleEl) titleEl.textContent = d.title || '';
      if (copyEl) copyEl.textContent = d.copy || '';
      if (tagsEl) {
        tagsEl.textContent = '';
        (d.tags || '').split('|').filter(Boolean).forEach(tag => {
          const span = document.createElement('span');
          span.textContent = tag;
          tagsEl.appendChild(span);
        });
      }
      if (caption && !reduceMotion) {
        caption.classList.remove('is-changing');
        void caption.offsetWidth;
        caption.classList.add('is-changing');
      }
      if (playing) schedule();
    }
    function setPlaying(on) {
      playing = on;
      if (autoBtn) {
        autoBtn.classList.toggle('is-playing', on);
        autoBtn.setAttribute('aria-pressed', String(on));
      }
      if (autoLabel) autoLabel.textContent = on ? '暂停导览' : '自动导览';
      schedule();
    }

    tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    dots.forEach((d, i) => d.addEventListener('click', () => select(i)));
    tour.querySelector('.tour-nav')?.addEventListener('keydown', e => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      e.preventDefault();
      const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
      select(current + dir);
      tabs[current].focus();
    });
    if (autoBtn) autoBtn.addEventListener('click', () => setPlaying(!playing));
    tour.addEventListener('mouseenter', () => { hovering = true; schedule(); });
    tour.addEventListener('mouseleave', () => { hovering = false; schedule(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearInterval(autoTimer); autoTimer = null; } else schedule();
    });
    select(0);
  }
})();
