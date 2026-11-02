// ============================================================
//  CONFIGURAÇÃO DA LOJA — edite aqui
//  (camisas, fotos e preços são cadastrados no painel /admin)
// ============================================================
const LOJA = {
  nome: 'Torcedor de Arquibancada',
  whatsapp: '5567996333431',              // DDI + DDD + número, só dígitos
  instagram: 'torcedor_de_arquibancada67', // sem o @
  precoPersonalizacao: 25,                // nome + número
  freteGratisAPartirDe: 2,                // nº de camisas para frete grátis
  frete: 24.9,                            // frete abaixo do mínimo para frete grátis
  maxParcelas: 12,                        // parcelas no cartão (texto do site)
  tamanhos: ['P', 'M', 'G', 'GG', 'XGG'],
  // InfiniteTag da conta InfinitePay, sem o $ (aparece no canto superior do app).
  // No app: Vendas > Checkout > Configurações > "Habilitar Checkout Integrado".
  infinitepayHandle: 'torcedor',
};

const CATEGORIAS = [
  { id: 'brasileirao', nome: 'Brasileirão' },
  { id: 'europa', nome: 'Europa' },
  { id: 'selecoes', nome: 'Seleções' },
  { id: 'retro', nome: 'Retrô' },
];

const PADROES = [
  { id: 'solido', nome: 'Lisa' },
  { id: 'listras-verticais', nome: 'Listras verticais' },
  { id: 'listras-horizontais', nome: 'Listras horizontais' },
  { id: 'faixa-diagonal', nome: 'Faixa diagonal' },
  { id: 'faixa-horizontal', nome: 'Faixa no peito' },
  { id: 'metade', nome: 'Metade / metade' },
];

const TAGS = [
  { id: 'lancamento', nome: 'Lançamento' },
  { id: 'promocao', nome: 'Promoção' },
  { id: 'mais-vendida', nome: 'Mais vendida' },
];

// ============================================================
//  CATÁLOGO INICIAL — usado só até o primeiro salvamento no painel
//  cores:  [base, secundária, detalhe] — desenham a camisa quando não há foto
// ============================================================
const c = (id, nome, temporada, versao, categoria, preco, precoAntigo, cores, padrao, tags = []) =>
  ({ id, nome, temporada, versao, categoria, preco, precoAntigo, cores, padrao, tags, fotos: [], ativo: true });

const PRODUTOS_PADRAO = [
  c('fla-26', 'Flamengo I', '26/27', 'Torcedor', 'brasileirao', 165, null, ['#c8102e', '#111111', '#111111'], 'listras-horizontais', ['mais-vendida']),
  c('cor-26', 'Corinthians I', '26/27', 'Torcedor', 'brasileirao', 165, null, ['#f4f4f4', '#f4f4f4', '#111111'], 'solido'),
  c('pal-26', 'Palmeiras I', '26/27', 'Jogador', 'brasileirao', 200, null, ['#006437', '#006437', '#ffffff'], 'solido', ['lancamento']),
  c('spfc-26', 'São Paulo I', '26/27', 'Torcedor', 'brasileirao', 165, null, ['#ffffff', '#d7131d', '#111111'], 'faixa-horizontal'),
  c('gre-26', 'Grêmio I', '26/27', 'Torcedor', 'brasileirao', 165, null, ['#0d80bf', '#111111', '#ffffff'], 'listras-verticais'),
  c('vas-25', 'Vasco I', '25/26', 'Torcedor', 'brasileirao', 90, 165, ['#111111', '#ffffff', '#ffffff'], 'faixa-diagonal', ['promocao']),
  c('rma-26', 'Real Madrid I', '26/27', 'Jogador', 'europa', 200, null, ['#fafafa', '#fafafa', '#c9a227'], 'solido', ['lancamento']),
  c('bar-26', 'Barcelona I', '26/27', 'Torcedor', 'europa', 165, null, ['#a50044', '#004d98', '#edbb00'], 'listras-verticais', ['mais-vendida']),
  c('psg-26', 'PSG I', '26/27', 'Jogador', 'europa', 200, null, ['#0b1f4b', '#0b1f4b', '#d7131d'], 'faixa-horizontal'),
  c('bra-26', 'Brasil I', '2026', 'Torcedor', 'selecoes', 165, null, ['#ffdc02', '#ffdc02', '#009739'], 'solido', ['lancamento', 'mais-vendida']),
  c('arg-26', 'Argentina I', '2026', 'Torcedor', 'selecoes', 165, null, ['#ffffff', '#75aadb', '#111111'], 'listras-verticais'),
  c('bra-fem-26', 'Brasil I Feminina', '2026', 'Feminina', 'selecoes', 140, null, ['#ffdc02', '#ffdc02', '#009739'], 'solido'),
  c('bra-70', 'Brasil Retrô', '1970', 'Retrô', 'retro', 165, null, ['#ffd400', '#ffd400', '#0a8f3c'], 'solido'),
  c('mil-89', 'Milan Retrô', '88/89', 'Retrô', 'retro', 90, 165, ['#d40000', '#111111', '#ffffff'], 'listras-verticais', ['promocao']),
];

