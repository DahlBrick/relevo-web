import * as THREE from 'three';
import { CAPITULOS } from './capitulos.js';
import { PALETA } from './paleta.js';
import { MAPAS, TILE, construirNivel, pieza, mat, halo, hash, crearCaja, crearMaia } from './diorama.js';
import { instancia, pezClonado, clipsDe, teñir } from './assets.js';
import { crearNilo, crearNiloPrimitivo } from './nilo.js';
import { crearMarco, panelHUD } from './marcos.js';
import { crearParticulas, crearHumo, barca, flotador } from './vida.js';
import { crearLava, uAgua } from './agua.js';

// Cada capítulo de la bitácora es una estación del mundo. T = índice de capítulo + fracción
// recorrida de su sección; las animaciones narrativas (bloques que suben, puentes que se
// despliegan, Nilo que se apaga) están atadas a T, así que avanzan y retroceden con la rueda.

export const CENTROS = {
  1: new THREE.Vector3(0, 0, 0),
  2: new THREE.Vector3(40, 0, -50),
  3: new THREE.Vector3(0, 0, -100),
  4: new THREE.Vector3(-42, 0, -150),
  5: new THREE.Vector3(0, 0, -205),
  6: new THREE.Vector3(42, 0, -255),
  7: new THREE.Vector3(0, 0, -310),
  8: new THREE.Vector3(-44, 0, -365),
  9: new THREE.Vector3(0, 0, -435),
  10: new THREE.Vector3(0, 0, -505),
};
export const CIENAGA = new THREE.Vector3(-36, 0, -428);
export const MAREAS = new THREE.Vector3(0, 0, -446);
export const FORJA = new THREE.Vector3(36, 0, -428);

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const tramo = (T, a, b) => clamp01((T - a) / (b - a));
const suave = (x) => x * x * (3 - 2 * x);

/** Marcos de capturas de un capítulo, colocados alrededor de su estación. */
function marcosDe(i, grupo, colocaciones) {
  const galeria = CAPITULOS[i].galeria;
  return colocaciones.map(({ g, x, z, rot = 0, ancho = 7, y = -0.35 }) => {
    const item = galeria[g];
    const m = crearMarco({ src: item.src, video: item.video, pie: item.pie, ancho });
    m.position.set(x, y, z);
    m.rotation.y = rot;
    grupo.add(m);
    return m;
  });
}

function estacion(i, construir) {
  const grupo = new THREE.Group();
  grupo.position.copy(CENTROS[i]);
  const e = { i, grupo, marcos: [], actualizadores: [], visibleDesde: i - 1.4, visibleHasta: i + 1.6 };
  construir(e, grupo);
  return e;
}

// ───────── 1 · Godot 2D ─────────
function etapa1() {
  return estacion(1, (e, g) => {
    const tex = new THREE.TextureLoader().load(import.meta.env.BASE_URL + 'img/godot_mapa.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    const ancho = 38;
    const largo = (ancho * 494) / 908;
    const papel = new THREE.MeshStandardMaterial({ color: '#efe6cf', roughness: 0.95 });
    const tapa = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const hoja = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.5, largo), [papel, papel, tapa, papel, papel, papel]);
    hoja.position.y = -0.1;
    hoja.receiveShadow = true;
    hoja.castShadow = true;
    g.add(hoja);

    // Los cuadrados funcionales del prototipo: al final de la etapa se extruyen hacia el 3D.
    const cuadros = [
      { u: 0.015, v: 0.38, color: '#8c8c8c', alto: 1.6 },
      { u: 0.372, v: 0.35, color: '#ffffff', alto: 1.0 },
      { u: 0.758, v: 0.37, color: '#d936d9', alto: 1.2 },
      { u: 0.976, v: 0.355, color: '#2fd0c0', alto: 2.2 },
      { u: 0.546, v: 0.76, color: '#e7a35d', alto: 0.8 },
    ].map((c, k) => {
      const m = pieza('caja', mat(c.color, { emisivo: 0.25 }), { esc: [1.1, 1, 1.1] });
      m.position.set((c.u - 0.5) * ancho, 0.15, (c.v - 0.5) * largo);
      m.userData = { ...c, k };
      g.add(m);
      return m;
    });
    e.actualizadores.push((T, t) => {
      cuadros.forEach((m) => {
        const f = suave(tramo(T, 1.5 + m.userData.k * 0.05, 1.9 + m.userData.k * 0.05));
        const alto = 0.02 + f * m.userData.alto;
        m.scale.y = alto;
        m.position.y = 0.15 + alto / 2 + Math.sin(t * 2 + m.userData.k) * 0.08 * f;
        m.rotation.y = f * Math.sin(t * 0.6 + m.userData.k) * 0.3;
      });
    });
    e.marcos = marcosDe(1, g, [
      { g: 1, x: -16, z: -17, rot: 0.35, ancho: 9 },
      { g: 2, x: 15, z: -17, rot: -0.35, ancho: 9 },
    ]);
  });
}

// ───────── 2 · Graybox ─────────
function etapa2() {
  return estacion(2, (e, g) => {
    const n = construirNivel(MAPAS.nivel1, 'graybox');
    g.add(n.grupo);
    const piezas = Object.values(n.piezas).flat();
    e.actualizadores.push((T) => {
      n.bloques.forEach((b) => {
        const f = suave(tramo(T, 1.7 + b.userData.retraso * 0.45, 2.05 + b.userData.retraso * 0.45));
        b.position.y = -2.4 * (1 - f);
        b.visible = f > 0.01;
      });
      const fp = suave(tramo(T, 2.25, 2.45));
      piezas.forEach((p) => {
        p.scale.setScalar(Math.max(0.001, fp));
        p.visible = fp > 0.01;
      });
      n.puentes.B?.desplegar(tramo(T, 2.45, 2.7));
      n.puentes.P?.desplegar(tramo(T, 2.6, 2.85));
    });
    e.marcos = marcosDe(2, g, [
      { g: 0, x: -20, z: -6, rot: 0.6, ancho: 8 },
      { g: 1, x: -6, z: -18, rot: 0.15, ancho: 8 },
      { g: 3, x: 13, z: -16, rot: -0.35, ancho: 8 },
    ]);
  });
}

