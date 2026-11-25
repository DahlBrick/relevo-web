# RELEVO · Web

Sitio local del juego RELEVO:

- `index.html`: portada con el key art, relato 2D por capas (parallax), los 13 puertos, teaser y vídeos de YouTube (gameplay y devlog), cinemáticas y notas del desarrollador.
- `bitacora.html`: la **Bitácora 3D**, un recorrido con la rueda del mouse en 15 etapas, del prototipo 2D en Godot a la versión 1.0.
- `juego.html`: **Jugar / Descargar**. Descarga para Windows desde GitHub Releases (`DahlBrick/RelevoZIP6`, archivo `RELEVO-Windows.zip`); la versión para el navegador figura como "Próximamente". En Windows el botón principal es la descarga; en el resto, el navegador.
- `historia.html`, `comunidad.html`: páginas "Coming soon" con Nilo animado.

## Abrir en local

Doble clic en **`Abrir Relevo Web.bat`**, o en una terminal dentro de esta carpeta:

```
npm install
npm run dev
```

Luego abre http://127.0.0.1:5173/ (portada) o http://127.0.0.1:5173/bitacora.html (bitácora).
`npm run build` genera la versión estática en `dist/`.

## Publicación

La web está publicada en **https://dahlbrick.github.io/relevo-web/** (GitHub Pages, repositorio
`DahlBrick/relevo-web`). Cada `git push` a `main` la reconstruye y publica sola
(`.github/workflows/pages.yml`, tarda ~1 minuto). En el build el sitio usa la base `/relevo-web/`
(`vite.config.js`); en local, la raíz.

### Nueva versión del juego

1. Comprime `Builds/Windows` del repo del juego como `RELEVO-Windows.zip` (con una carpeta `RELEVO/` dentro).
2. `gh release create vX.Y.Z RELEVO-Windows.zip --repo DahlBrick/RelevoZIP6 --title ... --notes ...`
3. El enlace `releases/latest/download/RELEVO-Windows.zip` apunta solo a la última; actualiza el tamaño en `juego.html`.

## Rendimiento

`src/shared/calidad.js` elige un perfil (`alta`, `media`, `baja`) según memoria, núcleos, pantalla, GPU por software y
`prefers-reduced-motion`, y lo baja si los FPS caen por debajo de 28. Se puede forzar con `?calidad=baja` en la URL.
En `baja`: pixelRatio 1, sin sombras, sin bloom ni contornos, menos partículas y texturas de 640 px. Si WebGL falla,
la bitácora sigue como scroll 2D (`body.sin-3d`).

- `python herramientas/imagenes.py`: pasa los JPG de `public/img` a WebP (1600 px y una versión `-640`).
  Con `--nuevas` importa también las capturas de los puertos, los fotogramas de los vídeos y las miniaturas.
- `node herramientas/modelos.mjs`: comprime los modelos (meshopt + texturas WebP de 512 px); los `.gltf` de
  Quaternius pasan a `.glb`.
- Los vídeos de YouTube se cargan solo al pulsar (fachada con póster, `youtube-nocookie.com`).

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
