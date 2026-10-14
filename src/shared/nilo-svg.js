// Nilo en 2D, dibujado a partir del key art: cúpula crema, bandas azul marino con remaches, lentes
// grandes con ojos cian, cejas gruesas, antena con halo, bufanda naranja y botas.
// Las animaciones viven en nilo.css; las clases de la raíz eligen qué hace (saludar, caminar).

let n = 0;

export function niloSVG({ saludo = true, clase = '' } = {}) {
  const id = `nilo${++n}`;
  const remaches = (y, x0, x1, paso) => {
    let s = '';
    for (let x = x0; x <= x1; x += paso) s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#c9cfd8"/>`;
    return s;
  };
  return `
<svg class="nilo ${saludo ? 'nilo--saluda' : ''} ${clase}" viewBox="0 0 240 410" role="img" aria-label="Nilo, el robot de RELEVO">
  <defs>
    <linearGradient id="${id}-crema" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6ecd8"/><stop offset=".55" stop-color="#e6d6b8"/><stop offset="1" stop-color="#c4ad88"/>
    </linearGradient>
    <linearGradient id="${id}-cupula" x1=".2" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#fbf3e2"/><stop offset=".6" stop-color="#e8d7b6"/><stop offset="1" stop-color="#b99f78"/>
    </linearGradient>
    <linearGradient id="${id}-azul" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#34486b"/><stop offset="1" stop-color="#1d2a42"/>
    </linearGradient>
    <radialGradient id="${id}-lente" cx=".38" cy=".32" r=".75">
      <stop offset="0" stop-color="#3a4558"/><stop offset=".5" stop-color="#1a2130"/><stop offset="1" stop-color="#0c1018"/>
    </radialGradient>
    <radialGradient id="${id}-ojo" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#e8ffff"/><stop offset=".35" stop-color="#5ff4f8"/><stop offset="1" stop-color="#1bb8c4"/>
    </radialGradient>
    <filter id="${id}-brillo" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <ellipse class="nilo__sombra" cx="120" cy="398" rx="78" ry="9" fill="#000" opacity=".28"/>
  <g class="nilo__cuerpo">
    <!-- Piernas y botas -->
    <g class="nilo__pierna nilo__pierna--i">
      <rect x="86" y="296" width="10" height="70" rx="4" fill="#9aa3ae"/>
      <circle cx="91" cy="330" r="7" fill="#c3cad3"/>
      <path d="M70 360 h40 l6 26 q1 6 -6 6 h-46 q-7 0 -6 -6 z" fill="url(#${id}-crema)"/>
      <rect x="64" y="386" width="52" height="7" rx="3" fill="#2a2f38"/>
    </g>
    <g class="nilo__pierna nilo__pierna--d">
      <rect x="144" y="296" width="10" height="70" rx="4" fill="#9aa3ae"/>
      <circle cx="149" cy="330" r="7" fill="#c3cad3"/>
      <path d="M130 360 h40 l6 26 q1 6 -6 6 h-46 q-7 0 -6 -6 z" fill="url(#${id}-crema)"/>
      <rect x="124" y="386" width="52" height="7" rx="3" fill="#2a2f38"/>
    </g>
    <!-- Torso -->
    <path d="M78 206 h84 l-6 86 h-72 z" fill="url(#${id}-crema)"/>
    <path d="M150 206 h12 l-6 86 h-10 z" fill="#000" opacity=".12"/>
    <rect x="80" y="232" width="80" height="6" fill="#e8792b" opacity=".9"/>
    <rect x="76" y="286" width="88" height="16" rx="6" fill="url(#${id}-azul)"/>
    ${remaches(294, 86, 154, 17)}
    <!-- Brazo izquierdo (cuelga) -->
    <g class="nilo__brazo nilo__brazo--i">
      <circle cx="74" cy="214" r="13" fill="url(#${id}-azul)"/>
      <rect x="56" y="216" width="22" height="52" rx="7" fill="url(#${id}-crema)" transform="rotate(12 67 216)"/>
      <rect x="44" y="262" width="22" height="40" rx="7" fill="url(#${id}-crema)" transform="rotate(6 55 262)"/>
      <rect x="38" y="298" width="30" height="26" rx="6" fill="#262b33"/>
      <rect x="36" y="296" width="34" height="8" rx="3" fill="url(#${id}-azul)"/>
    </g>
    <!-- Brazo derecho (saluda) -->
    <g class="nilo__brazo nilo__brazo--d">
      <path d="M166 214 L208 186" stroke="url(#${id}-crema)" stroke-width="22" stroke-linecap="round"/>
      <path d="M208 186 L228 146" stroke="url(#${id}-crema)" stroke-width="21" stroke-linecap="round"/>
      <circle cx="208" cy="186" r="9" fill="#c3cad3"/>
      <rect x="214" y="142" width="30" height="8" rx="3" fill="url(#${id}-azul)" transform="rotate(24 229 146)"/>
      <g transform="translate(20 16) rotate(20 211 112)">
        <rect x="196" y="96" width="32" height="32" rx="8" fill="#262b33"/>
        <rect x="196" y="80" width="8" height="22" rx="4" fill="#262b33"/>
        <rect x="206" y="76" width="8" height="24" rx="4" fill="#262b33"/>
        <rect x="216" y="78" width="8" height="22" rx="4" fill="#262b33"/>
        <rect x="228" y="104" width="8" height="18" rx="4" fill="#262b33"/>
      </g>
      <circle cx="166" cy="214" r="13" fill="url(#${id}-azul)"/>
    </g>
    <!-- Bufanda -->
    <g class="nilo__bufanda">
      <path class="nilo__bufanda-cola" d="M90 202 q-14 24 -6 52 l12 -4 q-4 -22 8 -42 z" fill="#c95f1c"/>
      <ellipse cx="120" cy="200" rx="48" ry="14" fill="#e8792b"/>
      <ellipse cx="120" cy="196" rx="40" ry="8" fill="#f39a52"/>
    </g>
    <!-- Cabeza -->
    <g class="nilo__cabeza">
      <g class="nilo__antena">
        <line x1="120" y1="60" x2="120" y2="26" stroke="#6b4a2f" stroke-width="5" stroke-linecap="round"/>
        <circle class="nilo__bombilla" cx="120" cy="25" r="6" fill="#e8d7b6" filter="url(#${id}-brillo)"/>
        <ellipse class="nilo__halo" cx="120" cy="12" rx="24" ry="6.5" fill="none" stroke="#5ff4f8" stroke-width="3.5" filter="url(#${id}-brillo)"/>
      </g>
      <path d="M30 150 C30 86 70 58 120 58 C170 58 210 86 210 150 L210 176 Q210 192 194 192 L46 192 Q30 192 30 176 Z" fill="url(#${id}-cupula)"/>
      <path d="M176 72 C198 92 210 118 210 150 L210 176 Q210 192 194 192 L176 192 Z" fill="#000" opacity=".1"/>
      <rect x="30" y="108" width="180" height="22" fill="url(#${id}-azul)"/>
      ${remaches(119, 40, 200, 20)}
      <rect x="30" y="164" width="180" height="18" fill="url(#${id}-azul)"/>
      ${remaches(173, 40, 200, 20)}
      <g class="nilo__cejas">
        <rect x="56" y="74" width="54" height="15" rx="6" fill="#1f232b" transform="rotate(-9 83 81)"/>
        <rect x="130" y="74" width="54" height="15" rx="6" fill="#1f232b" transform="rotate(9 157 81)"/>
      </g>
      <g class="nilo__lentes">
        <circle cx="86" cy="128" r="32" fill="#2a3b5c"/>
        <circle cx="154" cy="128" r="32" fill="#2a3b5c"/>
        <circle cx="86" cy="128" r="26" fill="url(#${id}-lente)"/>
        <circle cx="154" cy="128" r="26" fill="url(#${id}-lente)"/>
        <g class="nilo__ojos">
          <g class="nilo__pupilas" filter="url(#${id}-brillo)">
            <circle cx="88" cy="128" r="10" fill="url(#${id}-ojo)"/>
            <circle cx="152" cy="128" r="10" fill="url(#${id}-ojo)"/>
          </g>
        </g>
        <ellipse cx="76" cy="116" rx="8" ry="4.5" fill="#fff" opacity=".22" transform="rotate(-30 76 116)"/>
        <ellipse cx="144" cy="116" rx="8" ry="4.5" fill="#fff" opacity=".22" transform="rotate(-30 144 116)"/>
      </g>
    </g>
  </g>
</svg>`;
}
