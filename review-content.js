(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const player = document.querySelector('[data-scene-player]');
  if (player) {
    const carousel = player.querySelector('[data-record-carousel]');
    const records = [...player.querySelectorAll('[data-carousel-record]')];
    const panels = [...player.querySelectorAll('[data-record-panel]')];
    const status = player.querySelector('#record-selection-status');
    const films = panels.map(panel => panel.querySelector('video'));
    let selected = 0;
    let inView = false;
    let manualPlayback = null;

    function syncPlayback() {
      const shouldPlay = manualPlayback ?? (!reducedMotion.matches && !navigator.connection?.saveData);
      films.forEach((film, index) => {
        if (index !== selected || !inView || document.hidden || !shouldPlay) {
          film.pause();
        } else if (film.paused) {
          // Browsers can restrict autoplay. The same control also starts playback on demand.
          film.play().catch(() => {});
        }
      });
    }

    films.forEach((film, index) => {
      const control = panels[index].querySelector('.scene-playback');
      const playIcon = control.querySelector('[data-play-icon]');
      const pauseIcon = control.querySelector('[data-pause-icon]');
      const updateControl = () => {
        control.setAttribute('aria-label', film.paused ? 'Play video' : 'Pause video');
        playIcon.toggleAttribute('hidden', !film.paused);
        pauseIcon.toggleAttribute('hidden', film.paused);
      };
      film.controls = false;
      control.hidden = false;
      control.addEventListener('click', () => {
        manualPlayback = film.paused;
        syncPlayback();
      });
      film.addEventListener('play', updateControl);
      film.addEventListener('pause', updateControl);
      updateControl();
    });

    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }).observe(player.querySelector('.record-detail'));

    reducedMotion.addEventListener('change', () => {
      manualPlayback = null;
      syncPlayback();
    });
    document.addEventListener('visibilitychange', syncPlayback);
    let gesture = null;
    let suppressPointerClick = false;

    function select(index, focus = false, announce = true) {
      const target = (index + records.length) % records.length;
      const changed = target !== selected;
      if (changed) {
        films[selected].pause();
        manualPlayback = null;
        films[target].currentTime = 0;
      }
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
      syncPlayback();
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
        const destination = {ArrowUp:selected - 1, ArrowDown:selected + 1, Home:0, End:records.length - 1}[event.key];
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
      gesture = {id:event.pointerId, record, x:event.clientX, y:event.clientY, dy:0, vertical:false};
      record.setPointerCapture(event.pointerId);
    });
    carousel.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.vertical) {
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) { suppressPointerClick = true; resetGesture(); return; }
        if (Math.abs(dy) < 10 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
        gesture.vertical = true;
        carousel.classList.add('is-dragging');
      }
      gesture.dy = dy;
      const offset = Math.max(-18, Math.min(18, dy * .12));
      carousel.style.setProperty('--drag', `${offset}px`);
    }, {passive:true});
    carousel.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const {dy, vertical} = gesture;
      suppressPointerClick = vertical;
      resetGesture();
      if (vertical && Math.abs(dy) >= Math.min(48, carousel.clientHeight * .15)) select(selected + (dy < 0 ? 1 : -1));
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
