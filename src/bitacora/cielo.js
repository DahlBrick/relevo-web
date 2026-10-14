import * as THREE from 'three';
import { uAgua } from './agua.js';

// Cielo en gradiente con sol, luna y estrellas, más los "ambientes" por tramo de la bitácora:
// cada etapa tiene su hora del día. El GDD sitúa la aventura "durante una tarde".

export function crearCielo() {
  const uniforms = {
    uArriba: { value: new THREE.Color() },
    uHorizonte: { value: new THREE.Color() },
    uAbajo: { value: new THREE.Color() },
    uSolDir: uAgua.uSolDir,
    uSolColor: uAgua.uSolColor,
    uEstrellas: { value: 0 },
    uLuna: { value: 0 },
    uTiempo: uAgua.uTiempo,
  };
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uArriba, uHorizonte, uAbajo, uSolDir, uSolColor; uniform float uEstrellas, uLuna, uTiempo;
      varying vec3 vDir;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizonte, uArriba, smoothstep(0.0, 0.55, h));
        col = mix(col, uAbajo, smoothstep(0.0, -0.25, h));
        float s = max(dot(d, normalize(uSolDir)), 0.0);
        col += uSolColor * (pow(s, 1400.0) * 4.0 + pow(s, 60.0) * 0.22 + pow(s, 8.0) * 0.06);
        // Estrellas
        vec3 c = floor(d * 260.0);
        float st = step(0.9975, hash(c)) * smoothstep(0.05, 0.4, h);
        st *= 0.6 + 0.4 * sin(uTiempo * 2.0 + hash(c + 1.0) * 30.0);
        col += vec3(0.9, 0.95, 1.0) * st * uEstrellas * 1.6;
        // Luna
        vec3 ld = normalize(vec3(0.55, 0.22, -0.8));
        float l = dot(d, ld);
        col += vec3(1.0, 0.94, 0.8) * (smoothstep(0.9993, 0.9996, l) * 2.5 + pow(max(l, 0.0), 60.0) * 0.25) * uLuna;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const malla = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
  malla.frustumCulled = false;
  malla.renderOrder = -10;
  return { malla, uniforms };
}