// ───────── 3 · Construcción visual (primitivas) ─────────
function cicloNivel1(n, e, T0, animables) {
  // Batería: de su sitio a la base A, el puente B se despliega, palanca, pasarela P, salida.
  const bat = n.piezas.Y?.[0];
  const base = n.piezas.A?.[0];
  const origen = bat?.position.clone();
  e.actualizadores.push((T) => {
    if (bat && base) {
      const f = suave(tramo(T, T0, T0 + 0.12));
      bat.position.lerpVectors(origen, base.position, f);
      bat.position.y = origen.y + Math.sin(f * Math.PI) * 1.4 + f * 0.85;
      const enBase = f > 0.99;
      base.userData.anillo.material = mat(enBase ? PALETA.ambar : PALETA.turquesa, { emisivo: enBase ? 2.2 : 1.6 });
    }
    n.puentes.B?.desplegar(tramo(T, T0 + 0.12, T0 + 0.35));
    const lev = n.piezas.L?.[0];
    if (lev) lev.userData.barra.rotation.z = 0.6 - 1.2 * suave(tramo(T, T0 + 0.33, T0 + 0.4));
    n.puentes.P?.desplegar(tramo(T, T0 + 0.4, T0 + 0.6));
    const salida = n.piezas.E?.[0];
    if (salida) salida.userData.umbral.material.emissiveIntensity = 0.6 + 2 * tramo(T, T0 + 0.55, T0 + 0.65);
  });
}

function etapa3() {
  return estacion(3, (e, g) => {
    const animables = [];
    const n = construirNivel(MAPAS.nivel1, 'primitivo', { tinteOrilla: '#3a9f92' });
    g.add(n.grupo);
    const nilo = crearNiloPrimitivo(animables);
    nilo.position.copy(n.marcadores.N[0]);
    nilo.rotation.y = 0.6;
    g.add(nilo);
    cicloNivel1(n, e, 3.3, animables);
    e.actualizadores.push((T, t) => {
      n.anima(t);
      animables.forEach((a) => a(t));
    });
    e.marcos = marcosDe(3, g, [
      { g: 0, x: -21, z: -4, rot: 0.7, ancho: 7.5 },
      { g: 2, x: 2, z: -17, rot: 0, ancho: 8 },
      { g: 5, x: 21, z: -5, rot: -0.7, ancho: 7.5 },
    ]);
  });
}

// ───────── 4 · Patio de Bombas (diseño) ─────────
function etapa4() {
  return estacion(4, (e, g) => {
    const n = construirNivel(MAPAS.nivel2, 'primitivo', { tinteOrilla: '#3a9f92' });
    g.add(n.grupo);
    const animables = [];
    const nilo = crearNiloPrimitivo(animables);
    nilo.position.copy(n.marcadores.N[0]);
    g.add(nilo);
    // Las cajas y placas son de la Etapa 8: aquí se esconden para mostrar el diseño original.
    ['k', 'o', 'u', 'g'].forEach((k) => n.piezas[k]?.forEach((p) => (p.visible = false)));
    e.actualizadores.push((T, t) => {
      n.anima(t);
      animables.forEach((a) => a(t));
      n.puentes.B?.desplegar(tramo(T, 4.25, 4.4));
      n.puentes.P?.desplegar(tramo(T, 4.4, 4.55));
      n.puentes.C?.desplegar(tramo(T, 4.55, 4.7));
      n.puentes.R?.desplegar(tramo(T, 4.7, 4.85));
      const [a, d] = [n.piezas.A?.[0], n.piezas.D?.[0]];
      const enD = T > 4.55;
      if (a) a.userData.anillo.material = mat(!enD && T > 4.25 ? PALETA.ambar : PALETA.turquesa, { emisivo: 2 });
      if (d) d.userData.anillo.material = mat(enD ? PALETA.ambar : PALETA.turquesa, { emisivo: 2 });
    });
    e.marcos = marcosDe(4, g, [
      { g: 0, x: -22, z: -8, rot: 0.6, ancho: 9 },
      { g: 1, x: 22, z: -8, rot: -0.6, ancho: 9 },
    ]);
  });
}

