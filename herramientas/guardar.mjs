// Servidor local mínimo que recibe los renders de herramientas/capas.html y los guarda en
// public/img/relato/. Solo escucha en 127.0.0.1 y solo acepta nombres de archivo simples.
import { createServer } from 'node:http';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img', 'relato');
await mkdir(raiz, { recursive: true });

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.end();
  const url = new URL(req.url, 'http://127.0.0.1');
  const nombre = url.searchParams.get('nombre') || '';
  if (req.method !== 'POST' || !/^[a-z0-9_-]+\.(webp|png|json)$/.test(nombre)) {
    res.statusCode = 400;
    return res.end('nombre no válido');
  }
  const trozos = [];
  for await (const t of req) trozos.push(t);
  await writeFile(join(raiz, nombre), Buffer.concat(trozos));
  console.log('guardado', nombre, Buffer.concat(trozos).length, 'bytes');
  res.end('ok');
}).listen(5199, '127.0.0.1', () => console.log('Guardando renders en', raiz));
