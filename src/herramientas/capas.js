import * as THREE from 'three';
import { cargarTodo, instancia } from '../bitacora/assets.js';
import { construirNivel, TILE, mat, hash } from '../bitacora/diorama.js';
import { crearNilo } from '../bitacora/nilo.js';
import { crearFaro } from '../bitacora/estaciones.js';
import { crearOceano, uAgua } from '../bitacora/agua.js';
import { uViento } from '../bitacora/viento.js';

// Renderiza las capas 2D del relato de la portada con los modelos del juego. Todas usan la misma
// cámara ortográfica inclinada y la misma escala, así encajan entre sí al superponerse.

const ALTO_PX = 1200;
const ALTO_U = 14;
const PXU = ALTO_PX / ALTO_U;
const INCL = THREE.MathUtils.degToRad(22);
const SEN = Math.sin(INCL);
const COS = Math.cos(INCL);
const OBJ_Y = 3.0; // altura del punto al que mira la cámara: deja el muelle cerca del 72 % de la altura
/** Altura (y) a la que hay que poner algo en la profundidad z para que salga en la altura de pantalla v (-7 abajo, 7 arriba). */
const yPara = (v, z) => (v + z * SEN) / COS + OBJ_Y;

const log = (m) => (document.getElementById('log').textContent += `${m}\n`);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

function camara(anchoU, cx, { alto = ALTO_U, objY = OBJ_Y } = {}) {
  const c = new THREE.OrthographicCamera(-anchoU / 2, anchoU / 2, alto / 2, -alto / 2, 0.1, 300);
  c.position.set(cx, objY + Math.sin(INCL) * 60, Math.cos(INCL) * 60);
  c.lookAt(cx, objY, 0);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
}

const DIA = {
  hemi: ['#d6e8ee', '#4a3a2c', 1.25],
  sol: ['#ffd9a8', 3.3, new THREE.Vector3(-0.45, 0.7, 0.55)],
  agua: { profundo: '#14403e', somero: '#2f8a80', cielo: '#cfe6e6', sol: '#ffd9a0', niebla: '#d9cdb8' },
};
const NOCHE = {
  hemi: ['#3b5f8f', '#0a0e14', 0.5],
  sol: ['#a9c4ff', 1.2, new THREE.Vector3(0.5, 0.65, -0.25)],
  agua: { profundo: '#071a24', somero: '#103a46', cielo: '#2b4a68', sol: '#d8e6ff', niebla: '#1b2c42' },
};

