import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { crearLightbox, iframeYouTube, TEASER_YT } from '../shared/lightbox.js';
import { montarNav } from '../shared/nav.js';

gsap.registerPlugin(ScrollTrigger);

const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = montarNav('inicio');

const lenis = new Lenis({ duration: 1.2, smoothWheel: !reducido });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
if (import.meta.env.DEV) window.__lenis = lenis;

document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const destino = document.querySelector(a.getAttribute('href'));
    if (!destino) return;
    e.preventDefault();
    lenis.scrollTo(destino, { offset: 0 });
  }),
);

// El hero empieza justo debajo de la barra, mida lo que mida.
const medirNav = () => document.documentElement.style.setProperty('--alto-nav', `${nav.offsetHeight}px`);
medirNav();
window.addEventListener('resize', medirNav);
window.addEventListener('load', medirNav);

// ───────── Teaser en YouTube ─────────
const lightbox = crearLightbox({ alAbrir: () => lenis.stop(), alCerrar: () => lenis.start() });
document.querySelectorAll('[data-teaser]').forEach((b) => b.addEventListener('click', () => lightbox.abrir({ youtube: TEASER_YT, pie: 'Teaser de RELEVO' })));
const fachada = document.querySelector('.teaser__fachada');
fachada?.addEventListener('click', () => {
  // La fachada evita cargar YouTube hasta que alguien pide verlo.
  fachada.parentElement.innerHTML = iframeYouTube(TEASER_YT);
});

// ───────── Relato por capas ─────────
// Las capas son ilustraciones renderizadas con los modelos del juego (herramientas/capas.html), en
// versión de tarde y de noche. Cada una mide 1200 px de alto y su propio ancho: al ajustarlas a la
// altura de la pantalla, las más anchas recorren más distancia y se mueven más rápido.
const escena = document.getElementById('escena');
const relato = document.getElementById('relato');
const capas = [...escena.querySelectorAll('[data-capa]')].map((el) => ({ el, nombre: el.dataset.capa }));
const textos = [...escena.querySelectorAll('.r-texto')];
const puntos = [...escena.querySelectorAll('.relato__progreso i')];
const sol = escena.querySelector('.r-sol');
const luna = escena.querySelector('.r-luna');
const estrellas = escena.querySelector('.r-estrellas');
const nubes = escena.querySelector('.r-nubes');
const haz = document.getElementById('haz-faro');
const puente = document.getElementById('puente');
const nilo = document.getElementById('relato-nilo');
const tinte = escena.querySelector('.r-tinte');

let meta = null;
let altoEscena = 1;
let anchoEscena = 1;
let escala = 1;
let progreso = 0;
let capituloActual = -1;

// Luciérnagas de la noche.
const luciernagas = document.getElementById('luciernagas');
for (let i = 0; i < 34; i++) {
  const l = document.createElement('i');
  l.style.left = `${Math.random() * 100}%`;
  l.style.top = `${55 + Math.random() * 40}%`;
  l.style.animationDelay = `${-Math.random() * 6}s`;
  l.style.animationDuration = `${4 + Math.random() * 4}s`;
  luciernagas.append(l);
}

function medirEscena() {
  if (!meta) return;
  altoEscena = escena.clientHeight;
  anchoEscena = escena.clientWidth;
  escala = altoEscena / meta.altoPx;
  for (const c of capas) {
    c.ancho = meta.capas[c.nombre].ancho * escala;
    c.el.style.width = `${c.ancho}px`;
  }
  const f = meta.capas.lejos.faro;
  haz.style.left = `${f.x * escala}px`;
  haz.style.top = `${f.y * escala}px`;
  const lado = meta.nilo.px * escala;
  nilo.style.width = nilo.style.height = `${lado}px`;
  nilo.style.top = `${meta.capas.medio.piesY * altoEscena - meta.nilo.pies * lado}px`;
  nilo.querySelectorAll('span').forEach((s) => (s.style.backgroundSize = `${lado * meta.nilo.cuadros}px ${lado}px`));
  actualizarRelato(progreso);
}

