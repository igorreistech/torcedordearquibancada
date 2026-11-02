// ============================================================
//  CONFIGURAÇÃO DA LOJA — edite aqui
//  (camisas, fotos e preços são cadastrados no painel /admin)
// ============================================================
const LOJA = {
  nome: 'Torcedor de Arquibancada',
  whatsapp: '5567996333431',              // DDI + DDD + número, só dígitos
  instagram: 'torcedor_de_arquibancada67', // sem o @
  precoPersonalizacao: 50,                // nome + número (padrão; cada camisa pode ter o seu no painel)
  // Cidade de onde as camisas são enviadas (origem do cálculo de frete no Melhor Envio).
  // faixaEstado: CEPs do estado de origem (para o frete grátis só dentro do estado).
  origem: { cep: '79910-134', cidade: 'Antônio João', uf: 'MS', faixaEstado: ['79000-000', '79999-999'] },
  maxParcelas: 12,                        // parcelas no cartão (texto do site)
  tamanhos: ['P', 'M', 'G', 'GG', '2XL', '3XL'],      // tamanhos das camisas sob encomenda
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

// Frete calculado pelo Melhor Envio (Correios PAC e SEDEX), saindo de LOJA.origem.
// Peso e medidas da embalagem de UMA camisa, acréscimo e frete grátis são ajustados no painel (botão Frete).
const FRETE_PADRAO = {
  gratisAPartirDe: 0, gratisSoNoEstado: true, gratisSemPromocao: true,
  acrescimo: 0, peso: 350, largura: 25, altura: 4, comprimento: 30,
};

// Quantas camisas contam para o frete grátis (as de promoção podem não contar).
function qtdParaFreteGratis(itens, produtos, config) {
  return itens.reduce((s, i) => {
    const p = produtos.find((x) => x.id === i.id);
    const promocao = p?.tags?.includes('promocao');
    return s + (config.gratisSemPromocao && promocao ? 0 : Number(i.qtd) || 0);
  }, 0);
}

// O CEP é do estado de origem?
function cepNoEstado(cep) {
  const n = Number(String(cep || '').replace(/[^0-9]/g, '').slice(0, 5));
  const [de, ate] = LOJA.origem.faixaEstado.map((c) => Number(c.replace(/[^0-9]/g, '').slice(0, 5)));
  return n >= de && n <= ate;
}

// Tabela de preços da loja: atalhos no cadastro de camisa do painel.
// preco: valor fixo. precoDe/precoAte: faixa (o dono digita o valor). grade: tamanhos sugeridos.
const TABELA_PRECOS = [
  { nome: 'Temporada 26/27 · Torcedor', preco: 145, versao: 'Torcedor', temporada: '26/27' },
  { nome: 'Temporada 26/27 · Jogador', preco: 175, versao: 'Jogador', temporada: '26/27' },
  { nome: 'Temporada 25/26', preco: 120, temporada: '25/26' },
  { nome: 'Kit Regata', preco: 135, versao: 'Kit Regata' },
  { nome: 'Kit Infantil', precoDe: 90, precoAte: 140, versao: 'Infantil', grade: ['2', '4', '6', '8', '10', '12', '14', '16'] },
  { nome: 'Feminina promocional', preco: 90, versao: 'Feminina', promocao: true, grade: ['P', 'M', 'G', 'GG'] },
  { nome: 'Retrô', preco: 170, versao: 'Retrô', categoria: 'retro' },
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

// Estoque de cada camisa: lista de { tamanho, qtd } cadastrada no painel.
// Camisa sem estoque (null) é sob encomenda: vende nos tamanhos padrão, sem limite.
const tamanhosDe = (p) => (p.estoque ? p.estoque.map((e) => e.tamanho) : LOJA.tamanhos);
const disponivel = (p, tamanho) => (p.estoque ? Math.max(0, p.estoque.find((e) => e.tamanho === tamanho)?.qtd || 0) : Infinity);
const esgotado = (p) => Boolean(p.estoque) && p.estoque.every((e) => !(e.qtd > 0));

// Preço da personalização de uma camisa: o do cadastro, ou o padrão da loja.
const precoPersonalizacaoDe = (p) => p.precoPersonalizacao ?? LOJA.precoPersonalizacao;
const aceitaPersonalizacao = (p) => p.personalizavel !== false;

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
    const estoque = p.estoque.map((e) => {
      const vendido = itens.filter((i) => i.id === p.id && i.tamanho === e.tamanho).reduce((s, i) => s + i.qtd, 0);
      return { ...e, qtd: Math.max(0, e.qtd - vendido) };
    });
    return { ...p, estoque };
  });
}

