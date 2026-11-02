const { LOJA, calcularPedido, validarCliente } = require('../produtos.js');
const { lerCatalogo } = require('../lib/catalogo');

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const centavos = (v) => Math.round(v * 100);

// Cria o link de pagamento no Checkout Integrado da InfinitePay (Pix ou cartão).
// O valor é sempre recalculado aqui a partir do catálogo.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  const handle = process.env.INFINITEPAY_HANDLE || LOJA.infinitepayHandle;
  if (!handle) return res.status(500).json({ erro: 'Pagamento ainda não configurado na loja.' });

  let pedido, cliente;
  try {
    pedido = calcularPedido(req.body?.itens, await lerCatalogo({ atualizado: true }));
    cliente = validarCliente(req.body?.cliente);
  } catch (e) {
    return res.status(400).json({ erro: e.message });
  }

  const referencia = 'TDA-' + Date.now().toString(36).toUpperCase();
  const descricao = (l) =>
    `${l.produto.nome} ${l.produto.temporada} (${l.produto.versao}) - Tam ${l.tamanho}` +
    (l.nome || l.numero ? ` - Pers. ${[l.nome, l.numero].filter(Boolean).join(' ')}` : '');
  const items = pedido.linhas.map((l) => ({ quantity: l.qtd, price: centavos(l.unitario), description: descricao(l) }));
  if (pedido.frete) items.push({ quantity: 1, price: centavos(pedido.frete), description: 'Frete' });

  const origem = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  const corpo = {
    handle,
    order_nsu: referencia,
    redirect_url: `${origem}/`,
    items,
    customer: { name: cliente.nome, email: cliente.email, phone_number: `+55${cliente.telefone}` },
    address: {
      cep: cliente.cep,
      street: cliente.rua,
      number: cliente.numero,
      neighborhood: cliente.bairro,
      city: cliente.cidade,
      state: cliente.uf,
      complement: cliente.complemento,
    },
  };

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.INFINITEPAY_API_KEY) headers['X-Api-Key'] = process.env.INFINITEPAY_API_KEY;
  const r = await fetch('https://api.checkout.infinitepay.io/links', { method: 'POST', headers, body: JSON.stringify(corpo) });
  const d = await r.json().catch(() => ({}));
  const url = d.url || d.link || d.checkout_url;
  if (!r.ok || !url) {
    console.error('InfinitePay recusou a criação do link', r.status, JSON.stringify(d));
    return res.status(502).json({ erro: 'Não foi possível gerar o pagamento. Tente novamente em instantes.' });
  }

  console.log('Pedido', referencia, brl(pedido.total), JSON.stringify({ itens: items.map((i) => `${i.quantity}x ${i.description}`), cliente }));
  res.json({ url, referencia, valor: pedido.total });
};
