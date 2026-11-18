(() => {
  const root = document.querySelector('[data-routine-cues]');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-routine-cue]')];
  const panels = [...root.querySelectorAll('[data-routine-example]')];
  const select = button => {
    const choice = button.dataset.routineCue;
    if (!panels.some(panel => panel.dataset.routineExample === choice)) return;
    buttons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.routineExample !== choice; });
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus();
      select(buttons[next]);
    });
  });
})();