// ───────── 5 · Faro de Liria ─────────
export function crearFaro(altura = 11) {
  // Faro de Liria: torre troncocónica a franjas crema y cobre, galería, cristalera con la lámpara,
  // cúpula de cobre y el aro de luz que el juego usa en las piezas importantes.
  const g = new THREE.Group();
  const cuerpo = altura * 0.72;
  const franjas = 6;
  for (let k = 0; k < franjas; k++) {
    const y0 = (k / franjas) * cuerpo;
    const h = cuerpo / franjas;
    const r0 = THREE.MathUtils.lerp(1.6, 1.05, k / franjas);
    const r1 = THREE.MathUtils.lerp(1.6, 1.05, (k + 1) / franjas);
    const tramoTorre = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 20), mat(k % 2 ? '#a5552f' : PALETA.niloCarcasa, { rugosidad: 0.75 }));
    tramoTorre.position.y = y0 + h / 2;
    tramoTorre.castShadow = tramoTorre.receiveShadow = true;
    g.add(tramoTorre);
  }
  g.add(pieza('hex', mat(PALETA.piedraBorde), { pos: [0, 0.2, 0], esc: [2.2, 0.5, 2.2] }));
  g.add(pieza('cil', mat('#3b2a20'), { pos: [0, cuerpo + 0.1, 0], esc: [1.55, 0.2, 1.55] }));
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    g.add(pieza('cil', mat('#3b2a20'), { pos: [Math.cos(a) * 1.45, cuerpo + 0.45, Math.sin(a) * 1.45], esc: [0.035, 0.6, 0.035] }));
  }
  g.add(pieza('aro', mat('#3b2a20'), { pos: [0, cuerpo + 0.75, 0], esc: [1.45, 1.45, 0.6], rot: [Math.PI / 2, 0, 0] }));
  const cristal = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe8e6', transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide }));
  cristal.position.y = cuerpo + 0.85;
  g.add(cristal);
  const lampara = pieza('esfera', mat('#fff2c8'), { pos: [0, cuerpo + 0.85, 0], esc: [0.45, 0.45, 0.45], sombra: false });
  lampara.material = lampara.material.clone();
  g.add(lampara);
  const cupula = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.1, 20), mat('#b5793f', { metal: 0.6, rugosidad: 0.35 }));
  cupula.position.y = cuerpo + 2.05;
  cupula.castShadow = true;
  g.add(cupula);
  g.add(pieza('cil', mat('#3b2a20'), { pos: [0, cuerpo + 2.9, 0], esc: [0.04, 0.8, 0.04] }));
  const aro = halo(PALETA.ambar, 0.9);
  aro.position.y = cuerpo + 3.4;
  g.add(aro);
  const luz = new THREE.PointLight('#ffcf7a', 0, 40, 1.6);
  luz.position.set(0, cuerpo + 0.85, 0);
  g.add(luz);
  const haz = new THREE.Group();
  haz.position.y = cuerpo + 0.85;
  const matHaz = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uFuerza: { value: 0 }, uColor: { value: new THREE.Color('#ffd98a') } },
    vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float uFuerza; uniform vec3 uColor; varying float vY; void main(){ gl_FragColor = vec4(uColor, pow(vY, 2.4) * 0.3 * uFuerza); }',
  });
  [0, Math.PI].forEach((a) => {
    const cono = new THREE.Mesh(new THREE.ConeGeometry(3.4, 36, 24, 1, true), matHaz);
    cono.rotation.z = Math.PI / 2;
    cono.position.x = 18;
    const brazo = new THREE.Group();
    brazo.rotation.y = a;
    brazo.add(cono);
    haz.add(brazo);
  });
  g.add(haz);
  g.userData.encender = (f, t) => {
    lampara.material.emissive.set('#ffd98a');
    lampara.material.emissiveIntensity = 0.2 + f * 7;
    luz.intensity = f * 70;
    matHaz.uniforms.uFuerza.value = f;
    haz.rotation.y = t * 0.6;
    aro.visible = f > 0.05;
    aro.userData.anima(t);
  };
  return g;
}

function etapa5() {
  return estacion(5, (e, g) => {
    const n = construirNivel(MAPAS.nivel3, 'primitivo', { tinteOrilla: '#3a9f92' });
    g.add(n.grupo);
    const faro = crearFaro(11);
    faro.position.copy(n.marcadores.E[0]);
    n.piezas.E?.forEach((p) => (p.visible = false));
    g.add(faro);
    const animables = [];
    const nilo = crearNiloPrimitivo(animables);
    nilo.position.copy(n.marcadores.N[0]);
    g.add(nilo);
    // Al encenderse el faro, los primeros botes cruzan el canal.
    const botes = [0, 1].map((k) => {
      const b = instancia(k ? 'pirate/boat-row-small' : 'watercraft/boat-fishing-small', { altura: 1.3 });
      b.position.set(k ? 15 : -15, -0.45, 20);
      g.add(b);
      return b;
    });
    e.actualizadores.push((T, t) => {
      n.anima(t);
      animables.forEach((a) => a(t));
      n.puentes.C?.desplegar(tramo(T, 5.2, 5.32));
      n.puentes.Q?.desplegar(tramo(T, 5.32, 5.45));
      const f = suave(tramo(T, 5.45, 5.62));
      faro.userData.encender(f, t);
      botes.forEach((b, k) => {
        const viaje = tramo(T, 5.55 + k * 0.06, 5.98);
        b.position.z = 22 - viaje * 50 + k * 6;
        b.position.y = -0.45 + Math.sin(t * 1.4 + k) * 0.08;
        b.rotation.y = Math.PI;
        b.visible = viaje > 0 && viaje < 1;
      });
    });
    e.marcos = marcosDe(5, g, [
      { g: 0, x: -21, z: -6, rot: 0.6, ancho: 8.5 },
      { g: 1, x: 21, z: 4, rot: -0.9, ancho: 8.5 },
    ]);
  });
}

