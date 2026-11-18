/* A dot-built record. Ornament only: no audio, requests, or microphone access. */
(() => {
  document.querySelectorAll('.dot-record-art').forEach(initRecord);

  function initRecord(art) {
    const canvas = art?.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const forced = matchMedia('(forced-colors: active)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const points = [];
    const W = 520, H = 460, cx = 277, cy = 225, radius = 202;
    for (let y = 17; y < H - 17; y += 6) {
      for (let x = 17; x < W - 10; x += 6) {
        const dx = x - cx, dy = y - cy, distance = Math.hypot(dx, dy);
        if (distance > radius || distance < 10) continue;
        const angle = Math.atan2(dy, dx);
        const label = distance < 63;
        // Concentric dot densities read as record grooves, not a generic particle globe.
        const groove = .62 + .25 * Math.cos(distance * .47);
        const light = .8 + .2 * Math.sin(angle * 2 + .55);
        const edge = Math.min(1, (radius - distance) / 12);
        points.push({x,y,ox:0,oy:0,r:label ? 1.7 : 1.25 + groove * .6,a:label ? .95 : groove * light * edge + .12,accent:label});
      }
    }
    // A sampled waveform leaves the outer groove and dissolves into white space.
    for (let x = 11; x < 127; x += 6) {
      const envelope = 9 + 40 * Math.pow(Math.sin((x - 11) / 116 * Math.PI), 2);
      for (let dy = -envelope; dy <= envelope; dy += 6) {
        const y = cy + Math.round(dy / 6) * 6;
        if (Math.hypot(x - cx,y - cy) < radius - 4) continue;
        points.push({x,y,ox:0,oy:0,r:1.5,a:.24 + .6 * x / 127,accent:x < 55});
      }
    }

    let frame = 0, visible = false, lastTime = 0, pulseStart = -Infinity;
    let pointer = null, pulseOrigin = {x:cx,y:cy};
    let scale = 1, dpr = 1;
    let palette = {base:'#97c2ec',label:'#d6d0c2',active:'#345d82'};
    const canAnimate = () => visible && !document.hidden && !reduced.matches && !forced.matches;

    function draw(time = performance.now(), animate = false) {
      const dt = Math.min(3, (time - lastTime) / 16.67 || 1);
      lastTime = time;
      ctx.setTransform(dpr * scale,0,0,dpr * scale,0,0);
      ctx.clearRect(0,0,W,H);
      let unsettled = false;
      // Keep individual dots legible when the edge ornaments shrink on phones.
      const sampleStride = Math.max(1, Math.ceil(2.4 / (6 * scale)));
      const pulseAge = time - pulseStart;
      for (const point of points) {
        if (Math.round((point.x - 17) / 6) % sampleStride || Math.round((point.y - 17) / 6) % sampleStride) continue;
        let targetX = 0, targetY = 0, lit = 0;
        if (animate && pointer) {
          const dx = point.x - pointer.x, dy = point.y - pointer.y;
          const distance = Math.hypot(dx,dy);
          if (distance < 88) {
            const force = Math.pow(1 - distance / 88,2) * 27;
            targetX += dx / (distance || 1) * force;
            targetY += dy / (distance || 1) * force;
            lit = (1 - distance / 88) * .8;
          }
        }
        if (animate && pulseAge < 1050 && pulseAge >= 0) {
          const dx = point.x - pulseOrigin.x, dy = point.y - pulseOrigin.y;
          const distance = Math.hypot(dx,dy);
          const wave = Math.exp(-Math.pow((distance - pulseAge * .38) / 24,2));
          targetX += dx / (distance || 1) * wave * 9;
          targetY += dy / (distance || 1) * wave * 9;
          lit = Math.max(lit,wave * .85);
          unsettled = true;
        }
        if (animate) {
          const ease = 1 - Math.pow(.81,dt);
          point.ox += (targetX - point.ox) * ease;
          point.oy += (targetY - point.oy) * ease;
          if (Math.abs(targetX - point.ox) + Math.abs(targetY - point.oy) > .02) unsettled = true;
        } else { point.ox = 0; point.oy = 0; }
        ctx.globalAlpha = Math.min(1,point.a + lit * .25);
        ctx.fillStyle = lit > .32 ? palette.active : point.accent ? palette.label : palette.base;
        ctx.beginPath();
        ctx.arc(point.x + point.ox,point.y + point.oy,Math.max(point.r,.65 / scale) + lit * .35,0,Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return unsettled;
    }
    function tick(time) {
      frame = 0;
      if (!canAnimate()) { draw(time,false); return; }
      if (draw(time,true)) frame = requestAnimationFrame(tick);
    }
    function wake() { if (canAnimate() && !frame) frame = requestAnimationFrame(tick); }
    function reset() {
      pointer = null; pulseStart = -Infinity;
      cancelAnimationFrame(frame); frame = 0; draw();
    }
    function resize() {
      const style = getComputedStyle(art);
      palette = {
        base: style.getPropertyValue('--dot-base').trim() || '#97c2ec',
        label: style.getPropertyValue('--dot-label').trim() || '#d6d0c2',
        active: style.getPropertyValue('--dot-active').trim() || '#345d82'
      };
      const bounds = canvas.getBoundingClientRect();
      scale = bounds.width / W;
      dpr = Math.min(devicePixelRatio || 1,2);
      canvas.width = Math.round(bounds.width * dpr);
      canvas.height = Math.round(bounds.height * dpr);
      draw();
      art.classList.add('is-ready');
    }
    function location(event) {
      const bounds = canvas.getBoundingClientRect();
      return {x:(event.clientX - bounds.left) / bounds.width * W,y:(event.clientY - bounds.top) / bounds.height * H};
    }
    art.addEventListener('pointermove',event => {
      if (!fine.matches || event.pointerType === 'touch' || !canAnimate()) return;
      pointer = location(event); wake();
    },{passive:true});
    art.addEventListener('pointerleave',() => { pointer = null; wake(); });
    // Tapping the decorative surface triggers the same brief visual ripple; never captures scrolling.
    art.addEventListener('pointerdown',event => {
      if (!canAnimate()) return;
      pulseOrigin = location(event); pulseStart = performance.now(); wake();
    },{passive:true});
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) reset();
    },{threshold:.05}).observe(art);
    document.addEventListener('visibilitychange',() => { if (document.hidden) reset(); });
    reduced.addEventListener('change',reset);
    forced.addEventListener('change',reset);
    resize();
  }
})();
