// Header: solid background once the hero scrolls away
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Full-screen menu
const menuBtn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');

function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) menu.hidden = false;
  requestAnimationFrame(() => menu.classList.toggle('open', open));
  document.body.style.overflow = open ? 'hidden' : '';
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Service carousel: swipe on touch, drag with the mouse, or use the arrows
const track = document.getElementById('tiles');
const tilesBar = document.getElementById('tiles-bar');
const tiles = [...track.querySelectorAll('.tile')];

function updateTilesBar() {
  const max = track.scrollWidth - track.clientWidth;
  const visible = track.clientWidth / track.scrollWidth;
  const progress = max > 0 ? track.scrollLeft / max : 1;
  tilesBar.style.width = `${(visible + (1 - visible) * progress) * 100}%`;
}
track.addEventListener('scroll', updateTilesBar, { passive: true });
window.addEventListener('resize', updateTilesBar);
updateTilesBar();

const tileStep = () => tiles[0].getBoundingClientRect().width + 16;
document.getElementById('tiles-prev').addEventListener('click', () => track.scrollBy({ left: -tileStep() }));
document.getElementById('tiles-next').addEventListener('click', () => track.scrollBy({ left: tileStep() }));
track.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') track.scrollBy({ left: tileStep() });
  if (e.key === 'ArrowLeft') track.scrollBy({ left: -tileStep() });
});

let dragStartX = 0;
let dragStartScroll = 0;
let dragMoved = false;
track.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return; // touch already swipes natively
  dragStartX = e.clientX;
  dragStartScroll = track.scrollLeft;
  dragMoved = false;
  const onMove = (ev) => {
    const dx = ev.clientX - dragStartX;
    if (!dragMoved && Math.abs(dx) > 5) {
      dragMoved = true;
      track.classList.add('dragging');
    }
    if (dragMoved) track.scrollLeft = dragStartScroll - dx;
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    if (dragMoved) {
      // let snapping settle on the nearest card
      const target = Math.round(track.scrollLeft / tileStep()) * tileStep();
      track.classList.remove('dragging');
      track.scrollTo({ left: target });
    }
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
});

// Tap a card to reveal its full service list (hover covers desktop)
tiles.forEach((tile) => {
  tile.tabIndex = 0;
  tile.addEventListener('click', () => { if (!dragMoved) tile.classList.toggle('open'); });
});

// Process slider
const steps = [...document.querySelectorAll('.step')];
const bar = document.getElementById('step-bar');
const blob = document.querySelector('.blob');
let current = 0;

function showStep(i) {
  current = (i + steps.length) % steps.length;
  steps.forEach((s, n) => s.classList.toggle('is-active', n === current));
  bar.style.width = `${((current + 1) / steps.length) * 100}%`;
  blob.style.transform = `translate(-50%, -50%) rotate(${current * 72}deg) scale(${1 + (current % 2) * 0.08})`;
}
document.getElementById('prev').addEventListener('click', () => showStep(current - 1));
document.getElementById('next').addEventListener('click', () => showStep(current + 1));

// Reveal on scroll
const revealTargets = document.querySelectorAll(
  '.sec-head, .quote, .about-grid, .clients-head, .clients li, .tile, .mv-card, .values li, .expertise article, .process, .adv-head, .adv article, .contact-grid > *'
);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 5) * 60}ms`;
    io.observe(el);
  });
}

// Contact form: no backend yet, so hand the enquiry to the visitor's mail client
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  let firstInvalid = null;
  form.querySelectorAll('[required]').forEach((field) => {
    const valid = field.checkValidity() && field.value.trim() !== '';
    field.setAttribute('aria-invalid', String(!valid));
    if (!valid && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    note.textContent = 'Please fill in your name, a valid email and a message.';
    firstInvalid.focus();
    return;
  }

  const data = new FormData(form);
  const subject = `Enquiry: ${data.get('topic')} — ${data.get('name')}`;
  const body = [
    `Name: ${data.get('name')}`,
    `Organization: ${data.get('organization') || '—'}`,
    `Email: ${data.get('email')}`,
    `Area of interest: ${data.get('topic')}`,
    '',
    data.get('message'),
  ].join('\n');

  window.location.href =
    `mailto:info@geedfadhi.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Opening your email app… If nothing happens, write to info@geedfadhi.com.';
});

document.getElementById('year').textContent = new Date().getFullYear();

// Highlight the desktop nav link for the section in view
const navLinks = [...document.querySelectorAll('.top-nav a:not(.top-nav-cta)')];
const navSections = navLinks
  .map((a) => document.querySelector(a.getAttribute('href') === '#top' ? '.hero' : a.getAttribute('href')))
  .filter(Boolean);
if ('IntersectionObserver' in window) {
  const navIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const i = navSections.indexOf(entry.target);
      navLinks.forEach((a, n) => a.classList.toggle('active', n === i));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navSections.forEach((el) => navIo.observe(el));
}
