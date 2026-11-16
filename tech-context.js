(() => {
  const system = document.querySelector('[data-context-system]');
  if (!system) return;
  const stage = system.querySelector('.context-diagram');
  const svg = system.querySelector('.context-wires');
  const deviceClip = system.querySelector('[data-context-clip]');
  const controls = [...system.querySelectorAll('[data-context-step]')];
  const caption = system.querySelector('.context-caption');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 800px)');
  const descriptions = {
    connect: 'Bring authorized context to your local agent.',
    remember: 'Shared knowledge. Separate agent memories. Stored locally.',
    act: 'Your agents can plan, run tasks and coordinate work.'
  };
  const nodes = Object.fromEntries([...system.querySelectorAll('[data-context-node]')].map(node => [node.dataset.contextNode, node]));
  const wires = Object.fromEntries([...system.querySelectorAll('[data-wire]')].map(path => [path.dataset.wire, path]));
  const packets = Object.fromEntries([...system.querySelectorAll('[data-packet]')].map(path => [path.dataset.packet, path]));
  let activeAnimations = [];

  function stopPackets() {
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations = [];
  }

  function drawWires() {
    const box = stage.getBoundingClientRect();
    if (!box.width) return;
    stopPackets();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const atElement = (element, x, y) => {
      const rect = element.getBoundingClientRect();
      return [rect.left - box.left + rect.width * x, rect.top - box.top + rect.height * y];
    };
    const at = (name, x, y) => atElement(nodes[name], x, y);
    const device = nodes.device.getBoundingClientRect();
    const edge = {
      left: device.left - box.left,
      top: device.top - box.top,
      right: device.right - box.left,
    };
    // Internal routes cannot draw or animate beyond the local device frame.
    Object.entries({ x: edge.left + 1, y: edge.top + 1, width: device.width - 2, height: device.height - 2 }).forEach(([key, value]) => deviceClip.setAttribute(key, value));
    const paths = {};

    ['files', 'mail', 'calendar', 'chat'].forEach((name, index) => {
      const a = atElement(nodes[name].querySelector('i'), .5, .5);
      const b = at('core', 0, .32 + index * .12);
      if (mobile.matches) {
        // A narrow input lane avoids the computer label and local-model node.
        const lane = edge.left + 12 + index * 3;
        const entry = edge.top - 12;
        paths[name] = `M${a} C${a[0]},${a[1] + 12} ${lane},${a[1] + 14} ${lane},${entry} L${lane},${b[1] - 14} Q${lane},${b[1]} ${lane + 14},${b[1]} L${b}`;
      } else {
        const bend = Math.min(65, (b[0] - a[0]) * .45);
        paths[name] = `M${a} C${a[0] + bend},${a[1]} ${b[0] - bend},${b[1]} ${b}`;
      }
    });

    const model = at('model', .5, 1);
    const coreTop = at('core', .5, 0);
    paths.model = `M${model} L${coreTop}`;
    ['wiki', 'memory'].forEach((name, index) => {
      const a = at(name, .5, 0);
      const b = at('core', index ? .72 : .28, 1);
      const bend = Math.min(24, Math.max(8, (a[1] - b[1]) * .6));
      paths[name] = `M${a} C${a[0]},${a[1] - bend} ${b[0]},${b[1] + bend} ${b}`;
    });

    const from = at('core', 1, .5);
    const to = at('agents', mobile.matches ? 1 : 0, .5);
    if (mobile.matches) {
      const lane = edge.right - 11;
      paths.agents = `M${from} C${from[0] + 20},${from[1]} ${lane},${from[1]} ${lane},${from[1] + 20} L${lane},${to[1] - 18} Q${lane},${to[1]} ${lane - 18},${to[1]} L${to}`;
    } else {
      const bend = Math.min(55, (to[0] - from[0]) * .45);
      paths.agents = `M${from} C${from[0] + bend},${from[1]} ${to[0] - bend},${to[1]} ${to}`;
    }
    Object.entries(paths).forEach(([name, path]) => {
      wires[name].setAttribute('d', path);
      packets[name].setAttribute('d', path);
    });
  }

  function selectStep(button) {
    const selection = button.dataset.contextStep;
    system.dataset.contextStage = selection;
    controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    caption.textContent = descriptions[selection];
    stopPackets();
    if (reduceMotion.matches) return;
    system.querySelectorAll(`.context-packets [data-context-route="${selection}"]`).forEach((packet, index) => {
      activeAnimations.push(packet.animate([
        { strokeDashoffset: 1, opacity: 0 },
        { strokeDashoffset: .86, opacity: 1, offset: .13 },
        { strokeDashoffset: .1, opacity: 1, offset: .9 },
        { strokeDashoffset: 0, opacity: 0 }
      ], { duration: 850, delay: index * 45, easing: 'cubic-bezier(.3,.1,.3,1)' }));
    });
  }

  controls.forEach((button, index) => {
    button.addEventListener('click', () => selectStep(button));
    button.addEventListener('keydown', event => {
      const destinations = {
        ArrowRight: (index + 1) % controls.length,
        ArrowLeft: (index - 1 + controls.length) % controls.length,
        Home: 0,
        End: controls.length - 1,
      };
      if (!Object.hasOwn(destinations, event.key)) return;
      event.preventDefault();
      const next = controls[destinations[event.key]];
      next.focus();
      selectStep(next);
    });
  });
  const resize = new ResizeObserver(drawWires);
  resize.observe(stage);
  resize.observe(nodes.device);
  document.fonts?.ready.then(drawWires);
  reduceMotion.addEventListener('change', stopPackets);
  drawWires();
})();
