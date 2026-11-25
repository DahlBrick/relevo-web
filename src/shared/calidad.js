// Calidad gráfica según el equipo: 'alta', 'media' o 'baja'. Se decide al cargar con lo que el
// navegador cuenta del equipo (memoria, núcleos, pantalla, movimiento reducido, GPU por software) y
// se corrige en marcha con los FPS medidos los primeros segundos. Nada se quita: en los equipos
// modestos se dibuja lo mismo con menos resolución, sin sombras caras y con menos partículas.
//
// Para probar a mano: ?calidad=baja | media | alta en la URL.

const CLAVE = 'relevo-calidad';

function leerGuardada() {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}
function guardar(nivel) {
  try {
    sessionStorage.setItem(CLAVE, nivel);
  } catch {
    /* modo privado: no pasa nada */
  }
}

function gpuPorSoftware() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|software|basic render/i.test(r);
  } catch {
    return false;
  }
}

function detectar() {
  const forzada = new URLSearchParams(location.search).get('calidad');
  if (['alta', 'media', 'baja'].includes(forzada)) return forzada;
  const guardada = leerGuardada();
  const mem = navigator.deviceMemory || 8;
  const nucleos = navigator.hardwareConcurrency || 8;
  const lado = Math.min(screen.width, screen.height);
  const movil = lado < 600 || matchMedia('(pointer: coarse)').matches;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let nivel = 'alta';
  if (gpuPorSoftware() || mem <= 2 || nucleos <= 2 || (movil && (mem <= 3 || nucleos <= 4))) nivel = 'baja';
  else if (mem <= 4 || nucleos <= 4 || movil || reducido) nivel = 'media';
  // Si una visita anterior tuvo que bajar la calidad, se empieza ahí.
  const orden = ['baja', 'media', 'alta'];
  if (guardada && orden.indexOf(guardada) < orden.indexOf(nivel)) nivel = guardada;
  return nivel;
}

const PERFILES = {
  alta: { pixelRatio: 1.75, sombras: true, mapaSombra: 2048, sombraSuave: true, particulas: 1, bloom: true, msaa: 4, tinta: true, texturas: 'grande', oceano: 320 },
  media: { pixelRatio: 1.25, sombras: true, mapaSombra: 1024, sombraSuave: false, particulas: 0.6, bloom: true, msaa: 0, tinta: true, texturas: 'grande', oceano: 200 },
  baja: { pixelRatio: 1, sombras: false, mapaSombra: 512, sombraSuave: false, particulas: 0.3, bloom: false, msaa: 0, tinta: false, texturas: 'mini', oceano: 110 },
};

const nivel = detectar();
export const CALIDAD = { nivel, ...PERFILES[nivel] };
document.documentElement.dataset.calidad = nivel;

/** Pixel ratio a usar, limitado por el perfil. */
export const pixelRatio = () => Math.min(window.devicePixelRatio || 1, CALIDAD.pixelRatio);

/** Imagen grande o miniatura de 640 px según el perfil (solo para .webp con su -640). */
export const texturaSegunCalidad = (src) => (CALIDAD.texturas === 'mini' && /\.webp$/.test(src) && !/-640\.webp$/.test(src) ? src.replace(/\.webp$/, '-640.webp') : src);

/**
 * Mide los FPS durante `segundos` (solo mientras la pestaña está visible) y, si el equipo no llega,
 * baja un escalón llamando a `bajar(nuevoNivel)`. Devuelve una función tick() para llamar cada fotograma.
 */
export function vigilarFPS({ calentamiento = 2, segundos = 5, minimo = 28, bajar }) {
  let inicio = 0;
  let previo = 0;
  let cuadros = 0;
  let medido = 0;
  let hecho = false;
  let rachas = 0;
  return function tick(ahora = performance.now()) {
    if (hecho) return;
    if (document.hidden || !document.hasFocus?.()) {
      // Pestaña o ventana en segundo plano: el navegador frena los fotogramas, no cuenta.
      inicio = previo = 0;
      return;
    }
    if (!inicio) {
      inicio = previo = ahora;
      cuadros = medido = 0;
      return;
    }
    const dt = ahora - previo;
    previo = ahora;
    if ((ahora - inicio) / 1000 < calentamiento) return; // compilación de shaders y carga de texturas
    // Un salto muy largo es un tirón puntual o un panel en segundo plano, no el ritmo real.
    if (dt > 250) return;
    cuadros++;
    medido += dt;
    if (medido / 1000 < segundos) return;
    const fps = (cuadros * 1000) / medido;
    if (import.meta.env.DEV) console.info(`[relevo] ${fps.toFixed(1)} FPS con calidad ${CALIDAD.nivel}`);
    window.__fps = fps;
    if (fps < minimo && CALIDAD.nivel !== 'baja' && rachas < 2) {
      const nuevo = CALIDAD.nivel === 'alta' ? 'media' : 'baja';
      Object.assign(CALIDAD, { nivel: nuevo, ...PERFILES[nuevo] });
      document.documentElement.dataset.calidad = nuevo;
      guardar(nuevo);
      bajar?.(nuevo);
      rachas++;
      inicio = 0; // vuelve a medir con la calidad nueva
      return;
    }
    hecho = true;
  };
}
