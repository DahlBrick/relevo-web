// Comprime los modelos de la bitácora para la web: geometría con meshopt y texturas en WebP de
// 512 px como máximo. Los .gltf de Quaternius (con su .bin y sus PNG sueltos) pasan a un .glb.
// Uso: node herramientas/modelos.mjs   (escribe en public/models y borra los originales convertidos)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, meshopt, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', 'public', 'models');
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

async function optimizar(entrada, salida) {
  const doc = await io.read(entrada);
  // Los nombres de las imágenes se conservan: la web reconoce las hojas por ellos.
  for (const t of doc.getRoot().listTextures()) if (!t.getName()) t.setName(path.basename(t.getURI() || '', path.extname(t.getURI() || '')));
  await doc.transform(
    dedup(),
    prune(),
    weld(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 82 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  await io.write(salida, doc);
}

let antes = 0;
let despues = 0;
const tam = (f) => fs.statSync(f).size;

// Quaternius: .gltf + .bin + texturas → .glb.
const nature = path.join(raiz, 'nature');
const usados = new Set();
for (const f of fs.readdirSync(nature).filter((f) => f.endsWith('.gltf'))) {
  const ruta = path.join(nature, f);
  const json = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const deps = [...(json.buffers || []), ...(json.images || [])].map((b) => b.uri).filter(Boolean);
  antes += tam(ruta) + deps.reduce((a, d) => a + (usados.has(d) ? 0 : tam(path.join(nature, d))), 0);
  deps.forEach((d) => usados.add(d));
  const salida = ruta.replace(/\.gltf$/, '.glb');
  await optimizar(ruta, salida);
  despues += tam(salida);
  console.log('nature', f, '→', (tam(salida) / 1024).toFixed(0), 'KB');
}
// Hojas blancas que la web tiñe aparte: a WebP.
for (const f of ['Leaves_NormalTree.png', 'Leaves_TwistedTree.png', 'Leaf_Pine.png']) {
  const ruta = path.join(nature, f);
  if (!fs.existsSync(ruta)) continue;
  const salida = ruta.replace(/\.png$/, '.webp');
  await sharp(ruta).resize(512, 512, { fit: 'inside' }).webp({ quality: 85 }).toFile(salida);
  antes += tam(ruta);
  despues += tam(salida);
}
// Kenney: .glb → .glb comprimido, en su sitio.
const kenney = path.join(raiz, 'kenney');
for (const kit of fs.readdirSync(kenney)) {
  for (const f of fs.readdirSync(path.join(kenney, kit)).filter((f) => f.endsWith('.glb'))) {
    const ruta = path.join(kenney, kit, f);
    antes += tam(ruta);
    const tmp = ruta + '.tmp.glb';
    await optimizar(ruta, tmp);
    fs.renameSync(tmp, ruta);
    despues += tam(ruta);
  }
}
// Borra los originales de Quaternius ya convertidos.
for (const f of fs.readdirSync(nature)) {
  if (/\.(gltf|bin|png)$/.test(f)) fs.unlinkSync(path.join(nature, f));
}
console.log(`modelos: ${(antes / 1048576).toFixed(2)} MB → ${(despues / 1048576).toFixed(2)} MB`);
