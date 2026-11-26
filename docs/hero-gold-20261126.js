(() => {
  const canvas = document.querySelector('.hero-atmosphere canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let visible = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let seed = 48127;

  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const pigment = ['#9b713222', '#be96582b', '#cfa6693b', '#fff4d266'];
  const grains = pigment.map((color, group) => ({
    color,
    points: Array.from({ length: [120, 160, 185, 125][group] }, () => ({
      offset: random(),
      lane: (random() + random() + random() - 1.5) / 1.42,
      speed: .010 + random() * .019,
      size: .26 + random() ** 2 * (group === 3 ? 1.17 : .90),
      phase: random() * Math.PI * 2
    }))
  }));

  const ribbonX = position => width * (.31 + position * .76);

  function curve(position, time) {
    const arc = .16 * Math.sin(position * 4 - 1.12 + time * .096);
    const drift = .033 * Math.sin(time * .21 + position * 3.6);
    return height * (.94 - .57 * position + arc + drift);
  }

  function spread(position) {
    return height * (.08 + .076 * Math.sin(Math.PI * position) ** 2);
  }

  function trace(time, offset) {
    context.beginPath();
    for (let i = 0; i <= 56; i++) {
      const p = i / 56;
      const ripples = Math.sin(p * 9 + time * .48 + offset * 3) * height * .007;
      const y = curve(p, time) + spread(p) * offset + ripples;
      if (i === 0) context.moveTo(ribbonX(p), y);
      else context.lineTo(ribbonX(p), y);
    }
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);

    const gold = context.createLinearGradient(ribbonX(.04), 0, ribbonX(1), 0);
    gold.addColorStop(0, 'transparent');
    gold.addColorStop(.43, '#c89a4c12');
    gold.addColorStop(.73, '#ba8d4b2b');
    gold.addColorStop(.9, '#d1a65e1d');
    gold.addColorStop(1, 'transparent');

    const shine = context.createLinearGradient(ribbonX(.13), 0, ribbonX(.98), 0);
    shine.addColorStop(0, 'transparent');
    shine.addColorStop(.55, '#eace971b');
    shine.addColorStop(.77, '#fff4cb42');
    shine.addColorStop(1, 'transparent');

    // Overlapping filaments taper across the ribbon, so the light has no hard outer contour.
    for (let i = 0; i < 49; i++) {
      const lane = (i - 24) / 24;
      const ripple = Math.sin(time * .24 + i * .49) * .052;
      trace(time, lane + ripple);
      context.strokeStyle = i % 3 === 0 ? shine : gold;
      context.globalAlpha = Math.exp(-lane * lane * 3.7) * .82;
      context.lineWidth = Math.min(4.4, height * .0065);
      context.stroke();
    }
    context.globalAlpha = 1;

    for (const { color, points } of grains) {
      context.fillStyle = color;
      context.beginPath();
      for (const point of points) {
        const p = (point.offset + time * point.speed) % 1;
        const x = ribbonX(p);
        const lane = point.lane + .062 * Math.sin(time * .8 + point.phase + p * 5);
        const y = curve(p, time) + lane * spread(p);
        const fade = Math.min(1, p * 3, (1 - p) * 9);
        const radius = point.size * fade;
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
      }
      context.fill();
    }
  }

  function shouldAnimate() {
    return visible && !document.hidden && !reducedMotion.matches && width > 0 && height > 0;
  }

  function animate(now) {
    if (!shouldAnimate()) {
      frame = 0;
      previous = 0;
      return;
    }
    if (!previous || now - previous >= 1000 / 30 - 1) {
      if (previous) elapsed += Math.min(.07, (now - previous) / 1000);
      previous = now;
      draw(elapsed);
    }
    frame = requestAnimationFrame(animate);
  }

  function sync() {
    if (shouldAnimate()) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    }
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.6);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(elapsed);
    sync();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(canvas);
  } else {
    visible = true;
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  resize();
})();
