(() => {
  const allowed = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const interactiveSelector = 'a, button, summary, input, select, textarea, video, [role="button"]';
  const feedback = document.createElement('span');
  feedback.className = 'pointer-feedback';
  feedback.setAttribute('aria-hidden', 'true');
  feedback.dataset.active = feedback.dataset.hover = feedback.dataset.running = 'false';
  const ring = document.createElement('span');
  ring.className = 'pointer-ring';
  feedback.append(ring);

  // A fixed pool leaves a luminous short trace, never a screen-length ribbon.
  const trail = Array.from({ length: 10 }, () => {
    const element = document.createElement('span');
    element.className = 'pointer-trail-dot';
    feedback.append(element);
    return { element, alive: false, x: 0, y: 0, born: 0 };
  });
  const trailLifetime = 240;
  const trailReach = 90;
  let trailIndex = 0;
  let lastStamp = 0;
  document.body.append(feedback);

  const fields = new Map();
  const surfaceSelector = '.hero, .team-stage, .feature-spread, .download-section';
  for (const surface of document.querySelectorAll(surfaceSelector)) {
    const light = document.createElement('span');
    light.className = 'pointer-field';
    light.setAttribute('aria-hidden', 'true');
    surface.append(light);
    fields.set(surface, light);
  }

  // Reveal the existing layered frame only within the beam. This copy is
  // decorative, cannot take focus, and never changes the original geometry.
  const downloadFrame = document.querySelector('.download-frame');
  if (downloadFrame) {
    const illuminatedFrame = downloadFrame.cloneNode(true);
    illuminatedFrame.classList.add('pointer-reveal');
    illuminatedFrame.setAttribute('aria-hidden', 'true');
    downloadFrame.parentElement.append(illuminatedFrame);
  }

  let frame = 0;
  let point = null;
  let surface = null;
  const dialogOpen = () => Boolean(document.querySelector('dialog[open]'));
  const colorAt = element => element.closest('.nav-surface') ||
    (element.closest('.feature-spread') && !element.closest('.feature-art'))
    ? '77 43 12' : '253 169 71';

  function clearTrail() {
    for (const dot of trail) {
      if (!dot.alive) continue;
      dot.alive = false;
      dot.element.style.opacity = '0';
    }
    lastStamp = 0;
  }

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    point = null;
    clearTrail();
    feedback.dataset.active = feedback.dataset.hover = feedback.dataset.running = 'false';
    surface?.classList.remove('is-pointer-lit');
    surface = null;
  }

  function lightSurface(element) {
    const nextSurface = element.closest(surfaceSelector);
    if (nextSurface !== surface) {
      surface?.classList.remove('is-pointer-lit');
      surface = nextSurface;
      surface?.classList.add('is-pointer-lit');
    }
    if (surface && fields.has(surface)) {
      const box = surface.getBoundingClientRect();
      const x = point.x - box.left;
      const y = point.y - box.top;
      fields.get(surface).style.transform = `translate3d(${x - 230}px, ${y - 230}px, 0)`;
      surface.style.setProperty('--light-x', `${x}px`);
      surface.style.setProperty('--light-y', `${y}px`);
    }
  }

  function paintTrail(now) {
    let alive = false;
    for (const dot of trail) {
      if (!dot.alive) continue;
      const life = 1 - (now - dot.born) / trailLifetime;
      if (life <= 0 || Math.hypot(point.x - dot.x, point.y - dot.y) > trailReach) {
        dot.alive = false;
        dot.element.style.opacity = '0';
        continue;
      }
      dot.element.style.opacity = (.5 * life * life).toFixed(3);
      dot.element.style.transform = `translate3d(${dot.x - 2.5}px, ${dot.y - 2.5}px, 0) scale(${(.45 + .55 * life).toFixed(3)})`;
      alive = true;
    }
    return alive;
  }

  function paint(now) {
    frame = 0;
    if (!point || !allowed.matches || document.hidden || dialogOpen()) { clear(); return; }
    const element = document.elementFromPoint(point.x, point.y);
    if (!element) { clear(); return; }
    feedback.style.setProperty('--pointer-color', colorAt(element));
    ring.style.transform = `translate3d(${point.x - 13}px, ${point.y - 13}px, 0)`;
    feedback.dataset.active = 'true';

    // Interactive elements own their hover styles. No floating frame or cursor
    // animation is allowed to cover their labels, logos or native hit targets.
    const interactive = Boolean(element.closest(interactiveSelector));
    feedback.dataset.hover = String(interactive);
    if (interactive) clearTrail();
    lightSurface(element);
    if (!interactive && paintTrail(now)) frame = requestAnimationFrame(paint);
    feedback.dataset.running = String(Boolean(frame));
  }

  function move(event) {
    if (!allowed.matches || event.pointerType === 'touch' || document.hidden || dialogOpen()) { clear(); return; }
    const previous = point;
    const now = performance.now();
    const interactive = Boolean(event.target.closest(interactiveSelector));
    point = { x: event.clientX, y: event.clientY, color: colorAt(event.target), interactive };
    if (interactive) {
      clearTrail();
    } else if (previous && !previous.interactive && now - lastStamp >= 14) {
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      if (distance >= 2 && distance <= trailReach) {
        const dot = trail[trailIndex];
        trailIndex = (trailIndex + 1) % trail.length;
        Object.assign(dot, { alive: true, x: previous.x, y: previous.y, born: now });
        dot.element.style.backgroundColor = `rgb(${previous.color})`;
        lastStamp = now;
      }
    }
    if (!frame) frame = requestAnimationFrame(paint);
    feedback.dataset.running = 'true';
  }

  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerdown', clear, { passive: true });
  document.documentElement.addEventListener('pointerleave', clear);
  document.addEventListener('pointercancel', clear);
  document.addEventListener('keydown', event => { if (event.key === 'Tab' || event.key === 'Escape') clear(); });
  document.addEventListener('scroll', clear, { passive: true, capture: true });
  window.addEventListener('blur', clear);
  window.addEventListener('resize', clear, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  allowed.addEventListener('change', clear);
  new MutationObserver(() => { if (dialogOpen()) clear(); }).observe(document.body, {
    attributes: true, attributeFilter: ['open'], childList: true, subtree: true,
  });
})();
