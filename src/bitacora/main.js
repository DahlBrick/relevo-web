import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CAPITULOS } from './capitulos.js';
import { cargarTodo } from './assets.js';
import { crearCielo, ambienteEn } from './cielo.js';
import { crearOceano, uAgua } from './agua.js';
import { crearEstaciones, CENTROS, FOCOS } from './estaciones.js';
import { crearAves, tickVida } from './vida.js';
import { uViento } from './viento.js';
import { railEn } from './camara.js';
import { crearPost } from './post.js';
import { clicables } from './marcos.js';
import { crearLightbox, TEASER_YT } from '../shared/lightbox.js';
import { montarNav } from '../shared/nav.js';

gsap.registerPlugin(ScrollTrigger);

const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);

// ───────── Relato (DOM) ─────────
function html(strings, ...vals) {
  return strings.reduce((a, s, i) => a + s + (vals[i] ?? ''), '');
}
const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function miniatura(item, idx, cap) {
  const media = item.video
    ? `<video src="${item.src}#t=1.5" muted preload="metadata" playsinline></video><span class="galeria__play"></span>`
    : `<img src="${item.src}" alt="${esc(item.pie)}" loading="lazy" decoding="async" />`;
  return `<button type="button" data-cap="${cap}" data-idx="${idx}" aria-label="Ver: ${esc(item.pie)}">${media}</button>`;
}

function construirRelato() {
  const historia = $('#historia');
  historia.innerHTML = CAPITULOS.map((c, ci) => {
    const alto = `style="min-height:${c.alto * 100}vh"`;
    if (c.tipo === 'intro') {
      return html`<section class="intro" id="${c.id}" data-cap="${ci}" ${alto}>
        <div class="intro__contenido">
          <p class="intro__etiqueta">Bitácora de desarrollo</p>
          <h1>RELEV<em>O</em></h1>
          <p class="intro__sub">Cómo un prototipo 2D de cuadrados de colores se convirtió en un mundo que respira. Nueve etapas, del primer intento en Godot a la Beta 1.0.</p>
          <div class="rueda" id="rueda"><span class="rueda__raton"></span>${matchMedia('(pointer: coarse)').matches ? 'Desliza hacia arriba para empezar' : 'Gira la rueda para empezar'}</div>
        </div>
      </section>`;
    }
    if (c.tipo === 'final') {
      return html`<section class="final" id="${c.id}" data-cap="${ci}" ${alto}>
        <div class="final__contenido">
          <p class="intro__etiqueta">Estado actual</p>
          <p class="final__sello">RELEVO <span>BETA 1.0</span></p>
          <p class="final__texto">De cuadrados de colores en Godot a un mundo vivo en Unity. La beta incluye el Muelle de Cobre y el Patio de Bombas con su arte final, a Nilo y a Maia animados y todas las mecánicas: batería, puentes, palancas, reserva de energía y cajas.</p>
          <div class="final__datos">
            <div class="dato"><b>9</b><span>etapas</span></div>
            <div class="dato"><b>16</b><span>entradas de bitácora</span></div>
            <div class="dato"><b>11</b><span>packs CC0</span></div>
            <div class="dato"><b>2</b><span>niveles con arte final</span></div>
          </div>
          <div class="final__acciones">
            <button class="btn" type="button" id="ver-teaser">▶ Ver el teaser</button>
            <a class="btn btn--ghost" href="./">Conocer el juego</a>
            <button class="btn btn--ghost" type="button" id="de-nuevo">↺ Recorrer de nuevo</button>
          </div>
          <p class="final__plataformas">Próximamente · PC Windows · Mac</p>
        </div>
      </section>`;
    }
    const extras = [];
    if (c.datos) extras.push(`<div class="datos">${c.datos.map((d) => `<div class="dato"><b>${d.valor}</b><span>${d.etiqueta}</span></div>`).join('')}</div>`);
    if (c.hitos) extras.push(`<ul class="hitos">${c.hitos.map((h) => `<li>${h}</li>`).join('')}</ul>`);
    const visibles = c.galeria.length > 6 ? c.galeria.slice(0, 5) : c.galeria;
    const resto = c.galeria.length - visibles.length;
    const mas = resto ? `<button type="button" class="galeria__mas" data-cap="${ci}" data-idx="5" aria-label="Ver ${resto} más">+${resto}</button>` : '';
    const galeria = `<div class="galeria">${visibles.map((g, i) => miniatura(g, i, ci)).join('')}${mas}</div>`;
    return html`<section class="cap cap--${c.lado}" id="${c.id}" data-cap="${ci}" ${alto}>
      <div class="cap__numero" aria-hidden="true">${c.numero}</div>
      <div class="cap__flujo">
        <article class="panel" data-vel="0.6">
          <p class="panel__etiqueta">${c.etiqueta}</p>
          <h2>${c.titulo}</h2>
          <p class="panel__entradilla">${c.entradilla}</p>
          <div class="chips">${c.chips.map((x) => `<span class="chip">${x}</span>`).join('')}</div>
        </article>
        <article class="panel" data-vel="1">
          ${c.parrafos.map((p) => `<p>${p}</p>`).join('')}
          ${c.cita ? `<blockquote>${c.cita}</blockquote>` : ''}
        </article>
        <article class="panel" data-vel="1.4">
          ${extras.join('')}
          ${galeria}
          <p class="panel__nota">Toca una captura o un marco del mundo para verla en grande.</p>
        </article>
      </div>
    </section>`;
  }).join('');

  // Riel y reserva.
  $('#riel').innerHTML = CAPITULOS.map(
    (c, i) => `<button class="riel__nodo" type="button" data-ir="${i}"><span class="riel__nombre">${c.numero ? `${c.numero} · ` : ''}${c.rail}</span><span class="riel__punto"></span></button>`,
  ).join('');
  $('#reserva-barra').innerHTML = CAPITULOS.map(() => '<i></i>').join('');
}

