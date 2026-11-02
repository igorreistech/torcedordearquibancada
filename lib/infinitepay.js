const { LOJA } = require('../produtos.js');

const handle = () => process.env.INFINITEPAY_HANDLE || LOJA.infinitepayHandle;

function cabecalhos() {
  const h = { 'Content-Type': 'application/json' };
  if (process.env.INFINITEPAY_API_KEY) h['X-Api-Key'] = process.env.INFINITEPAY_API_KEY;
  return h;
}

// Pergunta à InfinitePay se o pagamento foi aprovado. Só esta resposta é prova de pagamento:
// os dados da URL de volta e do webhook podem ser forjados.
async function conferirPagamento({ order_nsu, transaction_nsu, slug }) {
  const r = await fetch('https://api.checkout.infinitepay.io/payment_check', {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify({ handle: handle(), order_nsu, transaction_nsu, slug }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`payment_check ${r.status}: ${JSON.stringify(d)}`);
  const pago = d.success === true && d.paid === true;
  return { pago, valor: pago ? d.amount / 100 : null, metodo: d.capture_method || null };
}

module.exports = { handle, cabecalhos, conferirPagamento };
