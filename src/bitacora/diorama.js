import * as THREE from 'three';
import { PALETA } from './paleta.js';
import { instancia } from './assets.js';
import { crearAguaOrilla } from './agua.js';

// Port a la web de DioramaBuilder.cs + DioramaVestido.cs: el nivel se arma desde el mismo mapa de
// texto que usa el juego (LevelLayouts.cs). Toda la variación sale de un ruido determinista por
// casilla, así que el mismo mapa siempre da la misma escena.

export const TILE = 2;

export const MAPAS = {
  nivel1: ['wwvwwwwwvwwvw', 'wwwwwwwwwwwww', 'wwwwvwwwwwwvw', 'MY#wwwwwww##E', 'N#ABBBBBBB###', '###wwwwwwwL##', 'w#wPPPPPPPPww', 'w#wmmmmwwwwww', 'w##mmmmwwwwww', '#Xwmmmmwwwwww'],
  nivel2: ['v##vww#v#ww#v#', '####ww###ww###', '###ABB##DCC###', '####ww###ww###', '###cPPc#Lwwk##', '####ww###ww###', 'wwgwww###wwu##', '####ww###ww###', '#ok#ww###ww###', 'M###ww##cRRc##', 'NY##ww#v#ww##E', 'v###wwX##ww#v#'],
  nivel3: ['####ww#####', '#v##ww##E##', '##cDCC#####', 'M###ww###v#', '####ww#####', 'N#Y#ww##K##', '##ccww#####', '###cQQ#####', '#v##QQ#c#c#', '##ccww###X#'],
};

const PUENTES = 'BCPQR';
const esAgua = (ch) => ch === 'w' || ch === '.';
const esPuente = (ch) => PUENTES.includes(ch);
export const esTierra = (ch) => !esAgua(ch) && !esPuente(ch);

export function hash(c, r, s = 0) {
  const x = Math.sin(c * 127.1 + r * 311.7 + s * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

// ───────── Materiales compartidos ─────────
const cacheMat = new Map();
export function mat(color, { emisivo = 0, rugosidad = 0.8, metal = 0, transparente = false, opacidad = 1 } = {}) {
  const k = `${color}|${emisivo}|${rugosidad}|${metal}|${opacidad}`;
  if (!cacheMat.has(k)) {
    const c = new THREE.Color(color);
    cacheMat.set(
      k,
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: rugosidad,
        metalness: metal,
        emissive: emisivo ? c : new THREE.Color(0),
        emissiveIntensity: emisivo,
        transparent: transparente,
        opacity: opacidad,
      }),
    );
  }
  return cacheMat.get(k);
}

// Adoquines teñidos al crema de la paleta: la textura original es gris oscuro, así que el color
// se lleva por encima de 1 para que el resultado quede claro.
const losas = [];
function matLosa(h) {
  const k = Math.floor(h * 3);
  if (!losas[k]) {
    const tex = instancia('nature/RockPath_Square_Wide').children[0];
    let mapa = null;
    tex.traverse((o) => o.isMesh && (mapa ||= o.material.map));
    const c = new THREE.Color(PALETA.piedraCrema).multiplyScalar(2.6 + k * 0.15);
    losas[k] = new THREE.MeshStandardMaterial({ map: mapa, color: c, roughness: 0.95 });
  }
  return losas[k];
}

const GEO = {
  caja: new THREE.BoxGeometry(1, 1, 1),
  esfera: new THREE.SphereGeometry(1, 20, 14),
  esferaLow: new THREE.IcosahedronGeometry(1, 1),
  cil: new THREE.CylinderGeometry(1, 1, 1, 20),
  hex: new THREE.CylinderGeometry(1, 1, 1, 6),
  aro: new THREE.TorusGeometry(1, 0.06, 8, 40),
  capsula: new THREE.CapsuleGeometry(0.5, 1, 6, 12),
};

