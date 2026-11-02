const { conferirPagamento } = require('../lib/infinitepay');
const { confirmarPedido } = require('../lib/catalogo');

// Aviso da InfinitePay quando um pagamento acontece (cobre o cliente que não volta ao site).
// O webhook não tem assinatura, então o pagamento é sempre conferido com o payment_check.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { order_nsu, transaction_nsu, invoice_slug } = req.body || {};
  if (!order_nsu || !transaction_nsu || !invoice_slug) return res.status(400).json({ erro: 'Dados incompletos.' });
  try {
    const { pago } = await conferirPagamento({ order_nsu, transaction_nsu, slug: invoice_slug });
    if (pago) await confirmarPedido(order_nsu);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ erro: 'Falha ao processar.' });
  }
};
