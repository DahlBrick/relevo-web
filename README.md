# RELEVO · Web

Sitio local del juego RELEVO:

- `index.html`: portada con el key art, relato 2D por capas (parallax), niveles, teaser de YouTube, cinemáticas y notas del desarrollador.
- `bitacora.html`: la **Bitácora 3D**, un recorrido con la rueda del mouse del prototipo 2D en Godot a la Beta 1.0.
- `juego.html`, `historia.html`, `comunidad.html`: páginas "Coming soon" con Nilo animado.

## Abrir en local

Doble clic en **`Abrir Relevo Web.bat`**, o en una terminal dentro de esta carpeta:

```
npm install
npm run dev
```

Luego abre http://127.0.0.1:5173/ (portada) o http://127.0.0.1:5173/bitacora.html (bitácora).
`npm run build` genera la versión estática en `dist/`.

## Estructura

- `src/home/escena.js`: capas dibujadas del relato de la portada; `home.js` las mueve con el scroll.
- `src/shared/nilo-svg.js` + `nilo.css`: Nilo en 2D animado (saluda, camina, parpadea).
- `src/shared/nav.js`: barra común con menú móvil. `src/shared/lightbox.js`: visor y teaser (`TEASER_YT`).
- `src/pronto/`: plantilla de las páginas "Coming soon".
- `src/bitacora/capitulos.js`: textos y galerías de cada etapa (editar aquí el contenido).
- `src/bitacora/estaciones.js`: el mundo 3D de cada etapa y sus animaciones ligadas al scroll.
- `src/bitacora/camara.js`: paradas del riel de cámara.
- `src/bitacora/diorama.js`: construye los niveles desde los mismos mapas de texto del juego (`LevelLayouts.cs`).
- `src/bitacora/nilo.js`: Nilo (robot de Quaternius con bufanda, antena y ojos), `agua.js`, `cielo.js`, `vida.js`, `post.js`.
- `public/img`, `public/video`: material del desarrollo (MATERIAL BITACORA, docs/bitacora y teasers).
- `public/models`: modelos CC0 de Kenney y Quaternius usados por el juego.

## Ilustraciones del relato (regenerarlas)

Las capas de la portada (`public/img/relato/`) se renderizan con los modelos del juego:

```
node herramientas/guardar.mjs
```

y, con `npm run dev` corriendo, abrir http://127.0.0.1:5173/herramientas/capas.html. La página monta las
escenas (`src/herramientas/capas.js`), renderiza cada capa de tarde y de noche, la hoja de Nilo caminando y
`relato.json` con las posiciones (pies de Nilo, hueco del puente, faro).

## Créditos

Modelos CC0 de Kenney (kenney.nl) y Quaternius (quaternius.com). Fuentes Lilita One y Varela Round (OFL).
