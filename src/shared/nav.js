// Barra de navegación común a todas las páginas, con menú desplegable en pantallas angostas.
const ENLACES = [
  { id: 'inicio', texto: 'Inicio', href: './' },
  { id: 'juego', texto: 'Juego', href: 'juego.html' },
  { id: 'historia', texto: 'Historia', href: 'historia.html' },
  { id: 'comunidad', texto: 'Comunidad', href: 'comunidad.html' },
  { id: 'bitacora', texto: 'Bitácora', href: 'bitacora.html' },
];

export function montarNav(activa) {
  const nav = document.getElementById('nav');
  const enlaces = ENLACES.map((e) => `<a href="${e.href}"${e.id === activa ? ' aria-current="page"' : ''}>${e.texto}</a>`).join('');
  nav.innerHTML = `
    <a class="nav__logo" href="./">RELEVO</a>
    <nav class="nav__links" aria-label="Principal">${enlaces}</nav>
    <button class="nav__menu" type="button" aria-expanded="false" aria-controls="nav-panel" aria-label="Abrir menú">
      <span></span><span></span><span></span>
    </button>`;
  // El panel va fuera de la barra: su backdrop-filter haría que un hijo "fixed" quedara atrapado en ella.
  const panel = document.createElement('div');
  panel.className = 'nav__panel';
  panel.id = 'nav-panel';
  panel.hidden = true;
  panel.innerHTML = `<nav aria-label="Principal (móvil)">${enlaces}</nav>`;
  nav.after(panel);
  const boton = nav.querySelector('.nav__menu');
  const alternar = (abrir) => {
    boton.setAttribute('aria-expanded', String(abrir));
    boton.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('is-abierto', abrir);
    panel.hidden = !abrir;
    document.documentElement.classList.toggle('menu-abierto', abrir);
  };
  boton.addEventListener('click', () => alternar(boton.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => e.target.closest('a') && alternar(false));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && alternar(false));
  window.matchMedia('(min-width: 861px)').addEventListener('change', (m) => m.matches && alternar(false));
  return nav;
}
