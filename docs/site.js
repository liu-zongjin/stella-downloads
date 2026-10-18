/* Content stays fully readable without JavaScript; motion is progressive enhancement. */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const elements = document.querySelectorAll('.section-heading, .detail-grid article, .sms-story, .court-card, .reading-features article, .mail-copy article, .tool-card, .install-steps, .download-inner');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  elements.forEach(element => { element.classList.add('reveal'); observer.observe(element); });
})();
