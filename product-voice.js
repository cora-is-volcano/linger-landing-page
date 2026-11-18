/* Fixed voice examples only. No audio capture, service calls or persisted state. */
(() => {
  const showcase = document.querySelector('[data-voice-showcase]');
  if (!showcase) return;
  const tabs = [...showcase.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  if (!tabs.length || panels.some(panel => !panel)) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const initialSelection = Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
  const supportsVisibilityObserver = typeof IntersectionObserver !== 'undefined';
  const timers = new Set();
  let runToken = 0;
  let running = null;
  let selected = -1;
  let visible = !supportsVisibilityObserver;

  const scenes = {
    meetings: {
      states: ['Recording…', 'Capturing the conversation…', 'Preparing meeting notes…', 'Draft ready for review'],
      final: 'Captured',
      times: ['00:00', '00:18', '00:42', '00:42']
    },
    dictation: {
      states: ['Listening…', 'Transcribing your message…', 'Preparing the agent message…', 'Sent to Another Me'],
      final: 'Sent to Another Me',
      times: ['00:00', '00:03', '00:06', '00:06']
    },
    live: {
      states: ['Listening…', 'Understanding the question…', 'Checking the connected calendar…', 'Reply ready'],
      final: 'Conversation complete',
      times: ['00:00', '00:04', '00:06', '00:08']
    }
  };

  const entries = panels.map(panel => {
    const scene = scenes[panel.dataset.voiceScene] || scenes.meetings;
    const status = panel.querySelector('[data-voice-status]');
    const clock = panel.querySelector('[data-voice-timer]');
    return {
      panel, scene, status, clock,
      finalStatus: status?.textContent.trim() || scene.final,
      finalTime: clock?.textContent.trim() || scene.times[3],
      results: [...panel.querySelectorAll('.voice-result[data-reveal-at]')],
      typed: [...panel.querySelectorAll('[data-voice-typed]')].map(element => {
        const result = element.closest('.voice-result[data-reveal-at]');
        return {element, full: element.dataset.fullText || element.textContent, at: Math.max(1, Number(result?.dataset.revealAt) || 1)};
      })
    };
  });

  function cancelTimers() {
    runToken += 1;
    timers.forEach(clearTimeout);
    timers.clear();
    running = null;
  }

  function later(callback, delay, token) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (token === runToken) callback();
    }, delay);
    timers.add(timer);
  }

  function reveal(entry, step) {
    entry.panel.dataset.step = String(step);
    entry.results.forEach(result => {
      const visible = Number(result.dataset.revealAt) <= step;
      result.classList.toggle('is-visible', visible);
      result.querySelector('.voice-result__body')?.setAttribute('aria-hidden', String(!visible));
    });
  }

  function showComplete(entry) {
    reveal(entry, 3);
    entry.panel.setAttribute('aria-busy', 'false');
    entry.typed.forEach(({element, full}) => { element.textContent = full; });
    if (entry.status) entry.status.textContent = entry.finalStatus;
    if (entry.clock) entry.clock.textContent = entry.finalTime;
  }

  function settleAll() {
    cancelTimers();
    entries.forEach(showComplete);
  }

  function canPlay() {
    return visible && !document.hidden && !reduced.matches;
  }

  function typeText(item, duration, token) {
    const characters = Array.from(item.full);
    const steps = Math.max(1, Math.ceil(duration / 40));
    for (let step = 1; step <= steps; step += 1) {
      later(() => {
        item.element.textContent = characters.slice(0, Math.ceil(characters.length * step / steps)).join('');
      }, step * duration / steps, token);
    }
  }

  function play(entry) {
    if (!canPlay() || entry !== entries[selected]) return;
    cancelTimers();
    running = entry;
    const token = runToken;
    entry.panel.setAttribute('aria-busy', 'true');
    entry.typed.forEach(({element}) => { element.textContent = ''; });

    function step(number) {
      reveal(entry, number);
      if (entry.status) entry.status.textContent = entry.scene.states[number];
      if (entry.clock) entry.clock.textContent = entry.scene.times[number];
      entry.typed.filter(item => item.at === number).forEach(item => typeText(item, number === 3 ? 520 : 780, token));
    }
    step(0);
    later(() => step(1), 1000, token);
    later(() => step(2), 2300, token);
    later(() => step(3), 3700, token);
    later(() => showComplete(entry), 4300, token);
    // Keep every completed result readable for three seconds before the next take.
    later(() => play(entry), 7300, token);
  }

  function syncPlayback() {
    if (!canPlay()) { settleAll(); return; }
    // Repeated visibility notifications and same-tab activation must not restart a take.
    if (running !== entries[selected]) play(entries[selected]);
  }

  function select(index, focus = false) {
    if (index === selected) {
      if (focus) tabs[selected].focus({preventScroll: true});
      return;
    }
    settleAll();
    selected = index;
    tabs.forEach((tab, position) => {
      const active = position === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[position].hidden = !active;
    });
    if (focus) tabs[selected].focus({preventScroll: true});
    syncPlayback();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      const destinations = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1};
      if (!(event.key in destinations)) return;
      event.preventDefault();
      select(destinations[event.key], true);
    });
  });
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', syncPlayback);
  select(initialSelection);
  if (supportsVisibilityObserver) {
    const observer = new IntersectionObserver(observations => {
      const observation = observations[observations.length - 1];
      visible = observation.isIntersecting && observation.intersectionRatio >= 0.15;
      syncPlayback();
    }, {threshold: 0.15});
    observer.observe(showcase);
  }
})();
