const menu = document.querySelector('.menu-trigger');
const nav = document.querySelector('.main-nav');

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('is-open', open);
}

menu.addEventListener('click', () => {
  const opening = menu.getAttribute('aria-expanded') !== 'true';
  setMenu(opening);
  if (opening) nav.querySelector('a').focus({preventScroll: true});
});
nav.addEventListener('click', () => setMenu(false));
document.querySelector('.nav-download').addEventListener('click', () => setMenu(false));
document.querySelector('.brand').addEventListener('click', () => setMenu(false));
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-surface')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener('focusin', event => {
  if (!event.target.closest('.nav-surface')) setMenu(false);
});
matchMedia('(max-width: 740px)').addEventListener('change', event => {
  const focused = document.activeElement;
  setMenu(false);
  // Keep keyboard focus on a visible control when the navigation changes form.
  if (event.matches && nav.contains(focused)) {
    menu.focus({preventScroll: true});
  } else if (!event.matches && focused === menu) {
    nav.querySelector('a').focus({preventScroll: true});
  }
});

const hero = document.querySelector('.hero');
const motionAllowed = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let frame = 0;
let visible = true;
let x = 0, y = 0;
let targetX = 0, targetY = 0;

function moveGlass() {
  frame = 0;
  if (!visible || !motionAllowed.matches) return;
  x += (targetX - x) * .14;
  y += (targetY - y) * .14;
  hero.style.setProperty('--pointer-x', x.toFixed(3));
  hero.style.setProperty('--pointer-y', y.toFixed(3));
  if (Math.max(Math.abs(targetX - x), Math.abs(targetY - y)) > .003) {
    frame = requestAnimationFrame(moveGlass);
  }
}

function aimGlass(nextX, nextY) {
  if (!visible || !motionAllowed.matches) return;
  targetX = nextX;
  targetY = nextY;
  if (!frame) frame = requestAnimationFrame(moveGlass);
}

hero.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  const rect = hero.getBoundingClientRect();
  aimGlass(2 * (event.clientX - rect.left) / rect.width - 1, 2 * (event.clientY - rect.top) / rect.height - 1);
}, {passive: true});
hero.addEventListener('pointerleave', () => aimGlass(0, 0));
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  hero.classList.toggle('off-screen', !visible);
}).observe(hero);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scrollFrame = 0;

function updateHeroTravel() {
  scrollFrame = 0;
  const bounds = hero.getBoundingClientRect();
  const travel = Math.min(1, Math.max(0, -bounds.top / bounds.height));
  hero.style.setProperty('--hero-travel', travel.toFixed(4));
}

function requestHeroTravel() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeroTravel);
}

function configureScrollMotion() {
  if (reducedMotion.matches) {
    window.removeEventListener('scroll', requestHeroTravel);
    window.removeEventListener('resize', requestHeroTravel);
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    hero.style.removeProperty('--hero-travel');
  } else {
    window.addEventListener('scroll', requestHeroTravel, {passive: true});
    window.addEventListener('resize', requestHeroTravel);
    requestHeroTravel();
  }
}

configureScrollMotion();
reducedMotion.addEventListener('change', configureScrollMotion);

document.querySelectorAll('.download-options a').forEach(link => {
  link.addEventListener('pointerenter', event => {
    if (!motionAllowed.matches || event.pointerType === 'touch') return;
    const box = link.getBoundingClientRect();
    link.style.setProperty('--entry-x', (event.clientX - box.left) + 'px');
    link.style.setProperty('--entry-y', (event.clientY - box.top) + 'px');
  });
});