// ───────── 6 · Interfaz ─────────
function etapa6() {
  return estacion(6, (e, g) => {
    const animables = [];
    // Escenario hexagonal de piedra con Nilo y Maia.
    g.add(pieza('hex', mat(PALETA.piedraBorde), { pos: [0, -0.9, 0], esc: [7, 1.8, 7] }));
    g.add(pieza('hex', mat(PALETA.piedraCrema), { pos: [0, 0.02, 0], esc: [6.6, 0.12, 6.6] }));
    const aro = pieza('aro', mat(PALETA.turquesa, { emisivo: 1.4 }), { pos: [0, 0.1, 0], esc: [6.7, 6.7, 6.7], rot: [Math.PI / 2, 0, 0], sombra: false });
    g.add(aro);
    const nilo = crearNiloPrimitivo(animables);
    nilo.position.set(-1.2, 0.08, 0.6);
    nilo.rotation.y = 0.3;
    g.add(nilo);
    const maia = crearMaia(false, animables);
    maia.position.set(1.6, 0.08, -0.6);
    maia.rotation.y = -0.4;
    g.add(maia);

    const paneles = [
      { titulo: 'NIVEL 1 · MUELLE DE COBRE', linea: 'Recoge la batería y colócala en una base.', ancho: 6.4, alto: 1.4, pos: [-7, 6.2, -2], rot: 0.3 },
      { titulo: 'RECUERDOS', linea: 'La barquera', valor: '1 / 1', ancho: 4, alto: 1.3, pos: [7.4, 5.2, -1], rot: -0.35 },
      { titulo: 'BATERÍA', linea: 'En manos de Nilo', ancho: 4, alto: 1.3, pos: [7.8, 3.4, 0.8], rot: -0.45, acento: PALETA.turquesa },
      { titulo: 'Hablar con Maia', linea: 'Pide una pista cuando quieras', tecla: 'E', ancho: 5.6, alto: 1.4, pos: [0, 4.6, 3.6], rot: 0 },
      { titulo: 'PAUSA', linea: 'Reanudar · Pista · Reiniciar', ancho: 4.6, alto: 1.4, pos: [-7.8, 3.2, 1.2], rot: 0.5, acento: PALETA.ambar },
    ].map((p, k) => {
      const m = panelHUD(p);
      m.position.set(...p.pos);
      m.rotation.y = p.rot;
      m.userData.base = m.position.clone();
      m.userData.k = k;
      g.add(m);
      return m;
    });
    e.actualizadores.push((T, t) => {
      animables.forEach((a) => a(t));
      aro.rotation.z = t * 0.2;
      paneles.forEach((m) => {
        const f = suave(tramo(T, 5.85 + m.userData.k * 0.06, 6.15 + m.userData.k * 0.06));
        m.visible = f > 0.01;
        m.scale.set(f, 0.2 + 0.8 * f, 1);
        m.position.copy(m.userData.base);
        m.position.y += Math.sin(t * 0.9 + m.userData.k) * 0.15 - (1 - f) * 2;
      });
    });
    e.marcos = marcosDe(6, g, [
      { g: 0, x: -14, z: -9, rot: 0.55, ancho: 8 },
      { g: 1, x: -4.6, z: -14, rot: 0.18, ancho: 8 },
      { g: 2, x: 5.4, z: -14, rot: -0.18, ancho: 8 },
      { g: 3, x: 15, z: -9, rot: -0.55, ancho: 8 },
    ]);
  });
}

// ───────── 7 · Mejora gráfica: el mundo vestido ─────────
function caminar(nilo, puntos, velocidad = 1.25) {
  // Recorrido en bucle por una lista de puntos, con giro suave hacia la marcha.
  const largos = [];
  let total = 0;
  for (let k = 0; k < puntos.length; k++) {
    const l = puntos[k].distanceTo(puntos[(k + 1) % puntos.length]);
    largos.push(l);
    total += l;
  }
  const dir = new THREE.Vector3();
  return (t) => {
    let d = (t * velocidad) % total;
    let k = 0;
    while (d > largos[k]) d -= largos[k++];
    const a = puntos[k];
    const b = puntos[(k + 1) % puntos.length];
    nilo.grupo.position.lerpVectors(a, b, d / largos[k]);
    dir.subVectors(b, a);
    const objetivo = Math.atan2(dir.x, dir.z);
    let delta = objetivo - nilo.grupo.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    nilo.grupo.rotation.y += delta * 0.08;
  };
}

// Planos de seguimiento: durante [a, c] la cámara se engancha a un personaje (máximo en b).
export const FOCOS = [];

function etapa7(vivos) {
  return estacion(7, (e, g) => {
    const n = construirNivel(MAPAS.nivel1, 'vestido');
    g.add(n.grupo);
    n.puentes.B.desplegar(1);
    n.puentes.P.desplegar(1);
    const base = n.piezas.A[0];
    base.userData.anillo.material = mat(PALETA.ambar, { emisivo: 2.2 });
    n.piezas.Y?.forEach((p) => (p.visible = false));

    const nilo = crearNilo({ bateria: true });
    g.add(nilo.grupo);
    nilo.reproducir('Walking');
    const c = n.centro;
    const ruta = [c(3, 4), c(10.6, 4), c(11, 3.3), c(10.6, 4)].map((p) => p.setY(0));
    const andar = caminar(nilo, ruta, 1.2);
    vivos.push(nilo);
    FOCOS.push({ a: 7.3, b: 7.5, c: 7.7, objeto: nilo.grupo, desplaz: new THREE.Vector3(1.9, 1.6, 4.2), altura: 1.05 });

    // Barcas y boyas que se mecen, como en Flotador.cs.
    const flot = [
      barca('pirate/boat-row-small', new THREE.Vector3(-17, -0.45, 6), 0.6),
      barca('watercraft/boat-fishing-small', new THREE.Vector3(18, -0.45, -6), -1.1, 1.6),
      barca('watercraft/boat-sail-a', new THREE.Vector3(-22, -0.5, -10), 0.3, 3.2),
      barca('watercraft/buoy-flag', new THREE.Vector3(12, -0.5, 10), 0, 1.2),
      barca('watercraft/buoy', new THREE.Vector3(-9, -0.5, 12), 0, 0.8),
    ];
    flot.forEach((b) => g.add(b));
    g.add(crearParticulas({ centro: new THREE.Vector3(0, 0.4, 0), cantidad: 260, caja: [34, 6, 26], color: '#ffe3a3', tam: 0.09, intensidad: 1.2 }));

    e.actualizadores.push((T, t, dt) => {
      n.anima(t);
      andar(t);
      nilo.actualizar(dt, t);
      flot.forEach((b) => b.userData.actualizar(t));
    });
    e.marcos = marcosDe(7, g, [
      { g: 0, x: -22, z: -3, rot: 0.75, ancho: 8 },
      { g: 2, x: -10, z: -18, rot: 0.25, ancho: 8 },
      { g: 4, x: 8, z: -18, rot: -0.2, ancho: 8 },
      { g: 9, x: 22, z: -4, rot: -0.75, ancho: 8.5 },
    ]);
  });
}

