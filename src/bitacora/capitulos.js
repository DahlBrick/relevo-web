// Contenido de la bitácora. Etapas 1–6: MATERIAL BITACORA. Etapas 7–9: docs/bitacora/BITACORA.md
// del repositorio (rama mejora-grafica). Cada capítulo es una sección de scroll y una estación del mundo 3D.

const E = (n) => `${import.meta.env.BASE_URL}img/etapas/e${n}.jpg`;
const B = (n) => `${import.meta.env.BASE_URL}img/bitacora/${n}.jpg`;
const V = (n) => `${import.meta.env.BASE_URL}video/${n}.mp4`;

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
    id: 'beta',
    tipo: 'final',
    lado: 'izq',
    rail: 'Beta 1.0',
    alto: 2.2,
  },
];
