import * as THREE from 'three';

// Océano global. Ondas suaves en el vértice; en el fragmento, color según la distancia a las islas,
// fresnel con el cielo, destellos de sol y "zonas de bioma": pantano turbio (Ciénaga) y costra de
// magma con grietas que laten (Forja). Mismo espíritu que RelevoAgua.shader del juego.

export const uAgua = {
  uTiempo: { value: 0 },
  uSolDir: { value: new THREE.Vector3(0.4, 0.5, -0.3).normalize() },
  uSolColor: { value: new THREE.Color('#ffd9a0') },
  uCieloColor: { value: new THREE.Color('#9ec7c9') },
  uProfundo: { value: new THREE.Color('#0f3533') },
  uSomero: { value: new THREE.Color('#2a7a72') },
  uNiebla: { value: new THREE.Color('#455761') },
  uNieblaCerca: { value: 60 },
  uNieblaLejos: { value: 260 },
  uZonas: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] },
};

const RUIDO = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * ruido(p); p *= 2.03; a *= 0.5; } return s; }
`;

export function crearOceano({ tam = 1800, segmentos = 320 } = {}) {
  const geo = new THREE.PlaneGeometry(tam, tam, segmentos, segmentos);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: uAgua,
    vertexShader: /* glsl */ `
      uniform float uTiempo;
      varying vec3 vMundo;
      varying vec3 vNormal;
      vec3 ola(vec2 p, vec2 d, float k, float a, float v){
        float f = dot(d, p) * k + uTiempo * v;
        return vec3(d.x * cos(f) * a * k, sin(f) * a, d.y * cos(f) * a * k);
      }
      void main(){
        vec4 mp = modelMatrix * vec4(position, 1.0);
        vec2 p = mp.xz;
        vec3 o1 = ola(p, normalize(vec2(1.0, 0.6)), 0.22, 0.11, 1.1);
        vec3 o2 = ola(p, normalize(vec2(-0.7, 1.0)), 0.41, 0.05, 1.7);
        vec3 o3 = ola(p, normalize(vec2(0.2, -1.0)), 0.83, 0.025, 2.3);
        mp.y += o1.y + o2.y + o3.y;
        vNormal = normalize(vec3(-(o1.x + o2.x + o3.x), 1.0, -(o1.z + o2.z + o3.z)));
        vMundo = mp.xyz;
        gl_Position = projectionMatrix * viewMatrix * mp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTiempo;
      uniform vec3 uSolDir, uSolColor, uCieloColor, uProfundo, uSomero, uNiebla;
      uniform float uNieblaCerca, uNieblaLejos;
      uniform vec4 uZonas[3];
      varying vec3 vMundo;
      varying vec3 vNormal;
      ${RUIDO}
      void main(){
        vec2 p = vMundo.xz;
        // Normal de detalle: dos capas de ruido que derivan en sentidos opuestos.
        float e = 0.15;
        vec2 q1 = p * 0.55 + vec2(uTiempo * 0.12, uTiempo * 0.05);
        vec2 q2 = p * 1.3 - vec2(uTiempo * 0.07, -uTiempo * 0.11);
        float h0 = fbm(q1) + 0.5 * fbm(q2);
        float hx = fbm(q1 + vec2(e, 0.0)) + 0.5 * fbm(q2 + vec2(e, 0.0));
        float hz = fbm(q1 + vec2(0.0, e)) + 0.5 * fbm(q2 + vec2(0.0, e));
        vec3 n = normalize(vNormal + vec3(h0 - hx, 0.0, h0 - hz) * 1.6);

        vec3 v = normalize(cameraPosition - vMundo);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 col = mix(uProfundo, uSomero, smoothstep(0.35, 1.0, h0) * 0.55);

        // Vetas de corriente.
        float vetas = smoothstep(0.48, 0.5, fbm(p * vec2(0.18, 0.9) + uTiempo * 0.04)) * smoothstep(0.52, 0.5, fbm(p * vec2(0.18, 0.9) + uTiempo * 0.04));
        col += vetas * 0.04;

        // Zonas de bioma.
        for (int i = 0; i < 3; i++){
          vec4 z = uZonas[i];
          if (z.w < 0.5) continue;
          float w = 1.0 - smoothstep(z.z * 0.55, z.z, distance(p, z.xy));
          if (z.w < 1.5){
            vec3 turbia = mix(vec3(0.07, 0.10, 0.06), vec3(0.20, 0.22, 0.12), fbm(p * 0.4 + uTiempo * 0.02));
            col = mix(col, turbia, w);
            fres *= 1.0 - w * 0.7;
          } else {
            float grietas = fbm(p * 0.6 + vec2(0.0, uTiempo * 0.03));
            float lat = 0.6 + 0.4 * sin(uTiempo * 1.5 + grietas * 9.0);
            vec3 costra = mix(vec3(0.05, 0.03, 0.03), vec3(0.12, 0.05, 0.03), grietas);
            costra += vec3(1.0, 0.32, 0.05) * smoothstep(0.62, 0.72, grietas) * lat * 1.6;
            col = mix(col, costra, w);
            fres *= 1.0 - w;
          }
        }

        col = mix(col, uCieloColor, fres * 0.75);
        vec3 r = reflect(-v, n);
        float spec = pow(max(dot(r, uSolDir), 0.0), 180.0);
        float destello = step(0.93, ruido(p * 3.0 + uTiempo * 0.6)) * pow(max(dot(r, uSolDir), 0.0), 12.0);
        col += uSolColor * (spec * 1.3 + destello * 0.35);

        float d = distance(cameraPosition, vMundo);
        float niebla = smoothstep(uNieblaCerca, uNieblaLejos, d);
        gl_FragColor = vec4(mix(col, uNiebla, niebla), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const malla = new THREE.Mesh(geo, mat);
  malla.position.y = -0.5;
  malla.frustumCulled = false;
  // Sigue a la cámara en saltos de una celda: las olas se calculan en coordenadas de mundo,
  // así que el mar nunca termina y los vértices no "nadan".
  const celda = tam / segmentos;
  malla.userData.seguir = (cam) => {
    malla.position.x = Math.round(cam.position.x / celda) * celda;
    malla.position.z = Math.round(cam.position.z / celda) * celda;
  };
  return malla;
}

/** Máscara de orilla a partir del mapa de casillas: blanco = tierra, difuminado hacia el agua. */
function mascaraOrilla(filas, esTierra, resol = 12, margen = 3) {
  const cols = filas[0].length;
  const w = (cols + margen * 2) * resol;
  const h = (filas.length + margen * 2) * resol;
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.filter = `blur(${resol * 0.45}px)`;
  ctx.fillStyle = '#fff';
  filas.forEach((fila, r) => {
    [...fila].forEach((ch, c) => {
      if (esTierra(ch)) ctx.fillRect((c + margen) * resol, (r + margen) * resol, resol, resol);
    });
  });
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Agua local de una isla: aclara junto a los muelles y dibuja una banda de espuma que "respira". */
export function crearAguaOrilla(filas, esTierra, tile, { tinte = '#3aa597', espuma = 1, margen = 3 } = {}) {
  const cols = filas[0].length;
  const ancho = (cols + margen * 2) * tile;
  const largo = (filas.length + margen * 2) * tile;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMascara: { value: mascaraOrilla(filas, esTierra, 16, margen) },
      uTiempo: uAgua.uTiempo,
      uTinte: { value: new THREE.Color(tinte) },
      uEspuma: { value: espuma },
      uNiebla: uAgua.uNiebla,
      uNieblaCerca: uAgua.uNieblaCerca,
      uNieblaLejos: uAgua.uNieblaLejos,
      uOpacidad: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vMundo;
      void main(){ vUv = uv; vec4 mp = modelMatrix * vec4(position, 1.0); vMundo = mp.xyz; gl_Position = projectionMatrix * viewMatrix * mp; }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMascara; uniform float uTiempo, uEspuma, uOpacidad, uNieblaCerca, uNieblaLejos; uniform vec3 uTinte, uNiebla;
      varying vec2 vUv; varying vec3 vMundo;
      ${RUIDO}
      void main(){
        float m = texture2D(uMascara, vUv).r;
        if (m > 0.97) discard;
        float somero = smoothstep(0.02, 0.5, m);
        float banda = m + sin(uTiempo * 1.4) * 0.04 + (ruido(vMundo.xz * 1.9 + uTiempo * 0.3) - 0.5) * 0.1;
        // Banda fina pegada al muelle, que "respira", y alguna línea suelta más afuera.
        float esp = smoothstep(0.42, 0.47, banda) * (1.0 - smoothstep(0.5, 0.56, banda));
        float lin = smoothstep(0.9, 0.95, sin(banda * 34.0 - uTiempo * 1.6)) * smoothstep(0.12, 0.25, m) * (1.0 - smoothstep(0.32, 0.4, m));
        lin *= step(0.45, ruido(vMundo.xz * 0.6 + uTiempo * 0.05));
        esp = max(esp * 0.85, lin * 0.45) * uEspuma;
        vec3 col = mix(uTinte, vec3(0.93, 0.97, 0.95), esp);
        float a = max(somero * 0.42, esp);
        float borde = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
        float niebla = smoothstep(uNieblaCerca, uNieblaLejos, distance(cameraPosition, vMundo));
        gl_FragColor = vec4(mix(col, uNiebla, niebla), a * borde * uOpacidad);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const geo = new THREE.PlaneGeometry(ancho, largo);
  geo.rotateX(-Math.PI / 2);
  const malla = new THREE.Mesh(geo, mat);
  malla.position.y = -0.38;
  malla.renderOrder = 2;
  return malla;
}

/** Río de lava con textura procedural que avanza lentamente y late (Forja de Ascuas). */
export function crearLava(ancho, largo, { flujo = new THREE.Vector2(0, 1) } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTiempo: uAgua.uTiempo, uFlujo: { value: flujo } },
    vertexShader: /* glsl */ `
      varying vec3 vMundo;
      void main(){ vec4 mp = modelMatrix * vec4(position, 1.0); vMundo = mp.xyz; gl_Position = projectionMatrix * viewMatrix * mp; }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTiempo; uniform vec2 uFlujo; varying vec3 vMundo;
      ${RUIDO}
      void main(){
        vec2 p = vMundo.xz * 0.45 + uFlujo * uTiempo * 0.12;
        float a = fbm(p + fbm(p * 1.7 - uTiempo * 0.05) * 1.4);
        float lat = 0.85 + 0.15 * sin(uTiempo * 2.0 + a * 6.0);
        vec3 col = mix(vec3(0.35, 0.03, 0.0), vec3(1.0, 0.36, 0.04), smoothstep(0.25, 0.65, a));
        col = mix(col, vec3(1.0, 0.85, 0.45), smoothstep(0.7, 0.9, a));
        float costra = smoothstep(0.42, 0.38, a) * 0.85;
        col = mix(col, vec3(0.06, 0.03, 0.02), costra);
        gl_FragColor = vec4(col * 2.2 * lat, 1.0);
      }
    `,
  });
  const geo = new THREE.PlaneGeometry(ancho, largo);
  geo.rotateX(-Math.PI / 2);
  const malla = new THREE.Mesh(geo, mat);
  malla.position.y = -0.42;
  return malla;
}