function iluminar(escena, modo, cx, anchoU) {
  const h = new THREE.HemisphereLight(...modo.hemi);
  escena.add(h);
  const [color, fuerza, dir] = modo.sol;
  const sol = new THREE.DirectionalLight(color, fuerza);
  sol.position.copy(dir).normalize().multiplyScalar(60).add(new THREE.Vector3(cx, 0, 0));
  sol.target.position.set(cx, 0, 0);
  sol.castShadow = true;
  sol.shadow.mapSize.set(8192, 2048);
  Object.assign(sol.shadow.camera, { left: -anchoU / 2 - 4, right: anchoU / 2 + 4, top: 14, bottom: -14, near: 1, far: 160 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  escena.add(sol, sol.target);
  // Relleno desde la cámara para que las caras frontales no queden negras.
  const relleno = new THREE.DirectionalLight(modo === DIA ? '#ffe8cc' : '#6f8fc8', modo === DIA ? 0.9 : 0.35);
  relleno.position.set(cx, 20, 60);
  relleno.target.position.set(cx, 0, 0);
  escena.add(relleno, relleno.target);
  const a = modo.agua;
  uAgua.uProfundo.value.set(a.profundo);
  uAgua.uSomero.value.set(a.somero);
  uAgua.uCieloColor.value.set(a.cielo);
  uAgua.uSolColor.value.set(a.sol);
  uAgua.uNiebla.value.set(a.niebla);
  uAgua.uSolDir.value.copy(dir).normalize();
  uAgua.uNieblaCerca.value = 64;
  uAgua.uNieblaLejos.value = 104;
}

/** Brillo (bloom) en 2D: aísla los píxeles muy claros, los difumina y los suma. */
function brillo(origen, { umbral = 235, radio = 16, fuerza = 1 } = {}) {
  const w = origen.width;
  const h = origen.height;
  const claro = document.createElement('canvas');
  claro.width = w;
  claro.height = h;
  const cc = claro.getContext('2d');
  cc.drawImage(origen, 0, 0);
  const img = cc.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = Math.max(d[i], d[i + 1], d[i + 2]);
    if (l < umbral || d[i + 3] < 200) d[i + 3] = 0;
  }
  cc.putImageData(img, 0, 0);
  const salida = document.createElement('canvas');
  salida.width = w;
  salida.height = h;
  const sc = salida.getContext('2d');
  sc.drawImage(origen, 0, 0);
  sc.globalCompositeOperation = 'lighter';
  sc.globalAlpha = fuerza;
  for (const r of [radio, radio * 2.5]) {
    sc.filter = `blur(${r}px)`;
    sc.drawImage(claro, 0, 0);
  }
  return salida;
}

function renderizar(escena, cam, anchoPx, altoPx = ALTO_PX) {
  renderer.setSize(anchoPx, altoPx, false);
  renderer.render(escena, cam);
  const c = document.createElement('canvas');
  c.width = anchoPx;
  c.height = altoPx;
  c.getContext('2d').drawImage(renderer.domElement, 0, 0);
  return c;
}

async function guardar(lienzo, nombre, calidad = 0.88) {
  const blob = await new Promise((r) => lienzo.toBlob(r, 'image/webp', calidad));
  await fetch(`http://127.0.0.1:5199/?nombre=${nombre}`, { method: 'POST', body: blob });
  const vista = document.createElement('img');
  vista.className = 'vista';
  vista.src = URL.createObjectURL(blob);
  vista.title = nombre;
  document.getElementById('vistas').append(vista);
  log(`✔ ${nombre} (${lienzo.width}×${lienzo.height}, ${Math.round(blob.size / 1024)} KB)`);
}

const aPx = (p, cam, anchoPx, altoPx = ALTO_PX) => {
  const v = p.clone().project(cam);
  return { x: ((v.x + 1) / 2) * anchoPx, y: ((1 - v.y) / 2) * altoPx };
};

// ───────── Nubes ─────────
function escenaNubes(anchoU) {
  const e = new THREE.Scene();
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, emissive: '#fff4ea', emissiveIntensity: 0.18 });
  const geo = new THREE.IcosahedronGeometry(1, 3);
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group();
    const cx = 2 + i * (anchoU / 14) + hash(i, 1) * 2;
    const v = 4.2 + hash(i, 2) * 2.3;
    const z = -40;
    g.position.set(cx, yPara(v, z), z);
    const n = 6 + Math.floor(hash(i, 3) * 6);
    const ancho = 2.2 + hash(i, 4) * 2.6;
    for (let k = 0; k < n; k++) {
      const s = new THREE.Mesh(geo, m);
      const r = 0.55 + hash(i, k + 10) * 0.7;
      s.scale.set(r * 1.25, r * 0.85, r);
      s.position.set((k / (n - 1) - 0.5) * ancho * 2, Math.sin((k / (n - 1)) * Math.PI) * 0.55 + hash(i, k) * 0.2, hash(i, k + 30) * 0.6);
      s.rotation.set(hash(i, k + 1) * 6, hash(i, k + 2) * 6, 0);
      g.add(s);
    }
    g.scale.setScalar(0.32 + hash(i, 5) * 0.22);
    e.add(g);
  }
  e.add(new THREE.HemisphereLight('#ffffff', '#b8a89a', 1.4));
  const s = new THREE.DirectionalLight('#ffe2c0', 2.4);
  s.position.set(-30, 30, 40);
  e.add(s);
  return e;
}

// ───────── Casas de canal de Liria (procedurales, low poly) ─────────
const PAREDES = ['#efe3c9', '#d98f6b', '#8fbfb2', '#e2b866', '#a9c3d6', '#e8cfc0', '#c7d9a8'];
const TECHOS = ['#8a3b2a', '#4c5f6e', '#6b4a2f', '#2f6f68', '#9a5a32'];
const cacheM = new Map();
const m = (color, extra = {}) => {
  const k = color + JSON.stringify(extra);
  if (!cacheM.has(k)) cacheM.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra }));
  return cacheM.get(k);
};
const caja = (w, h, d, material, x, y, z) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  return o;
};

