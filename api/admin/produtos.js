const { validarProduto } = require('../../produtos.js');
const { lerCatalogo, salvarCatalogo, lerLoja, apagarFotos, autorizado } = require('../../lib/catalogo');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_SENHA) return res.status(500).json({ erro: 'Defina a variável ADMIN_SENHA na Vercel.' });
  if (!autorizado(req)) return res.status(401).json({ erro: 'Senha incorreta.' });

  try {
    if (req.method === 'GET') return res.json({ produtos: await lerCatalogo({ atualizado: true }) });

    if (req.method === 'PUT') {
      const lista = req.body?.produtos;
      if (!Array.isArray(lista) || lista.length > 500) return res.status(400).json({ erro: 'Lista de camisas inválida.' });
      const { categorias } = await lerLoja({ atualizado: true });
      let produtos;
      try {
        produtos = lista.map((p) => validarProduto(p, categorias));
      } catch (e) {
        return res.status(400).json({ erro: e.message });
      }
      if (new Set(produtos.map((p) => p.id)).size !== produtos.length) return res.status(400).json({ erro: 'Há camisas com identificador repetido.' });

      const antes = await lerCatalogo({ atualizado: true });
      await salvarCatalogo(produtos);
      const usadas = new Set(produtos.flatMap((p) => p.fotos));
      await apagarFotos(antes.flatMap((p) => p.fotos || []).filter((u) => !usadas.has(u))).catch(console.error);
      return res.json({ produtos });
    }

    res.status(405).json({ erro: 'Método não permitido.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao acessar o armazenamento. Confira se o Blob está conectado ao projeto.' });
  }
};