// ───────── Mundo 3D ─────────
const lienzo = $('#mundo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
escena.fog = new THREE.Fog('#455761', 60, 260);
const camara = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 2000);
const post = crearPost(renderer, escena, camara);

const cielo = crearCielo();
escena.add(cielo.malla);
const oceano = crearOceano();
escena.add(oceano);

const hemi = new THREE.HemisphereLight('#bcd6e0', '#3a3026', 1);
escena.add(hemi);
const sol = new THREE.DirectionalLight('#ffe2b8', 2.6);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
sol.shadow.bias = -0.0004;
sol.shadow.normalBias = 0.03;
escena.add(sol, sol.target);
// Relleno suave desde el lado de la cámara: las caras a contraluz no se van a negro.
const relleno = new THREE.DirectionalLight('#cfe3ff', 0.7);
escena.add(relleno, relleno.target);

const amb = {};
const pos = new THREE.Vector3();
const mira = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camMira = new THREE.Vector3();
const focoPos = new THREE.Vector3();
const focoTmp = new THREE.Vector3();
const puntero = new THREE.Vector2();
const punteroSuave = new THREE.Vector2();
let estaciones = null;
let aves = [];

function construirMundo() {
  estaciones = crearEstaciones();
  estaciones.lista.forEach((e) => escena.add(e.grupo));
  const centrosAves = [1, 3, 5, 7, 8, 10].map((i) => CENTROS[i]);
  aves.push(crearAves(26, centrosAves));
  aves.push(crearAves(10, [new THREE.Vector3(-36, 0, -428), new THREE.Vector3(36, 0, -428)], { color: '#1a1a1e', radio: 14, altura: [6, 11] }));
  aves.forEach((a) => escena.add(a));
}

function aplicarAmbiente(T) {
  ambienteEn(T, amb);
  cielo.uniforms.uArriba.value.copy(amb.arriba);
  cielo.uniforms.uHorizonte.value.copy(amb.horizonte);
  cielo.uniforms.uAbajo.value.copy(amb.abajo);
  cielo.uniforms.uEstrellas.value = amb.estrellas;
  cielo.uniforms.uLuna.value = amb.luna;
  const alt = amb.solAlt;
  const az = amb.solAz;
  uAgua.uSolDir.value.set(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)).normalize();
  uAgua.uSolColor.value.copy(amb.sol);
  uAgua.uCieloColor.value.copy(amb.horizonte).lerp(amb.arriba, 0.35);
  uAgua.uProfundo.value.copy(amb.profundo);
  uAgua.uSomero.value.copy(amb.somero);
  uAgua.uNiebla.value.copy(amb.niebla);
  uAgua.uNieblaCerca.value = amb.cerca;
  uAgua.uNieblaLejos.value = amb.lejos;
  escena.fog.color.copy(amb.niebla);
  escena.fog.near = amb.cerca;
  escena.fog.far = amb.lejos;
  sol.color.copy(amb.sol);
  sol.intensity = amb.luz;
  hemi.intensity = amb.amb;
  hemi.color.copy(amb.arriba).lerp(new THREE.Color('#ffffff'), 0.4);
  hemi.groundColor.copy(amb.profundo).lerp(new THREE.Color('#3a3026'), 0.5);
}

