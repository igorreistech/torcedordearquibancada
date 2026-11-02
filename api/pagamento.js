const { calcularPedido, conferirEstoque, validarCliente } = require('../produtos.js');
const { lerCatalogo, lerFrete, salvarPedido } = require('../lib/catalogo');
const { handle, cabecalhos } = require('../lib/infinitepay');
const { cotarFrete } = require('../lib/melhorenvio');

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const centavos = (v) => Math.round(v * 100);

// Cria o link de pagamento no Checkout Integrado da InfinitePay (Pix ou cartão).
// O valor é sempre recalculado aqui a partir do catálogo.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  if (!handle()) return res.status(500).json({ erro: 'Pagamento ainda não configurado na loja.' });

  let pedido, cliente;
  try {
    const [produtos, frete] = await Promise.all([lerCatalogo({ atualizado: true }), lerFrete({ atualizado: true })]);
    cliente = validarCliente(req.body?.cliente);
    // O frete é cotado de novo aqui, para cobrar o valor real do Melhor Envio
    const qtd = (Array.isArray(req.body?.itens) ? req.body.itens : []).reduce((s, i) => s + (Number(i.qtd) || 0), 0);
    const opcoes = await cotarFrete(cliente.cep, qtd, frete);
    pedido = calcularPedido(req.body?.itens, produtos, { opcoes, modalidade: String(req.body?.modalidade ?? '') });
    conferirEstoque(req.body.itens, produtos);
  } catch (e) {
    return res.status(400).json({ erro: e.message });
  }

  const referencia = 'TDA-' + Date.now().toString(36).toUpperCase();
  const descricao = (l) =>
    `${l.produto.nome} ${l.produto.temporada} (${l.produto.versao}) - Tam ${l.tamanho}` +
    (l.nome || l.numero ? ` - Pers. ${[l.nome, l.numero].filter(Boolean).join(' ')}` : '');
  const items = pedido.linhas.map((l) => ({ quantity: l.qtd, price: centavos(l.unitario), description: descricao(l) }));
  if (pedido.frete) items.push({ quantity: 1, price: centavos(pedido.frete), description: `Frete ${pedido.modalidade.nome} (até ${pedido.modalidade.prazo} ${pedido.modalidade.prazo > 1 ? 'dias úteis' : 'dia útil'})` });

  const origem = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  const corpo = {
    handle: handle(),
    order_nsu: referencia,
    redirect_url: `${origem}/`,
    webhook_url: `${origem}/api/webhook`,
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

  const r = await fetch('https://api.checkout.infinitepay.io/links', { method: 'POST', headers: cabecalhos(), body: JSON.stringify(corpo) });
  const d = await r.json().catch(() => ({}));
  const url = d.url || d.link || d.checkout_url;
  if (!r.ok || !url) {
    console.error('InfinitePay recusou a criação do link', r.status, JSON.stringify(d));
    return res.status(502).json({ erro: 'Não foi possível gerar o pagamento. Tente novamente em instantes.' });
  }

  // Itens do pedido (sem dados do cliente), para baixar o estoque quando o pagamento cair.
  await salvarPedido(referencia, pedido.linhas.map((l) => ({ id: l.produto.id, tamanho: l.tamanho, qtd: l.qtd }))).catch(console.error);

  console.log('Pedido', referencia, brl(pedido.total), JSON.stringify({ itens: items.map((i) => `${i.quantity}x ${i.description}`), freteACombinar: pedido.freteACombinar, cliente }));
  res.json({ url, referencia, valor: pedido.total });
};