// ============================================================
//  REGRAS — usadas pelo site, pelo painel e pelo servidor
//  (não precisa editar abaixo desta linha)
// ============================================================
const arredondar = (v) => Math.round(v * 100) / 100;

// Quantas unidades há de um tamanho. Camisa sem controle de estoque (sob encomenda) não tem limite.
const disponivel = (p, tamanho) => (p.estoque ? Math.max(0, p.estoque[tamanho] || 0) : Infinity);
const esgotado = (p) => Boolean(p.estoque) && LOJA.tamanhos.every((t) => disponivel(p, t) === 0);

// Confere se há estoque para o carrinho todo, somando as linhas do mesmo tamanho.
function conferirEstoque(itens, produtos) {
  const soma = {};
  for (const i of itens) soma[`${i.id}|${i.tamanho}`] = (soma[`${i.id}|${i.tamanho}`] || 0) + Number(i.qtd);
  for (const [chave, qtd] of Object.entries(soma)) {
    const [id, tamanho] = chave.split('|');
    const p = produtos.find((x) => x.id === id);
    if (!p) continue;
    const tem = disponivel(p, tamanho);
    if (qtd > tem) {
      throw new Error(tem
        ? `Só temos ${tem} unidade${tem > 1 ? 's' : ''} de ${p.nome} ${p.temporada} no tamanho ${tamanho}.`
        : `${p.nome} ${p.temporada} esgotou no tamanho ${tamanho}.`);
    }
  }
}

// Desconta do estoque os itens de um pedido pago.
function baixarEstoque(produtos, itens) {
  return produtos.map((p) => {
    if (!p.estoque) return p;
    const estoque = { ...p.estoque };
    for (const i of itens) if (i.id === p.id) estoque[i.tamanho] = Math.max(0, (estoque[i.tamanho] || 0) - i.qtd);
    return { ...p, estoque };
  });
}

// Recalcula o pedido a partir dos itens do carrinho. O servidor usa esta função
// para cobrar o preço do catálogo, nunca o valor enviado pelo navegador.
function calcularPedido(itens, produtos) {
  if (!Array.isArray(itens) || !itens.length) throw new Error('Carrinho vazio.');
  const linhas = itens.map((i) => {
    const p = produtos.find((x) => x.id === i.id && x.ativo !== false);
    if (!p) throw new Error('Uma das camisas do carrinho não está mais disponível.');
    if (!LOJA.tamanhos.includes(i.tamanho)) throw new Error('Tamanho inválido.');
    const qtd = Number(i.qtd);
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 20) throw new Error('Quantidade inválida.');
    const nome = String(i.nome || '').trim().toUpperCase().slice(0, 12);
    const numero = String(i.numero || '').replace(/\D/g, '').slice(0, 2);
    const unitario = p.preco + (nome || numero ? LOJA.precoPersonalizacao : 0);
    return { produto: p, tamanho: i.tamanho, nome, numero, qtd, unitario, total: arredondar(unitario * qtd) };
  });
  const qtd = linhas.reduce((s, l) => s + l.qtd, 0);
  const subtotal = arredondar(linhas.reduce((s, l) => s + l.total, 0));
  const frete = qtd >= LOJA.freteGratisAPartirDe ? 0 : LOJA.frete;
  const total = arredondar(subtotal + frete);
  return { linhas, qtd, subtotal, frete, total };
}

