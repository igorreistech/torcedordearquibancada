const crypto = require('crypto');
const { put, del } = require('@vercel/blob');
const { PRODUTOS_PADRAO } = require('../produtos.js');

const CAMINHO = 'catalogo/produtos.json';

// Monta o endereço público do catálogo a partir do token (vercel_blob_rw_<loja>_<segredo>),
// sem chamar head(), que conta como operação avançada no plano grátis.
function urlCatalogo() {
  const [, , , loja] = (process.env.BLOB_READ_WRITE_TOKEN || '').split('_');
  if (!loja) throw new Error('BLOB_READ_WRITE_TOKEN não configurado');
  return `https://${loja.toLowerCase()}.public.blob.vercel-storage.com/${CAMINHO}`;
}

// Lê o catálogo salvo no Vercel Blob. Antes do primeiro salvamento no painel,
// devolve o catálogo inicial de produtos.js.
// atualizado: pula o cache da CDN (painel e pagamento); o site público usa o cache.
async function lerCatalogo({ atualizado = false } = {}) {
  const url = atualizado ? `${urlCatalogo()}?v=${Date.now()}` : urlCatalogo();
  const r = await fetch(url, { cache: 'no-store' });
  if (r.status === 404) return PRODUTOS_PADRAO;
  if (!r.ok) throw new Error(`Falha ao ler o catálogo (${r.status})`);
  return r.json();
}

async function salvarCatalogo(produtos) {
  await put(CAMINHO, JSON.stringify(produtos), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

async function salvarFoto(tipo, buffer) {
  const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[tipo];
  const nome = `fotos/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const blob = await put(nome, buffer, { access: 'public', contentType: tipo, addRandomSuffix: false });
  return blob.url;
}

// Apaga do Blob as fotos que deixaram de ser usadas no catálogo.
async function apagarFotos(urls) {
  const nossas = urls.filter((u) => /\.public\.blob\.vercel-storage\.com\/fotos\//.test(u));
  if (nossas.length) await del(nossas);
}

function autorizado(req) {
  const senha = process.env.ADMIN_SENHA;
  if (!senha) return false;
  let enviada = '';
  try { enviada = decodeURIComponent(String(req.headers['x-admin-senha'] || '')); } catch {}
  const hash = (v) => crypto.createHash('sha256').update(v).digest();
  return crypto.timingSafeEqual(hash(senha), hash(enviada));
}

module.exports = { lerCatalogo, salvarCatalogo, salvarFoto, apagarFotos, autorizado };