// ───────── 8 · Mecánicas: reserva, cajas, apagado ─────────
function etapa8(vivos) {
  return estacion(8, (e, g) => {
    const n = construirNivel(MAPAS.nivel2, 'vestido');
    g.add(n.grupo);
    const c = n.centro;
    n.puentes.B.desplegar(1);
    n.puentes.P.desplegar(1);
    n.puentes.C.desplegar(0);
    n.piezas.Y?.forEach((p) => (p.visible = false));
    const [baseA, baseD] = [n.piezas.A[0], n.piezas.D[0]];
    baseD.userData.anillo.material = mat(PALETA.ambar, { emisivo: 2.2 });
    // Batería en la base D, con su zona segura (aro ámbar discontinuo que gira).
    const celda = instancia('space/machine_barrel', { altura: 0.9, tinte: '#ffcf8a' });
    celda.position.copy(baseD.position).setY(0.85);
    g.add(celda);
    const zona = new THREE.Group();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      zona.add(pieza('caja', mat(PALETA.ambar, { emisivo: 1.6 }), { pos: [Math.cos(a) * 3, 0.06, Math.sin(a) * 3], esc: [0.7, 0.04, 0.16], rot: [0, -a + Math.PI / 2, 0], sombra: false }));
    }
    zona.position.copy(baseD.position).setY(0);
    g.add(zona);

    // Cajas sobre placas: este (k → u, dos casillas al sur) y oeste (k → o, a la izquierda).
    const cajaEste = n.piezas.k.find((p) => p.position.x > 0);
    const cajaOeste = n.piezas.k.find((p) => p.position.x < 0);
    const placaU = n.piezas.u[0];
    const placaO = n.piezas.o[0];
    const compuerta = n.piezas.g[0];
    const iniE = cajaEste.position.clone();
    const iniO = cajaOeste.position.clone();

    // Nilo, que se queda sin reserva lejos de la batería.
    const nilo = crearNilo();
    g.add(nilo.grupo);
    nilo.reproducir('Walking');
    const puntoApagado = c(13, 7).setY(0);
    const desde = c(11, 2).setY(0);
    const humo = crearHumo(new THREE.Vector3());
    humo.visible = false;
    g.add(humo);
    vivos.push(nilo);
    FOCOS.push({ a: 8.4, b: 8.6, c: 8.8, objeto: nilo.grupo, desplaz: new THREE.Vector3(1.2, 1.5, 3.6), altura: 0.9 });

    g.add(crearParticulas({ centro: new THREE.Vector3(0, 0.4, 0), cantidad: 220, caja: [34, 6, 30], color: '#ffe3a3', tam: 0.09, intensidad: 1.1 }));

    e.actualizadores.push((T, t, dt) => {
      n.anima(t);
      zona.rotation.y = t * 0.4;
      // Oeste: caja a la placa, la compuerta baja.
      const fo = suave(tramo(T, 7.95, 8.12));
      cajaOeste.position.lerpVectors(iniO, placaO.position, fo);
      const pisadaO = fo > 0.98;
      placaO.userData.rombo.material = mat(PALETA.turquesa, { emisivo: pisadaO ? 2.4 : 0.4 });
      compuerta.userData.barrotes.position.y = -1.5 * suave(tramo(T, 8.1, 8.2));
      // Este: dos casillas hasta su placa y se despliega el puente R.
      const fe = suave(tramo(T, 8.12, 8.3));
      cajaEste.position.lerpVectors(iniE, placaU.position, fe);
      placaU.userData.rombo.material = mat(PALETA.turquesa, { emisivo: fe > 0.98 ? 2.4 : 0.4 });
      n.puentes.R.desplegar(tramo(T, 8.28, 8.42));
      n.puentes.C.desplegar(tramo(T, 7.9, 8.05));

      // Nilo camina hacia el sureste; la reserva baja casilla a casilla y se apaga.
      const fc = tramo(T, 8.3, 8.5);
      const energia = 1 - tramo(T, 8.3, 8.56);
      const apagado = suave(tramo(T, 8.56, 8.7));
      nilo.grupo.position.lerpVectors(desde, puntoApagado, fc);
      const dir = Math.atan2(puntoApagado.x - desde.x, puntoApagado.z - desde.z);
      nilo.grupo.rotation.y = fc > 0.99 ? dir + 0.5 * apagado : dir;
      if (fc > 0.001 && fc < 0.999) nilo.reproducir('Walking');
      else nilo.reproducir('Idle');
      nilo.energia = energia;
      nilo.apagado = apagado;
      nilo.actualizar(dt, t);
      humo.visible = apagado > 0.2;
      humo.position.copy(nilo.grupo.position).setY(1.9);
    });
    e.marcos = marcosDe(8, g, [
      { g: 1, x: -24, z: -2, rot: 0.75, ancho: 8 },
      { g: 6, x: -10, z: -19, rot: 0.25, ancho: 8.5 },
      { g: 7, x: 10, z: -19, rot: -0.25, ancho: 8.5 },
      { g: 2, x: 25, z: 0, rot: -0.8, ancho: 7.5 },
    ]);
  });
}

// ───────── 9 · Maquetas: Ciénaga, Mareas, Forja ─────────
function islaTematica(mapa, { piedra, borde, alto = 1.6 }) {
  const g = new THREE.Group();
  const rows = mapa.length;
  const cols = mapa[0].length;
  const centro = (c, r) => new THREE.Vector3((c - (cols - 1) / 2) * TILE, 0, (r - (rows - 1) / 2) * TILE);
  mapa.forEach((fila, r) =>
    [...fila].forEach((ch, c) => {
      if (ch === 'w') return;
      const p = centro(c, r);
      g.add(pieza('caja', mat(borde, { rugosidad: 0.95 }), { pos: [p.x, -alto / 2 - 0.06, p.z], esc: [TILE, alto, TILE] }));
      const tono = new THREE.Color(piedra).offsetHSL(0, 0, (hash(c, r, 7) - 0.5) * 0.05);
      g.add(pieza('caja', mat(tono.getStyle(), { rugosidad: 0.95 }), { pos: [p.x, -0.06, p.z], esc: [TILE * 0.94, 0.14, TILE * 0.94] }));
    }),
  );
  return { grupo: g, centro, cols, rows };
}