function casa(w, pisos, i, noche) {
  const g = new THREE.Group();
  const d = 2.1;
  const alto = pisos * 1.35 + 0.25;
  const pared = m(PAREDES[Math.floor(hash(i, 1) * PAREDES.length)]);
  const techo = m(TECHOS[Math.floor(hash(i, 2) * TECHOS.length)]);
  const madera = m('#5a3f2a');
  const marco = m('#f7f1e4');
  g.add(caja(w, 0.25, d + 0.1, m('#b9ab90'), 0, 0.125, 0));
  g.add(caja(w, alto - 0.25, d, pared, 0, 0.25 + (alto - 0.25) / 2, 0));
  for (let p = 1; p <= pisos; p++) g.add(caja(w + 0.08, 0.08, d + 0.08, marco, 0, 0.25 + p * 1.35 - 0.04, 0));
  // Tejado a dos aguas con el hastial mirando al canal.
  const rh = 0.9 + hash(i, 3) * 0.7;
  const forma = new THREE.Shape([new THREE.Vector2(-w / 2 - 0.05, 0), new THREE.Vector2(w / 2 + 0.05, 0), new THREE.Vector2(0, rh)]);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  const hastial = new THREE.Mesh(geo, pared);
  hastial.position.y = alto;
  hastial.castShadow = hastial.receiveShadow = true;
  g.add(hastial);
  const lado = Math.hypot(w / 2 + 0.25, rh + 0.1);
  const ang = Math.atan2(rh + 0.1, w / 2 + 0.25);
  [-1, 1].forEach((sg) => {
    const f = caja(lado, 0.12, d + 0.42, techo, (sg * (w / 2 + 0.25)) / 2, alto + rh / 2 + 0.02, 0);
    f.rotation.z = -sg * ang;
    g.add(f);
  });
  const ojo = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 12), noche && hash(i, 4) > 0.3 ? m('#ffc66a', { emissive: '#ffb347', emissiveIntensity: 2.4 }) : m('#2b3c4c', { roughness: 0.3 }));
  ojo.rotation.x = Math.PI / 2;
  ojo.position.set(0, alto + rh * 0.36, d / 2 + 0.03);
  g.add(ojo);
  // Ventanas.
  const nv = Math.max(1, Math.floor((w - 0.4) / 0.95));
  const contraventana = m(['#2f6f68', '#3e5c46', '#8a3b2a', '#4c5f6e'][Math.floor(hash(i, 5) * 4)]);
  const conContra = hash(i, 6) > 0.45;
  const puerta = Math.floor(nv / 2);
  for (let p = 0; p < pisos; p++) {
    for (let k = 0; k < nv; k++) {
      if (p === 0 && k === puerta) continue;
      const x = (k - (nv - 1) / 2) * ((w - 0.4) / nv);
      const y = 0.25 + p * 1.35 + 0.72;
      const encendida = noche && hash(i * 7 + p, k) > 0.35;
      g.add(caja(0.52, 0.7, 0.06, marco, x, y, d / 2 + 0.02));
      g.add(caja(0.4, 0.58, 0.06, encendida ? m('#ffcf7a', { emissive: '#ffb347', emissiveIntensity: 2.2 }) : m('#2b3c4c', { roughness: 0.25, metalness: 0.2 }), x, y, d / 2 + 0.05));
      g.add(caja(0.42, 0.04, 0.06, marco, x, y, d / 2 + 0.07));
      if (conContra) [-1, 1].forEach((sg) => g.add(caja(0.18, 0.62, 0.05, contraventana, x + sg * 0.34, y, d / 2 + 0.05)));
      if (hash(i + p, k + 9) > 0.7) {
        g.add(caja(0.5, 0.14, 0.18, madera, x, y - 0.42, d / 2 + 0.12));
        const fl = instancia('nature/Flower_4_Group', { altura: 0.22 });
        fl.position.set(x, y - 0.36, d / 2 + 0.12);
        g.add(fl);
      }
    }
  }
  const px = (puerta - (nv - 1) / 2) * ((w - 0.4) / nv);
  g.add(caja(0.62, 1.02, 0.08, marco, px, 0.25 + 0.51, d / 2 + 0.02));
  g.add(caja(0.5, 0.94, 0.08, madera, px, 0.25 + 0.47, d / 2 + 0.05));
  g.add(caja(0.12, 0.16, 0.12, m('#ffcf7a', { emissive: '#ffb347', emissiveIntensity: noche ? 3 : 0.6 }), px + 0.45, 1.25, d / 2 + 0.12));
  if (hash(i, 8) > 0.35) g.add(caja(0.3, 0.8, 0.3, m('#9a8a74'), (hash(i, 9) - 0.5) * w * 0.5, alto + rh * 0.55, -0.3));
  return g;
}

