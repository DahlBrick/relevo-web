import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { cargarRobot } from '../bitacora/assets.js';
import { crearNilo } from '../bitacora/nilo.js';

// "COMING SOON" en 3D: letras de Lilita One extruidas con bisel sobre el cartel de brocha naranja,
// Nilo (el robot del juego) de pie detrás saludando, luz de lava por un lado y de canal por el otro,
// brasas que suben y todo inclinándose hacia el puntero.

export async function montarCartel3D(contenedor) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  contenedor.append(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const raiz = new THREE.Group();
  escena.add(raiz);

  // Luces: lava cálida al oeste, canal turquesa al este, relleno suave y un contraluz.
  escena.add(new THREE.HemisphereLight('#ffe9cf', '#2a1410', 1.1));
  const lava = new THREE.DirectionalLight('#ff8a3a', 3.2);
  lava.position.set(-6, 3, 5);
  lava.castShadow = true;
  lava.shadow.mapSize.set(1024, 1024);
  Object.assign(lava.shadow.camera, { left: -6, right: 6, top: 6, bottom: -3, near: 1, far: 30 });
  escena.add(lava);
  const canal = new THREE.DirectionalLight('#5ff4e0', 2.4);
  canal.position.set(6, 2.5, 3);
  escena.add(canal);
  const contra = new THREE.DirectionalLight('#ffd9a0', 2.2);
  contra.position.set(0, 5, -6);
  escena.add(contra);
  const frente = new THREE.PointLight('#fff1dc', 6, 14, 1.6);
  frente.position.set(0, 0.8, 4.5);
  escena.add(frente);

  // ───────── Cartel de brocha ─────────
  const puntos = [
    [14, 34], [40, 22], [92, 26], [130, 14], [210, 20], [260, 10], [330, 18], [402, 12], [470, 22], [508, 18],
    [500, 46], [512, 70], [498, 96], [460, 104], [392, 98], [318, 110], [240, 102], [170, 112], [98, 104], [40, 108], [8, 96], [18, 70], [4, 50],
  ];
  const forma = new THREE.Shape(puntos.map(([x, y]) => new THREE.Vector2((x - 258) / 52, -(y - 60) / 52)));
  const geoCartel = new THREE.ExtrudeGeometry(forma, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 4 });
  geoCartel.center();
  const matCartel = new THREE.MeshStandardMaterial({ color: '#e8792b', roughness: 0.55, metalness: 0.15 });
  const cartel = new THREE.Mesh(geoCartel, matCartel);
  cartel.castShadow = cartel.receiveShadow = true;
  const grupoCartel = new THREE.Group();
  grupoCartel.add(cartel);
  grupoCartel.position.set(0, 0.5, 0.9);
  grupoCartel.rotation.z = -0.045;
  raiz.add(grupoCartel);
  // Trazos de pintura más clara sobre el cartel, como pinceladas.
  const matTrazo = new THREE.MeshStandardMaterial({ color: '#ffb347', roughness: 0.6, transparent: true, opacity: 0.55 });
  [[-1.2, 0.55, 5.2, 0.16], [1.6, -0.62, 4.2, 0.1]].forEach(([x, y, w, h]) => {
    const t = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.02, 2, 0.04), matTrazo);
    t.position.set(x, y, 0.24);
    grupoCartel.add(t);
  });

  // ───────── Letras ─────────
  const datos = await new TTFLoader().loadAsync(import.meta.env.BASE_URL + 'fonts/LilitaOne-Regular.ttf');
  const fuente = new Font(datos);
  const matCara = new THREE.MeshStandardMaterial({ color: '#fff3e0', roughness: 0.35, metalness: 0.05, emissive: '#ffd9a0', emissiveIntensity: 0.12 });
  const matCanto = new THREE.MeshStandardMaterial({ color: '#8a2c0c', roughness: 0.45, metalness: 0.35 });
  const texto = 'COMING SOON';
  const tam = 0.78;
  const letras = [];
  const grupoLetras = new THREE.Group();
  const escala = tam / fuente.data.resolution;
  let x = 0;
  for (const ch of texto) {
    const glifo = fuente.data.glyphs[ch] || fuente.data.glyphs['?'];
    const avance = glifo.ha * escala;
    if (ch !== ' ') {
      const geo = new TextGeometry(ch, { font: fuente, size: tam, depth: 0.26, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.03, bevelSegments: 3 });
      geo.computeBoundingBox();
      const m = new THREE.Mesh(geo, [matCara, matCanto]);
      m.castShadow = true;
      const pivote = new THREE.Group();
      pivote.position.x = x;
      pivote.add(m);
      pivote.userData = { i: letras.length, base: x };
      grupoLetras.add(pivote);
      letras.push(pivote);
    }
    x += avance + 0.035;
  }
  const anchoTexto = x;
  grupoLetras.position.set(-anchoTexto / 2, 0.17, 1.18);
  grupoLetras.rotation.z = -0.045;
  raiz.add(grupoLetras);

  // ───────── Nilo ─────────
  await cargarRobot();
  const nilo = crearNilo({ altura: 2.6 });
  nilo.grupo.position.set(0, 1.05, -0.35);
  nilo.reproducir('Wave');
  raiz.add(nilo.grupo);

  // Sombra suave en el suelo.
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.ShadowMaterial({ opacity: 0.35 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = 1.05;
  suelo.receiveShadow = true;
  raiz.add(suelo);

  // ───────── Brasas y destellos ─────────
  const n = 140;
  const pos = new Float32Array(n * 3);
  const sem = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 1] = Math.random() * 5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    sem[i] = Math.random();
  }
  const geoBrasas = new THREE.BufferGeometry();
  geoBrasas.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geoBrasas.setAttribute('aSem', new THREE.BufferAttribute(sem, 1));
  const uTiempo = { value: 0 };
  const brasas = new THREE.Points(
    geoBrasas,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTiempo, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: `
        uniform float uTiempo, uPR; attribute float aSem; varying float vVida; varying float vLado;
        void main(){
          vec3 p = position;
          float y = mod(p.y + uTiempo * (0.25 + aSem * 0.5), 5.0);
          vVida = y / 5.0;
          vLado = step(0.0, p.x);
          p.y = y - 0.6;
          p.x += sin(uTiempo * 0.8 + aSem * 20.0) * 0.25;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (2.0 + aSem * 4.0) * uPR * (8.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vVida; varying float vLado;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * sin(vVida * 3.14159);
          vec3 c = mix(vec3(1.0, 0.55, 0.15), vec3(0.45, 1.0, 0.92), vLado);
          gl_FragColor = vec4(c * 1.6, a);
        }`,
    }),
  );
  raiz.add(brasas);

  // ───────── Interacción ─────────
  const puntero = new THREE.Vector2();
  const suave = new THREE.Vector2();
  window.addEventListener('pointermove', (e) => puntero.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1));
  let salto = -10;
  const gestos = ['Yes', 'ThumbsUp', 'Jump', 'Wave'];
  let gesto = 0;
  renderer.domElement.addEventListener('click', () => {
    salto = reloj.elapsedTime;
    nilo.reproducir(gestos[gesto++ % gestos.length], { una: true, fundido: 0.2 });
    setTimeout(() => nilo.reproducir('Wave', { fundido: 0.4 }), 1600);
  });

  function ajustar() {
    const w = contenedor.clientWidth;
    const h = contenedor.clientHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // Encuadre que siempre deja ver el cartel completo, también en vertical.
    // El cartel mide ~10.4 de ancho y la escena ~5 de alto (cartel + Nilo).
    const tanV = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    const dist = Math.max(10.6 / 2 / tanV / camara.aspect, 5.2 / 2 / tanV) + 1.2;
    camara.position.set(0, 2.2, dist);
    camara.lookAt(0, 1.75, 0);
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(contenedor);
  ajustar();

  const reloj = new THREE.Clock();
  const entrada = performance.now();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(reloj.getDelta(), 1 / 20);
    const t = reloj.elapsedTime;
    uTiempo.value = t;
    suave.lerp(puntero, 1 - Math.exp(-dt * 3));
    raiz.rotation.y = suave.x * 0.28 + Math.sin(t * 0.4) * 0.04;
    raiz.rotation.x = suave.y * 0.08;
    // Entrada: el cartel cae con rebote y las letras llegan una a una.
    const e = (performance.now() - entrada) / 1000;
    const caida = Math.min(1, Math.max(0, (e - 0.2) / 0.7));
    grupoCartel.position.y = 0.5 + (1 - rebote(caida)) * 4;
    letras.forEach((l) => {
      const k = Math.min(1, Math.max(0, (e - 0.6 - l.userData.i * 0.06) / 0.55));
      const s = rebote(k);
      l.scale.setScalar(Math.max(0.001, s));
      // Ola continua a lo largo del texto; al hacer clic, salto en cadena.
      const ola = Math.sin(t * 2.2 - l.userData.i * 0.55) * 0.06;
      const brinco = Math.max(0, Math.sin(Math.min(1, (t - salto - l.userData.i * 0.04) / 0.45) * Math.PI)) * 0.5;
      l.position.y = ola + (t - salto < 1.2 ? brinco : 0);
      l.rotation.z = Math.sin(t * 1.7 - l.userData.i * 0.7) * 0.03;
    });
    grupoCartel.rotation.x = Math.sin(t * 0.9) * 0.03;
    frente.intensity = 5.5 + Math.sin(t * 3) * 0.6;
    nilo.actualizar(dt, t);
    renderer.render(escena, camara);
  });
  return { renderer };
}

// Curva con rebote al final (easeOutBack).
function rebote(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
