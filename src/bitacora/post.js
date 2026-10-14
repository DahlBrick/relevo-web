import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Pase final: pixelado + posterizado (la etapa 2D de Godot), viñeta, grano y una leve aberración
// cromática, como la cámara de cine de CinematicaMecanica.cs.
const PaseRelevo = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPixel: { value: 0 },
    uTiempo: { value: 0 },
    uVineta: { value: 0.32 },
    uGrano: { value: 0.035 },
    uAberracion: { value: 0.0012 },
    uFundido: { value: 0 },
    uTinteFundido: { value: new THREE.Color('#061113') },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uPixel, uTiempo, uVineta, uGrano, uAberracion, uFundido; uniform vec3 uTinteFundido;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      float px = mix(1.0, 7.0, uPixel);
      if (uPixel > 0.01){
        vec2 celda = uRes / px;
        uv = (floor(uv * celda) + 0.5) / celda;
      }
      vec2 d = uv - 0.5;
      float ab = uAberracion * (1.0 - uPixel);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + d * ab * 2.0).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - d * ab * 2.0).b;
      if (uPixel > 0.01){
        float niveles = mix(64.0, 7.0, uPixel);
        col = floor(col * niveles + 0.5) / niveles;
        // rejilla de píxel muy sutil
        vec2 g = fract(vUv * uRes / px);
        col *= 1.0 - 0.06 * uPixel * step(0.86, max(g.x, g.y));
      }
      float v = smoothstep(0.85, 0.2, length(d * vec2(1.0, 0.85)));
      col *= mix(1.0 - uVineta, 1.0, v);
      col += (hash(vUv * uRes + fract(uTiempo) * 100.0) - 0.5) * uGrano * (1.0 - uPixel);
      col = mix(col, uTinteFundido, uFundido);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function crearPost(renderer, scene, camera) {
  const destino = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, destino);
  composer.addPass(new RenderPass(scene, camera));
  // Un solo píxel NaN o infinito (p. ej. de un vértice degenerado) se expandiría como un bloque
  // negro al pasar por el bloom; este pase lo neutraliza antes.
  const sanear = new ShaderPass(
    new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { tDiffuse: { value: null } },
      vertexShader: 'out vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform sampler2D tDiffuse; in vec2 vUv; out vec4 color;
        void main(){
          vec4 c = texture(tDiffuse, vUv);
          if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
          color = min(c, vec4(60.0));
        }`,
    }),
  );
  composer.addPass(sanear);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.86);
  composer.addPass(bloom);
  // El pase propio va después del OutputPass para trabajar sobre la imagen ya en sRGB.
  composer.addPass(new OutputPass());
  const final = new ShaderPass(PaseRelevo);
  composer.addPass(final);
  return {
    composer,
    bloom,
    final,
    tamano(w, h, pr) {
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
      final.uniforms.uRes.value.set(w * pr, h * pr);
    },
  };
}
