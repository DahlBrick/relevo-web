import * as THREE from 'three';
import { robotClonado, clipsDe, instancia } from './assets.js';
import { PALETA } from './paleta.js';
import { mat, pieza, halo } from './diorama.js';

// Nilo: el robot animado de Quaternius pintado con los colores del GDD, con bufanda naranja,
// antena con luz cian, ojos luminosos sobre las lentes y la batería a la espalda
// (AnimadorNiloModelo.cs y ActorFactory.CrearNiloModelo).

const COLORES = { Main: PALETA.niloCarcasa, Grey: PALETA.niloExtremidades, Black: PALETA.niloPantalla };
const ANTENA = { lleno: new THREE.Color(PALETA.niloOjos), medio: new THREE.Color(PALETA.ambar), bajo: new THREE.Color(PALETA.coral), vacio: new THREE.Color('#ff1a0d') };
const v = new THREE.Vector3();

function pegarAHueso(obj, hueso, posMundo) {
  hueso.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(hueso.matrixWorld).invert();
  obj.position.copy(posMundo).applyMatrix4(inv);
  const s = new THREE.Vector3();
  hueso.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
  obj.scale.divide(s);
  const q = new THREE.Quaternion();
  hueso.getWorldQuaternion(q);
  obj.quaternion.copy(q.invert());
  hueso.add(obj);
}

