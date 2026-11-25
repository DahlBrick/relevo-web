import * as THREE from 'three';
import { CENTROS, CIENAGA, MAREAS, FORJA } from './estaciones.js';

// Riel de cámara. Cada parada es (T, posición, objetivo) relativa a una estación. Entre paradas la
// cámara viaja por una Catmull-Rom; dentro de cada tramo se frena un poco al llegar, así cada
// parada "respira" mientras se lee el texto.

const K = (T, centro, pos, mira) => ({
  T,
  pos: centro.clone().add(new THREE.Vector3(...pos)),
  mira: centro.clone().add(new THREE.Vector3(...mira)),
});

const C = CENTROS;
const PARADAS = [
  K(0.0, C[1], [0, 15, 50], [0, -1, 8]),
  K(0.55, C[1], [0, 40, 34], [0, 0, -4]),
  K(1.1, C[1], [0, 33, 6], [0, 0, -0.5]),
  K(1.55, C[1], [-3, 28, 9], [0, 0, 0]),
  K(1.92, C[1], [10, 14, 16], [1, 0, -1]),
  K(2.25, C[2], [16, 15, 22], [0, 0, 0]),
  K(2.75, C[2], [-15, 11, 18], [0, 0, -1]),
  K(3.15, C[3], [17, 13, 21], [0, 0, 0]),
  K(3.55, C[3], [-8, 8, 15], [0, 0.5, -1]),
  K(3.9, C[3], [6, 16, 20], [0, 0, -2]),
  K(4.25, C[4], [20, 22, 23], [0, 0, 0]),
  K(4.75, C[4], [-14, 18, 18], [0, 0, -1]),
  K(5.2, C[5], [15, 6, 21], [3, 6, -4]),
  K(5.7, C[5], [-15, 18, 19], [0, 2, -2]),
  K(6.2, C[6], [0, 7, 21], [0, 4, 0]),
  K(6.75, C[6], [9, 9, 17], [0, 4, -3]),
  K(7.15, C[7], [20, 15, 23], [0, 0, 0]),
  K(7.5, C[7], [8, 7, 13], [1, 1, -1]),
  K(7.85, C[7], [-17, 11, 15], [0, 0, -2]),
  K(8.2, C[8], [19, 17, 22], [0, 0, 0]),
  K(8.58, C[8], [12, 8, 14], [11, 1, 2]),
  K(8.88, C[8], [-15, 15, 16], [0, 0, -2]),
  K(9.12, C[9], [0, 40, 52], [0, 0, -2]),
  K(9.38, CIENAGA, [10, 7, 14], [0, 1, -1]),
  K(9.62, MAREAS, [5, 6, 12], [0, 0, -1]),
  K(9.86, FORJA, [-10, 7, 14], [0, 1, -1]),
  // Etapas 10-15: de Liria al Eco del Apagón.
  K(10.15, C[10], [-6, 30, 42], [0, 0, -2]),
  K(10.55, C[10], [20, 13, 27], [0, 1.5, -3]),
  K(10.85, C[10], [-24, 15, 24], [0, 1, -2]),
  K(11.2, C[11], [10, 6, 16], [0, 2, -4]),
  K(11.58, C[11], [2.6, 1.7, 5.8], [-0.3, 0.9, 0]),
  K(11.88, C[11], [-12, 8, 14], [0, 2, -4]),
  K(12.2, C[12], [0, 17, 19], [0, 0, 0]),
  K(12.58, C[12], [8, 7, 12], [2.5, 0.5, 2.5]),
  K(12.88, C[12], [-13, 11, 13], [0, 1, 0]),
  K(13.2, C[13], [17, 13, 21], [0, 0, 0]),
  K(13.55, C[13], [6, 7, 11], [1, 1, -3]),
  K(13.88, C[13], [-15, 16, 18], [0, 0, -2]),
  K(14.2, C[14], [0, 24, 30], [0, 0, -2]),
  K(14.55, C[14], [12, 10, 14], [0, 3, -2]),
  K(14.88, C[14], [-14, 14, 16], [0, 2, -2]),
  K(15.2, C[15], [0, 13, 25], [0, 3, -1]),
  K(15.5, C[15], [11, 5, 13], [0, 4, -2]),
  K(15.85, C[15], [-12, 9, 16], [0, 3, 0]),
  // Final: la isla del key art.
  K(16.3, C[16], [0.5, 2.7, 7.8], [-0.4, 1.6, 0]),
  K(16.95, C[16], [-2.4, 3.4, 10], [-0.5, 1.8, -0.5]),
];

const curvaPos = new THREE.CatmullRomCurve3(PARADAS.map((p) => p.pos), false, 'centripetal');
const curvaMira = new THREE.CatmullRomCurve3(PARADAS.map((p) => p.mira), false, 'centripetal');
const N = PARADAS.length - 1;

export function railEn(T, pos, mira) {
  let k = 0;
  while (k < N - 1 && T > PARADAS[k + 1].T) k++;
  const a = PARADAS[k];
  const b = PARADAS[k + 1];
  let f = THREE.MathUtils.clamp((T - a.T) / (b.T - a.T), 0, 1);
  // Mezcla entre lineal y suavizado: frena sin detenerse del todo.
  f = THREE.MathUtils.lerp(f, f * f * (3 - 2 * f), 0.7);
  const u = (k + f) / N;
  curvaPos.getPoint(u, pos);
  curvaMira.getPoint(u, mira);
}

export const T_MAX = PARADAS[PARADAS.length - 1].T;
