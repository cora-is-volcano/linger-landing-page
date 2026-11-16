(() => {
  const group = document.querySelector('.memory-layers');
  if (!group) return;
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let animations = [];
  function stop() { animations.forEach(animation => animation.cancel()); animations = []; }
  function select(tab) {
    stop();
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    }
    if (reduced.matches) return;
    const cells = [...tab.querySelectorAll('.expert-grid i')];
    animations = cells.map((cell, index) => cell.animate([
      { opacity: .32, transform: 'translateY(3px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 340, delay: index * 22, easing: 'cubic-bezier(.22,.78,.18,1)' }));
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const next = { ArrowDown: (index + 1) % tabs.length, ArrowUp: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault(); tabs[next].focus(); select(tabs[next]);
    });
  });
  reduced.addEventListener('change', stop);
})();
