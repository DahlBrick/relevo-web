import * as THREE from 'three';
import { instancia } from './assets.js';

// Lo que hace que el mundo se sienta vivo mientras se recorre: gaviotas (Gaviotas.cs), barcas y
// boyas que se mecen (Flotador.cs), polen y luciérnagas, brasas que suben y humo.

const uTiempo = { value: 0 };
export function tickVida(t) {
  uTiempo.value = t;
}

// ───────── Aves ─────────
function geometriaAve() {
  // Cuerpo y dos alas; el aleteo se hace en el vértice según la distancia al eje.
  const g = new THREE.BufferGeometry();
  const p = [
    // ala izquierda
    0, 0, 0.18, -0.9, 0.05, -0.05, 0, 0, -0.22,
    // ala derecha
    0, 0, 0.18, 0, 0, -0.22, 0.9, 0.05, -0.05,
    // cuerpo
    0, 0.04, 0.35, -0.08, 0, -0.3, 0.08, 0, -0.3,
  ];
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  return g;
}

export function crearAves(cantidad, centros, { color = '#f4efe6', radio = 22, altura = [7, 14] } = {}) {
  const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.8 });
  material.onBeforeCompile = (s) => {
    s.uniforms.uTiempo = uTiempo;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTiempo;\nattribute float aFase;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float ala = abs(position.x);
         transformed.y += sin(uTiempo * 7.0 + aFase) * ala * 0.55;`,
      );
  };
  const geo = geometriaAve();
  const malla = new THREE.InstancedMesh(geo, material, cantidad);
  const fases = new Float32Array(cantidad);
  const datos = [];
  for (let i = 0; i < cantidad; i++) {
    fases[i] = Math.random() * 10;
    const c = centros[i % centros.length];
    datos.push({
      c,
      r: radio * (0.45 + Math.random() * 0.7),
      h: altura[0] + Math.random() * (altura[1] - altura[0]),
      v: (0.12 + Math.random() * 0.12) * (Math.random() > 0.5 ? 1 : -1),
      f: Math.random() * Math.PI * 2,
      e: 0.5 + Math.random() * 0.35,
    });
  }
  geo.setAttribute('aFase', new THREE.InstancedBufferAttribute(fases, 1));
  malla.castShadow = true;
  malla.frustumCulled = false;
  const m = new THREE.Object3D();
  malla.userData.actualizar = (t) => {
    datos.forEach((d, i) => {
      const a = d.f + t * d.v;
      m.position.set(d.c.x + Math.cos(a) * d.r, d.h + Math.sin(t * 0.6 + d.f) * 0.8, d.c.z + Math.sin(a) * d.r * 0.7);
      const sg = Math.sign(d.v);
      m.rotation.set(0, Math.atan2(-Math.sin(a) * sg, Math.cos(a) * 0.7 * sg), -sg * 0.35);
      m.scale.setScalar(d.e);
      m.updateMatrix();
      malla.setMatrixAt(i, m.matrix);
    });
    malla.instanceMatrix.needsUpdate = true;
  };
  return malla;
}

// ───────── Partículas ─────────
function texturaPunto() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const PUNTO = texturaPunto();

/**
 * Nube de partículas alrededor de un centro.
 * modo 'deriva': polen/luciérnagas que flotan; 'sube': brasas o humo que ascienden y reaparecen.
 */
export function crearParticulas({ centro, cantidad = 200, caja = [30, 8, 30], color = '#ffd27a', tam = 0.18, modo = 'deriva', velocidad = 1, intensidad = 1.6, aditivo = true, opacidad = 1 }) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(cantidad * 3);
  const sem = new Float32Array(cantidad);
  for (let i = 0; i < cantidad; i++) {
    pos[i * 3] = (Math.random() - 0.5) * caja[0];
    pos[i * 3 + 1] = Math.random() * caja[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * caja[2];
    sem[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSemilla', new THREE.BufferAttribute(sem, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTiempo,
      uMapa: { value: PUNTO },
      uColor: { value: new THREE.Color(color) },
      uTam: { value: tam },
      uAlto: { value: caja[1] },
      uVel: { value: velocidad },
      uSube: { value: modo === 'sube' ? 1 : 0 },
      uIntensidad: { value: intensidad },
      uOpacidad: { value: opacidad },
    },
    vertexShader: /* glsl */ `
      uniform float uTiempo, uTam, uAlto, uVel, uSube;
      attribute float aSemilla;
      varying float vBrillo; varying float vVida;
      void main(){
        vec3 p = position;
        float t = uTiempo * uVel;
        if (uSube > 0.5){
          float y = mod(p.y + t * (0.8 + aSemilla), uAlto);
          vVida = y / uAlto;
          p.y = y;
          p.x += sin(t * 0.7 + aSemilla * 20.0) * 0.6 * vVida;
          p.z += cos(t * 0.5 + aSemilla * 13.0) * 0.6 * vVida;
        } else {
          vVida = 0.5;
          p.x += sin(t * 0.3 + aSemilla * 30.0) * 1.2;
          p.y += sin(t * 0.5 + aSemilla * 17.0) * 0.6;
          p.z += cos(t * 0.27 + aSemilla * 23.0) * 1.2;
        }
        vBrillo = 0.55 + 0.45 * sin(uTiempo * (1.5 + aSemilla * 3.0) + aSemilla * 40.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uTam * (0.6 + aSemilla) * 600.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMapa; uniform vec3 uColor; uniform float uSube, uIntensidad, uOpacidad;
      varying float vBrillo; varying float vVida;
      void main(){
        float a = texture2D(uMapa, gl_PointCoord).a;
        float vida = uSube > 0.5 ? sin(vVida * 3.14159) : 1.0;
        gl_FragColor = vec4(uColor * uIntensidad, a * vBrillo * vida * uOpacidad);
      }
    `,
  });
  const puntos = new THREE.Points(geo, mat);
  puntos.position.copy(centro);
  puntos.frustumCulled = false;
  return puntos;
}

// ───────── Flotadores ─────────
export function flotador(obj, { amplitud = 0.12, inclinacion = 0.05, semilla = Math.random() * 10, deriva = 0 } = {}) {
  const base = obj.position.clone();
  const rotBase = obj.rotation.y;
  obj.userData.actualizar = (t) => {
    obj.position.y = base.y + Math.sin(t * 1.1 + semilla) * amplitud;
    obj.rotation.z = Math.sin(t * 0.9 + semilla) * inclinacion;
    obj.rotation.x = Math.cos(t * 0.7 + semilla) * inclinacion * 0.7;
    if (deriva) {
      obj.position.x = base.x + Math.sin(t * deriva + semilla) * 1.2;
      obj.rotation.y = rotBase + Math.sin(t * deriva * 0.8 + semilla) * 0.15;
    }
  };
  return obj;
}

export function barca(clave, pos, rotY = 0, altura = 1.2) {
  const b = instancia(clave, { altura });
  b.position.copy(pos);
  b.rotation.y = rotY;
  return flotador(b, { deriva: 0.15 });
}

// ───────── Humo ─────────
export function crearHumo(centro, { color = '#9a9a9a', cantidad = 40 } = {}) {
  return crearParticulas({ centro, cantidad, caja: [0.4, 2.2, 0.4], color, tam: 0.6, modo: 'sube', velocidad: 0.45, intensidad: 0.9, aditivo: false, opacidad: 0.55 });
}
