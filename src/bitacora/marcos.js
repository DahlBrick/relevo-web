import * as THREE from 'three';
import { PALETA } from './paleta.js';

// Capturas del desarrollo como marcos en el mundo. Fusión 2D/3D: cuando su etapa no está activa,
// el marco yace plano sobre el agua como una hoja; al llegar, se levanta girando sobre su canto.

const cargador = new THREE.TextureLoader();
const geoPlano = new THREE.PlaneGeometry(1, 1);
const matBorde = new THREE.MeshStandardMaterial({ color: PALETA.cobreClaro, metalness: 0.6, roughness: 0.35 });
const matDorso = new THREE.MeshStandardMaterial({ color: '#0a1c1f', roughness: 0.8 });

export const clicables = [];

export function crearMarco({ src, video = false, pie = '', ancho = 7 }) {
  const pivote = new THREE.Group(); // gira sobre el canto inferior
  const cuerpo = new THREE.Group();
  pivote.add(cuerpo);

  const matImagen = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 1 });
  const imagen = new THREE.Mesh(geoPlano, matImagen);
  const bordeMat = matBorde.clone();
  const borde = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.12), bordeMat);
  const dorso = new THREE.Mesh(geoPlano, matDorso);
  dorso.rotation.y = Math.PI;
  borde.castShadow = true;
  cuerpo.add(borde, imagen, dorso);

  let elVideo = null;
  const ajustar = (w, h) => {
    const alto = (ancho * h) / w;
    imagen.scale.set(ancho, alto, 1);
    imagen.position.set(0, alto / 2 + 0.25, 0.065);
    dorso.scale.set(ancho, alto, 1);
    dorso.position.set(0, alto / 2 + 0.25, -0.065);
    borde.scale.set(ancho + 0.32, alto + 0.32, 1);
    borde.position.set(0, alto / 2 + 0.25, 0);
    pivote.userData.alto = alto;
  };
  ajustar(16, 9);

  if (video) {
    elVideo = document.createElement('video');
    Object.assign(elVideo, { src, muted: true, loop: true, playsInline: true, preload: 'metadata', crossOrigin: 'anonymous' });
    const tex = new THREE.VideoTexture(elVideo);
    tex.colorSpace = THREE.SRGBColorSpace;
    matImagen.map = tex;
    elVideo.addEventListener('loadedmetadata', () => ajustar(elVideo.videoWidth, elVideo.videoHeight));
  } else {
    cargador.load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      matImagen.map = tex;
      matImagen.needsUpdate = true;
      ajustar(tex.image.width, tex.image.height);
    });
  }

  imagen.userData.marco = { src, video, pie };
  clicables.push(imagen);

  const semilla = Math.random() * 10;
  let levantado = -1;
  let enfoque = 0;
  let baseY = 0;
  pivote.userData = {
    ...pivote.userData,
    imagen,
    /** f: 0 = plano sobre el agua (2D), 1 = de pie (3D). */
    levantar(f) {
      if (Math.abs(f - levantado) < 0.0005) return;
      levantado = f;
      const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
      cuerpo.rotation.x = -Math.PI / 2 * (1 - e);
      baseY = -0.3 * (1 - e);
      pivote.visible = f > 0.001;
      matImagen.opacity = 0.35 + 0.65 * Math.min(1, f * 1.6);
      if (elVideo) {
        if (f > 0.6 && elVideo.paused) elVideo.play().catch(() => {});
        else if (f <= 0.6 && !elVideo.paused) elVideo.pause();
      }
    },
    actualizar(t, resaltado) {
      enfoque += ((resaltado ? 1 : 0) - enfoque) * 0.12;
      cuerpo.position.y = baseY + Math.sin(t * 0.8 + semilla) * 0.08 * Math.min(1, levantado * 2);
      cuerpo.rotation.z = Math.sin(t * 0.5 + semilla) * 0.012;
      const s = 1 + enfoque * 0.04;
      cuerpo.scale.set(s, s, s);
      bordeMat.emissive.setRGB(enfoque * 0.4, enfoque * 0.25, enfoque * 0.1);
    },
  };
  return pivote;
}

// ───────── Paneles de HUD en el espacio (Etapa 6) ─────────
// Se dibujan con Canvas 2D en el estilo de RelevoUIEstilo.cs: fondo azul verdoso, contorno de cobre.
export function panelHUD({ titulo, linea, valor = '', ancho = 4.6, alto = 1.5, acento = PALETA.ambar, tecla = '' }) {
  const escala = 220;
  const c = document.createElement('canvas');
  c.width = ancho * escala;
  c.height = alto * escala;
  const g = c.getContext('2d');
  const r = 26;
  const w = c.width;
  const h = c.height;
  const rr = (x, y, ww, hh, rad) => {
    g.beginPath();
    g.moveTo(x + rad, y);
    g.arcTo(x + ww, y, x + ww, y + hh, rad);
    g.arcTo(x + ww, y + hh, x, y + hh, rad);
    g.arcTo(x, y + hh, x, y, rad);
    g.arcTo(x, y, x + ww, y, rad);
    g.closePath();
  };
  rr(6, 6, w - 12, h - 12, r);
  g.fillStyle = 'rgba(10,28,31,0.9)';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = '#c98f55';
  g.stroke();
  let x0 = 44;
  if (tecla) {
    rr(40, h / 2 - 62, 124, 118, 22);
    g.fillStyle = '#8f8268';
    g.fill();
    rr(40, h / 2 - 70, 124, 112, 22);
    g.fillStyle = '#e8dec6';
    g.fill();
    g.fillStyle = '#061113';
    g.font = '86px "Lilita One"';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(tecla, 102, h / 2 - 12);
    x0 = 200;
  }
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = acento;
  g.font = '64px "Lilita One"';
  g.fillText(titulo, x0, h * 0.42);
  g.fillStyle = 'rgba(232,222,198,0.85)';
  g.font = '46px "Varela Round"';
  g.fillText(linea, x0, h * 0.74);
  if (valor) {
    g.textAlign = 'right';
    g.fillStyle = '#e8dec6';
    g.font = '72px "Lilita One"';
    g.fillText(valor, w - 50, h * 0.6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  return m;
}