export function crearNilo({ altura = 1.75, bateria = false } = {}) {
  const raiz = new THREE.Group();
  const robot = robotClonado();
  raiz.add(robot);

  // Normalizar altura en la pose de reposo.
  robot.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(robot);
  const s = altura / caja.getSize(v).y;
  robot.scale.multiplyScalar(s);
  robot.position.y = -caja.min.y * s;
  raiz.updateMatrixWorld(true);

  const materiales = {};
  robot.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const lista = Array.isArray(o.material) ? o.material : [o.material];
    const nuevos = lista.map((m) => {
      if (!materiales[m.name]) {
        materiales[m.name] = new THREE.MeshStandardMaterial({
          name: m.name,
          color: new THREE.Color(COLORES[m.name] || PALETA.niloCarcasa),
          roughness: m.name === 'Black' ? 0.25 : 0.55,
          metalness: m.name === 'Main' ? 0.1 : 0.2,
        });
      }
      return materiales[m.name];
    });
    o.material = Array.isArray(o.material) ? nuevos : nuevos[0];
  });

  // Las piezas se enganchan sobre la pose de reposo animada (Idle), no sobre la de enlace del FBX.
  const mixer = new THREE.AnimationMixer(robot);
  const acciones = {};
  for (const clip of clipsDe('robot')) {
    const nombre = clip.name.split('|').pop().replace('Robot_', '');
    acciones[nombre] = mixer.clipAction(clip);
  }
  acciones.Idle?.play();
  mixer.update(0);
  raiz.updateMatrixWorld(true);

  const hueso = (n) => robot.getObjectByName(n);
  const cabeza = hueso('Head');
  const cuello = hueso('Neck') || cabeza;
  const torso = hueso('Torso') || hueso('Body');
  const finCabeza = hueso('Head_end') || cabeza;

  // Hacia dónde mira el modelo: hacia sus lentes. Se gira para que mire a +Z, como el resto del código.
  let pCabeza = cabeza.getWorldPosition(new THREE.Vector3());
  const negros = verticesNegros(robot, pCabeza.y - altura * 0.08);
  if (negros.length) {
    const cent = negros.reduce((acc, p) => acc.add(p), new THREE.Vector3()).multiplyScalar(1 / negros.length);
    const fwd = cent.sub(pCabeza).setY(0);
    if (fwd.lengthSq() > 1e-6) robot.rotation.y -= Math.atan2(fwd.x, fwd.z);
    raiz.updateMatrixWorld(true);
  }
  pCabeza = cabeza.getWorldPosition(new THREE.Vector3());
  const pCuello = cuello.getWorldPosition(new THREE.Vector3());
  const pTope = finCabeza.getWorldPosition(new THREE.Vector3());

  // Ojos: se buscan las lentes en la propia malla (vértices del material Black en la cabeza).
  const ojos = [];
  const ojoMat = new THREE.MeshStandardMaterial({ color: PALETA.niloOjos, emissive: PALETA.niloOjos, emissiveIntensity: 2.6, roughness: 0.3 });
  const lentes = buscarLentes(verticesNegros(robot, pCabeza.y - altura * 0.08));
  const radioOjo = altura * 0.045;
  for (const l of lentes) {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), ojoMat);
    ojo.scale.set(radioOjo, radioOjo, radioOjo * 0.45);
    pegarAHueso(ojo, cabeza, l);
    ojos.push(ojo);
  }

  // Antena con luz.
  const antena = new THREE.Group();
  const antenaMat = new THREE.MeshStandardMaterial({ color: PALETA.niloOjos, emissive: PALETA.niloOjos, emissiveIntensity: 3, roughness: 0.3 });
  antena.add(pieza('cil', mat('#3a2a20'), { pos: [0, altura * 0.12, 0], esc: [altura * 0.012, altura * 0.24, altura * 0.012] }));
  const bombilla = new THREE.Mesh(new THREE.SphereGeometry(altura * 0.04, 14, 10), antenaMat);
  bombilla.position.y = altura * 0.25;
  antena.add(bombilla);
  const aro = halo(PALETA.niloOjos, altura * 0.08);
  aro.position.y = altura * 0.3;
  antena.add(aro);
  const pAntena = pTope.clone();
  pegarAHueso(antena, cabeza, pAntena);

  // Bufanda naranja colgada del cuello, con dos puntas que ondean.
  const bufanda = new THREE.Group();
  const bufMat = mat(PALETA.niloBufanda, { rugosidad: 0.85 });
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(altura * 0.115, altura * 0.04, 8, 20), bufMat);
  anillo.rotation.x = Math.PI / 2;
  anillo.castShadow = true;
  bufanda.add(anillo);
  const puntas = [0, 1].map((i) => {
    const p = new THREE.Group();
    p.position.set((i ? 0.04 : -0.04) * altura, 0, -altura * 0.1);
    const tela = pieza('caja', bufMat, { pos: [0, -altura * 0.09, -altura * 0.01], esc: [altura * 0.07, altura * 0.18, altura * 0.025] });
    p.add(tela);
    bufanda.add(p);
    return p;
  });
  pegarAHueso(bufanda, cuello, pCuello.clone().add(new THREE.Vector3(0, -altura * 0.02, 0)));

  // Batería a la espalda (colgada del torso para que el balanceo de los brazos no la atraviese).
  let celda = null;
  if (bateria && torso) {
    celda = instancia('space/machine_barrel', { altura: altura * 0.36, tinte: '#ffcf8a' });
    const brillo = pieza('cil', mat(PALETA.ambar, { emisivo: 2.2 }), { pos: [0, altura * 0.19, 0], esc: [altura * 0.1, altura * 0.025, altura * 0.1], sombra: false });
    celda.add(brillo);
    const pT = torso.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -altura * 0.12, -altura * 0.17));
    pegarAHueso(celda, torso, pT);
  }

  let actual = acciones.Idle || null;
  function reproducir(nombre, { fundido = 0.35, una = false, velocidad = 1 } = {}) {
    const a = acciones[nombre];
    if (!a || a === actual) return a;
    a.reset();
    a.setLoop(una ? THREE.LoopOnce : THREE.LoopRepeat);
    a.clampWhenFinished = una;
    a.timeScale = velocidad;
    a.play();
    if (actual && fundido > 0) actual.crossFadeTo(a, fundido, false);
    else if (actual) actual.stop();
    actual = a;
    return a;
  }

  let energia = 1;
  let apagado = 0;
  const colorTmp = new THREE.Color();
  return {
    grupo: raiz,
    mixer,
    acciones,
    reproducir,
    get actual() {
      return actual;
    },
    set energia(e) {
      energia = e;
    },
    set apagado(a) {
      apagado = a;
    },
    actualizar(dt, t) {
      mixer.timeScale = 1 - apagado * 0.97;
      mixer.update(dt);
      // Antena: turquesa con carga, ámbar a media carga, coral y parpadeo cuando queda poca, roja al apagarse.
      if (energia > 0.6) colorTmp.copy(ANTENA.medio).lerp(ANTENA.lleno, (energia - 0.6) / 0.4);
      else if (energia > 0.3) colorTmp.copy(ANTENA.bajo).lerp(ANTENA.medio, (energia - 0.3) / 0.3);
      else colorTmp.copy(ANTENA.vacio).lerp(ANTENA.bajo, energia / 0.3);
      antenaMat.color.copy(colorTmp);
      antenaMat.emissive.copy(colorTmp);
      const parpadeo = energia < 0.3 ? (Math.sin(t * (apagado > 0.05 ? 18 : 9)) > 0 ? 1 : 0.25) : 1;
      antenaMat.emissiveIntensity = 3.2 * parpadeo;
      ojoMat.emissiveIntensity = 2.6 * (1 - apagado);
      ojoMat.color.setRGB(0.21 * (1 - apagado) + 0.05, 0.88 * (1 - apagado) + 0.06, 0.9 * (1 - apagado) + 0.08);
      aro.visible = apagado < 0.5;
      aro.userData.anima(t);
      // La cabeza cae hacia el pecho y el cuerpo se asienta.
      if (apagado > 0) {
        cabeza.rotation.x += apagado * 0.75;
      }
      // Bufanda y antena reaccionan a la marcha.
      const marcha = actual === acciones.Walking ? 1 : actual === acciones.Running ? 1.6 : 0.35;
      puntas.forEach((p, i) => (p.rotation.x = -0.25 - Math.sin(t * 6 + i) * 0.18 * marcha * (1 - apagado)));
      antena.rotation.z = Math.sin(t * 5) * 0.06 * marcha * (1 - apagado);
    },
  };
}

/** Vértices del material Black por encima de una altura, en la pose actual. Recorre todas las mallas:
 *  la cabeza es una malla aparte, hija del hueso "Head" (la bitácora del juego lo cuenta en la Entrada 12). */