// ───────── Scroll → T (tiempo de la historia) ─────────
let secciones = [];
let tops = [];
let altos = [];
let maxScroll = 1;
function medir() {
  secciones = [...document.querySelectorAll('[data-cap]')].filter((el) => el.tagName === 'SECTION');
  tops = secciones.map((s) => s.offsetTop);
  altos = secciones.map((s) => s.offsetHeight);
  maxScroll = document.documentElement.scrollHeight - innerHeight;
}
function tDesdeScroll(y) {
  const n = secciones.length;
  for (let i = n - 1; i >= 0; i--) {
    if (y >= tops[i] || i === 0) {
      const fin = i === n - 1 ? maxScroll : tops[i + 1];
      const f = THREE.MathUtils.clamp((y - tops[i]) / Math.max(1, fin - tops[i]), 0, 1);
      return i + f;
    }
  }
  return 0;
}

// ───────── Arranque ─────────
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
montarNav('bitacora');
construirRelato();
const lightbox = crearLightbox({ alAbrir: () => lenis?.stop(), alCerrar: () => lenis?.start() });
let lenis = null;

async function iniciar() {
  const relleno = $('#carga-relleno');
  const pct = $('#carga-pct');
  await Promise.all([document.fonts.load('64px "Lilita One"'), document.fonts.load('46px "Varela Round"')]).catch(() => {});
  await cargarTodo((f) => {
    relleno.style.width = `${Math.round(f * 100)}%`;
    pct.textContent = `${Math.round(f * 100)}%`;
  });
  const t0 = performance.now();
  $('#carga-texto').textContent = 'Montando el mundo';
  await new Promise((r) => setTimeout(r, 30));
  construirMundo();
  ajustar();
  const t1 = performance.now();
  // Precompila shaders para que el primer recorrido no tartamudee.
  estaciones.lista.forEach((e) => (e.grupo.visible = true));
  await Promise.race([renderer.compileAsync(escena, camara).catch(() => {}), new Promise((r) => setTimeout(r, 4000))]);
  if (import.meta.env.DEV) console.info(`[relevo] carga ${Math.round(t0)} ms · mundo ${Math.round(t1 - t0)} ms · shaders ${Math.round(performance.now() - t1)} ms`);
  $('#carga').classList.add('is-hecha');
  iniciarScroll();
  requestAnimationFrame(bucle);
}