// Ambientes: T es el "tiempo de la historia" (número de capítulo + fracción recorrida).
const A = (T, o) => ({ T, ...o });
export const AMBIENTES = [
  A(0.0, { arriba: '#2f6d93', horizonte: '#f0b98a', abajo: '#1f3d48', sol: '#ffc58a', solAlt: 0.16, solAz: -0.55, niebla: '#8fa6a8', cerca: 90, lejos: 520, profundo: '#13403f', somero: '#2f8a80', luz: 2.6, amb: 0.9, estrellas: 0, luna: 0 }),
  A(1.2, { arriba: '#3f8fc0', horizonte: '#bfe3e6', abajo: '#2a4a55', sol: '#fff1d6', solAlt: 0.62, solAz: -0.3, niebla: '#9cc4cc', cerca: 70, lejos: 340, profundo: '#1a6aa6', somero: '#5fd0f0', luz: 2.9, amb: 1.1, estrellas: 0, luna: 0 }),
  // El graybox de Unity: cielo gris del editor.
  A(2.2, { arriba: '#5a5f66', horizonte: '#8d8a84', abajo: '#47443f', sol: '#fffaf0', solAlt: 0.7, solAz: 0.2, niebla: '#7c7a76', cerca: 50, lejos: 240, profundo: '#3b3d40', somero: '#5b5e60', luz: 2.6, amb: 1.2, estrellas: 0, luna: 0 }),
  A(3.2, { arriba: '#4f7f99', horizonte: '#f0caa0', abajo: '#2e4650', sol: '#ffd9a0', solAlt: 0.32, solAz: 0.5, niebla: '#8fa3a5', cerca: 55, lejos: 260, profundo: '#123d3b', somero: '#2a7a72', luz: 2.8, amb: 0.95, estrellas: 0, luna: 0 }),
  A(5.3, { arriba: '#3c5f80', horizonte: '#f7b27a', abajo: '#2a3a46', sol: '#ffb877', solAlt: 0.14, solAz: 0.8, niebla: '#9a8a80', cerca: 55, lejos: 250, profundo: '#11353a', somero: '#2a6a6a', luz: 2.4, amb: 0.8, estrellas: 0.15, luna: 0 }),
  // Interfaz: azul verdoso profundo del HUD.
  A(6.3, { arriba: '#0e2a33', horizonte: '#2d6a6a', abajo: '#0a1c1f', sol: '#8ff3e6', solAlt: 0.3, solAz: 0.2, niebla: '#16383c', cerca: 40, lejos: 200, profundo: '#071d20', somero: '#1c5450', luz: 1.6, amb: 0.7, estrellas: 0.5, luna: 0 }),
  A(7.3, { arriba: '#4a86a6', horizonte: '#f5d0a2', abajo: '#2e4650', sol: '#ffd9a0', solAlt: 0.3, solAz: -0.5, niebla: '#8aa3a6', cerca: 60, lejos: 280, profundo: '#123d3b', somero: '#2a7a72', luz: 3.0, amb: 1.0, estrellas: 0, luna: 0 }),
  A(8.4, { arriba: '#3e6f8c', horizonte: '#efb889', abajo: '#2a3e48', sol: '#ffc58a', solAlt: 0.22, solAz: -0.7, niebla: '#8a8f8c', cerca: 55, lejos: 260, profundo: '#113636', somero: '#286a66', luz: 2.7, amb: 0.9, estrellas: 0, luna: 0 }),
  A(9.3, { arriba: '#1b2a2c', horizonte: '#55604c', abajo: '#141a16', sol: '#c9e0a0', solAlt: 0.1, solAz: -0.2, niebla: '#3d4a3c', cerca: 35, lejos: 190, profundo: '#0d1a16', somero: '#22352a', luz: 1.4, amb: 0.65, estrellas: 0.2, luna: 0.3 }),
  // Mareas de Liria: luz dorada con el agua baja, como en su maqueta.
  A(9.62, { arriba: '#3c6f92', horizonte: '#f2b07a', abajo: '#24404a', sol: '#ffc078', solAlt: 0.12, solAz: 0.1, niebla: '#7d8c8e', cerca: 45, lejos: 210, profundo: '#123d3b', somero: '#2a7a72', luz: 2.4, amb: 0.9, estrellas: 0, luna: 0 }),
  A(9.85, { arriba: '#1e1012', horizonte: '#a1452a', abajo: '#1a0c0a', sol: '#ff7a3a', solAlt: 0.08, solAz: 0.3, niebla: '#4a2418', cerca: 30, lejos: 170, profundo: '#160e0c', somero: '#3a2018', luz: 1.8, amb: 0.6, estrellas: 0.3, luna: 0.2 }),
  // Final: como el key art, lava a un lado, agua y luna al otro.
  A(10.4, { arriba: '#0f1c2e', horizonte: '#c46a3c', abajo: '#0e1418', sol: '#ffa060', solAlt: 0.06, solAz: -0.9, niebla: '#2b2f3a', cerca: 45, lejos: 230, profundo: '#0b2a33', somero: '#1f6f73', luz: 1.9, amb: 0.65, estrellas: 1, luna: 1 }),
];

const NUM = ['solAlt', 'solAz', 'cerca', 'lejos', 'luz', 'amb', 'estrellas', 'luna'];
const COL = ['arriba', 'horizonte', 'abajo', 'sol', 'niebla', 'profundo', 'somero'];
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

export function ambienteEn(T, salida) {
  let i = 0;
  while (i < AMBIENTES.length - 2 && T > AMBIENTES[i + 1].T) i++;
  const a = AMBIENTES[i];
  const b = AMBIENTES[i + 1];
  let f = THREE.MathUtils.clamp((T - a.T) / (b.T - a.T), 0, 1);
  f = f * f * (3 - 2 * f);
  for (const k of NUM) salida[k] = THREE.MathUtils.lerp(a[k], b[k], f);
  for (const k of COL) {
    salida[k] = salida[k] || new THREE.Color();
    salida[k].copy(tmpA.set(a[k])).lerp(tmpB.set(b[k]), f);
  }
  return salida;
}
