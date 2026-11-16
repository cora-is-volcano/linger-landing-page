(() => {
  const reader = document.querySelector('[data-feature-reader]');
  const tabs = Array.from(reader.querySelectorAll('[role="tab"]'));

  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const decks = Array.from(reader.querySelectorAll('.feature-art'));
  const tiltResets = new Map();
  let selectedIndex = 0;
  let handoffAnimations = [];

  function clearHandoff() {
    for (const animation of handoffAnimations) animation.cancel();
    handoffAnimations = [];
  }

  function handOff(next, direction) {
    // Animate the stable art container, not a clone with a different fan transform.
    handoffAnimations = [next.animate([
      { opacity: .25, translate: `${direction * 12}px 0` },
      { opacity: 1, translate: '0 0' },
    ], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' })];
  }

  function selectFeature(selected, direction) {
    const nextIndex = tabs.indexOf(selected);
    if (nextIndex === selectedIndex) return;
    clearHandoff();
    tiltResets.forEach(reset => reset());
    const next = decks[nextIndex];
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    }
    if (!motionPreference.matches && typeof next.animate === 'function') {
      handOff(next, direction ?? Math.sign(nextIndex - selectedIndex));
    }
    selectedIndex = nextIndex;
  }

  for (const art of decks) {
    let start = null;
    let frame = 0;
    let horizontal = 0;
    let vertical = 0;

    function resetTilt() {
      cancelAnimationFrame(frame);
      frame = 0;
      art.classList.remove('is-inspecting');
      art.style.removeProperty('--deck-x');
      art.style.removeProperty('--deck-y');
    }

    function tiltAt(event) {
      if (motionPreference.matches || event.pointerType === 'touch') return;
      const box = art.getBoundingClientRect();
      horizontal = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      vertical = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        art.classList.add('is-inspecting');
        art.style.setProperty('--deck-x', horizontal.toFixed(3));
        art.style.setProperty('--deck-y', vertical.toFixed(3));
      });
    }

    tiltResets.set(art, resetTilt);
    art.addEventListener('pointermove', tiltAt, { passive: true });
    art.addEventListener('pointerleave', resetTilt);
    art.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
      art.setPointerCapture(event.pointerId);
      tiltAt(event);
    });
    art.addEventListener('pointerup', event => {
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      resetTilt();
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const direction = dx < 0 ? 1 : -1;
      selectFeature(tabs[(selectedIndex + direction + tabs.length) % tabs.length], direction);
    });
    art.addEventListener('pointercancel', () => {
      start = null;
      resetTilt();
    });
    motionPreference.addEventListener('change', resetTilt);
  }
  motionPreference.addEventListener('change', clearHandoff);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectFeature(tab));
    tab.addEventListener('keydown', event => {
      const destinations = {
        ArrowLeft: (index - 1 + tabs.length) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!Object.hasOwn(destinations, event.key)) return;
      event.preventDefault();
      const next = tabs[destinations[event.key]];
      next.focus();
      selectFeature(next);
    });
  });

  const dialog = document.getElementById('overview-dialog');
  const openers = document.querySelectorAll('a[data-demo]');
  const selectors = Array.from(dialog.querySelectorAll('[data-demo-select]'));
  const video = dialog.querySelector('video');
  const title = document.getElementById('overview-title');
  const duration = document.getElementById('demo-duration');
  const description = document.getElementById('demo-description');
  const sourceLink = document.getElementById('demo-source');
  const errorMessage = document.getElementById('demo-error');
  let lastOpener = null;

  const demos = {
    teams: {
      title: 'Your agents, working together', duration: '12 seconds',
      label: 'Linger agent team workflow',
      description: 'Another Me creates a shared team.md plan and brings in specialist agents. Each agent has a role and a clear handoff.',
    },
    tasks: {
      title: 'Delegate. Keep moving.', duration: '12 seconds',
      label: 'Linger background task delegation',
      description: 'Hand a task to an agent without stopping your main conversation. The task runs in its own context and returns its result when ready.',
    },
    memory: {
      title: 'Shared knowledge, ready to use', duration: '14 seconds',
      label: 'Linger shared wiki workflow',
      description: 'Connected sources become a wiki your agents can search. Relevant pages bring useful context into the next conversation. Background processing may use a configured external model.',
    },
    inference: {
      title: 'A larger model. On your machine.', duration: '13 seconds',
      label: 'PolyStrata local inference architecture',
      description: 'PolyStrata distributes supported model experts across GPU memory, system memory and storage. This official animation illustrates the architecture; requirements vary by model and hardware.',
    },
  };

  function selectDemo(key) {
    const demo = demos[key] || demos.teams;
    if (!Object.hasOwn(demos, key)) key = 'teams';
    video.pause();
    title.textContent = demo.title;
    duration.textContent = demo.duration;
    description.textContent = demo.description;
    video.setAttribute('aria-label', demo.label);
    video.poster = `./media/platform-${key}.webp`;
    video.src = `./media/platform-${key}.mp4`;
    video.querySelector('a').href = video.src;
    video.querySelector('a').textContent = `Open the ${key === 'teams' ? 'agent teams' : key} demo`;
    sourceLink.href = video.src;
    sourceLink.setAttribute('aria-label', `Open video: ${demo.label} in a new tab`);
    errorMessage.hidden = true;
    errorMessage.textContent = '';
    selectors.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demoSelect === key)));
    video.load();
    video.play().catch(() => {
      // Native controls remain available if another playback gesture is required.
    });
  }

  function openOverview(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    lastOpener = event.currentTarget;
    dialog.showModal();
    dialog.scrollTop = 0;
    selectDemo(lastOpener.dataset.demo);
  }
  for (const opener of openers) opener.addEventListener('click', openOverview);
  selectors.forEach((button, index) => {
    button.addEventListener('click', () => selectDemo(button.dataset.demoSelect));
    button.addEventListener('keydown', event => {
      const destinations = {
        ArrowLeft: (index - 1 + selectors.length) % selectors.length,
        ArrowRight: (index + 1) % selectors.length,
        Home: 0,
        End: selectors.length - 1,
      };
      if (!Object.hasOwn(destinations, event.key)) return;
      event.preventDefault();
      const next = selectors[destinations[event.key]];
      next.focus();
      selectDemo(next.dataset.demoSelect);
    });
  });
  video.addEventListener('error', () => {
    if (!dialog.open || !video.error) return;
    errorMessage.textContent = 'This video could not play here. Use Open video to try it in a new tab.';
    errorMessage.hidden = false;
  });
  document.getElementById('close-overview').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const outside = event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom;
    if (outside) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    lastOpener?.focus({preventScroll: true});
  });
})();