export function pieza(geo, material, { pos = [0, 0, 0], esc = [1, 1, 1], rot = [0, 0, 0], sombra = true } = {}) {
  const m = new THREE.Mesh(GEO[geo] || geo, material);
  m.position.set(...pos);
  m.scale.set(...esc);
  m.rotation.set(...rot);
  m.castShadow = sombra;
  m.receiveShadow = true;
  return m;
}

/** Halo emisivo que gira y respira (AcentoEmisivo.cs). */
export function halo(color, radio = 0.5) {
  const g = new THREE.Group();
  const aro = pieza('aro', mat(color, { emisivo: 2.2 }), { esc: [radio, radio, radio], rot: [Math.PI / 2, 0, 0], sombra: false });
  g.add(aro);
  g.userData.anima = (t) => {
    aro.rotation.z = t * 0.8;
    const s = radio * (1 + Math.sin(t * 2.4) * 0.08);
    aro.scale.set(s, s, s);
  };
  return g;
}

// ───────── Constructor ─────────
export function construirNivel(filas, estilo = 'primitivo', opciones = {}) {
  const grupo = new THREE.Group();
  const rows = filas.length;
  const cols = filas[0].length;
  const centro = (c, r) => new THREE.Vector3((c - (cols - 1) / 2) * TILE, 0, (r - (rows - 1) / 2) * TILE);
  const en = (c, r) => (r >= 0 && r < rows && c >= 0 && c < cols ? filas[r][c] : 'w');
  const marcadores = {};
  const animables = [];
  const bloques = [];
  const ALTO = 1.7;

  const suelo = new THREE.Group();
  grupo.add(suelo);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = filas[r][c];
      const p = centro(c, r);
      if (/[A-Za-z]/.test(ch) && !'wvcmBCPQR'.includes(ch)) {
        (marcadores[ch] ||= []).push(p.clone());
      }
      if (!esTierra(ch)) continue;
      const bloque = new THREE.Group();
      bloque.position.copy(p);
      bloque.userData.retraso = (c + r) / (cols + rows);
      suelo.add(bloque);
      bloques.push(bloque);

      if (estilo === 'graybox') {
        const g = 0.62 + hash(c, r) * 0.06;
        bloque.add(pieza('caja', mat(new THREE.Color(g, g, g).getStyle(), { rugosidad: 0.95 }), { pos: [0, -ALTO / 2, 0], esc: [TILE, ALTO, TILE] }));
        continue;
      }

      const madera = ch === 'm';
      const cobre = ch === 'c';
      const base = madera ? PALETA.maderaOscura : cobre ? PALETA.cobre : PALETA.piedraBorde;
      bloque.add(pieza('caja', mat(base, { rugosidad: 0.9 }), { pos: [0, -ALTO / 2 - 0.06, 0], esc: [TILE, ALTO, TILE] }));

      if (estilo === 'vestido' && !madera && !cobre) {
        const losa = instancia('nature/RockPath_Square_Wide', { ancho: TILE * 0.98 });
        losa.traverse((o) => o.isMesh && (o.material = matLosa(hash(c, r, 6))));
        losa.position.y = -0.12;
        losa.rotation.y = Math.floor(hash(c, r, 3) * 4) * (Math.PI / 2);
        bloque.add(losa);
        bloque.add(pieza('caja', mat(PALETA.piedraCrema, { rugosidad: 0.95 }), { pos: [0, -0.1, 0], esc: [TILE * 0.98, 0.12, TILE * 0.98], sombra: false }));
      } else if (madera) {
        for (let i = 0; i < 4; i++) {
          const tono = new THREE.Color(PALETA.maderaOscura).offsetHSL(0, 0, (hash(c, r, i) - 0.5) * 0.06 + 0.04);
          bloque.add(pieza('caja', mat(tono.getStyle(), { rugosidad: 0.85 }), { pos: [0, -0.04, (i - 1.5) * 0.5], esc: [TILE * 0.98, 0.1, 0.46] }));
        }
      } else {
        const tono = new THREE.Color(cobre ? '#8a6a44' : PALETA.piedraCrema).offsetHSL(0, 0, (hash(c, r) - 0.5) * 0.04);
        bloque.add(pieza('caja', mat(tono.getStyle(), { rugosidad: 0.92, metal: cobre ? 0.4 : 0 }), { pos: [0, -0.06, 0], esc: [TILE * 0.94, 0.14, TILE * 0.94] }));
      }

      if (ch === 'v') vegetacion(bloque, c, r, estilo, animables);
    }
  }

  // Perímetro del graybox: muretes bajos, como en las capturas de Unity.
  if (estilo === 'graybox') {
    const w = cols * TILE;
    const d = rows * TILE;
    const m = mat('#8f8f8f', { rugosidad: 0.95 });
    [
      [0, -d / 2, w + 0.6, 0.6],
      [0, d / 2, w + 0.6, 0.6],
      [-w / 2, 0, 0.6, d],
      [w / 2, 0, 0.6, d],
    ].forEach(([x, z, sx, sz]) => grupo.add(pieza('caja', m, { pos: [x, -0.4, z], esc: [sx, 1.4, sz] })));
  }

  // Decoración de orillas y malecón en el estilo vestido.
  if (estilo === 'vestido') decorarOrillas(grupo, filas, centro, en, opciones.malecon !== false);

  // Puentes y pasarelas: se despliegan tramo a tramo.
  const puentes = {};
  for (const letra of PUENTES) {
    const tramos = [];
    filas.forEach((fila, r) => [...fila].forEach((ch, c) => ch === letra && tramos.push({ c, r, p: centro(c, r) })));
    if (!tramos.length) continue;
    puentes[letra] = crearPuente(tramos, letra, estilo, en);
    grupo.add(puentes[letra].grupo);
  }

  // Piezas del puzle.
  const piezas = {};
  for (const [letra, posiciones] of Object.entries(marcadores)) {
    posiciones.forEach((p) => {
      const obj = crearPieza(letra, estilo, animables);
      if (!obj) return;
      obj.position.copy(p);
      grupo.add(obj);
      (piezas[letra] ||= []).push(obj);
    });
  }

  // Agua local con espuma contra los muelles.
  if (estilo !== 'graybox' && opciones.orilla !== false) {
    const orilla = crearAguaOrilla(filas, esTierra, TILE, { tinte: opciones.tinteOrilla, espuma: opciones.espuma ?? 1 });
    grupo.add(orilla);
  }

  return {
    grupo,
    marcadores,
    piezas,
    puentes,
    bloques,
    centro,
    ancho: cols * TILE,
    largo: rows * TILE,
    anima(t) {
      for (const a of animables) a(t);
    },
  };
}