function etapa9(vivos) {
  return estacion(9, (e, g) => {
    g.position.set(0, 0, 0);
    e.visibleDesde = 8.3;
    e.visibleHasta = 10.6;

    // Ciénaga de los Faroles Ahogados.
    const ci = new THREE.Group();
    ci.position.copy(CIENAGA);
    g.add(ci);
    const isla = islaTematica(['##ww###', '##ww#w#', '##ww###', '###ww##', '#w#ww##', '###ww##'], { piedra: '#6f7563', borde: '#4b5143' });
    ci.add(isla.grupo);
    const props = [
      ['graveyard/pine-crooked', -5, -4, 4.2],
      ['graveyard/pine-fall-crooked', 5.5, 3, 3.8],
      ['graveyard/gravestone-cross', -5, 1, 1.2],
      ['graveyard/gravestone-round', -3.2, 3.2, 1],
      ['graveyard/gravestone-broken', 3.5, -3.6, 0.9],
      ['graveyard/crypt', 4.6, -2.2, 2.6],
      ['graveyard/iron-fence-damaged', -1.8, -5, 1.2],
      ['graveyard/coffin-old', -5.6, 4.2, 0.7],
      ['graveyard/candle-multiple', 2.4, 4.4, 0.6],
    ];
    props.forEach(([k, x, z, h]) => {
      const o = instancia(k, { altura: h, tinte: k.includes('pine') ? '#6f7d66' : undefined });
      o.position.set(x, -0.08, z);
      o.rotation.y = hash(x, z) * 6;
      ci.add(o);
    });
    // Faroles de la pasarela que se encienden uno tras otro.
    const faroles = [-4, -1.3, 1.3, 4].map((z, k) => {
      const f = instancia('graveyard/lightpost-single', { altura: 2.4 });
      f.position.set(k % 2 ? 1.2 : -1.2, -0.08, z);
      ci.add(f);
      const luz = pieza('esferaLow', mat('#c9ff9a', { emisivo: 0 }), { pos: [f.position.x, 2.05, z], esc: [0.16, 0.16, 0.16], sombra: false });
      luz.material = luz.material.clone();
      ci.add(luz);
      return luz;
    });
    const fantasma = instancia('graveyard/character-ghost', { altura: 1.6 });
    fantasma.position.set(0, 1.2, 8);
    ci.add(fantasma);
    fantasma.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0.7;
        o.material.emissive = new THREE.Color('#9fd8c0');
        o.material.emissiveIntensity = 0.5;
      }
    });
    const barcoFantasma = flotador(instancia('pirate/ship-ghost', { altura: 5 }), { amplitud: 0.2, inclinacion: 0.06, deriva: 0.08 });
    barcoFantasma.position.set(-12, -0.6, -6);
    barcoFantasma.rotation.y = 0.9;
    barcoFantasma.userData.actualizar(0);
    ci.add(barcoFantasma);
    const naufragio = instancia('pirate/ship-wreck', { altura: 2.4 });
    naufragio.position.set(10, -0.7, 6);
    naufragio.rotation.y = -0.6;
    ci.add(naufragio);
    ci.add(crearParticulas({ centro: new THREE.Vector3(0, 0.5, 0), cantidad: 120, caja: [26, 5, 26], color: '#b6ff8a', tam: 0.13, intensidad: 2.2 }));
    ci.add(crearParticulas({ centro: new THREE.Vector3(0, 0, 0), cantidad: 60, caja: [30, 3, 30], color: '#9fb59a', tam: 3.5, intensidad: 0.5, aditivo: false, opacidad: 0.22, velocidad: 0.3 }));
    // Peces que nadan bajo el agua turbia.
    const peces = [0, 1, 2].map((k) => {
      const pez = pezClonado();
      pez.scale.setScalar(0.004);
      teñir(pez, '#9aa36a');
      const mixer = new THREE.AnimationMixer(pez);
      const clip = clipsDe('fish')[0];
      if (clip) mixer.clipAction(clip).play();
      ci.add(pez);
      return { pez, mixer, k };
    });

    // Mareas de Liria: los pasos de piedra asoman con la marea baja.
    const ma = new THREE.Group();
    ma.position.copy(MAREAS);
    g.add(ma);
    const orillas = islaTematica(['###wwwww###', '###wwwww###', '###wwwww###'], { piedra: PALETA.piedraCrema, borde: PALETA.piedraBorde });
    ma.add(orillas.grupo);
    const pasos = [-3, -1, 1, 3].map((x, k) => {
      const p = pieza('hex', mat('#cfc2a6', { rugosidad: 0.95 }), { pos: [x, -0.68, k % 2 ? 0.4 : -0.4], esc: [0.75, 1, 0.75] });
      ma.add(p);
      return p;
    });
    const poste = new THREE.Group();
    for (let k = 0; k < 6; k++) poste.add(pieza('cil', mat(k % 2 ? '#e8dec6' : PALETA.coral), { pos: [0, -0.6 + k * 0.4, 0], esc: [0.12, 0.4, 0.12] }));
    poste.position.set(6.2, 0, -2.6);
    ma.add(poste);
    const aguaMarea = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2f8f86', transparent: true, opacity: 0.88, roughness: 0.12, metalness: 0.1, emissive: new THREE.Color('#0d3a36'), emissiveIntensity: 0.6 }));
    ma.add(aguaMarea);
    const arbolMa = instancia('nature/CommonTree_2', { altura: 4.5 });
    arbolMa.position.set(-9, -0.1, -1.5);
    ma.add(arbolMa);

    // Forja de Ascuas: río de lava, ruinas y losas de basalto que emergen y se funden.
    const fo = new THREE.Group();
    fo.position.copy(FORJA);
    g.add(fo);
    const islaF = islaTematica(['###ww###', '###ww###', '###ww#w#', '#w#ww###', '###ww###', '###ww###'], { piedra: '#2e2a2a', borde: '#1c1919' });
    fo.add(islaF.grupo);
    const lava = crearLava(4, 14);
    fo.add(lava);
    const propsF = [
      ['castle/tower-hexagon-base', -6, -4, 3.2],
      ['castle/wall-half', 5.4, -4.6, 1.6],
      ['castle/siege-catapult-demolished', 5.6, 3, 1.6],
      ['castle/siege-tower-demolished', -5.6, 3.6, 3.2],
      ['castle/tree-trunk', 3.8, 0.5, 0.9],
      ['castle/rocks-large', -3.4, -1, 1.1],
      ['castle/flag-banner-long', 3.2, -4.6, 2.6],
    ];
    propsF.forEach(([k, x, z, h]) => {
      const o = instancia(k, { altura: h, tinte: '#8b7a72' });
      o.position.set(x, -0.08, z);
      o.rotation.y = hash(x, z, 2) * 6;
      fo.add(o);
    });
    [[-2.6, -3], [2.6, 2], [-2.6, 4]].forEach(([x, z]) => {
      const cesta = instancia('graveyard/fire-basket', { altura: 1.1 });
      cesta.position.set(x, -0.08, z);
      fo.add(cesta);
      fo.add(pieza('esferaLow', mat('#ff8a2a', { emisivo: 4 }), { pos: [x, 1.1, z], esc: [0.2, 0.28, 0.2], sombra: false }));
      fo.add(crearParticulas({ centro: new THREE.Vector3(x, 1, z), cantidad: 26, caja: [0.4, 1.6, 0.4], color: '#ff9a3a', tam: 0.16, modo: 'sube', velocidad: 1.1, intensidad: 3 }));
    });
    const losas = [-4, -1.5, 1, 3.5].map((z) => {
      const m = pieza('caja', new THREE.MeshStandardMaterial({ color: '#1d1a19', roughness: 0.9, emissive: new THREE.Color('#ff4a12'), emissiveIntensity: 0 }), { pos: [0, -0.6, z], esc: [1.6, 0.5, 1.6] });
      fo.add(m);
      return m;
    });
    fo.add(crearParticulas({ centro: new THREE.Vector3(0, 0, 0), cantidad: 220, caja: [14, 9, 16], color: '#ff7a2a', tam: 0.1, modo: 'sube', velocidad: 0.5, intensidad: 3 }));
    const luzLava = new THREE.PointLight('#ff6a2a', 30, 22, 1.8);
    luzLava.position.set(0, 2, 0);
    fo.add(luzLava);

    e.actualizadores.push((T, t, dt) => {
      // Ciénaga
      faroles.forEach((l, k) => {
        const ciclo = (t * 0.35) % 6;
        l.material.emissive.set('#c9ff9a');
        l.material.emissiveIntensity = ciclo > k + 0.5 ? 3.2 + Math.sin(t * 9 + k) * 0.3 : 0.05;
      });
      fantasma.position.y = 1.3 + Math.sin(t * 1.3) * 0.3;
      fantasma.position.x = Math.sin(t * 0.3) * 3;
      fantasma.rotation.y = Math.sin(t * 0.3 + 1.2) * 0.8;
      barcoFantasma.userData.actualizar(t);
      peces.forEach(({ pez, mixer, k }) => {
        mixer.update(dt);
        const a = t * 0.4 + k * 2.1;
        pez.position.set(Math.cos(a) * (9 + k), -1.1, Math.sin(a) * (7 + k));
        pez.rotation.y = -a;
      });
      // Mareas: el agua sube y cubre los pasos; baja y asoman.
      const marea = 0.5 + 0.5 * Math.sin(t * 0.55);
      aguaMarea.position.y = -0.6 + marea * 0.62;
      pasos.forEach((p, k) => (p.position.y = -0.68 + Math.sin(t * 2 + k) * 0.01));
      aguaMarea.material.color.setStyle(marea > 0.5 ? '#2d7896' : '#2f8f86');
      // Forja: las losas emergen al rojo, se enfrían y vuelven a fundirse.
      losas.forEach((m, k) => {
        const ciclo = ((t * 0.25 + k * 0.18) % 1 + 1) % 1;
        const sube = suave(clamp01(ciclo / 0.2)) * (1 - suave(clamp01((ciclo - 0.8) / 0.2)));
        m.position.y = -0.75 + sube * 0.6;
        m.material.emissiveIntensity = 2.6 * (1 - clamp01((ciclo - 0.15) / 0.4)) + 2.6 * clamp01((ciclo - 0.75) / 0.2);
      });
      luzLava.intensity = 26 + Math.sin(t * 3) * 5;
    });

    // Marcos de video, uno por maqueta.
    const galeria = CAPITULOS[9].galeria;
    const colocar = (gi, pos, rot, ancho = 8) => {
      const item = galeria[gi];
      const m = crearMarco({ src: item.src, video: true, pie: item.pie, ancho });
      m.position.copy(pos);
      m.rotation.y = rot;
      g.add(m);
      return m;
    };
    e.marcos = [
      colocar(2, CIENAGA.clone().add(new THREE.Vector3(-8, -0.35, -12)), 0.45),
      colocar(0, MAREAS.clone().add(new THREE.Vector3(0, -0.35, -13)), 0),
      colocar(3, FORJA.clone().add(new THREE.Vector3(8, -0.35, -12)), -0.45),
    ];
    // Zonas de bioma del océano: pantano y costra de magma.
    uAgua.uZonas.value[0].set(CIENAGA.x, CIENAGA.z, 26, 1);
    uAgua.uZonas.value[1].set(FORJA.x, FORJA.z, 24, 2);
  });
}

