import { montarNav } from '../shared/nav.js';
import { niloSVG } from '../shared/nilo-svg.js';
import { montarCartel3D } from './cartel3d.js';

// Páginas "Coming soon" (Juego, Historia, Comunidad): Nilo saluda sobre el cartel, la escena 2D se
// desplaza por capas con el puntero y los ojos de Nilo siguen al cursor.

const pagina = document.body.dataset.pagina;
montarNav(pagina);
document.getElementById('nilo').innerHTML = niloSVG({ saludo: true });

// El cartel 3D sustituye al dibujo 2D; si no hay WebGL, se queda el 2D.
const heroe = document.querySelector('.pronto__heroe');
montarCartel3D(document.getElementById('cartel3d'))
  .then(() => heroe.classList.add('con-3d'))
  .catch((err) => {
    console.warn('[relevo] cartel 3D no disponible', err);
    document.getElementById('cartel3d').remove();
    heroe.classList.add('sin-3d');
  });

const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const capas = [...document.querySelectorAll('[data-prof]')];
const pupilas = document.querySelector('.nilo__pupilas');
const objetivo = { x: 0, y: 0 };
const actual = { x: 0, y: 0 };

window.addEventListener('pointermove', (e) => {
  objetivo.x = (e.clientX / innerWidth) * 2 - 1;
  objetivo.y = (e.clientY / innerHeight) * 2 - 1;
  pupilas?.classList.add('es-guiada');
});

// En móvil, la inclinación del teléfono mueve las capas (si el navegador lo permite sin pedir permiso).
window.addEventListener('deviceorientation', (e) => {
  if (e.gamma == null) return;
  objetivo.x = Math.max(-1, Math.min(1, e.gamma / 30));
  objetivo.y = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
});

function bucle() {
  actual.x += (objetivo.x - actual.x) * 0.06;
  actual.y += (objetivo.y - actual.y) * 0.06;
  for (const c of capas) {
    const p = parseFloat(c.dataset.prof);
    c.style.transform = `translate3d(${(-actual.x * p).toFixed(2)}px, ${(-actual.y * p * 0.6).toFixed(2)}px, 0)`;
  }
  if (pupilas?.classList.contains('es-guiada')) {
    pupilas.style.transform = `translate(${(actual.x * 6).toFixed(2)}px, ${(actual.y * 4).toFixed(2)}px)`;
  }
  requestAnimationFrame(bucle);
}
if (!reducido) requestAnimationFrame(bucle);

// Tocar a Nilo: salta y la antena suelta chispas.
const nilo = document.getElementById('nilo');
nilo.addEventListener('click', () => {
  nilo.classList.remove('salta');
  void nilo.offsetWidth;
  nilo.classList.add('salta');
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('i');
    s.className = 'chispa';
    s.style.setProperty('--a', `${(i / 10) * 360}deg`);
    s.style.setProperty('--d', `${40 + Math.random() * 50}px`);
    nilo.append(s);
    setTimeout(() => s.remove(), 900);
  }
});

// Brasas (lado de la forja) y luciérnagas (lado del canal).
function particulas(contenedor, n, clase) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = clase;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${-Math.random() * 8}s`;
    p.style.animationDuration = `${5 + Math.random() * 6}s`;
    p.style.setProperty('--tam', `${2 + Math.random() * 4}px`);
    frag.append(p);
  }
  contenedor.append(frag);
}
particulas(document.querySelector('.capa--brasas'), 34, 'brasa');
particulas(document.querySelector('.capa--luciernagas'), 22, 'luciernaga');
