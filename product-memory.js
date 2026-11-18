(() => {
  const root = document.querySelector('[data-memory-story]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[data-memory-source]')];
  const excerpts = root.querySelectorAll('[data-memory-panel]');
  const briefRows = root.querySelectorAll('[data-brief-source]');

  function select(tab) {
    const source = tab.dataset.memorySource;
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    excerpts.forEach(panel => { panel.hidden = panel.dataset.memoryPanel !== source; });
    briefRows.forEach(row => {
      if (row.dataset.briefSource === source) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight:(index+1)%tabs.length, ArrowLeft:(index+tabs.length-1)%tabs.length, Home:0, End:tabs.length-1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next]);
      tabs[next].focus();
    });
  });
})();
