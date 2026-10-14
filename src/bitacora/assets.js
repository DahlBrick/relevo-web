import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { PALETA } from './paleta.js';
import { conViento } from './viento.js';

// Catálogo de modelos CC0 usados por el juego (Kenney y Quaternius). Clave → ruta.
const KENNEY = {
  pirate: ['barrel', 'crate', 'crate-bottles', 'boat-row-small', 'boat-row-large', 'ship-small', 'ship-wreck', 'ship-ghost', 'platform', 'structure-platform-dock', 'tower-complete-large', 'rocks-a', 'rocks-b', 'rocks-c', 'flag-pennant', 'chest'],
  town: ['lantern', 'pillar-stone', 'pillar-wood', 'banner-green', 'fence', 'tree', 'tree-high-round', 'rock-large', 'rock-small', 'stall-green', 'windmill', 'watermill', 'fountain-round', 'planks'],
  graveyard: ['pine-crooked', 'pine-fall-crooked', 'gravestone-cross', 'gravestone-round', 'gravestone-broken', 'crypt', 'iron-fence-damaged', 'lightpost-single', 'candle-multiple', 'fire-basket', 'character-ghost', 'coffin-old', 'lantern-candle', 'rocks-tall'],
  castle: ['tower-hexagon-base', 'tower-hexagon-mid', 'tower-square-mid', 'wall-half', 'rocks-large', 'rocks-small', 'tree-log', 'siege-catapult-demolished', 'siege-tower-demolished', 'flag-banner-long', 'tree-trunk'],
  watercraft: ['buoy', 'buoy-flag', 'boat-fishing-small', 'boat-sail-a'],
  space: ['machine_generator', 'machine_barrel', 'machine_wireless', 'desk_computerScreen'],
};
const NATURE = ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'Bush_Common', 'Bush_Common_Flowers', 'Fern_1', 'Grass_Common_Tall', 'Grass_Wispy_Tall', 'Flower_3_Group', 'Flower_4_Group', 'Rock_Medium_1', 'Rock_Medium_2', 'Pebble_Round_2', 'Pebble_Round_4', 'RockPath_Square_Wide', 'TwistedTree_1', 'DeadTree_2', 'Plant_1_Big', 'Mushroom_Common'];

// Las texturas *_C de Quaternius son máscaras para su shader de pago (la bitácora lo cuenta en la
// Entrada 3: "árboles rojos"). Igual que en Unity, se usan las hojas blancas y se tiñen con la paleta.
const HOJAS_BLANCAS = {
  'Leaves_NormalTree_C.png': 'Leaves_NormalTree.png',
  'Leaves_TwistedTree_C.png': 'Leaves_TwistedTree.png',
  'Leaf_Pine_C.png': 'Leaf_Pine.png',
};

const modelos = new Map();
const animaciones = new Map();
let texturasHojas = {};

/** Carga ligera para páginas que solo necesitan a Nilo (y la celda de batería). */
export async function cargarRobot() {
  const fbx = new FBXLoader();
  const gltf = new GLTFLoader();
  const [obj, celda] = await Promise.all([fbx.loadAsync(import.meta.env.BASE_URL + 'models/robot/Robot.fbx'), gltf.loadAsync(import.meta.env.BASE_URL + 'models/kenney/space/machine_barrel.glb')]);
  modelos.set('robot', obj);
  animaciones.set('robot', obj.animations);
  prepararKenney(celda.scene);
  modelos.set('space/machine_barrel', celda.scene);
}

export async function cargarTodo(onProgreso) {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, hechos, total) => onProgreso?.(hechos / total);
  const gltf = new GLTFLoader(manager);
  const fbx = new FBXLoader(manager);
  const tex = new THREE.TextureLoader(manager);

  const tareas = [];
  for (const [kit, lista] of Object.entries(KENNEY)) {
    for (const nombre of lista) {
      tareas.push(
        gltf.loadAsync(`${import.meta.env.BASE_URL}models/kenney/${kit}/${nombre}.glb`).then((g) => {
          prepararKenney(g.scene);
          modelos.set(`${kit}/${nombre}`, g.scene);
        }),
      );
    }
  }
  for (const nombre of NATURE) {
    tareas.push(
      gltf.loadAsync(`${import.meta.env.BASE_URL}models/nature/${nombre}.gltf`).then((g) => {
        modelos.set(`nature/${nombre}`, g.scene);
      }),
    );
  }
  for (const blanca of new Set(Object.values(HOJAS_BLANCAS))) {
    tareas.push(
      tex.loadAsync(`${import.meta.env.BASE_URL}models/nature/${blanca}`).then((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.flipY = false;
        texturasHojas[blanca] = t;
      }),
    );
  }
  tareas.push(
    fbx.loadAsync(import.meta.env.BASE_URL + 'models/robot/Robot.fbx').then((obj) => {
      modelos.set('robot', obj);
      animaciones.set('robot', obj.animations);
    }),
  );
  tareas.push(
    fbx.loadAsync(import.meta.env.BASE_URL + 'models/robot/Fish1.fbx').then((obj) => {
      modelos.set('fish', obj);
      animaciones.set('fish', obj.animations);
    }),
  );

  await Promise.all(tareas);
  for (const nombre of NATURE) prepararNaturaleza(modelos.get(`nature/${nombre}`));
}

