const crypto = require('crypto');
const { LOJA, calcularPedido, validarCliente } = require('../produtos.js');
const { lerCatalogo } = require('../lib/catalogo');

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Cria o pagamento no Mercado Pago (cartão ou Pix).
// O valor é sempre recalculado aqui a partir do catálogo.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ erro: 'Pagamento ainda não configurado na loja.' });

  const { itens, cliente: dadosCliente, pagamento = {}, chave } = req.body || {};
  let pedido, cliente;
  try {
    pedido = calcularPedido(itens, await lerCatalogo());
    cliente = validarCliente(dadosCliente);
  } catch (e) {
    return res.status(400).json({ erro: e.message });
  }

  const pix = pagamento.payment_method_id === 'pix';
  if (!pix && !pagamento.token) return res.status(400).json({ erro: 'Dados do cartão não recebidos.' });

  const referencia = 'TDA-' + Date.now().toString(36).toUpperCase();
  const [primeiroNome, ...sobrenome] = cliente.nome.split(/\s+/);
  const descricaoItem = (l) =>
    `${l.produto.nome} ${l.produto.temporada} (${l.produto.versao}) - Tam ${l.tamanho}` +
    (l.nome || l.numero ? ` - Pers. ${[l.nome, l.numero].filter(Boolean).join(' ')}` : '');
  const endereco = `${cliente.rua}, ${cliente.numero}${cliente.complemento ? ' - ' + cliente.complemento : ''} - ${cliente.bairro} - ${cliente.cidade}/${cliente.uf} - CEP ${cliente.cep}`;

  const corpo = {
    transaction_amount: pix ? pedido.totalPix : pedido.total,
    description: `${LOJA.nome} - pedido ${referencia}`,
    external_reference: referencia,
    statement_descriptor: 'TORCEDOR ARQ',
    payment_method_id: pagamento.payment_method_id,
    payer: {
      email: cliente.email,
      first_name: primeiroNome,
      last_name: sobrenome.join(' '),
      identification: pagamento.payer?.identification?.number
        ? pagamento.payer.identification
        : { type: 'CPF', number: cliente.cpf },
    },
    additional_info: {
      items: pedido.linhas.map((l) => ({
        id: l.produto.id,
        title: descricaoItem(l),
        category_id: 'fashion',
        quantity: l.qtd,
        unit_price: l.unitario,
      })),
      payer: {
        first_name: primeiroNome,
        last_name: sobrenome.join(' '),
        phone: { area_code: cliente.telefone.slice(0, 2), number: cliente.telefone.slice(2) },
      },
      shipments: {
        receiver_address: {
          zip_code: cliente.cep,
          street_name: /^\d+$/.test(cliente.numero) ? cliente.rua : `${cliente.rua}, ${cliente.numero}`,
          ...(/^\d+$/.test(cliente.numero) && { street_number: Number(cliente.numero) }),
          apartment: cliente.complemento,
          city_name: cliente.cidade,
          state_name: cliente.uf,
        },
      },
    },
    metadata: {
      pedido: referencia,
      itens: pedido.linhas.map((l) => `${l.qtd}x ${descricaoItem(l)}`).join(' | '),
      frete: pedido.frete ? brl(pedido.frete) : 'Grátis',
      cliente: cliente.nome,
      telefone: cliente.telefone,
      cpf: cliente.cpf,
      endereco,
    },
  };
  if (!pix) {
    Object.assign(corpo, {
      token: pagamento.token,
      installments: Math.min(Number(pagamento.installments) || 1, LOJA.maxParcelas),
      issuer_id: pagamento.issuer_id,
    });
  }

  const r = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Idempotency-Key': /^[\w-]{8,64}$/.test(chave || '') ? chave : crypto.randomUUID(),
    },
    body: JSON.stringify(corpo),
  });
  const p = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('Mercado Pago recusou a criação do pagamento', r.status, JSON.stringify(p));
    return res.status(502).json({ erro: 'Não foi possível processar o pagamento. Confira os dados e tente novamente.' });
  }

  console.log('Pedido', referencia, p.id, p.status, JSON.stringify(corpo.metadata));
  const dadosPix = p.point_of_interaction?.transaction_data;
  res.json({
    id: p.id,
    status: p.status,
    status_detail: p.status_detail,
    referencia,
    valor: corpo.transaction_amount,
    pix: pix && dadosPix ? { codigo: dadosPix.qr_code, imagem: dadosPix.qr_code_base64 } : null,
  });
};
