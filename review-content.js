(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const player = document.querySelector('[data-scene-player]');
  if (player) {
    const carousel = player.querySelector('[data-record-carousel]');
    const records = [...player.querySelectorAll('[data-carousel-record]')];
    const panels = [...player.querySelectorAll('[data-record-panel]')];
    const status = player.querySelector('#record-selection-status');
    let selected = 0;
    let gesture = null;
    let suppressPointerClick = false;

    function select(index, focus = false, announce = true) {
      const target = (index + records.length) % records.length;
      const changed = target !== selected;
      selected = target;
      const key = records[selected].dataset.carouselRecord;
      player.dataset.scene = key;
      records.forEach((record, position) => {
        const active = position === selected;
        record.style.setProperty('--slot', String((position - selected + records.length) % records.length));
        record.classList.toggle('is-selected', active);
        record.setAttribute('aria-pressed', String(active));
        record.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => { panel.hidden = panel.dataset.recordPanel !== key; });
      if (focus) records[selected].focus({preventScroll:true});
      if (announce && changed && status) status.textContent = records[selected].getAttribute('aria-label');
    }
    records.forEach((record, index) => {
      record.addEventListener('click', event => {
        // Native click covers mouse, touch, keyboard and assistive technology.
        // A completed drag must not reselect the record where the gesture began.
        if (event.detail > 0 && suppressPointerClick) { suppressPointerClick = false; return; }
        select(index);
      });
      record.addEventListener('keydown', event => {
        const destination = {ArrowLeft:selected - 1, ArrowRight:selected + 1, Home:0, End:records.length - 1}[event.key];
        if (destination === undefined) return;
        event.preventDefault();
        select(destination, true);
      });
    });
    function resetGesture() {
      if (!gesture) return;
      const {id, record} = gesture;
      gesture = null;
      carousel.classList.remove('is-dragging');
      carousel.style.removeProperty('--drag');
      carousel.style.removeProperty('--drag-turn');
      if (record.hasPointerCapture(id)) record.releasePointerCapture(id);
    }
    function cancelGesture(event) {
      if (!gesture || (event?.pointerId !== undefined && event.pointerId !== gesture.id)) return;
      suppressPointerClick = true;
      resetGesture();
    }
    carousel.addEventListener('pointerdown', event => {
      const record = event.target.closest('[data-carousel-record]');
      if (!record || gesture || !event.isPrimary || event.button !== 0) return;
      suppressPointerClick = false;
      gesture = {id:event.pointerId, record, x:event.clientX, y:event.clientY, dx:0, horizontal:false};
      record.setPointerCapture(event.pointerId);
    });
    carousel.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.horizontal) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { suppressPointerClick = true; resetGesture(); return; }
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        gesture.horizontal = true;
        carousel.classList.add('is-dragging');
      }
      gesture.dx = dx;
      const offset = Math.max(-18, Math.min(18, dx * .12));
      carousel.style.setProperty('--drag', `${offset}px`);
      carousel.style.setProperty('--drag-turn', `${offset * .5}deg`);
    }, {passive:true});
    carousel.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const {dx, horizontal} = gesture;
      suppressPointerClick = horizontal;
      resetGesture();
      if (horizontal && Math.abs(dx) >= Math.min(48, carousel.clientWidth * .15)) select(selected + (dx < 0 ? 1 : -1));
    });
    carousel.addEventListener('pointercancel', cancelGesture);
    carousel.addEventListener('lostpointercapture', cancelGesture);
    // Pointerup can be lost when a drag leaves the browser or the tab is hidden.
    window.addEventListener('blur', cancelGesture);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelGesture(); });
    select(0, false, false);
  }

  const scenes = new Set(['research', 'plan', 'followup']);
  document.querySelectorAll('a[data-use-scene][href="#try-linger"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const scene = link.dataset.useScene;
      const demo = document.getElementById('agent-demo');
      const destination = document.getElementById('try-linger');
      if (!scenes.has(scene) || !demo || !destination) return;
      const openScene = new CustomEvent('linger:open-scene', {detail: {scene}, cancelable: true});
      demo.dispatchEvent(openScene);
      if (!openScene.defaultPrevented) return;
      event.preventDefault();
      const roomTitle = document.getElementById('ad-room-title');
      if (roomTitle) { roomTitle.tabIndex = -1; roomTitle.focus({preventScroll: true}); }
      if (location.hash !== '#try-linger') {
        try { history.pushState(null, '', '#try-linger'); } catch { /* Native anchor remains the fallback in restricted previews. */ }
      }
      destination.scrollIntoView({block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth'});
    });
  });
})();