function vegetacion(bloque, c, r, estilo, animables) {
  if (estilo === 'vestido') {
    const arboles = ['nature/CommonTree_1', 'nature/CommonTree_2', 'nature/CommonTree_3'];
    const arbol = instancia(arboles[Math.floor(hash(c, r, 1) * 3)], { altura: 3.3 + hash(c, r, 2) * 0.9 });
    arbol.position.set(-0.35, -0.1, -0.3);
    arbol.rotation.y = hash(c, r, 4) * Math.PI * 2;
    bloque.add(arbol);
    const mata = instancia(hash(c, r, 5) > 0.5 ? 'nature/Bush_Common_Flowers' : 'nature/Bush_Common', { altura: 0.8 });
    mata.position.set(0.5, -0.1, 0.45);
    bloque.add(mata);
    const flores = instancia('nature/Flower_3_Group', { altura: 0.35 });
    flores.position.set(-0.55, -0.1, 0.6);
    bloque.add(flores);
    const farol = instancia('town/lantern', { altura: 1.7 });
    farol.position.set(0.65, -0.1, -0.6);
    bloque.add(farol);
    const luz = pieza('esferaLow', mat(PALETA.ambar, { emisivo: 3 }), { pos: [0.65, 1.32, -0.6], esc: [0.12, 0.12, 0.12], sombra: false });
    bloque.add(luz);
    titilar(luz, c * 3.1 + r, animables);
    return;
  }
  // Primitivas: dos esferas verdes y un tronco, y un farol de poste y cubo ámbar.
  const verde = mat(PALETA.vegetacion, { rugosidad: 0.9 });
  bloque.add(pieza('cil', mat('#5a4030'), { pos: [-0.3, 0.5, -0.2], esc: [0.12, 1, 0.12] }));
  bloque.add(pieza('esferaLow', verde, { pos: [-0.3, 1.2, -0.2], esc: [0.62, 0.55, 0.62] }));
  bloque.add(pieza('esferaLow', mat('#6c8d55', { rugosidad: 0.9 }), { pos: [0.15, 0.95, 0.1], esc: [0.42, 0.38, 0.42] }));
  bloque.add(pieza('cil', mat('#3a2a20'), { pos: [0.6, 0.7, -0.6], esc: [0.05, 1.4, 0.05] }));
  const luz = pieza('caja', mat(PALETA.ambar, { emisivo: 2.5 }), { pos: [0.6, 1.45, -0.6], esc: [0.2, 0.2, 0.2], sombra: false });
  bloque.add(luz);
  titilar(luz, c * 2.3 + r, animables);
}

