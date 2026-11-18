(() => {
  const root = document.querySelector('[data-memory-story]');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-memory-source]')];
  const panels = [...root.querySelectorAll('[data-memory-panel]')];
  const photos = [...root.querySelectorAll('[data-memory-photo]')];
  const status = root.querySelector('[data-memory-status]');
  let selected = 0;
  let hovered = null;
  let focused = null;
  let previewInput = 'pointer';
  const preview = () => {
    const current = previewInput === 'keyboard' ? (focused ?? hovered) : (hovered ?? focused);
    photos.forEach((photo, index) => photo.classList.toggle('is-preview', index === current));
  };
  function select(index) {
    if (index === selected) return;
    selected = index;
    const key = buttons[index].dataset.memorySource;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    photos.forEach((photo, i) => photo.classList.toggle('is-selected', i === index));
    panels.forEach(panel => { panel.hidden = panel.dataset.memoryPanel !== key; });
    status.textContent = [...panels.find(panel => !panel.hidden).children].map(child => child.textContent.trim()).join(' ');
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    const pointerPreview = event => {
      if (event.pointerType !== 'mouse' || (hovered === index && previewInput === 'pointer')) return;
      hovered = index;
      previewInput = 'pointer';
      preview();
    };
    button.addEventListener('pointerenter', pointerPreview);
    button.addEventListener('pointermove', pointerPreview, {passive: true});
    button.addEventListener('pointerleave', () => { hovered = null; preview(); });
    button.addEventListener('focus', () => { if (button.matches(':focus-visible')) { focused = index; previewInput = 'keyboard'; preview(); } });
    button.addEventListener('blur', () => { focused = null; preview(); });
    button.addEventListener('keydown', event => {
      const next = {ArrowRight:(index+1)%buttons.length, ArrowLeft:(index+buttons.length-1)%buttons.length, Home:0, End:buttons.length-1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus({preventScroll:true});
      select(next);
    });
  });
  // Match each lifted fragment to its exact place in the full photograph.
  const matchCrops = () => photos.forEach(photo => {
    const stamp = photo.querySelector('.memory-photo__stamp');
    const image = stamp.querySelector('img');
    image.style.width = `${photo.clientWidth}px`;
    image.style.height = `${photo.clientHeight}px`;
    image.style.left = `${-stamp.offsetLeft}px`;
    image.style.top = `${-stamp.offsetTop}px`;
  });
  new ResizeObserver(matchCrops).observe(root.querySelector('[data-memory-collage]'));
  matchCrops();
})();
