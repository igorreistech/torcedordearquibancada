const { validarLoja } = require('../../produtos.js');
const { lerLoja, salvarLoja, lerCatalogo, autorizado } = require('../../lib/catalogo');

// Categorias e tabela de preços cadastradas no painel.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_SENHA) return res.status(500).json({ erro: 'Defina a variável ADMIN_SENHA na Vercel.' });
  if (!autorizado(req)) return res.status(401).json({ erro: 'Senha incorreta.' });
  try {
    if (req.method === 'GET') return res.json({ loja: await lerLoja({ atualizado: true }) });
    if (req.method === 'PUT') {
      let loja;
      try {
        loja = validarLoja(req.body?.loja);
      } catch (e) {
        return res.status(400).json({ erro: e.message });
      }
      // Não deixa apagar uma categoria que ainda tem camisas
      const ids = new Set(loja.categorias.map((c) => c.id));
      const orfas = (await lerCatalogo({ atualizado: true })).filter((p) => !ids.has(p.categoria));
      if (orfas.length) {
        return res.status(400).json({
          erro: `Ainda há ${orfas.length} camisa(s) numa categoria que você removeu (ex.: "${orfas[0].nome}"). Mude a categoria delas antes de remover.`,
        });
      }
      await salvarLoja(loja);
      return res.json({ loja });
    }
    res.status(405).json({ erro: 'Método não permitido.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao acessar o armazenamento. Confira se o Blob está conectado ao projeto.' });
  }
};
