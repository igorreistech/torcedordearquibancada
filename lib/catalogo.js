const crypto = require('crypto');
const { put, del } = require('@vercel/blob');
const { PRODUTOS_PADRAO, FRETE_PADRAO, baixarEstoque } = require('../produtos.js');

const CAMINHO = 'catalogo/produtos.json';
const REF_PEDIDO = /^TDA-[A-Z0-9]+$/;

// Monta o endereço público de um arquivo a partir do token (vercel_blob_rw_<loja>_<segredo>),
// sem chamar head(), que conta como operação avançada no plano grátis.
function urlBlob(caminho) {
  const [, , , loja] = (process.env.BLOB_READ_WRITE_TOKEN || '').split('_');
  if (!loja) throw new Error('BLOB_READ_WRITE_TOKEN não configurado');
  return `https://${loja.toLowerCase()}.public.blob.vercel-storage.com/${caminho}`;
}

// Lê um JSON do Blob. atualizado: pula o cache da CDN.
async function lerJson(caminho, atualizado) {
  const url = atualizado ? `${urlBlob(caminho)}?v=${Date.now()}` : urlBlob(caminho);
  const r = await fetch(url, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Falha ao ler ${caminho} (${r.status})`);
  return r.json();
}

const salvarJson = (caminho, dados) =>
  put(caminho, JSON.stringify(dados), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });

// Lê o catálogo salvo no Vercel Blob. Antes do primeiro salvamento no painel,
// devolve o catálogo inicial de produtos.js.
// atualizado: pula o cache da CDN (painel e pagamento); o site público usa o cache.
async function lerCatalogo({ atualizado = false } = {}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return PRODUTOS_PADRAO;
  return (await lerJson(CAMINHO, atualizado)) || PRODUTOS_PADRAO;
}

const salvarCatalogo = (produtos) => salvarJson(CAMINHO, produtos);

// Tabela de frete por região, cadastrada no painel.
async function lerFrete({ atualizado = false } = {}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return FRETE_PADRAO;
  return (await lerJson('config/frete.json', atualizado)) || FRETE_PADRAO;
}
const salvarFrete = (tabela) => salvarJson('config/frete.json', tabela);

// Guarda os itens do pedido (sem dados do cliente) para baixar o estoque quando for pago.
async function salvarPedido(referencia, itens) {
  await salvarJson(`pedidos/${referencia}.json`, { itens, status: 'pendente', criado: new Date().toISOString() });
}

// Marca o pedido como pago e desconta o estoque. Pode ser chamada mais de uma vez
// (volta do cliente e webhook): só desconta na primeira.
async function confirmarPedido(referencia) {
  if (!REF_PEDIDO.test(referencia)) return;
  const caminho = `pedidos/${referencia}.json`;
  const pedido = await lerJson(caminho, true);
  if (!pedido || pedido.status === 'pago') return;
  await salvarJson(caminho, { ...pedido, status: 'pago', pago: new Date().toISOString() });
  const produtos = await lerCatalogo({ atualizado: true });
  if (produtos.some((p) => p.estoque)) await salvarCatalogo(baixarEstoque(produtos, pedido.itens));
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

module.exports = { lerCatalogo, salvarCatalogo, lerFrete, salvarFrete, salvarPedido, confirmarPedido, salvarFoto, apagarFotos, autorizado };
