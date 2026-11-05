import { $, $$ } from './dom.js';

export function initializeLoader() {
  const hideLoader = () => {
    const loader = $('#loader');
    setTimeout(() => loader?.classList.add('hidden'), 1200);
  };

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader, { once: true });
    window.setTimeout(hideLoader, 3000);
  }
}

export function initializeNavigation() {
  const header = $('#header');
  const hamburger = $('#hamburger');
  const nav = $('#nav');
  if (!header || !hamburger || !nav) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    nav.classList.toggle('open');
  });

  $$('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      nav.classList.remove('open');
    });
  });
}
export function initializeHeroNotes() {
  const heroNotes = $('#heroNotes');
  if (!heroNotes) return;
  const symbols = ['♩', '♪', '♫', '♬', '𝄞', '𝄢', '♭', '♯'];

  setInterval(() => {
    const el = document.createElement('span');
    el.classList.add('floating-note');
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${Math.random() * 80 + 20}%`;
    const duration = 6 + Math.random() * 6;
    const delay = Math.random() * 4;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;
    el.style.fontSize = `${1.2 + Math.random() * 1.5}rem`;
    heroNotes.appendChild(el);
    setTimeout(() => el.remove(), (duration + delay) * 1000 + 200);
  }, 700);
}
export function initializeStats() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.target);
      const duration = 1800;
      const step = 16;
      const steps = Math.floor(duration / step);
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          el.textContent = target.toLocaleString('pt-BR');
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current).toLocaleString('pt-BR');
        }
      }, step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  $$('.stat__number').forEach((el) => observer.observe(el));
}
let toastTimer;
export function showToast(message, isError = false) {
  const toast = $('#toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.style.borderColor = isError ? '#c94c4c' : 'var(--gold)';
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
export function initializeUI() {
  initializeLoader();
  initializeNavigation();
  initializeHeroNotes();
  initializeStats();
}