// Valida e normaliza os dados de entrega. Lança Error com mensagem para o cliente.
function validarCliente(c = {}) {
  const txt = (v, max = 80) => String(v || '').trim().slice(0, max);
  const dig = (v) => String(v || '').replace(/\D/g, '');
  const r = {
    nome: txt(c.nome), email: txt(c.email).toLowerCase(), telefone: dig(c.telefone),
    cep: dig(c.cep), rua: txt(c.rua), numero: txt(c.numero, 10), complemento: txt(c.complemento, 40),
    bairro: txt(c.bairro), cidade: txt(c.cidade), uf: txt(c.uf, 2).toUpperCase(),
  };
  if (r.nome.split(/\s+/).length < 2) throw new Error('Informe nome e sobrenome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) throw new Error('E-mail inválido.');
  if (r.telefone.length < 10 || r.telefone.length > 11) throw new Error('Telefone inválido. Use DDD + número.');
  if (r.cep.length !== 8) throw new Error('CEP inválido.');
  if (!r.rua || !r.numero || !r.bairro || !r.cidade) throw new Error('Preencha o endereço completo.');
  if (!/^[A-Z]{2}$/.test(r.uf)) throw new Error('UF inválida.');
  return r;
}

// Valida e normaliza uma camisa vinda do painel. Lança Error com mensagem para o dono.
function validarProduto(p = {}) {
  const txt = (v, max) => String(v ?? '').trim().slice(0, max);
  const hex = /^#[0-9a-f]{6}$/i;
  const cores = Array.isArray(p.cores) ? p.cores.slice(0, 3) : [];
  const r = {
    id: txt(p.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, ''),
    nome: txt(p.nome, 60),
    temporada: txt(p.temporada, 12),
    versao: txt(p.versao, 20) || 'Torcedor',
    categoria: p.categoria,
    preco: arredondar(Number(p.preco)),
    precoAntigo: p.precoAntigo ? arredondar(Number(p.precoAntigo)) : null,
    cores: cores.length === 3 && cores.every((x) => hex.test(x)) ? cores : ['#ffffff', '#111111', '#111111'],
    padrao: PADROES.some((x) => x.id === p.padrao) ? p.padrao : 'solido',
    tags: (Array.isArray(p.tags) ? p.tags : []).filter((t) => TAGS.some((x) => x.id === t)),
    fotos: (Array.isArray(p.fotos) ? p.fotos : []).filter((u) => /^https:\/\/\S+$/.test(u)).slice(0, 8),
    estoque: p.estoque && typeof p.estoque === 'object'
      ? Object.fromEntries(LOJA.tamanhos.map((t) => [t, Math.min(9999, Math.max(0, Math.trunc(Number(p.estoque[t]) || 0)))]))
      : null,
    ativo: p.ativo !== false,
  };
  const quem = r.nome ? `"${r.nome}": ` : '';
  if (!r.id) throw new Error('Camisa sem identificador.');
  if (!r.nome) throw new Error('Informe o nome da camisa.');
  if (!CATEGORIAS.some((x) => x.id === r.categoria)) throw new Error(quem + 'escolha uma categoria.');
  if (!Number.isFinite(r.preco) || r.preco <= 0) throw new Error(quem + 'preço inválido.');
  if (r.precoAntigo !== null && !(r.precoAntigo > r.preco)) throw new Error(quem + 'o preço "de" precisa ser maior que o preço atual.');
  return r;
}

if (typeof module !== 'undefined') {
  module.exports = { LOJA, CATEGORIAS, PADROES, TAGS, PRODUTOS_PADRAO, calcularPedido, conferirEstoque, baixarEstoque, validarCliente, validarProduto };
}