function verticesNegros(raiz, alturaMin) {
  const puntos = [];
  raiz.updateMatrixWorld(true);
  raiz.traverse((malla) => {
    if (!malla.isMesh) return;
    const geo = malla.geometry;
    const pos = geo.attributes.position;
    const grupos = geo.groups.length ? geo.groups : [{ start: 0, count: geo.index ? geo.index.count : pos.count, materialIndex: 0 }];
    const mats = Array.isArray(malla.material) ? malla.material : [malla.material];
    const vistos = new Set();
    malla.skeleton?.update();
    for (const g of grupos) {
      if (mats[g.materialIndex]?.name !== 'Black') continue;
      for (let k = g.start; k < g.start + g.count; k++) {
        const idx = geo.index ? geo.index.getX(k) : k;
        if (vistos.has(idx)) continue;
        vistos.add(idx);
        v.fromBufferAttribute(pos, idx);
        if (malla.isSkinnedMesh) malla.applyBoneTransform(idx, v);
        v.applyMatrix4(malla.matrixWorld);
        if (v.y > alturaMin) puntos.push(v.clone());
      }
    }
  });
  return puntos;
}

/** Centros de las dos lentes. Las lentes son esferas con muchos vértices y las cejas son barras con
 *  pocos, así que la mediana de cada lado cae en la lente; el frente es el punto más adelantado cerca de ella. */
function buscarLentes(puntos) {
  if (puntos.length < 6) return [];
  const mediana = (arr) => {
    const o = [...arr].sort((x, y) => x - y);
    return o[Math.floor(o.length / 2)];
  };
  const xMedio = mediana(puntos.map((p) => p.x));
  const lados = [puntos.filter((p) => p.x < xMedio - 0.01), puntos.filter((p) => p.x > xMedio + 0.01)];
  return lados
    .filter((l) => l.length > 3)
    .map((l) => {
      const cx = mediana(l.map((p) => p.x));
      const cy = mediana(l.map((p) => p.y));
      const cerca = l.filter((p) => Math.hypot(p.x - cx, p.y - cy) < 0.07);
      const zFrente = Math.max(...(cerca.length ? cerca : l).map((p) => p.z));
      return new THREE.Vector3(cx, cy, zFrente + 0.008);
    });
}

/** Nilo de la Etapa 3: primitivas (cabeza esférica, visor, bufanda, antena con halo). */
export function crearNiloPrimitivo(animables) {
  const g = new THREE.Group();
  const carcasa = mat(PALETA.niloCarcasa, { rugosidad: 0.5 });
  const azul = mat(PALETA.niloExtremidades, { rugosidad: 0.6 });
  g.add(pieza('cil', mat('#4a3527'), { pos: [0, 0.03, 0], esc: [0.55, 0.06, 0.55] }));
  [-0.17, 0.17].forEach((x) => {
    g.add(pieza('caja', azul, { pos: [x, 0.25, 0], esc: [0.18, 0.45, 0.2] }));
    g.add(pieza('caja', azul, { pos: [x, 0.06, 0.05], esc: [0.22, 0.1, 0.32] }));
  });
  const cuerpo = new THREE.Group();
  g.add(cuerpo);
  cuerpo.add(pieza('caja', carcasa, { pos: [0, 0.8, 0], esc: [0.62, 0.7, 0.45] }));
  [-0.4, 0.4].forEach((x) => cuerpo.add(pieza('caja', azul, { pos: [x, 0.8, 0], esc: [0.14, 0.55, 0.16] })));
  cuerpo.add(pieza('cil', mat(PALETA.niloBufanda), { pos: [0, 1.17, 0], esc: [0.4, 0.12, 0.32] }));
  const cabeza = new THREE.Group();
  cabeza.position.y = 1.5;
  cuerpo.add(cabeza);
  cabeza.add(pieza('esfera', carcasa, { esc: [0.36, 0.34, 0.36] }));
  cabeza.add(pieza('caja', mat(PALETA.niloPantalla, { rugosidad: 0.3 }), { pos: [0, 0, 0.3], esc: [0.42, 0.18, 0.1] }));
  const ojo = mat(PALETA.niloOjos, { emisivo: 2.6 });
  [-0.1, 0.1].forEach((x) => cabeza.add(pieza('esfera', ojo, { pos: [x, 0, 0.36], esc: [0.06, 0.06, 0.03], sombra: false })));
  cabeza.add(pieza('cil', mat('#4a3527'), { pos: [0, 0.48, 0], esc: [0.02, 0.4, 0.02] }));
  cabeza.add(pieza('esferaLow', mat(PALETA.niloOjos, { emisivo: 3 }), { pos: [0, 0.7, 0], esc: [0.06, 0.06, 0.06], sombra: false }));
  const h = halo(PALETA.niloOjos, 0.16);
  h.position.y = 0.8;
  cabeza.add(h);
  animables.push((t) => {
    h.userData.anima(t);
    cuerpo.position.y = Math.sin(t * 2) * 0.015;
    cabeza.rotation.y = Math.sin(t * 0.7) * 0.3;
  });
  return g;
}