function iniciarScroll() {
  lenis = new Lenis({ duration: 1.35, easing: (t) => 1 - Math.pow(1 - t, 3.2), wheelMultiplier: 0.9, smoothWheel: !reducido });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  medir();

  // Capas de parallax: cada panel viaja a su propia velocidad y entra deslizándose desde su lado.
  document.querySelectorAll('.panel[data-vel]').forEach((el) => {
    const vel = parseFloat(el.dataset.vel);
    const lado = el.closest('.cap--der') ? 1 : -1;
    gsap.fromTo(el, { y: 90 * vel }, { y: -90 * vel, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(el, { opacity: 0, x: 60 * lado, rotateY: 8 * lado }, { opacity: 1, x: 0, rotateY: 0, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 58%', scrub: true } });
  });
  document.querySelectorAll('.cap__numero').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 80 }, { opacity: 1, y: 0, scrollTrigger: { trigger: el.parentElement, start: 'top 80%', end: 'top 20%', scrub: true } });
  });
  gsap.to('.intro__contenido', { opacity: 0, y: -80, scale: 0.94, ease: 'none', scrollTrigger: { trigger: '.intro', start: 'top top', end: '70% top', scrub: true } });
  gsap.fromTo('.final__contenido > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.08, scrollTrigger: { trigger: '.final', start: 'top 35%', end: 'top -10%', scrub: true } });

  // Navegación.
  $('#riel').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ir]');
    if (!b) return;
    const i = +b.dataset.ir;
    const destino = i === 0 ? 0 : tops[i] + altos[i] * (CAPITULOS[i].tipo === 'final' ? 0.6 : 0.18);
    lenis.scrollTo(destino, { duration: 2.4 });
  });
  $('#de-nuevo').addEventListener('click', () => lenis.scrollTo(0, { duration: 4 }));
  $('#ver-teaser').addEventListener('click', () => lightbox.abrir({ youtube: TEASER_YT, pie: 'Teaser de RELEVO' }));
  if (import.meta.env.DEV) {
    // Depuración: window.__irT(5.3) salta a ese punto del recorrido.
    window.__dbg = { camara, FOCOS, escena, get T() { return T; } };
    // Avanza el mundo a mano (útil con la pestaña oculta, donde no hay requestAnimationFrame).
    window.__avanzar = (seg = 1) => {
      for (let k = 0; k < seg * 30; k++) {
        lenis.raf(performance.now() + k * 33);
        fotograma(1 / 30);
      }
    };
    window.__irT = (Tv) => {
      const i = Math.floor(Tv);
      const fin = i === secciones.length - 1 ? maxScroll : tops[i + 1];
      lenis.scrollTo(tops[i] + (Tv - i) * (fin - tops[i]), { immediate: true });
    };
  }
  $('#historia').addEventListener('click', (e) => {
    const b = e.target.closest('.galeria button');
    if (!b) return;
    lightbox.abrir(CAPITULOS[+b.dataset.cap].galeria, +b.dataset.idx);
  });
}

// ───────── Interacción con los marcos del mundo ─────────
const rayo = new THREE.Raycaster();
let resaltado = null;
let punteroMovido = false;
const visibleEnCadena = (o) => {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
};
window.addEventListener('pointermove', (e) => {
  puntero.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  punteroMovido = true;
});
lienzo.addEventListener('click', () => {
  if (!resaltado) return;
  // Abre la captura dentro de la serie de su capítulo, para poder pasar a las demás.
  const { src } = resaltado.userData.marco;
  const cap = CAPITULOS.find((c) => c.galeria?.some((g) => g.src === src));
  if (cap) lightbox.abrir(cap.galeria, cap.galeria.findIndex((g) => g.src === src));
  else lightbox.abrir(resaltado.userData.marco);
});
function buscarResaltado() {
  if (!punteroMovido) return;
  punteroMovido = false;
  rayo.setFromCamera(puntero, camara);
  const candidatos = clicables.filter(visibleEnCadena);
  const hit = rayo.intersectObjects(candidatos, false)[0];
  resaltado = hit && hit.distance < 90 ? hit.object : null;
  lienzo.classList.toggle('es-clicable', !!resaltado);
}

// ───────── HUD de progreso ─────────
let capActual = -1;
function actualizarHUD(T) {
  const i = Math.min(CAPITULOS.length - 1, Math.floor(T + 0.02));
  if (i === capActual) return;
  capActual = i;
  document.querySelectorAll('.riel__nodo').forEach((n, k) => {
    n.classList.toggle('is-activo', k === i);
    n.classList.toggle('is-hecho', k < i);
  });
  document.querySelectorAll('#reserva-barra i').forEach((n, k) => {
    n.classList.toggle('is-lleno', k < i);
    n.classList.toggle('is-actual', k === i);
  });
  const c = CAPITULOS[i];
  $('#reserva-etapa').textContent = c.numero ? `Etapa ${c.numero} · ${c.rail}` : c.rail;
  $('#nav').classList.toggle('is-solid', i > 0);
  const rueda = $('#rueda');
  if (rueda) rueda.style.opacity = i > 0 ? 0 : 1;
}

// ───────── Bucle ─────────
const reloj = new THREE.Clock();
let T = 0;
let desplazamiento = 0;
let primera = true;

function ladoDe(Tv) {
  const c = CAPITULOS[Math.min(CAPITULOS.length - 1, Math.floor(Tv))];
  if (innerWidth < 860 || !c.lado) return 0;
  // Texto a la izquierda → isla desplazada a la derecha, y viceversa.
  return c.lado === 'izq' ? 0.13 : -0.13;
}