// ───────── Lejos: mar, islas y el faro ─────────
function escenaLejos(anchoU, modo) {
  const e = new THREE.Scene();
  const cx = anchoU / 2;
  iluminar(e, modo, cx, anchoU);
  const noche = modo === NOCHE;
  const zHorizonte = -7;
  const zFondo = 11;
  const oceano = crearOceano({ tam: 10, segmentos: 2 });
  const geo = new THREE.PlaneGeometry(anchoU + 20, zFondo - zHorizonte, 300, 140);
  geo.rotateX(-Math.PI / 2);
  oceano.geometry.dispose();
  oceano.geometry = geo;
  oceano.position.set(cx, -0.5, (zFondo + zHorizonte) / 2);
  e.add(oceano);

  const verde = m(noche ? '#2c4034' : '#7a9a5a');
  const verde2 = m(noche ? '#25382d' : '#62844c');
  const roca = m(noche ? '#3b4048' : '#b8ab94');
  const ico = new THREE.IcosahedronGeometry(1, 1);
  const islas = [
    [3, 4.5, 1.3, 'casas'],
    [10.5, 3.2, 0.9, 'arboles'],
    [17, 6, 1.8, 'molino'],
    [25, 4, 1.1, 'casas'],
  ];
  islas.forEach(([x, w, h, tipo], i) => {
    const g = new THREE.Group();
    g.position.set(x, -0.6, zHorizonte - 1.6 - hash(i, 1) * 1.2);
    const base = new THREE.Mesh(ico, roca);
    base.scale.set(w, h * 0.5, 1.5);
    g.add(base);
    const cima = new THREE.Mesh(ico, i % 2 ? verde2 : verde);
    cima.scale.set(w * 0.86, h, 1.3);
    cima.position.y = h * 0.22;
    g.add(cima);
    for (let k = 0; k < Math.round(w * 1.1); k++) {
      const a = instancia(hash(i, k) > 0.5 ? 'nature/CommonTree_1' : 'nature/CommonTree_3', { altura: 0.8 + hash(i, k + 3) * 0.6 });
      a.position.set((hash(i, k + 7) - 0.5) * w * 1.4, h * 0.95 - Math.abs(hash(i, k + 7) - 0.5) * h * 0.9, hash(i, k + 9) - 0.6);
      g.add(a);
    }
    if (tipo === 'casas') {
      for (let k = 0; k < 3; k++) {
        const c = casa(1.6 + hash(i, k) * 0.8, 1 + Math.round(hash(i, k + 4)), i * 10 + k, noche);
        c.scale.setScalar(0.45);
        c.position.set((k - 1) * 1.0, h * 0.75, 0.4);
        g.add(c);
      }
    }
    if (tipo === 'molino') {
      const mo = instancia('town/windmill', { altura: 2.6 });
      mo.position.set(0.6, h * 1.05, 0);
      g.add(mo);
    }
    e.add(g);
  });
  // El faro en su isla, al final del recorrido.
  const isla = new THREE.Group();
  isla.position.set(anchoU - 5, -0.6, zHorizonte - 2);
  const ib = new THREE.Mesh(ico, roca);
  ib.scale.set(3.6, 1, 1.8);
  isla.add(ib);
  const ic = new THREE.Mesh(ico, verde);
  ic.scale.set(2.8, 0.7, 1.4);
  ic.position.y = 0.4;
  isla.add(ic);
  const faro = crearFaro(5.2);
  faro.position.y = 0.6;
  faro.scale.setScalar(0.7);
  isla.add(faro);
  e.add(isla);
  faro.userData.encender(noche ? 1 : 0, 0);
  faro.traverse((o) => {
    if (o.material?.uniforms?.uFuerza) o.material.uniforms.uFuerza.value = 0; // los haces van en CSS
    if (o.isPointLight) o.intensity = noche ? 25 : 0;
  });
  [
    ['watercraft/boat-sail-a', 6, -3, 1.8, 0.6],
    ['pirate/ship-small', 20, -5, 2.4, -0.4],
    ['watercraft/boat-fishing-small', 28, -1, 1.3, 2.4],
    ['watercraft/buoy-flag', 13, -2, 0.9, 0],
  ].forEach(([k, x, z, h, r]) => {
    const b = instancia(k, { altura: h });
    b.position.set(x, -0.5, z);
    b.rotation.y = r;
    e.add(b);
  });
  e.fog = new THREE.Fog(modo.agua.niebla, 64, 104);
  uAgua.uNieblaCerca.value = 64;
  uAgua.uNieblaLejos.value = 104;
  return { escena: e, faro };
}