function prepararKenney(raiz) {
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const m = o.material;
    if (m && m.isMeshStandardMaterial) {
      m.roughness = Math.max(m.roughness, 0.72);
      m.metalness = Math.min(m.metalness, 0.15);
      if (m.map) m.map.anisotropy = 4;
    }
  });
}

const TINTES_HOJAS = {
  Leaves_NormalTree: '#a7c77e',
  Leaves_TwistedTree: '#9dbb72',
  Leaves_Pine: '#7e9e6a',
  Leaves: '#9cc274',
  Grass: '#a9c477',
  Flowers: '#ffffff',
};

function prepararNaturaleza(raiz) {
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const materiales = Array.isArray(o.material) ? o.material : [o.material];
    const nuevos = materiales.map((m) => {
      const nombre = m.name || '';
      const esFollaje = /Leaves|Leaf|Grass|Flowers|Fern|Plant/i.test(nombre) || m.alphaTest > 0 || m.transparent;
      if (!esFollaje) {
        m.roughness = 0.9;
        m.metalness = 0;
        return m;
      }
      const src = m.map?.userData?.uri || m.map?.name || '';
      const clave = Object.keys(HOJAS_BLANCAS).find((k) => src.includes(k.replace('.png', '')));
      const nuevo = new THREE.MeshStandardMaterial({
        name: nombre,
        map: clave ? texturasHojas[HOJAS_BLANCAS[clave]] : m.map,
        color: new THREE.Color(TINTES_HOJAS[nombre] || PALETA.vegetacion),
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        roughness: 0.85,
        metalness: 0,
      });
      if (!clave && /Leaves_NormalTree|Leaves_TwistedTree|Leaves_Pine/.test(nombre)) {
        // Si el nombre de la textura no llegó por userData, se resuelve por el nombre del material.
        const porNombre = { Leaves_NormalTree: 'Leaves_NormalTree.png', Leaves_TwistedTree: 'Leaves_TwistedTree.png', Leaves_Pine: 'Leaf_Pine.png' }[nombre];
        if (porNombre) nuevo.map = texturasHojas[porNombre];
      }
      conViento(nuevo);
      return nuevo;
    });
    o.material = Array.isArray(o.material) ? nuevos : nuevos[0];
  });
}

/** Copia de un modelo, normalizada opcionalmente a una altura o anchura dadas. */
export function instancia(clave, { altura, ancho, tinte } = {}) {
  const base = modelos.get(clave);
  if (!base) {
    console.warn('[relevo] falta el modelo', clave);
    return new THREE.Group();
  }
  const copia = base.clone(true);
  if (tinte) teñir(copia, tinte);
  if (altura || ancho) {
    const caja = new THREE.Box3().setFromObject(copia);
    const tam = caja.getSize(new THREE.Vector3());
    const s = altura ? altura / tam.y : ancho / Math.max(tam.x, tam.z);
    copia.scale.multiplyScalar(s);
  }
  const envoltorio = new THREE.Group();
  envoltorio.add(copia);
  return envoltorio;
}

const cacheTintes = new Map();
/** Tiñe todos los materiales de un modelo, guardando la caché por material y por tinte
 *  (la bitácora, Entrada 16: "los pinos de colores chillones"). */
export function teñir(obj, tinte) {
  const c = new THREE.Color(tinte);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map((m) => {
      const k = `${m.uuid}|${c.getHexString()}`;
      if (!cacheTintes.has(k)) {
        const n = m.clone();
        n.color = n.color ? n.color.clone().multiply(c) : c.clone();
        if (m.userData.viento) conViento(n);
        cacheTintes.set(k, n);
      }
      return cacheTintes.get(k);
    });
    o.material = Array.isArray(o.material) ? out : out[0];
  });
  return obj;
}

export function robotClonado() {
  return cloneSkinned(modelos.get('robot'));
}
export function pezClonado() {
  return cloneSkinned(modelos.get('fish'));
}
export function clipsDe(clave) {
  return animaciones.get(clave) || [];
}