// Recalcula o pedido a partir dos itens do carrinho. O servidor usa esta função
// para cobrar o preço do catálogo, nunca o valor enviado pelo navegador.
// entrega (opcional): { opcoes: cotação de frete do CEP, modalidade escolhida }.
// Sem entrega, o frete ainda não é conhecido; sem opções, o frete é a combinar.
function calcularPedido(itens, produtos, entrega) {
  if (!Array.isArray(itens) || !itens.length) throw new Error('Carrinho vazio.');
  const linhas = itens.map((i) => {
    const p = produtos.find((x) => x.id === i.id && x.ativo !== false);
    if (!p) throw new Error('Uma das camisas do carrinho não está mais disponível.');
    if (!tamanhosDe(p).includes(i.tamanho)) throw new Error('Tamanho inválido.');
    const qtd = Number(i.qtd);
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 20) throw new Error('Quantidade inválida.');
    const nome = String(i.nome || '').trim().toUpperCase().slice(0, 12);
    const numero = String(i.numero || '').replace(/\D/g, '').slice(0, 2);
    if ((nome || numero) && !aceitaPersonalizacao(p)) throw new Error(`${p.nome} não aceita personalização.`);
    const unitario = p.preco + (nome || numero ? precoPersonalizacaoDe(p) : 0);
    return { produto: p, tamanho: i.tamanho, nome, numero, qtd, unitario, total: arredondar(unitario * qtd) };
  });
  const qtd = linhas.reduce((s, l) => s + l.qtd, 0);
  const subtotal = arredondar(linhas.reduce((s, l) => s + l.total, 0));
  let frete = null, modalidade = null, freteACombinar = false;
  if (entrega) {
    const opcoes = entrega.opcoes || [];
    if (!opcoes.length) {
      frete = 0;
      freteACombinar = true;
    } else {
      modalidade = opcoes.find((o) => o.id === entrega.modalidade);
      if (!modalidade) throw new Error('Escolha a forma de envio.');
      frete = modalidade.valor;
    }
  }
  const total = arredondar(subtotal + (frete || 0));
  return { linhas, qtd, subtotal, frete, modalidade, freteACombinar, total };
}

// Valida a configuração de frete vinda do painel. Lança Error com mensagem para o dono.
function validarFrete(c = {}) {
  const num = (v) => Number(String(v ?? '').replace(',', '.'));
  const inteiro = (v, min, max, nome) => {
    const n = Math.trunc(num(v));
    if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${nome}: informe um número entre ${min} e ${max}.`);
    return n;
  };
  const acrescimo = num(c.acrescimo || 0);
  if (!Number.isFinite(acrescimo) || acrescimo < 0 || acrescimo > 100) throw new Error('Acréscimo no frete: informe um valor entre 0 e 100.');
  return {
    gratisAPartirDe: inteiro(c.gratisAPartirDe || 0, 0, 99, 'Frete grátis'),
    gratisSoNoEstado: c.gratisSoNoEstado !== false,
    gratisSemPromocao: c.gratisSemPromocao !== false,
    acrescimo: arredondar(acrescimo),
    peso: inteiro(c.peso ?? FRETE_PADRAO.peso, 50, 30000, 'Peso por camisa (g)'),
    largura: inteiro(c.largura ?? FRETE_PADRAO.largura, 1, 100, 'Largura (cm)'),
    altura: inteiro(c.altura ?? FRETE_PADRAO.altura, 1, 100, 'Altura (cm)'),
    comprimento: inteiro(c.comprimento ?? FRETE_PADRAO.comprimento, 1, 100, 'Comprimento (cm)'),
  };
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

// Normaliza a lista de tamanhos e quantidades do painel. null = sob encomenda.
function lerEstoque(estoque) {
  if (!estoque || typeof estoque !== 'object') return null;
  const linhas = Array.isArray(estoque) ? estoque : Object.entries(estoque).map(([tamanho, qtd]) => ({ tamanho, qtd }));
  const vistos = new Set();
  const r = [];
  for (const e of linhas) {
    const tamanho = String(e?.tamanho ?? '').trim().toUpperCase().slice(0, 8);
    if (!tamanho || vistos.has(tamanho)) continue;
    vistos.add(tamanho);
    r.push({ tamanho, qtd: Math.min(9999, Math.max(0, Math.trunc(Number(e.qtd) || 0))) });
  }
  return r.length ? r.slice(0, 20) : null;
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
    estoque: lerEstoque(p.estoque),
    ativo: p.ativo !== false,
    personalizavel: p.personalizavel !== false,
    precoPersonalizacao: p.precoPersonalizacao === '' || p.precoPersonalizacao == null ? null : arredondar(Number(p.precoPersonalizacao)),
  };
  const quem = r.nome ? `"${r.nome}": ` : '';
  if (!r.id) throw new Error('Camisa sem identificador.');
  if (!r.nome) throw new Error('Informe o nome da camisa.');
  if (!CATEGORIAS.some((x) => x.id === r.categoria)) throw new Error(quem + 'escolha uma categoria.');
  if (!Number.isFinite(r.preco) || r.preco <= 0) throw new Error(quem + 'preço inválido.');
  if (r.precoPersonalizacao !== null && !(r.precoPersonalizacao >= 0 && r.precoPersonalizacao <= 500)) throw new Error(quem + 'preço da personalização inválido.');
  if (r.precoAntigo !== null && !(r.precoAntigo > r.preco)) throw new Error(quem + 'o preço "de" precisa ser maior que o preço atual.');
  return r;
}

if (typeof module !== 'undefined') {
  module.exports = { LOJA, CATEGORIAS, TABELA_PRECOS, PADROES, TAGS, FRETE_PADRAO, PRODUTOS_PADRAO, precoPersonalizacaoDe, validarFrete, qtdParaFreteGratis, cepNoEstado, tamanhosDe, calcularPedido, conferirEstoque, baixarEstoque, validarCliente, validarProduto };
}