// ───────── Medio: casas de canal y muelles ─────────
const MAPA_MEDIO = [
  '#########################wwww####',
  '##v######M#####v######A##wwww#L##',
  '#########################wwww####',
  'mmm####mmmmm####mmmm#####wwww##mm',
];
function escenaMedio(anchoU, modo, { soloPuente = false } = {}) {
  const e = new THREE.Scene();
  const cx = anchoU / 2;
  iluminar(e, modo, cx, anchoU);
  const noche = modo === NOCHE;
  const cols = MAPA_MEDIO[0].length;
  const filas = soloPuente ? MAPA_MEDIO.map((f, r) => [...f].map((ch) => (ch === 'w' && r === 2 ? 'B' : '.')).join('')) : MAPA_MEDIO;
  const n = construirNivel(filas, 'vestido', { malecon: false, orilla: !soloPuente });
  n.grupo.position.x = (cols * TILE) / 2 + 0.5;
  e.add(n.grupo);
  const gx = (c) => n.centro(c, 2).x + n.grupo.position.x;
  const hueco = [gx(25) - TILE / 2, gx(28) + TILE / 2];
  const zFila = (r) => n.centro(0, r).z;
  if (soloPuente) {
    n.puentes.B.desplegar(1);
    return { escena: e, hueco, zPies: zFila(2) };
  }
  n.anima(1.3);
  const base = n.piezas.A?.[0];
  if (base) {
    base.userData.anillo.material = mat('#ffb347', { emisivo: 2.4 });
    const celda = instancia('space/machine_barrel', { altura: 0.9, tinte: '#ffcf8a' });
    celda.position.copy(base.position).setY(0.85);
    n.grupo.add(celda);
  }
  // Hilera de casas sobre la primera fila.
  const tramosCasas = [
    [0.6, hueco[0] - 0.2],
    [hueco[1] + 0.2, anchoU + 2],
  ];
  let i = 0;
  for (const [x0, x1] of tramosCasas) {
    let x = x0;
    while (x < x1 - 1.6) {
      const w = Math.min(x1 - x, 2.3 + hash(i, 11) * 1.5);
      const pisos = 1 + Math.floor(hash(i, 12) * 2.6);
      const c = casa(w, pisos, i + 3, noche);
      c.position.set(x + w / 2, -0.04, zFila(0) - 0.15);
      e.add(c);
      x += w + 0.06;
      i++;
    }
  }
  // Vida en el muelle: puesto, fuente, faroles, barriles, cajas y flores.
  const poner = (clave, x, r, { altura, rot = 0, dz = 0 } = {}) => {
    const o = instancia(clave, { altura });
    o.position.set(x, -0.1, zFila(r) + dz);
    o.rotation.y = rot;
    e.add(o);
    return o;
  };
  poner('town/stall-green', gx(18), 1, { altura: 1.9 });
  const fuente = instancia('town/fountain-round', { ancho: 1.7 });
  fuente.position.set(gx(12), -0.1, zFila(1));
  e.add(fuente);
  [5, 20, 31].forEach((c) => poner('town/lantern', gx(c) + 0.7, 3, { altura: 1.8, dz: 0.6 }));
  [
    [4, 'pirate/barrel'],
    [4.4, 'pirate/barrel'],
    [11, 'pirate/crate'],
    [11.5, 'pirate/crate-bottles'],
    [23.5, 'pirate/crate'],
    [32, 'pirate/barrel'],
    [17, 'pirate/chest'],
  ].forEach(([c, k], j) => poner(k, gx(0) + c * 2 - 0.4, 1, { altura: k.includes('chest') ? 0.45 : 0.55, rot: hash(j, 3) * 6, dz: 0.5 }));
  [7, 14, 26].forEach((c) => poner('nature/Bush_Common_Flowers', gx(c), 1, { altura: 0.7, dz: -0.6 }));
  if (noche) {
    const luces = [];
    MAPA_MEDIO.forEach((f, r) => [...f].forEach((ch, c) => ch === 'v' && luces.push(n.centro(c, r).add(n.grupo.position).add(new THREE.Vector3(0.65, 1.4, -0.6)))));
    [5, 20, 31].forEach((c) => luces.push(new THREE.Vector3(gx(c) + 0.7, 1.5, zFila(3) + 0.6)));
    luces.forEach((p) => {
      const l = new THREE.PointLight('#ffb35a', 7, 7, 1.6);
      l.position.copy(p);
      e.add(l);
    });
  }
  // Barcas amarradas delante del muelle.
  [
    ['pirate/boat-row-small', 7, 0.55, 1.6],
    ['pirate/boat-row-large', 21, 0.7, 1.5],
    ['watercraft/boat-fishing-small', 39, 1.1, -1.6],
    ['watercraft/buoy', 30, 0.6, 0],
  ].forEach(([k, x, h, r]) => {
    const b = instancia(k, { altura: h });
    b.position.set(x, -0.5, zFila(3) + 2.4);
    b.rotation.y = r;
    e.add(b);
  });
  return { escena: e, hueco, zPies: zFila(2) };
}

