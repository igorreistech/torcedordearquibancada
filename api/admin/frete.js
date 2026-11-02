const { validarFrete } = require('../../produtos.js');
const { lerFrete, salvarFrete, autorizado } = require('../../lib/catalogo');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_SENHA) return res.status(500).json({ erro: 'Defina a variável ADMIN_SENHA na Vercel.' });
  if (!autorizado(req)) return res.status(401).json({ erro: 'Senha incorreta.' });
  try {
    if (req.method === 'GET') return res.json({ frete: await lerFrete({ atualizado: true }) });
    if (req.method === 'PUT') {
      let frete;
      try {
        frete = validarFrete(req.body?.frete);
      } catch (e) {
        return res.status(400).json({ erro: e.message });
      }
      await salvarFrete(frete);
      return res.json({ frete });
    }
    res.status(405).json({ erro: 'Método não permitido.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao acessar o armazenamento. Confira se o Blob está conectado ao projeto.' });
  }
};