function titilar(malla, semilla, animables) {
  const base = malla.material;
  malla.material = base.clone();
  animables.push((t) => {
    const f = 0.85 + Math.sin(t * 7 + semilla) * 0.06 + Math.sin(t * 13.7 + semilla * 2) * 0.05;
    malla.material.emissiveIntensity = base.emissiveIntensity * f;
  });
}

function decorarOrillas(grupo, filas, centro, en, conMalecon = true) {
  const rows = filas.length;
  const cols = filas[0].length;
  // Rocas, guijarros y juncos en el agua junto a la tierra.
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const ch = en(c, r);
      if (!esAgua(ch)) continue;
      const vecinos = [en(c + 1, r), en(c - 1, r), en(c, r + 1), en(c, r - 1)].filter(esTierra).length;
      if (!vecinos) continue;
      const h = hash(c, r, 9);
      const p = centro(c, r);
      if (h < 0.18) {
        const roca = instancia(h < 0.09 ? 'nature/Rock_Medium_1' : 'nature/Rock_Medium_2', { altura: 0.6 + h * 2, tinte: '#cfc6b4' });
        roca.position.set(p.x + (hash(c, r, 1) - 0.5) * 1.2, -0.55, p.z + (hash(c, r, 2) - 0.5) * 1.2);
        roca.rotation.y = h * 40;
        grupo.add(roca);
      } else if (h < 0.3) {
        const junco = instancia('nature/Grass_Wispy_Tall', { altura: 0.9 });
        junco.position.set(p.x + (hash(c, r, 3) - 0.5), -0.45, p.z + (hash(c, r, 4) - 0.5));
        grupo.add(junco);
      }
    }
  }
  // Barriles y cajas pegados a algunas esquinas de muelle.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = filas[r][c];
      if (ch !== '#' || hash(c, r, 11) > 0.09) continue;
      const p = centro(c, r);
      const obj = instancia(hash(c, r, 12) > 0.5 ? 'pirate/barrel' : 'pirate/crate', { altura: 0.75 });
      obj.position.set(p.x + 0.55, -0.05, p.z + 0.55);
      obj.rotation.y = hash(c, r, 13) * 6;
      grupo.add(obj);
    }
  }
  if (!conMalecon) return;
  // Malecón: albardilla de sillares y pilotes de amarre alrededor del recinto.
  const w = cols * TILE + 3;
  const d = rows * TILE + 3;
  const sillar = mat('#d8ccb2', { rugosidad: 0.95 });
  const sillar2 = mat('#c5b89c', { rugosidad: 0.95 });
  const lados = [
    [[-w / 2, -d / 2], [w / 2, -d / 2]],
    [[w / 2, -d / 2], [w / 2, d / 2]],
    [[w / 2, d / 2], [-w / 2, d / 2]],
    [[-w / 2, d / 2], [-w / 2, -d / 2]],
  ];
  let i = 0;
  for (const [[x0, z0], [x1, z1]] of lados) {
    const largo = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.round(largo / 0.75);
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n;
      const x = x0 + (x1 - x0) * f;
      const z = z0 + (z1 - z0) * f;
      const alto = 0.42 + hash(k, i, 5) * 0.08;
      const horizontal = z0 === z1;
      grupo.add(pieza('caja', k % 2 ? sillar : sillar2, { pos: [x, -0.5 + alto / 2, z], esc: horizontal ? [0.7, alto, 0.6] : [0.6, alto, 0.7] }));
      if (k % 7 === 3) {
        const pilote = instancia('town/pillar-wood', { altura: 1.6 });
        pilote.position.set(x + (horizontal ? 0 : Math.sign(x) * 0.6), -0.9, z + (horizontal ? Math.sign(z) * 0.6 : 0));
        grupo.add(pilote);
      }
    }
    i++;
  }
}

