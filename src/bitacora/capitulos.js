// Contenido de la bitácora. Etapas 1–6: MATERIAL BITACORA. Etapas 7–9: docs/bitacora/BITACORA.md
// del repositorio (rama mejora-grafica). Etapas 10–15: historial de commits desde el 13-oct, la
// Entrada 17 de la bitácora y docs/narrativa (historia_final.md). Cada capítulo es una sección de
// scroll y una estación del mundo 3D.

const E = (n) => `${import.meta.env.BASE_URL}img/etapas/e${n}.webp`;
const B = (n) => `${import.meta.env.BASE_URL}img/bitacora/${n}.webp`;
const V = (n) => `${import.meta.env.BASE_URL}video/${n}.mp4`;
const C = (n) => `${import.meta.env.BASE_URL}img/v1/${n}.webp`;
const P = (n) => `${import.meta.env.BASE_URL}img/puertos/puerto${n}.webp`;
const Y = (n) => `${import.meta.env.BASE_URL}img/videos/${n}.webp`;

// Vídeos de YouTube (el reproductor solo se carga al pulsar el póster).
export const YT_GAMEPLAY = 'EvTGAfRIXgc';
export const YT_DEVLOG = 'aIs9ir1Icd4';

export const CAPITULOS = [
  {
    id: 'intro',
    tipo: 'intro',
    rail: 'Inicio',
    alto: 1.6,
  },
  {
    id: 'etapa-1',
    numero: '01',
    rail: 'Godot 2D',
    etiqueta: 'Etapa 1 · Prototipo',
    titulo: 'Primer prototipo de la lógica en Godot',
    lado: 'izq',
    alto: 2.6,
    entradilla:
      'Antes de pensar en cómo se vería, había que comprobar que la idea funcionaba: transportar una batería, colocarla en una base, activar un puente y usar una palanca para llegar a la meta.',
    parrafos: [
      'Elegimos Godot por su rapidez para prototipar y su sistema 2D. La poca experiencia del equipo con el motor y su lenguaje complicó coordinar la batería, la base, el puente, la palanca y los espacios del escenario.',
      'El mapa usaba recursos gráficos provisionales: islas, agua y puentes ya marcaban la estructura del nivel, pero las piezas funcionales seguían siendo cuadrados de colores.',
    ],
    hitos: ['Recorrido y secuencia validados', 'Mecánicas que se conservan', 'Hacía falta otra herramienta'],
    chips: ['Godot', '2D', 'Prueba de concepto'],
    galeria: [
      { src: E('1.1'), pie: 'Mapa 2D del prototipo en Godot, con recursos provisionales.' },
      { src: E('1.2'), pie: 'Zonas interactivas marcadas con cuadrados de colores.' },
      { src: E('1.3'), pie: 'Prueba de la secuencia batería → base → puente → palanca.' },
    ],
  },
  {
    id: 'etapa-2',
    numero: '02',
    rail: 'Graybox',
    etiqueta: 'Etapa 2 · Cambio de motor',
    titulo: 'Del 2D al graybox en Unity 3D',
    lado: 'der',
    alto: 2.6,
    entradilla:
      'Con lo aprendido en Godot, reconstruimos la lógica en Unity y en tres dimensiones: geometría básica y materiales provisionales para volver a probar a Nilo, la batería, las bases, la palanca, el puente y la salida.',
    parrafos: [
      'La interacción fue más sencilla de implementar porque el equipo ya conocía Unity y su flujo de trabajo. El 3D también ordenó mejor las alturas, las plataformas, los obstáculos y las zonas transitables.',
      'Los colores eran códigos para diferenciar estados y elementos interactivos. Aun así, el graybox demostró que la secuencia central de RELEVO funcionaba en 3D.',
    ],
    cita: 'No fue solo una decisión visual: Unity facilitaba organizar escenas, colisiones, scripts, cámaras e interacciones.',
    chips: ['Unity', 'Graybox', '3D'],
    galeria: [
      { src: E('2.1'), pie: 'Primer graybox: bloques y códigos de color.' },
      { src: E('2.2'), pie: 'Evolución del escenario en geometría básica.' },
      { src: E('2.3'), pie: 'Plataformas, alturas y zonas transitables.' },
      { src: E('2.4'), pie: 'La base técnica del escenario definitivo.' },
    ],
  },
  {
    id: 'etapa-3',
    numero: '03',
    rail: 'Nivel 1',
    etiqueta: 'Etapa 3 · Construcción visual',
    titulo: 'El graybox se viste: nace el Muelle de Cobre',
    lado: 'izq',
    alto: 2.8,
    entradilla:
      'Con la lógica validada, la geometría provisional fue cediendo su lugar a un escenario con identidad: personajes reconocibles, materiales, iluminación, animaciones y decoración.',
    parrafos: [
      'Los scripts AnimadorNilo, AnimadorMaia y AcentoEmisivo dieron movimiento a los personajes y pulsos de luz a los objetos interactivos: halos y aros en la batería, la base, la palanca, la salida y el recuerdo.',
      'Nada de esto tocó los colliders ni las reglas. El Nivel 1 se verificó de principio a fin: batería, base, puente, palanca, pasarela, recuerdo y salida.',
    ],
    datos: [
      { valor: '314', etiqueta: 'renderers' },
      { valor: '74', etiqueta: 'colliders' },
      { valor: '7', etiqueta: 'luces' },
      { valor: '0', etiqueta: 'errores' },
    ],
    chips: ['Animación', 'Emisivos', 'Nivel 1'],
    galeria: [
      { src: E('3.1'), pie: 'Nilo y Maia, primera versión con primitivas.' },
      { src: E('3.2'), pie: 'Evolución visual del escenario.' },
      { src: E('3.3'), pie: 'Acentos emisivos en las piezas interactivas.' },
      { src: E('3.4'), pie: 'El puente eléctrico en funcionamiento.' },
      { src: E('3.5'), pie: 'Nilo, Maia y la batería en el muelle.' },
      { src: E('3.6'), pie: 'Nivel 1 completado.' },
    ],
  },
  {
    id: 'etapa-4',
    numero: '04',
    rail: 'Nivel 2',
    etiqueta: 'Etapa 4 · Diseño de niveles',
    titulo: 'Nivel 2: el Patio de Bombas',
    lado: 'der',
    alto: 2.4,
    entradilla:
      'Tres muelles separados por dos canales. Dos bases de energía, dos pasarelas manuales y una regla que lo cambia todo: solo una base puede estar alimentada a la vez.',
    parrafos: [
      'El jugador ya conoce el ciclo de observar, conectar, accionar y recuperar. Aquí tiene que decidir el orden: qué puente encender primero, qué pasarela dejar abierta y cómo volver a por la batería.',
      'El objetivo final no cambia: cruzar el patio llevando la batería hasta la salida.',
    ],
    cita: '«Dos bases y dos pasarelas manuales. Solo una base puede estar alimentada a la vez.»',
    chips: ['Puzle', 'Dos bases', 'Orden de acciones'],
    galeria: [
      { src: E('4.1'), pie: 'Patio de Bombas: Maia presenta el nivel.' },
      { src: E('4.2'), pie: 'Las dos pasarelas abiertas, rumbo a la salida.' },
    ],
  },
  {
    id: 'etapa-5',
    numero: '05',
    rail: 'Faro',
    etiqueta: 'Etapa 5 · El destino',
    titulo: 'Nivel 3: el Faro de Liria',
    lado: 'izq',
    alto: 2.4,
    entradilla:
      'El viaje termina donde empezó la idea: el faro necesita la última batería. Esta vez no hay que cruzarla, hay que entregarla en su cuna.',
    parrafos: [
      'La isla del faro tiene una sola entrada, el puente de la base D. Al retirar la batería ese puente se retrae, así que el regreso depende de la pasarela de la palanca.',
      'Al encender el faro, Liria recupera la energía en ese tramo de canal.',
    ],
    cita: '«El faro vuelve a señalar la ruta segura. Los primeros botes cruzan el canal.»',
    chips: ['Final de la aventura', 'Base D', 'Palanca K'],
    galeria: [
      { src: E('5.1'), pie: 'Faro de Liria: la batería tiene que llegar a su base.' },
      { src: E('5.2'), pie: 'Nivel completado: el faro vuelve a brillar.' },
    ],
  },
  {
    id: 'etapa-6',
    numero: '06',
    rail: 'Interfaz',
    etiqueta: 'Etapa 6 · Interfaz',
    titulo: 'HUD, pausa y cuaderno de viaje',
    lado: 'der',
    alto: 2.4,
    entradilla:
      'El jugador siempre tiene que saber qué hacer y dónde está la batería. La interfaz se construyó con la paleta del juego: azul verdoso profundo, cobre y ámbar.',
    parrafos: [
      'El HUD muestra el objetivo, los recuerdos y el estado de la batería, con la leyenda de controles abajo. La pausa permite pedir una pista a Maia o reiniciar.',
      'Al restaurar un tramo se abre el cuaderno de viaje, donde se guardan los recuerdos de Liria: la barquera, el aprendiz de bombas y el farero.',
    ],
    cita: '«Aprendí a leer los cables antes que las letras. Turquesa es manual; ámbar, prestado.»',
    chips: ['UI', 'Cuaderno', 'Recuerdos'],
    galeria: [
      { src: E('6.1'), pie: 'HUD del Nivel 1: objetivo, recuerdos y batería.' },
      { src: E('6.2'), pie: 'Menú de pausa con pista de Maia.' },
      { src: E('6.3'), pie: 'Nivel restaurado.' },
      { src: E('6.4'), pie: 'Cuaderno de viaje con los tres recuerdos.' },
    ],
  },
  {
    id: 'etapa-7',
    numero: '07',
    rail: 'Arte',
    etiqueta: 'Etapa 7 · Mejora gráfica',
    titulo: 'El mundo cobra vida',
    lado: 'izq',
    alto: 3.2,
    entradilla:
      'Las primitivas se reemplazaron por modelos 3D estilizados y el escenario empezó a moverse, sin cambiar ni una regla del juego.',
    parrafos: [
      'Partimos de packs gratuitos CC0 de Quaternius y Kenney y los unificamos con un kit visual propio. Escribimos dos shaders: un agua que cambia de color con la profundidad y hace espuma contra las orillas, y un follaje que se mece con el viento.',
      'Nilo pasó a ser un robot animado con bufanda naranja y antena cian, con gestos que responden a cada acción. Después llegaron las piezas del puzle, el malecón de piedra, un HUD con Lilita One y Varela Round, la tecla E animada y diálogos con retratos en vivo.',
    ],
    hitos: ['Árboles rojos: las texturas eran máscaras', 'Agua con manchas: espuma en líneas finas', 'Imagen lavada: niebla lineal'],
    datos: [
      { valor: '8', etiqueta: 'packs CC0' },
      { valor: '2', etiqueta: 'shaders propios' },
      { valor: '74', etiqueta: 'colliders intactos' },
    ],
    chips: ['Shaders', 'Nilo animado', 'HUD', 'Diálogos'],
    galeria: [
      { src: B('00_nivel1_antes'), pie: 'Punto de partida: el Nivel 1 con primitivas.' },
      { src: B('02_primer_intento_arboles_rojos'), pie: 'Primer intento: árboles rojos y agua con manchas.' },
      { src: B('03_texturas_y_agua_corregidas'), pie: 'Texturas y agua corregidas.' },
      { src: B('07_primer_plano_nilo'), pie: 'Nilo animado en el muelle.' },
      { src: B('09_piezas_del_puzle'), pie: 'Piezas del puzle: Maia, batería, base, palanca, salida y recuerdo.' },
      { src: B('13_tecla_e_animada'), pie: 'La tecla E, fotograma a fotograma.' },
      { src: B('16_malecon_de_piedra'), pie: 'Malecón de piedra con pilotes de amarre.' },
      { src: B('18_dialogo_maia_con_retratos'), pie: 'Diálogos con retratos en vivo.' },
      { src: V('01_cinematica'), video: true, pie: 'Cinemática del teaser: cuatro planos con corte seco.' },
      { src: V('02_jugabilidad'), video: true, pie: 'Jugabilidad del Nivel 1 con piloto automático.' },
    ],
  },
  {
    id: 'etapa-8',
    numero: '08',
    rail: 'Mecánicas',
    etiqueta: 'Etapa 8 · Mecánicas nuevas',
    titulo: 'Reserva de energía, cajas y un robot que se apaga',
    lado: 'der',
    alto: 3.0,
    entradilla:
      'El Patio de Bombas se rediseñó para ser más desafiante. Lejos de la batería, Nilo gasta su reserva por cada casilla recorrida. Si llega a cero, se apaga.',
    parrafos: [
      'Al apagarse, la antena destella en rojo, sale humo, los ojos se apagan y la cabeza cae sobre el pecho. Maia lo explica y el patio se reinicia.',
      'Las cajas se empujan sobre placas de presión que abren compuertas y despliegan puentes turquesa. Maia enseña todo con tarjetas ilustradas animadas, y dos cinemáticas con cámara de cine lo cuentan en planos detalle.',
    ],
    datos: [
      { valor: '12', etiqueta: 'casillas de reserva' },
      { valor: '≈2', etiqueta: 'de margen, ruta correcta' },
      { valor: '≈17', etiqueta: 'necesita la ruta equivocada' },
    ],
    chips: ['Reserva', 'Cajas y placas', 'Cinemáticas'],
    galeria: [
      { src: B('21_nivel2_patio_de_bombas'), pie: 'El Patio de Bombas renovado.' },
      { src: B('26_nilo_se_apaga_primer_plano'), pie: 'Nilo se apaga: antena roja, ojos apagados.' },
      { src: B('22_maia_tarjeta_reserva'), pie: 'Tarjeta ilustrada de la reserva.' },
      { src: B('23_maia_tarjeta_cajas'), pie: 'Tarjeta ilustrada de las cajas.' },
      { src: B('25_caja_placa_compuerta_y_reserva'), pie: 'Caja, placa, compuerta y panel de reserva.' },
      { src: B('28_solucion_completa_nivel2'), pie: 'Solución completa con piloto automático.' },
      { src: V('05_cinematica_apagado'), video: true, pie: 'Cinemática: cómo se descarga y se apaga Nilo.' },
      { src: V('06_cinematica_cajas'), video: true, pie: 'Cinemática: empujar la caja sobre la placa.' },
    ],
  },
  {
    id: 'etapa-9',
    numero: '09',
    rail: 'Próximo',
    etiqueta: 'Etapa 9 · Siguiente versión',
    titulo: 'Maquetas de lo que viene',
    lado: 'izq',
    alto: 3.2,
    entradilla:
      'Timelapses de niveles nuevos, construidos pieza a pieza con el mismo generador del juego, como adelanto de la próxima beta.',
    parrafos: [
      'Mareas de Liria: la marea sube y baja, y los pasos de piedra solo asoman con el agua baja. Los Condensadores: el puente aguanta mientras se vacían las barras de carga.',
      'La Ciénaga de los Faroles Ahogados cambia el agua por un pantano turbio con niebla que retrocede al encender cada farol. La Forja de Ascuas convierte el canal en un río de lava donde las losas de basalto emergen, se enfrían y vuelven a fundirse.',
    ],
    chips: ['Mareas', 'Condensadores', 'Ciénaga', 'Forja'],
    galeria: [
      { src: V('07_maqueta_mareas'), video: true, pie: 'Mareas de Liria: timelapse de construcción.' },
      { src: V('08_maqueta_condensadores'), video: true, pie: 'Los Condensadores: timelapse.' },
      { src: V('09_cienaga_faroles_ahogados'), video: true, pie: 'Ciénaga de los Faroles Ahogados.' },
      { src: V('10_forja_de_ascuas'), video: true, pie: 'Forja de Ascuas.' },
      { src: B('34_cienaga_faroles_ahogados'), pie: 'La Ciénaga: niebla, lápidas y un barco fantasma.' },
      { src: B('35_forja_de_ascuas'), pie: 'La Forja: lava, ruinas y salamandras de fuego.' },
    ],
  },
  {
    id: 'etapa-10',
    numero: '10',
    rail: 'Liria',
    etiqueta: 'Etapa 10 · La ciudad · 16 de octubre',
    titulo: 'Liria, modelada en Blender por script',
    lado: 'der',
    alto: 2.8,
    entradilla:
      'La ciudad dejó de ser un fondo. Un script de Blender construye Liria entera, con muelles y casas sobre pilotes, y la exporta a Unity con sus colisiones.',
    parrafos: [
      'construir_liria.py genera ocho bloques: el barrio residencial, el canal con su puente, el muelle industrial con grúa, el faro sobre su peñasco, el barrio de piedra, los palafitos con mercado y la bahía con barcas. Alrededor, islotes con árboles y una cordillera lejana para las cinemáticas.',
      'Todo con un estilo de cómic propio: sombreado en bandas, sombra violeta con trama, tinta fina en los contornos, chapa ondulada y agua con espuma. El mismo día llegaron los documentos de narrativa: la biblia de Liria, la red narrativa, el mundo reactivo y el Acto I.',
    ],
    hitos: ['Ocho bloques de ciudad', 'Estilo cómic con tinta', 'Nilo ya no se atasca en los bordes'],
    chips: ['Blender', 'Python', 'Estilo cómic', 'Narrativa'],
    galeria: [
      { src: C('liria_ciudad'), pie: 'Liria completa: el faro, las casas sobre pilotes y los muelles.' },
      { src: C('liria_casas'), pie: 'Los tejados y los palafitos, dentro del juego.' },
      { src: C('liria_noche'), pie: 'Liria de noche, en la cinemática del prólogo.' },
    ],
  },
  {
    id: 'etapa-11',
    numero: '11',
    rail: 'Cinemáticas',
    etiqueta: 'Etapa 11 · Cinemáticas · 16 y 17 de octubre',
    titulo: 'La noche del apagón y el Despertar',
    lado: 'izq',
    alto: 2.8,
    entradilla:
      'El juego empieza con una cinemática de 98 segundos dirigida plano a plano: Liria encendida, el apagón en cadena y un robot que despierta sin memoria.',
    parrafos: [
      'Una cámara de cine propia, con profundidad de campo, cámara en mano, grano y bandas 2,39:1. Toda la puesta en escena depende del tiempo, así que se puede revisar desde cualquier segundo. Las luces caen barrio a barrio al pulso de la canción, que se frena como una cinta, hasta que solo queda la luna.',
      'Después, en primera persona, los párpados de Nilo se abren a trompicones. Se levanta rígido, como una máquina que arranca, y una radio se enciende sola. La canción provisional y los sonidos (estática, agua, relés) se generan por código.',
    ],
    cita: '«Unidad de memoria: 0 bytes.»',
    datos: [
      { valor: '98 s', etiqueta: 'de apertura' },
      { valor: '17', etiqueta: 'planos' },
      { valor: '2,39:1', etiqueta: 'formato de cine' },
    ],
    chips: ['Cinemática', 'Cámara de cine', 'Sonido por código'],
    galeria: [
      { src: C('apagon_faro'), pie: 'Prólogo: la noche en que Liria se apagó.' },
      { src: C('apagon_calle'), pie: 'Ventanas, faros y farolas con luz cálida de noche.' },
      { src: C('apagon_canal'), pie: 'Las luces de Liria se apagan barrio a barrio.' },
      { src: C('apagon_montaje'), pie: 'Montaje del plano en el editor.' },
      { src: C('despertar_muelle'), pie: 'Nilo despierta en el muelle, sin memoria.' },
      { src: C('despertar_nilo'), pie: 'El Despertar: Nilo se pone en pie.' },
      { src: C('maia_radio'), pie: 'Maia es una radio: ella habla, Nilo no.' },
    ],
  },
  {
    id: 'etapa-12',
    numero: '12',
    rail: 'Circuitos',
    etiqueta: 'Etapa 12 · Trabajo en equipo · 17 de octubre',
    titulo: 'Circuitos de energía y un cuaderno nuevo',
    lado: 'der',
    alto: 2.4,
    entradilla:
      'Dos ramas del equipo entraron el mismo día por pull request: un prototipo de circuitos de energía y el cuaderno de viaje rediseñado.',
    parrafos: [
      'El prototipo de circuitos prueba a llevar la energía por cables de cobre, turquesa y ámbar, con su palanca y las instrucciones en pantalla. Tras la primera revisión, la palanca pasó a una zona más central y se reordenó la interfaz.',
      'El cuaderno de viaje se convirtió en un libro decorado, con un menú de exploración: cada recuerdo se guarda con su ilustración y su texto, puerto a puerto.',
    ],
    hitos: ['PR #1 · fajardo/mecanicas', 'PR #2 · fajardo/cuaderno'],
    chips: ['Pull requests', 'Circuitos', 'Cuaderno de viaje'],
    galeria: [
      { src: C('cuaderno_recuerdo1'), pie: 'El cuaderno de viaje: Recuerdo 1, la primera canción.' },
      { src: E('6.4'), pie: 'Antes: el cuaderno de la Beta 1.0.' },
    ],
  },
  {
    id: 'etapa-13',
    numero: '13',
    rail: 'Puertos 1-3',
    etiqueta: 'Etapa 13 · Diseño de niveles · 4 de noviembre',
    titulo: 'Los tres primeros puertos, rehechos',
    lado: 'izq',
    alto: 2.8,
    entradilla:
      'Con la historia nueva, el Muelle de Cobre, el Patio de Bombas y el Faro de Liria se rehicieron más completos y más difíciles.',
    parrafos: [
      'El Muelle tiene ahora tres orillas y el ciclo de base, puente y palanca se repite dos veces. El Patio suma una compuerta con caja, una reserva de 12 para la palanca y el muelle este, y un puente de placa. Los tres pasan al estilo cómic, con objetivos paso a paso.',
      'El Faro estrena los condensadores: sostienen el puente 3,2 segundos después de retirar la batería. Si el puente se repliega con Nilo encima, cae al agua. Para comprobar que cada mapa tiene solución se escribió un solucionador.',
    ],
    datos: [
      { valor: '5', etiqueta: 'de dificultad en el 2 y el 3' },
      { valor: '3,2 s', etiqueta: 'aguanta un condensador' },
      { valor: '12', etiqueta: 'casillas de reserva' },
    ],
    chips: ['Condensadores', 'Estilo cómic', 'Solucionador'],
    galeria: [
      { src: Y('gameplay'), youtube: YT_GAMEPLAY, pie: 'Gameplay en YouTube: el prólogo y los puertos 1 a 3.' },
      { src: P(1), pie: 'Puerto 01 · Muelle de Cobre.' },
      { src: P(2), pie: 'Puerto 02 · Patio de Bombas.' },
      { src: P(3), pie: 'Puerto 03 · Faro de Liria.' },
      { src: C('faro_condensadores'), pie: 'Condensadores: el puente aguanta un rato sin batería.' },
      { src: C('muelle_rehecho'), pie: 'El Muelle de Cobre rehecho, con Maia.' },
      { src: C('muelle_editor'), pie: 'Probando el nivel en el editor.' },
      { src: C('faro_planta'), pie: 'El Faro visto desde arriba.' },
      { src: C('faro_vigila'), pie: 'El faro vigila todo el puerto.' },
    ],
  },
  {
    id: 'etapa-14',
    numero: '14',
    rail: 'Puertos 4-12',
    etiqueta: 'Etapa 14 · Nueve puertos más · 18 y 19 de noviembre',
    titulo: 'De la Aduana de la Marea al Varadero de las Campanas',
    lado: 'der',
    alto: 2.8,
    entradilla:
      'En dos días el mapa pasó de tres puertos a doce, con mecánicas nuevas, decoración, las láminas de los recuerdos y música.',
    parrafos: [
      'Cada puerto tiene su entrada y su cierre, un recuerdo escondido y la voz de Maia, que se va rompiendo con interferencias a medida que avanza la noche. Los recuerdos cuentan la verdad en orden, salvo uno.',
      'Llegaron dos mecánicas nuevas, el cuaderno se decoró con doce láminas ilustradas y entró la música. Después, la reserva de energía se extendió a los niveles 9 a 12.',
    ],
    datos: [
      { valor: '9', etiqueta: 'puertos nuevos' },
      { valor: '12', etiqueta: 'recuerdos' },
      { valor: '2', etiqueta: 'mecánicas nuevas' },
    ],
    chips: ['Niveles', 'Recuerdos', 'Música'],
    galeria: [
      { src: P(4), pie: 'Puerto 04 · Aduana de la Marea.' },
      { src: P(5), pie: 'Puerto 05 · Dársena del Torno.' },
      { src: P(6), pie: 'Puerto 06 · Esclusa de las Dos Llaves.' },
      { src: P(7), pie: 'Puerto 07 · Lonja de las Dos Voces.' },
      { src: C('laminas_recuerdos'), pie: 'Las láminas de los recuerdos del cuaderno.' },
      { src: P(8), pie: 'Puerto 08 · Archivo de la Frecuencia.' },
      { src: P(9), pie: 'Puerto 09 · Astillero de la Maroma.' },
      { src: P(10), pie: 'Puerto 10 · Casa de las Dos Guardias.' },
      { src: P(11), pie: 'Puerto 11 · Mercado de la Sal.' },
      { src: P(12), pie: 'Puerto 12 · Varadero de las Campanas.' },
    ],
  },
  {
    id: 'etapa-15',
    numero: '15',
    rail: 'Jefe final',
    etiqueta: 'Etapa 15 · Juego completo · 24 de noviembre',
    titulo: 'El Eco del Apagón y el juego de principio a fin',
    lado: 'izq',
    alto: 3.0,
    entradilla:
      'El puerto 13 es la Sala del Relevo: una figura enorme de tinta y cobre, el Eco del Apagón, se levanta en la subestación y va a por Nilo.',
    parrafos: [
      'El Eco persigue, embiste y lanza pulsos que repliegan los puentes. Solo las tres torres cargadas con la batería le hacen daño, y cada golpe baja la señal de Maia. El combate tiene música propia; al vencerlo amanece y los faroles se encienden desde el núcleo hacia fuera.',
      'Ese mismo día RELEVO quedó completo: título nuevo sobre la Liria real, la narrativa de los 13 puertos, dos decisiones, cuatro finales, todas las cinemáticas y los créditos. Y la primera build de Windows, la versión 1.0.0.',
    ],
    datos: [
      { valor: '13', etiqueta: 'puertos' },
      { valor: '12', etiqueta: 'recuerdos' },
      { valor: '2', etiqueta: 'decisiones' },
      { valor: '4', etiqueta: 'finales' },
    ],
    chips: ['Jefe final', 'Cuatro finales', 'Build de Windows'],
    galeria: [
      { src: Y('devlog'), youtube: YT_DEVLOG, pie: 'Devlog en YouTube: Liria, cinemáticas y jefe final.' },
      { src: P(13), pie: 'Puerto 13 · La Sala del Relevo.' },
      { src: C('jefe_eco'), pie: 'Primer combate de jefe en RELEVO.' },
      { src: C('jefe_combate'), pie: 'El Eco se mueve por todo el puerto: hay que leer sus ataques.' },
      { src: C('jefe_golpe'), pie: 'Un golpe del Eco: la señal de Maia baja.' },
      { src: C('jefe_victoria'), pie: 'Liria se enciende: jefe superado.' },
      { src: C('cinematica_final'), pie: 'La cinemática final, sin spoilers.' },
    ],
  },
  {
    id: 'beta',
    tipo: 'final',
    lado: 'izq',
    rail: 'Versión 1.0',
    alto: 2.2,
  },
];
