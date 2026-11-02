const { lerCatalogo } = require('../lib/catalogo');

// Catálogo público: só as camisas ativas.
module.exports = async (req, res) => {
  try {
    const produtos = (await lerCatalogo()).filter((p) => p.ativo !== false);
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.json({ produtos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível carregar o catálogo.' });
  }
};