function crearPuente(tramos, letra, estilo, en) {
  const grupo = new THREE.Group();
  const electrico = letra === 'B' || letra === 'C';
  const placa = letra === 'R';
  const color = estilo === 'graybox' ? (electrico ? '#d936d9' : '#6a6a6a') : electrico ? PALETA.ambar : placa ? PALETA.turquesa : '#b88d5c';
  const segmentos = [];
  // Orientación: horizontal si los tramos comparten fila.
  const horizontal = tramos.every((t) => t.r === tramos[0].r) && tramos.length > 1;
  const orden = [...tramos].sort((a, b) => (horizontal ? a.c - b.c : a.r - b.r));
  orden.forEach((t, i) => {
    const seg = new THREE.Group();
    seg.position.copy(t.p);
    const tablero = pieza('caja', mat(estilo === 'graybox' ? color : electrico || placa ? '#3b4650' : '#9a7448', { rugosidad: 0.7, metal: electrico ? 0.4 : 0 }), {
      pos: [0, -0.12, 0],
      esc: horizontal ? [TILE * 1.01, 0.18, 1.5] : [1.5, 0.18, TILE * 1.01],
    });
    seg.add(tablero);
    if (estilo !== 'graybox') {
      const bordeMat = mat(color, { emisivo: electrico || placa ? 1.8 : 0, rugosidad: 0.6 });
      const off = 0.72;
      [-1, 1].forEach((s) => {
        seg.add(pieza('caja', bordeMat, { pos: horizontal ? [0, 0, s * off] : [s * off, 0, 0], esc: horizontal ? [TILE * 1.01, 0.1, 0.08] : [0.08, 0.1, TILE * 1.01], sombra: false }));
      });
      if (!electrico && !placa) {
        // Pasarela manual: barandilla de madera.
        [-1, 1].forEach((s) => {
          seg.add(pieza('caja', mat('#6b4a2f'), { pos: horizontal ? [0, 0.45, s * 0.7] : [s * 0.7, 0.45, 0], esc: horizontal ? [TILE, 0.07, 0.07] : [0.07, 0.07, TILE] }));
          seg.add(pieza('caja', mat('#6b4a2f'), { pos: horizontal ? [0, 0.22, s * 0.7] : [s * 0.7, 0.22, 0], esc: [0.08, 0.5, 0.08] }));
        });
      }
    }
    seg.userData.horizontal = horizontal;
    grupo.add(seg);
    segmentos.push(seg);
  });
  const api = {
    grupo,
    estado: -1,
    desplegar(f) {
      if (f === api.estado) return;
      api.estado = f;
      const n = segmentos.length;
      segmentos.forEach((s, i) => {
        const local = THREE.MathUtils.clamp(f * n - i, 0, 1);
        const e = local === 0 ? 0 : 1 - Math.pow(1 - local, 3);
        s.visible = local > 0.001;
        s.scale.set(1, 1, 1);
        if (s.userData.horizontal) s.scale.x = e;
        else s.scale.z = e;
        s.position.y = (1 - e) * -0.8;
      });
    },
  };
  return api;
}

