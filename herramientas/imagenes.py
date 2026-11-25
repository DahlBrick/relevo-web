"""Optimiza las imágenes de la web: WebP a 1600 px como máximo y una miniatura de 640 px (-640.webp).

Uso:  python herramientas/imagenes.py            (convierte los JPG/PNG de public/img y borra los JPG ya convertidos)
      python herramientas/imagenes.py --nuevas    (además, importa capturas del juego y fotogramas de los vídeos)

Las capturas nuevas salen del repositorio del juego (Assets/Resources/Bitacora/PuertoN.jpg) y de los
vídeos de C:/Users/Usuario/Videos (fotogramas sacados con ffmpeg). Los vídeos no se copian a la web.
"""
import os, subprocess, sys, tempfile
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(RAIZ, 'public', 'img')
JUEGO = r'C:/Users/Usuario/Downloads/RelevoZIP6/RelevoZIP6/Assets/Resources/Bitacora'
VIDEOS = r'C:/Users/Usuario/Videos'
DEVLOG = os.path.join(VIDEOS, 'RELEVO - Actualizacion Desarrollo.mp4')
GAMEPLAY = os.path.join(VIDEOS, 'RELEVO - Gameplay YouTube.mp4')

# nombre → (vídeo, segundo)
FOTOGRAMAS = {
    'liria_ciudad': (DEVLOG, 28),
    'liria_casas': (DEVLOG, 20),
    'liria_noche': (GAMEPLAY, 15),
    'apagon_canal': (DEVLOG, 40),
    'apagon_calle': (GAMEPLAY, 7),
    'apagon_faro': (GAMEPLAY, 6),
    'apagon_montaje': (DEVLOG, 55),
    'despertar_muelle': (GAMEPLAY, 35),
    'despertar_nilo': (GAMEPLAY, 40),
    'maia_radio': (DEVLOG, 95),
    'cuaderno_recuerdo1': (GAMEPLAY, 90),
    'muelle_rehecho': (DEVLOG, 125),
    'muelle_editor': (DEVLOG, 135),
    'faro_condensadores': (DEVLOG, 190),
    'faro_planta': (DEVLOG, 205),
    'faro_vigila': (DEVLOG, 210),
    'jefe_eco': (DEVLOG, 220),
    'jefe_combate': (DEVLOG, 245),
    'jefe_golpe': (DEVLOG, 280),
    'jefe_victoria': (DEVLOG, 288),
    'cinematica_final': (DEVLOG, 292),
}


def guardar(im, destino, ancho_max=1600):
    im = im.convert('RGB')
    if im.width > ancho_max:
        im = im.resize((ancho_max, round(im.height * ancho_max / im.width)), Image.LANCZOS)
    im.save(destino, 'WEBP', quality=80, method=6)
    base = destino[:-5]
    mini = im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS) if im.width > 640 else im
    mini.save(base + '-640.webp', 'WEBP', quality=74, method=6)


def convertir_existentes():
    for carpeta, _, archivos in os.walk(IMG):
        if 'relato' in carpeta:
            continue
        for a in archivos:
            ruta = os.path.join(carpeta, a)
            nombre, ext = os.path.splitext(a)
            if ext.lower() not in ('.jpg', '.jpeg'):
                continue
            if a == 'keyart.jpg':  # respaldo del <picture> de la portada
                continue
            destino = os.path.join(carpeta, nombre + '.webp')
            if not os.path.exists(destino):
                guardar(Image.open(ruta), destino)
            os.remove(ruta)


def importar_nuevas():
    puertos = os.path.join(IMG, 'puertos')
    os.makedirs(puertos, exist_ok=True)
    for n in range(1, 14):
        guardar(Image.open(os.path.join(JUEGO, f'Puerto{n}.jpg')), os.path.join(puertos, f'puerto{n}.webp'))
    capturas = os.path.join(IMG, 'v1')
    os.makedirs(capturas, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for nombre, (video, seg) in FOTOGRAMAS.items():
            png = os.path.join(tmp, nombre + '.png')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(seg), '-i', video, '-frames:v', '1', png], check=True)
            guardar(Image.open(png), os.path.join(capturas, nombre + '.webp'))
    videos = os.path.join(IMG, 'videos')
    os.makedirs(videos, exist_ok=True)
    guardar(Image.open(os.path.join(VIDEOS, 'RELEVO - Miniatura YouTube.jpg')), os.path.join(videos, 'gameplay.webp'))
    guardar(Image.open(os.path.join(VIDEOS, 'RELEVO - Miniatura Actualizacion.jpg')), os.path.join(videos, 'devlog.webp'))


if __name__ == '__main__':
    if '--nuevas' in sys.argv:
        importar_nuevas()
    convertir_existentes()
    print('listo')
