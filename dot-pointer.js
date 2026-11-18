/* Persistent mouse ornament. One small canvas; no idle animation or pointer capture. */
(() => {
  const fine = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'dot-pointer';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  document.body.append(canvas);

  const SIZE = 128, HALF = SIZE / 2, RADIUS = 37;
  const points = [];
  for (let row = -6; row <= 6; row++) {
    for (let col = -6; col <= 6; col++) {
      const x = col * 6, y = row * 6, r = Math.hypot(x,y);
      const inner = 10 + 4 * Math.cos(4 * Math.atan2(y,x));
      if (r > RADIUS || r < inner) continue;
      points.push({x,y,r,alpha:Math.pow(1-r/(RADIUS+5),.65),sand:(row+col+14)%9===0});
    }
  }
  let frame = 0, lastTime = 0, positioned = false;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  let alpha = 0, targetAlpha = 0, energy = 0, dpr = 1;
  let palette = {base:'#97c2ec',active:'#345d82',sand:'#d6d0c2'};
  const enabled = () => fine.matches && !reduced.matches && !forced.matches && !document.hidden;

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0; lastTime = 0; positioned = false;
    alpha = 0; targetAlpha = 0; energy = 0;
    ctx.clearRect(0,0,SIZE,SIZE);
    canvas.hidden = true;
  }
  function resize() {
    clear();
    dpr = Math.min(devicePixelRatio || 1,2);
    canvas.width = Math.round(SIZE*dpr);
    canvas.height = Math.round(SIZE*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const style = getComputedStyle(document.documentElement);
    palette = {
      base:style.getPropertyValue('--accent').trim() || '#97c2ec',
      active:style.getPropertyValue('--accent-ink').trim() || '#345d82',
      sand:style.getPropertyValue('--sand').trim() || '#d6d0c2'
    };
  }
  function draw() {
    ctx.clearRect(0,0,SIZE,SIZE);
    canvas.style.transform = `translate3d(${x-HALF}px,${y-HALF}px,0)`;
    const spread = 1 + energy*.15;
    for (const point of points) {
      // A hollow center preserves the native cursor; translucent dots keep text legible.
      ctx.globalAlpha = alpha * (point.r < 22 ? .58 : point.alpha*.7);
      ctx.fillStyle = point.r < 22 ? palette.active : point.sand ? palette.sand : palette.base;
      ctx.beginPath();
      ctx.arc(HALF+point.x*spread,HALF+point.y*spread,point.r < 22 ? 1.65 : 1.45,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function tick(time) {
    frame = 0;
    if (!enabled()) { clear(); return; }
    const dt = Math.min(3,(time-lastTime)/16.67 || 1);
    lastTime = time;
    const dx = targetX-x, dy = targetY-y, distance = Math.hypot(dx,dy);
    const follow = 1-Math.pow(.64,dt), fade = 1-Math.pow(.68,dt);
    x += dx*follow; y += dy*follow;
    // Even a fast sweep keeps the ornament close to the actual pointer.
    const lag = Math.hypot(targetX-x,targetY-y);
    if (lag > 9) { x = targetX-(targetX-x)*9/lag; y = targetY-(targetY-y)*9/lag; }
    energy += (Math.min(distance/14,1)-energy)*follow;
    alpha += (targetAlpha-alpha)*fade;
    if (!targetAlpha && alpha < .01) { clear(); return; }
    canvas.hidden = false;
    draw();
    if (Math.abs(targetAlpha-alpha) > .005 || distance > .05 || energy > .005) frame = requestAnimationFrame(tick);
  }
  function move(event) {
    if (event.pointerType !== 'mouse' || !enabled()) { clear(); return; }
    targetX = event.clientX; targetY = event.clientY;
    if (!positioned) { x = targetX; y = targetY; positioned = true; }
    targetAlpha = 1;
    if (!frame) frame = requestAnimationFrame(tick);
  }

  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('pointerup',move,{passive:true});
  document.addEventListener('pointerdown',move,{passive:true});
  document.addEventListener('pointerout',event => { if (!event.relatedTarget) clear(); },{passive:true});
  document.addEventListener('pointercancel',clear,{passive:true});
  // Clicking, text selection, focus changes and scrolling keep the ornament in place.
  // Keyboard navigation yields to the focus indicator until the next mouse movement.
  document.addEventListener('keydown',event => { if (event.key === 'Tab') clear(); },{passive:true});
  document.addEventListener('visibilitychange',clear);
  window.addEventListener('blur',clear);
  window.addEventListener('pagehide',clear);
  window.addEventListener('resize',resize,{passive:true});
  [fine,reduced,forced].forEach(query => query.addEventListener('change',clear));
  resize();
})();