// ───────── Frente: juncos, helechos y pilotes ─────────
function escenaFrente(anchoU, modo) {
  const e = new THREE.Scene();
  const cx = anchoU / 2;
  iluminar(e, modo, cx, anchoU);
  const plantas = ['nature/Grass_Common_Tall', 'nature/Grass_Wispy_Tall', 'nature/Fern_1', 'nature/Plant_1_Big', 'nature/Bush_Common'];
  for (let i = 0; i < 80; i++) {
    const x = (i / 80) * anchoU + (hash(i, 1) - 0.5) * 2;
    const z = 7 + hash(i, 2) * 3;
    const tipo = hash(i, 3);
    let o;
    if (tipo < 0.1) o = instancia('town/pillar-wood', { altura: 3.6 + hash(i, 4) * 2, tinte: '#6b5240' });
    else if (tipo < 0.24) o = instancia(hash(i, 5) > 0.5 ? 'nature/Rock_Medium_1' : 'nature/Rock_Medium_2', { altura: 1.2 + hash(i, 6) * 1.4, tinte: '#cfc6b4' });
    else o = instancia(plantas[Math.floor(hash(i, 7) * plantas.length)], { altura: 1.8 + hash(i, 8) * 2.4 });
    o.position.set(x, -2.1 - hash(i, 9) * 0.5, z);
    o.rotation.y = hash(i, 10) * 6;
    e.add(o);
  }
  return e;
}

// ───────── Nilo caminando ─────────
async function hojaNilo(modo, cuadros = 16) {
  const e = new THREE.Scene();
  iluminar(e, modo, 0, 6);
  const nilo = crearNilo({ altura: 2.2, bateria: true });
  nilo.grupo.rotation.y = Math.PI / 2 - 0.45;
  e.add(nilo.grupo);
  const accion = nilo.reproducir('Walking', { fundido: 0 });
  const dur = accion.getClip().duration;
  const lado = 3.4;
  const pxCuadro = Math.round(lado * PXU);
  const cam = camara(lado, 0, { alto: lado, objY: 1.1 });
  const hoja = document.createElement('canvas');
  hoja.width = pxCuadro * cuadros;
  hoja.height = pxCuadro;
  const ctx = hoja.getContext('2d');
  for (let i = 0; i < cuadros; i++) {
    nilo.mixer.setTime((dur * i) / cuadros);
    nilo.actualizar(0, i * 0.12);
    const c = renderizar(e, cam, pxCuadro, pxCuadro);
    ctx.drawImage(modo === NOCHE ? brillo(c, { umbral: 220, radio: 6 }) : c, i * pxCuadro, 0);
  }
  const pies = aPx(new THREE.Vector3(0, 0, 0), cam, pxCuadro, pxCuadro).y / pxCuadro;
  return { hoja, pxCuadro, pies };
}