// Cielo por capítulo: amanecer, mañana, tarde dorada, atardecer y noche.
const HORAS = [
  { arriba: '#3a6f98', horizonte: '#f4c79c', tinte: 0, noche: 0, nube: 1 },
  { arriba: '#3f8fc4', horizonte: '#d8eeec', tinte: 0, noche: 0, nube: 1 },
  { arriba: '#3e7aa6', horizonte: '#f6cd94', tinte: 0.15, noche: 0, nube: 0.95 },
  { arriba: '#34497a', horizonte: '#f09060', tinte: 0.6, noche: 0.15, nube: 0.8 },
  { arriba: '#0a1424', horizonte: '#1f3d5a', tinte: 0, noche: 1, nube: 0.28 },
];
const mezclar = (a, b, f) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = (sh) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * f);
  return `rgb(${c(16)}, ${c(8)}, ${c(0)})`;
};
const suave = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function actualizarRelato(p) {
  progreso = p;
  if (!meta) return;
  // Desplazamiento lateral de cada capa.
  const tx = {};
  for (const c of capas) {
    tx[c.nombre] = -p * Math.max(0, c.ancho - anchoEscena);
    c.el.style.transform = `translate3d(${tx[c.nombre].toFixed(1)}px, 0, 0)`;
  }
  // Hora del día.
  const t = p * (HORAS.length - 1);
  const i = Math.min(HORAS.length - 2, Math.floor(t));
  const f = suave(t - i);
  const a = HORAS[i];
  const b = HORAS[i + 1];
  escena.style.setProperty('--arriba', mezclar(a.arriba, b.arriba, f));
  escena.style.setProperty('--horizonte', mezclar(a.horizonte, b.horizonte, f));
  const noche = a.noche + (b.noche - a.noche) * f;
  escena.style.setProperty('--noche', noche.toFixed(3));
  tinte.style.opacity = (a.tinte + (b.tinte - a.tinte) * f).toFixed(3);
  const brilloNube = a.nube + (b.nube - a.nube) * f;
  nubes.style.filter = `brightness(${brilloNube.toFixed(2)}) sepia(${(0.35 * (1 - noche) * clamp01((p - 0.4) / 0.3)).toFixed(2)})`;
  // Sol, luna y estrellas.
  const arco = Math.sin(clamp01(p / 0.8) * Math.PI);
  sol.style.transform = `translate(${(-20 + p * 40).toFixed(1)}vw, ${(46 - arco * 38).toFixed(1)}vh)`;
  sol.style.opacity = String(1 - clamp01((p - 0.72) / 0.12));
  luna.style.transform = `translateY(${(30 - noche * 26).toFixed(1)}vh)`;
  luna.style.opacity = String(noche);
  estrellas.style.opacity = String(noche);
  haz.style.opacity = String(clamp01((p - 0.84) / 0.08));
  // Nilo avanza un poco por la pantalla y el mundo pasa por detrás.
  const movil = anchoEscena < 861;
  const xNilo = movil ? 0.42 + p * 0.16 : 0.3 + p * 0.32;
  nilo.style.left = `${xNilo * anchoEscena - parseFloat(nilo.style.width || 0) / 2}px`;
  // El puente se despliega cuando Nilo se acerca al canal.
  const bajoNilo = (-tx.medio + anchoEscena * xNilo) / escala;
  const [h0, h1] = meta.capas.medio.hueco;
  const fp = clamp01((bajoNilo - (h0 - 620)) / 480);
  const borde = h0 + (h1 - h0) * fp;
  puente.style.clipPath = `inset(0 ${(100 - (borde / meta.capas.medio.ancho) * 100).toFixed(2)}% 0 0)`;
  // Capítulo activo.
  const cap = Math.min(textos.length - 1, Math.floor(p * textos.length * 0.999));
  if (cap !== capituloActual) {
    capituloActual = cap;
    textos.forEach((tx2, k) => tx2.classList.toggle('is-activo', k === cap));
    puntos.forEach((pt, k) => pt.classList.toggle('is-activo', k <= cap));
  }
}

// Nilo camina por fotogramas: avanza un cuadro cada tantos píxeles de scroll y se queda quieto al parar.
let cuadro = 0;
let acumulado = 0;
let ultimoScroll = 0;
function pasos(scroll) {
  if (!meta) return;
  acumulado += Math.abs(scroll - ultimoScroll);
  ultimoScroll = scroll;
  const nuevo = Math.floor(acumulado / 26) % meta.nilo.cuadros;
  if (nuevo === cuadro) return;
  cuadro = nuevo;
  const lado = meta.nilo.px * escala;
  nilo.querySelectorAll('span').forEach((s) => (s.style.backgroundPosition = `${-cuadro * lado}px 0`));
}

ScrollTrigger.create({
  trigger: relato,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (st) => {
    actualizarRelato(st.progress);
    pasos(st.scroll());
  },
});
fetch(import.meta.env.BASE_URL + 'img/relato/relato.json')
  .then((r) => r.json())
  .then((m) => {
    meta = m;
    medirEscena();
  });
window.addEventListener('resize', medirEscena);

// ───────── Parallax del resto de la página ─────────
document.querySelectorAll('[data-velocidad]').forEach((el) => {
  const v = parseFloat(el.dataset.velocidad);
  gsap.fromTo(el, { yPercent: -v * 100 }, { yPercent: v * 100, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
});
document.querySelectorAll('[data-interior]').forEach((img) => {
  gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
});

ScrollTrigger.batch('.revela', {
  start: 'top 88%',
  onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true }),
});

// Nilo cruza la banda de la bitácora al ritmo del scroll.
const bandaNilo = document.getElementById('banda-nilo');
gsap.fromTo(bandaNilo, { xPercent: -120 }, { xPercent: 0, left: '100%', ease: 'none', scrollTrigger: { trigger: '.banda', start: 'top bottom', end: 'bottom top', scrub: true } });

// ───────── Cinemáticas ─────────
const enPantalla = new IntersectionObserver(
  (entradas) =>
    entradas.forEach(({ target, isIntersecting }) => {
      if (isIntersecting && !reducido) target.play().catch(() => {});
      else target.pause();
    }),
  { threshold: 0.4 },
);
document.querySelectorAll('.cine__item').forEach((b) => {
  enPantalla.observe(b.querySelector('video'));
  b.addEventListener('click', () => lightbox.abrir({ src: b.dataset.video, video: true, pie: b.dataset.pie }));
});

// La barra se vuelve sólida en cuanto se baja del hero.
ScrollTrigger.create({ start: 80, onToggle: (s) => nav.classList.toggle('is-solid', s.isActive) });
