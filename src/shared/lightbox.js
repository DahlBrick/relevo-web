// Visor a pantalla completa para capturas y videos del desarrollo, con navegación por la serie.
export function crearLightbox({ alAbrir, alCerrar } = {}) {
  const raiz = document.getElementById('lightbox');
  const media = document.getElementById('lightbox-media');
  const pie = document.getElementById('lightbox-pie');
  const cerrarBtn = document.getElementById('lightbox-cerrar');
  const prev = boton('prev', '←', 'Anterior');
  const next = boton('next', '→', 'Siguiente');
  raiz.append(prev, next);
  let foco = null;
  let serie = [];
  let indice = 0;

  function boton(tipo, txt, etiqueta) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `lightbox__nav lightbox__nav--${tipo}`;
    b.textContent = txt;
    b.setAttribute('aria-label', etiqueta);
    return b;
  }

  function mostrar() {
    const { src, video, youtube, pie: texto } = serie[indice];
    media.querySelector('video')?.pause();
    media.innerHTML = '';
    if (youtube) {
      media.innerHTML = `<div class="lightbox__yt">${iframeYouTube(youtube)}</div>`;
      pie.innerHTML = `${texto || ''} · <a href="https://youtu.be/${youtube}" target="_blank" rel="noopener">Ver en YouTube ↗</a>`;
      prev.hidden = next.hidden = serie.length < 2;
      return;
    }
    const el = document.createElement(video ? 'video' : 'img');
    el.className = 'lightbox__media';
    el.src = src;
    if (video) Object.assign(el, { controls: true, autoplay: true, loop: true, muted: true, playsInline: true });
    else el.alt = texto || '';
    media.append(el);
    pie.textContent = serie.length > 1 ? `${texto || ''}  ·  ${indice + 1} / ${serie.length}` : texto || '';
    prev.hidden = next.hidden = serie.length < 2;
  }

  /** abrir(item) o abrir(lista, indice). */
  function abrir(itemOLista, i = 0) {
    serie = Array.isArray(itemOLista) ? itemOLista : [itemOLista];
    indice = i;
    if (!raiz.classList.contains('is-open')) foco = document.activeElement;
    mostrar();
    raiz.classList.add('is-open');
    cerrarBtn.focus();
    alAbrir?.();
  }

  function mover(d) {
    if (serie.length < 2) return;
    indice = (indice + d + serie.length) % serie.length;
    mostrar();
  }

  function cerrar() {
    if (!raiz.classList.contains('is-open')) return;
    raiz.classList.remove('is-open');
    media.querySelector('video')?.pause();
    media.querySelector('iframe')?.remove();
    setTimeout(() => !raiz.classList.contains('is-open') && (media.innerHTML = ''), 300);
    foco?.focus?.();
    alCerrar?.();
  }

  prev.addEventListener('click', () => mover(-1));
  next.addEventListener('click', () => mover(1));
  cerrarBtn.addEventListener('click', cerrar);
  raiz.addEventListener('click', (e) => e.target === raiz && cerrar());
  window.addEventListener('keydown', (e) => {
    if (!raiz.classList.contains('is-open')) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'ArrowLeft') mover(-1);
    if (e.key === 'ArrowRight') mover(1);
  });
  return { abrir, cerrar };
}

export const TEASER_YT = 'z1q6cUyIgEI';

/** iframe del reproductor de YouTube, en el dominio sin cookies hasta que se reproduce. */
export function iframeYouTube(id, { autoplay = true } = {}) {
  const params = new URLSearchParams({ autoplay: autoplay ? '1' : '0', rel: '0', modestbranding: '1', playsinline: '1' });
  return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?${params}" title="Teaser de RELEVO en YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
}