// ───────── Orquestación ─────────
async function main() {
  log('Cargando modelos…');
  await cargarTodo();
  uViento.tiempo.value = 1.3;
  uAgua.uTiempo.value = 7.5;
  const meta = { altoPx: ALTO_PX, capas: {} };

  const anchos = { nubes: 3400, lejos: 3200, medio: 5600, frente: 7200 };
  const U = (px) => px / PXU;

  {
    const anchoU = U(anchos.nubes);
    const c = renderizar(escenaNubes(anchoU), camara(anchoU, anchoU / 2), anchos.nubes);
    await guardar(c, 'nubes.webp', 0.85);
    meta.capas.nubes = { ancho: anchos.nubes };
  }
  for (const [modo, sufijo] of [
    [DIA, 'dia'],
    [NOCHE, 'noche'],
  ]) {
    const anchoUL = U(anchos.lejos);
    const camL = camara(anchoUL, anchoUL / 2);
    const lejos = escenaLejos(anchoUL, modo);
    let c = renderizar(lejos.escena, camL, anchos.lejos);
    if (modo === NOCHE) c = brillo(c, { umbral: 225, radio: 10 });
    await guardar(c, `lejos-${sufijo}.webp`);
    const lampara = new THREE.Vector3();
    lejos.faro.getWorldPosition(lampara);
    lampara.y += 5.2 * 0.7 * 0.72 + 0.6;
    meta.capas.lejos = { ancho: anchos.lejos, faro: aPx(lampara, camL, anchos.lejos) };

    const anchoUM = U(anchos.medio);
    const camM = camara(anchoUM, anchoUM / 2);
    const medio = escenaMedio(anchoUM, modo);
    c = brillo(renderizar(medio.escena, camM, anchos.medio), { umbral: modo === NOCHE ? 215 : 245, radio: 12, fuerza: modo === NOCHE ? 1 : 0.6 });
    await guardar(c, `medio-${sufijo}.webp`);
    meta.capas.medio = {
      ancho: anchos.medio,
      hueco: [aPx(new THREE.Vector3(medio.hueco[0], 0, 0), camM, anchos.medio).x, aPx(new THREE.Vector3(medio.hueco[1], 0, 0), camM, anchos.medio).x],
      piesY: aPx(new THREE.Vector3(0, 0, medio.zPies), camM, anchos.medio).y / ALTO_PX,
    };

    const anchoUF = U(anchos.frente);
    c = renderizar(escenaFrente(anchoUF, modo), camara(anchoUF, anchoUF / 2), anchos.frente);
    await guardar(c, `frente-${sufijo}.webp`, 0.85);
    meta.capas.frente = { ancho: anchos.frente };

    const nilo = await hojaNilo(modo);
    await guardar(nilo.hoja, `nilo-${sufijo}.webp`, 0.9);
    meta.nilo = { cuadros: 16, px: nilo.pxCuadro, pies: nilo.pies };
  }
  {
    const anchoUM = U(anchos.medio);
    const puente = escenaMedio(anchoUM, DIA, { soloPuente: true });
    const c = brillo(renderizar(puente.escena, camara(anchoUM, anchoUM / 2), anchos.medio), { umbral: 230, radio: 10 });
    await guardar(c, 'puente.webp');
  }
  await fetch('http://127.0.0.1:5199/?nombre=relato.json', { method: 'POST', body: JSON.stringify(meta, null, 2) });
  log(`✔ relato.json\n${JSON.stringify(meta, null, 2)}\nListo.`);
  window.__listo = true;
}

main().catch((e) => {
  log(`✖ ${e.stack || e}`);
  window.__error = String(e);
});
