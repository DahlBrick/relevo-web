// Página Jugar / Descargar. Reutiliza la escena de las páginas "pronto" (capas, Nilo y cartel 3D)
// y ordena los botones según el dispositivo: en Windows manda la descarga; en el resto, el navegador.
import '../pronto/pronto.js';

const ua = navigator.userAgent;
const plataforma = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
const esMovil = navigator.userAgentData?.mobile ?? /android|iphone|ipad|ipod|mobile/i.test(ua);
// Un iPad moderno se presenta como Mac con pantalla táctil.
const esIPad = /mac/.test(plataforma) && navigator.maxTouchPoints > 1;
const esWindows = !esMovil && !esIPad && (/win/.test(plataforma) || /Windows NT/.test(ua));

const acciones = document.getElementById('acciones');
const windows = document.getElementById('boton-windows');
const navegador = document.getElementById('boton-navegador');
const aviso = document.getElementById('aviso-dispositivo');

if (esWindows) {
  acciones.prepend(windows);
  windows.className = 'btn btn--jugar';
  navegador.className = 'btn btn--ghost';
} else {
  // Fuera de Windows el navegador va primero. Mientras la versión web no esté lista, la descarga
  // sigue a mano (por ejemplo, para pasarla a un PC).
  acciones.prepend(navegador);
  navegador.className = 'btn btn--jugar';
  windows.className = 'btn btn--ghost';
  aviso.hidden = false;
  aviso.textContent = esMovil || esIPad
    ? 'La descarga es para PC con Windows. La versión para jugar desde el móvil o la tablet llegará pronto.'
    : 'La descarga es para PC con Windows. La versión para jugar en el navegador de tu equipo llegará pronto.';
}
document.documentElement.dataset.sistema = esWindows ? 'windows' : esMovil || esIPad ? 'movil' : 'otro';
