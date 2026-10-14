// Viento en el vértice, como RelevoFollaje.shader: cada planta se mece más cuanto más alta es,
// con un desfase por posición para que no se muevan todas a la vez.
export const uViento = { tiempo: { value: 0 }, fuerza: { value: 1 } };

export function conViento(material) {
  material.userData.viento = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTiempo = uViento.tiempo;
    shader.uniforms.uFuerza = uViento.fuerza;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTiempo;\nuniform float uFuerza;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          vec4 wp = modelMatrix * vec4(transformed, 1.0);
          float h = max(transformed.y, 0.0);
          float fase = wp.x * 0.35 + wp.z * 0.27;
          float s = sin(uTiempo * 1.6 + fase) * 0.6 + sin(uTiempo * 2.7 + fase * 1.7) * 0.25;
          transformed.x += s * h * 0.035 * uFuerza;
          transformed.z += cos(uTiempo * 1.3 + fase) * h * 0.022 * uFuerza;
        }`,
      );
  };
  material.customProgramCacheKey = () => 'relevo-viento';
  return material;
}
