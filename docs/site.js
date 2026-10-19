/* Keep content and navigation usable without JavaScript. */
(() => {
  const header = document.querySelector('.site-header');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled = false;
  const updateHeader = () => {
    const y = window.scrollY;
    // Separate thresholds prevent flicker near the top of the page.
    if (header) {
      if (y > 64) header.classList.add('is-compact');
      else if (y < 16) header.classList.remove('is-compact');
    }
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateHeader);
    }
  }, { passive: true });
  window.addEventListener('pageshow', updateHeader);
  updateHeader();

  const links = [...document.querySelectorAll('.site-header nav a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  const visible = new Set();
  const navigation = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    const current = sections.filter(section => visible.has(section)).pop();
    links.forEach(link => {
      if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-96px 0px -45% 0px' });
  sections.forEach(section => navigation.observe(section));

  if (motion.matches) return;
  const elements = document.querySelectorAll('.hero > .eyebrow, .hero h1, .hero-description, .hero-actions, .section-heading > *, .product-shot, .case-showcase-detail, .reading-stage, .detail-grid article, .sms-story, .court-card, .reading-features article, .mail-visual, .mail-copy article, .tool-card, .updates-intro, .updates-list > .update-entry, .package-details, .install-steps, .download-inner');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      } else if (entry.boundingClientRect.top > 0) {
        entry.target.classList.remove('revealed');
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.section-heading, .detail-grid, .court-grid, .reading-features, .tool-grid').forEach(group => {
    [...group.children].forEach((child, index) => child.style.setProperty('--reveal-delay', `${index * 110}ms`));
  });
  elements.forEach(element => { element.classList.add('reveal'); observer.observe(element); });
  motion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      elements.forEach(element => element.classList.add('revealed'));
    }
  });
})();