let tiempo = 0;
function bucle() {
  requestAnimationFrame(bucle);
  fotograma(Math.min(reloj.getDelta(), 1 / 20));
}

function fotograma(dt) {
  tiempo += dt;
  const t = tiempo;

  const objetivoT = tDesdeScroll(lenis ? lenis.animatedScroll : scrollY);
  T += (objetivoT - T) * (primera ? 1 : 1 - Math.exp(-dt * 6));

  aplicarAmbiente(T);
  railEn(T, pos, mira);
  for (const f of FOCOS) {
    if (T <= f.a || T >= f.c) continue;
    const u = T < f.b ? (T - f.a) / (f.b - f.a) : (f.c - T) / (f.c - f.b);
    const w = u * u * (3 - 2 * u);
    f.objeto.getWorldPosition(focoPos);
    // El desplazamiento se mide en el marco del personaje: (lateral, alto, delante).
    focoTmp.copy(f.desplaz).applyAxisAngle(camara.up, f.objeto.rotation.y);
    pos.lerp(focoTmp.add(focoPos), w);
    mira.lerp(focoTmp.copy(focoPos).setY(focoPos.y + f.altura), w);
  }

  // Vida en la cámara: respiración lenta y parallax con el puntero.
  punteroSuave.lerp(puntero, 1 - Math.exp(-dt * 2.5));
  const respira = reducido ? 0 : 1;
  pos.y += Math.sin(t * 0.35) * 0.25 * respira;
  pos.x += Math.sin(t * 0.23) * 0.3 * respira;
  const derecha = new THREE.Vector3().subVectors(mira, pos).cross(camara.up).normalize();
  pos.addScaledVector(derecha, punteroSuave.x * 1.1);
  pos.y += punteroSuave.y * 0.6;

  const k = primera ? 1 : 1 - Math.exp(-dt * 4.5);
  camPos.lerp(pos, k);
  camMira.lerp(mira, k);
  camara.position.copy(camPos);
  camara.lookAt(camMira);
  primera = false;

  // Desplazamiento lateral de la proyección para dejar sitio al texto.
  desplazamiento += (ladoDe(T) - desplazamiento) * (1 - Math.exp(-dt * 2));
  const w = innerWidth;
  const h = innerHeight;
  camara.setViewOffset(w, h, -desplazamiento * w, 0, w, h);

  // Sol y sombras siguen a la parada actual.
  sol.target.position.copy(camMira);
  sol.position.copy(camMira).addScaledVector(uAgua.uSolDir.value, 70);
  relleno.target.position.copy(camMira);
  relleno.position.copy(camara.position).add(new THREE.Vector3(0, 6, 0));
  relleno.intensity = amb.amb * 0.75;
  cielo.malla.position.copy(camara.position);
  oceano.userData.seguir(camara);

  // Tiempo para shaders y vida.
  uAgua.uTiempo.value = t;
  uViento.tiempo.value = t;
  uViento.fuerza.value = T > 9 && T < 9.5 ? 0.4 : 1;
  tickVida(t);
  aves.forEach((a) => a.userData.actualizar(t));
  buscarResaltado();
  estaciones.actualizar(T, t, dt, resaltado);

  // La etapa 2D se ve pixelada; al pasar al graybox de Unity el mundo gana resolución.
  const pixel = 1 - THREE.MathUtils.smoothstep(T, 1.8, 2.35);
  post.final.uniforms.uPixel.value = pixel * 0.78;
  post.final.uniforms.uTiempo.value = t;
  post.bloom.strength = 0.45 + (T > 9 ? 0.35 : 0) + (T > 5.4 && T < 6.9 ? 0.15 : 0);

  actualizarHUD(T);
  post.composer.render();
}

function ajustar() {
  const w = innerWidth;
  const h = innerHeight;
  camara.aspect = w / h;
  // En vertical se abre el campo de visión para que las islas quepan a lo ancho.
  camara.fov = camara.aspect < 1 ? 42 + (1 - camara.aspect) * 40 : 42;
  camara.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  post.tamano(w, h, renderer.getPixelRatio());
  medir();
}
window.addEventListener('resize', () => {
  ajustar();
  ScrollTrigger.refresh();
});

iniciar().catch((err) => {
  console.error(err);
  $('#carga-texto').textContent = 'No se pudo cargar el mundo 3D';
});
