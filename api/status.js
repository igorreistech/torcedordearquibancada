const { conferirPagamento } = require('../lib/infinitepay');
const { confirmarPedido } = require('../lib/catalogo');

// Confere o pagamento quando o cliente volta da InfinitePay e, se pago, baixa o estoque.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { order_nsu, transaction_nsu, slug } = req.query;
  const valido = (v) => typeof v === 'string' && /^[\w-]{1,100}$/.test(v);
  if (![order_nsu, transaction_nsu, slug].every(valido)) return res.status(400).json({ erro: 'Pagamento inválido.' });

  try {
    const resultado = await conferirPagamento({ order_nsu, transaction_nsu, slug });
    if (resultado.pago) await confirmarPedido(order_nsu).catch(console.error);
    res.json(resultado);
  } catch (e) {
    console.error(e);
    res.status(502).json({ erro: 'Não foi possível consultar o pagamento.' });
  }
};