// ───────── 10 · Beta 1.0 ─────────
function etapa10(vivos) {
  return estacion(10, (e, g) => {
    e.visibleDesde = 9.2;
    e.visibleHasta = 12;
    // Isla del final: lava a la izquierda, agua y árboles a la derecha, como el key art.
    const n = construirNivel(['##########', '###cc#####', '##c##c#v##', '#v######v#', '##########', '##########'], 'vestido', { tinteOrilla: '#2f8f86' });
    g.add(n.grupo);
    g.add(pieza('hex', mat(PALETA.piedraBorde), { pos: [0, 0.2, 0], esc: [2.2, 0.4, 2.2] }));
    g.add(pieza('hex', mat('#8a6a44', { metal: 0.4 }), { pos: [0, 0.42, 0], esc: [1.9, 0.06, 1.9] }));
    const aroFinal = pieza('aro', mat(PALETA.ambar, { emisivo: 1.1 }), { pos: [0, 0.47, 0], esc: [1.75, 1.75, 0.5], rot: [Math.PI / 2, 0, 0], sombra: false });
    g.add(aroFinal);
    const nilo = crearNilo({ altura: 2.1, bateria: true });
    nilo.grupo.position.set(0, 0.45, 0);
    g.add(nilo.grupo);
    nilo.reproducir('Wave');
    vivos.push(nilo);
    const maia = crearMaia(true, []);
    maia.position.set(5.5, 0, -1.6);
    maia.rotation.y = -0.6;
    g.add(maia);
    const faro = crearFaro(12);
    faro.position.set(-7, 0, -11);
    g.add(faro);
    // Lava al oeste.
    const lava = crearLava(12, 18);
    lava.position.set(-17, -0.4, 0);
    g.add(lava);
    [[-12, -4, 3.4], [-14, 5, 2.6], [-21, 1, 4]].forEach(([x, z, h]) => {
      const o = instancia(h > 3 ? 'castle/tower-hexagon-base' : 'castle/rocks-large', { altura: h, tinte: '#5a4a44' });
      o.position.set(x, -0.5, z);
      g.add(o);
    });
    g.add(crearParticulas({ centro: new THREE.Vector3(-16, 0, 0), cantidad: 220, caja: [12, 10, 18], color: '#ff7a2a', tam: 0.11, modo: 'sube', velocidad: 0.6, intensidad: 3 }));
    g.add(crearParticulas({ centro: new THREE.Vector3(8, 0.5, 0), cantidad: 120, caja: [16, 5, 14], color: '#a8ffe8', tam: 0.1, intensidad: 2 }));
    const flot = [barca('watercraft/boat-fishing-small', new THREE.Vector3(16, -0.45, 4), -0.8, 1.6), barca('watercraft/buoy-flag', new THREE.Vector3(13, -0.5, -6), 0, 1.2)];
    flot.forEach((b) => g.add(b));
    const luzLava = new THREE.PointLight('#ff6a2a', 40, 30, 1.6);
    luzLava.position.set(-10, 3, 2);
    g.add(luzLava);
    const luzNilo = new THREE.PointLight('#8ff3e6', 10, 10, 2);
    luzNilo.position.set(2, 3, 3);
    g.add(luzNilo);

    // Chispas de celebración.
    const chispas = crearParticulas({ centro: new THREE.Vector3(0, 0.5, 0), cantidad: 90, caja: [3, 7, 3], color: PALETA.ambar, tam: 0.12, modo: 'sube', velocidad: 0.9, intensidad: 3.5 });
    g.add(chispas);

    let ultimo = '';
    e.actualizadores.push((T, t, dt) => {
      n.anima(t);
      faro.userData.encender(1, t);
      aroFinal.rotation.z = t * 0.5;
      flot.forEach((b) => b.userData.actualizar(t));
      // Saluda al llegar y baila al final del recorrido.
      const quiere = T > 10.45 ? 'Dance' : 'Wave';
      if (quiere !== ultimo) {
        nilo.reproducir(quiere, { fundido: 0 });
        ultimo = quiere;
      }
      nilo.actualizar(dt, t);
      chispas.visible = T > 10.4;
      luzLava.intensity = 34 + Math.sin(t * 2.6) * 6;
    });
    const keyart = crearMarco({ src: import.meta.env.BASE_URL + 'img/keyart.jpg', pie: 'Key art de RELEVO.', ancho: 11 });
    keyart.position.set(14, -0.35, -11);
    keyart.rotation.y = -0.55;
    g.add(keyart);
    e.marcos = [keyart];
  });
}

export function crearEstaciones() {
  const vivos = [];
  const lista = [etapa1(), etapa2(), etapa3(), etapa4(), etapa5(), etapa6(), etapa7(vivos), etapa8(vivos), etapa9(vivos), etapa10(vivos)];
  return {
    lista,
    actualizar(T, t, dt, resaltado) {
      for (const e of lista) {
        const visible = T > e.visibleDesde && T < e.visibleHasta;
        e.grupo.visible = visible;
        if (!visible) {
          e.marcos.forEach((m) => m.userData.levantar(0));
          continue;
        }
        const sube = suave(tramo(T, e.i - 0.45, e.i + 0.08));
        const baja = 1 - suave(tramo(T, e.i + 0.92, e.i + 1.3));
        const f = e.i === 10 ? sube : Math.min(sube, baja);
        e.marcos.forEach((m) => {
          m.userData.levantar(f);
          m.userData.actualizar(t, resaltado === m.userData.imagen);
        });
        for (const a of e.actualizadores) a(T, t, dt);
      }
    },
  };
}
