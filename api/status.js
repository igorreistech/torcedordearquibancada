// Consulta o status de um pagamento (usado para saber quando o Pix foi pago).
module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  if (!/^\d{1,20}$/.test(id)) return res.status(400).json({ erro: 'Pagamento inválido.' });
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) return res.status(502).json({ erro: 'Não foi possível consultar o pagamento.' });
  const p = await r.json();
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: p.status, status_detail: p.status_detail });
};
