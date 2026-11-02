const { LOJA } = require('../produtos.js');

// Confere com a InfinitePay se o pagamento que voltou no redirecionamento foi aprovado.
// Os parâmetros da URL de volta não são prova de pagamento: só o payment_check é.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { order_nsu, transaction_nsu, slug } = req.query;
  const valido = (v) => typeof v === 'string' && /^[\w-]{1,100}$/.test(v);
  if (![order_nsu, transaction_nsu, slug].every(valido)) return res.status(400).json({ erro: 'Pagamento inválido.' });

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.INFINITEPAY_API_KEY) headers['X-Api-Key'] = process.env.INFINITEPAY_API_KEY;
  const r = await fetch('https://api.checkout.infinitepay.io/payment_check', {
    method: 'POST',
    headers,
    body: JSON.stringify({ handle: process.env.INFINITEPAY_HANDLE || LOJA.infinitepayHandle, order_nsu, transaction_nsu, slug }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('InfinitePay payment_check falhou', r.status, JSON.stringify(d));
    return res.status(502).json({ erro: 'Não foi possível consultar o pagamento.' });
  }
  const pago = d.success === true && d.paid === true;
  res.json({ pago, valor: pago ? d.amount / 100 : null, metodo: d.capture_method || null });
};