function crearPieza(letra, estilo, animables) {
  const g = new THREE.Group();
  if (estilo === 'graybox') {
    const gris = mat('#7d7d7d', { rugosidad: 0.95 });
    switch (letra) {
      case 'Y':
        g.add(pieza('caja', mat('#d936d9', { emisivo: 0.25 }), { pos: [0, 0.35, 0], esc: [0.7, 0.7, 0.7] }));
        break;
      case 'E':
        g.add(pieza('caja', mat('#3fdc3a', { emisivo: 0.2 }), { pos: [0, 0.05, 0], esc: [1.9, 0.1, 1.9] }));
        break;
      case 'A':
      case 'D':
      case 'L':
      case 'K':
        g.add(pieza('caja', gris, { pos: [0, 0.4, 0], esc: [0.7, 0.8, 0.7] }));
        break;
      case 'N':
        g.add(pieza('capsula', mat('#8fa0b8', { rugosidad: 0.8 }), { pos: [0, 0.9, 0], esc: [0.8, 0.8, 0.8] }));
        break;
      case 'M':
        g.add(pieza('caja', gris, { pos: [0, 0.9, 0], esc: [0.9, 1.8, 0.9] }));
        break;
      default:
        return null;
    }
    return g;
  }
  const vestido = estilo === 'vestido';
  switch (letra) {
    case 'Y': {
      if (vestido) {
        const cel = instancia('space/machine_barrel', { altura: 0.95, tinte: '#ffcf8a' });
        g.add(cel);
        g.add(pieza('cil', mat(PALETA.ambar, { emisivo: 2 }), { pos: [0, 0.5, 0], esc: [0.36, 0.08, 0.36], sombra: false }));
      } else {
        g.add(pieza('caja', mat(PALETA.ambar, { emisivo: 1.2, rugosidad: 0.5 }), { pos: [0, 0.4, 0], esc: [0.55, 0.8, 0.4] }));
        g.add(pieza('caja', mat('#3b2a1c'), { pos: [0, 0.85, 0], esc: [0.3, 0.1, 0.2] }));
      }
      const h = halo(PALETA.ambar, 0.55);
      h.position.y = 1.35;
      g.add(h);
      animables.push(h.userData.anima);
      g.userData.bateria = true;
      break;
    }
    case 'A':
    case 'D': {
      g.add(pieza('hex', mat(vestido ? '#b9ab90' : '#6b4b33', { rugosidad: 0.9 }), { pos: [0, 0.35, 0], esc: [0.8, 0.7, 0.8] }));
      g.add(pieza('hex', mat(vestido ? '#a49678' : '#5a3d29'), { pos: [0, 0.75, 0], esc: [0.62, 0.12, 0.62] }));
      const anillo = pieza('aro', mat(PALETA.turquesa, { emisivo: 1.6 }), { pos: [0, 0.05, 0], esc: [1.05, 1.05, 1.05], rot: [Math.PI / 2, 0, 0], sombra: false });
      g.add(anillo);
      if (vestido) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          g.add(pieza('esferaLow', mat('#b5793f', { metal: 0.6, rugosidad: 0.4 }), { pos: [Math.cos(a) * 0.72, 0.5, Math.sin(a) * 0.72], esc: [0.07, 0.07, 0.07] }));
        }
      }
      // Conector hexagonal del GDD.
      g.add(pieza('hex', mat(PALETA.ambarSuave, { emisivo: 0.6 }), { pos: [0, 0.84, 0], esc: [0.22, 0.06, 0.22], sombra: false }));
      g.userData.anillo = anillo;
      break;
    }
    case 'L':
    case 'K': {
      if (vestido) g.add(instancia('space/machine_generator', { altura: 0.8, tinte: '#d39a5e' }));
      else g.add(pieza('caja', mat('#8a6a44', { metal: 0.5, rugosidad: 0.5 }), { pos: [0, 0.3, 0], esc: [0.7, 0.6, 0.5] }));
      const barra = new THREE.Group();
      barra.position.set(0, 0.6, 0);
      barra.add(pieza('cil', mat('#3a3a3a', { metal: 0.6 }), { pos: [0, 0.35, 0], esc: [0.05, 0.7, 0.05] }));
      barra.add(pieza('esferaLow', mat(PALETA.coral, { emisivo: 0.6 }), { pos: [0, 0.72, 0], esc: [0.11, 0.11, 0.11] }));
      barra.rotation.z = 0.6;
      g.add(barra);
      g.userData.barra = barra;
      break;
    }
    case 'E': {
      const pilar = (x) => {
        if (vestido) {
          const p = instancia('town/pillar-stone', { altura: 2.4 });
          p.position.x = x;
          return p;
        }
        return pieza('caja', mat('#8a6a44', { metal: 0.4 }), { pos: [x, 1.1, 0], esc: [0.25, 2.2, 0.25] });
      };
      g.add(pilar(-0.85), pilar(0.85));
      g.add(pieza('caja', mat(vestido ? '#6b4a2f' : '#8a6a44'), { pos: [0, 2.35, 0], esc: [2.2, 0.22, 0.4] }));
      if (vestido) {
        const ban = instancia('town/banner-green', { altura: 1.2 });
        ban.position.set(0, 1.15, 0.12);
        g.add(ban);
      }
      const umbral = pieza('caja', mat(PALETA.ambar, { emisivo: 1.4, transparente: true, opacidad: 0.85 }), { pos: [0, 0.02, 0], esc: [1.5, 0.04, 1.2], sombra: false });
      g.add(umbral);
      g.userData.umbral = umbral;
      break;
    }
    case 'X': {
      g.add(pieza('cil', mat(vestido ? '#cfc2a6' : '#8a6a44'), { pos: [0, 0.35, 0], esc: [0.25, 0.7, 0.25] }));
      const orbe = pieza('esfera', mat(PALETA.ambarSuave, { emisivo: 2 }), { pos: [0, 1.0, 0], esc: [0.18, 0.18, 0.18], sombra: false });
      g.add(orbe);
      animables.push((t) => (orbe.position.y = 1.0 + Math.sin(t * 2) * 0.08));
      break;
    }
    case 'M': {
      g.add(crearMaia(vestido, animables));
      break;
    }
    case 'k': {
      g.add(crearCaja());
      g.userData.caja = true;
      break;
    }
    case 'o':
    case 'u': {
      g.add(pieza('caja', mat('#e2d6bb'), { pos: [0, 0.01, 0], esc: [1.7, 0.06, 1.7] }));
      g.add(pieza('caja', mat('#8a6a44', { metal: 0.4 }), { pos: [0, 0.04, 0], esc: [1.3, 0.06, 1.3] }));
      const rombo = pieza('caja', mat(PALETA.turquesa, { emisivo: 0.4 }), { pos: [0, 0.08, 0], esc: [0.5, 0.04, 0.5], rot: [0, Math.PI / 4, 0], sombra: false });
      g.add(rombo);
      g.userData.rombo = rombo;
      break;
    }
    case 'g': {
      const barrotes = new THREE.Group();
      for (let i = 0; i < 5; i++) barrotes.add(pieza('cil', mat(PALETA.turquesa, { emisivo: 0.5, metal: 0.4 }), { pos: [(i - 2) * 0.38, 0.7, 0], esc: [0.06, 1.4, 0.06] }));
      barrotes.add(pieza('caja', mat('#3b4650', { metal: 0.4 }), { pos: [0, 1.42, 0], esc: [1.9, 0.12, 0.16] }));
      g.add(barrotes);
      g.userData.barrotes = barrotes;
      break;
    }
    default:
      return null;
  }
  return g;
}

export function crearCaja() {
  const g = new THREE.Group();
  const caja = instancia('pirate/crate', { altura: 1.3 });
  g.add(caja);
  // Tapa de tablones (la de Kenney es un cajón abierto, Entrada 14).
  for (let i = 0; i < 3; i++) g.add(pieza('caja', mat('#a77a4a'), { pos: [0, 1.3, (i - 1) * 0.42], esc: [1.25, 0.06, 0.38] }));
  return g;
}

export function crearMaia(vestido, animables) {
  const g = new THREE.Group();
  if (vestido) {
    g.add(pieza('cil', mat('#b5a888'), { pos: [0, 0.3, 0], esc: [0.8, 0.6, 0.8] }));
    const helecho = instancia('nature/Fern_1', { altura: 0.7 });
    helecho.position.set(0.45, 0.55, 0.3);
    g.add(helecho);
    const helecho2 = instancia('nature/Fern_1', { altura: 0.6 });
    helecho2.position.set(-0.45, 0.55, -0.2);
    helecho2.rotation.y = 2;
    g.add(helecho2);
  } else {
    g.add(pieza('cil', mat('#6b4b33'), { pos: [0, 0.25, 0], esc: [0.75, 0.5, 0.75] }));
    g.add(pieza('esferaLow', mat('#5f8a55'), { pos: [0.4, 0.75, 0.3], esc: [0.32, 0.3, 0.32] }));
  }
  const cuerpo = new THREE.Group();
  cuerpo.position.y = 0.6;
  g.add(cuerpo);
  cuerpo.add(pieza('caja', mat(PALETA.maiaCarcasa, { metal: 0.35, rugosidad: 0.55 }), { pos: [0, 0.75, 0], esc: [0.95, 1.3, 0.8] }));
  cuerpo.add(pieza('caja', mat(PALETA.maiaPantalla, { rugosidad: 0.3 }), { pos: [0, 0.95, 0.41], esc: [0.72, 0.5, 0.04] }));
  const ojoMat = mat(PALETA.maiaOjos, { emisivo: 2.2 });
  const ojos = [-0.16, 0.16].map((x) => pieza('esfera', ojoMat, { pos: [x, 0.97, 0.44], esc: [0.07, 0.07, 0.03], sombra: false }));
  cuerpo.add(...ojos);
  cuerpo.add(pieza('caja', mat('#2f4636'), { pos: [0, 1.45, 0], esc: [1.05, 0.1, 0.9] }));
  cuerpo.add(pieza('cil', mat('#3a2a20'), { pos: [0.25, 1.85, 0], esc: [0.03, 0.8, 0.03] }));
  const punta = pieza('esferaLow', mat(PALETA.maiaOjos, { emisivo: 2.5 }), { pos: [0.25, 2.28, 0], esc: [0.07, 0.07, 0.07], sombra: false });
  cuerpo.add(punta);
  const h = halo(PALETA.maiaOjos, 0.22);
  h.position.set(0.25, 2.4, 0);
  cuerpo.add(h);
  animables.push((t) => {
    h.userData.anima(t);
    cuerpo.scale.y = 1 + Math.sin(t * 1.8) * 0.012;
    const parpadeo = Math.sin(t * 0.9) > 0.985 ? 0.15 : 1;
    ojos.forEach((o) => (o.scale.y = 0.07 * parpadeo));
  });
  return g;
}
