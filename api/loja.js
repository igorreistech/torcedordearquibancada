const { lerLoja } = require('../lib/catalogo');

// Categorias da loja (o site monta os filtros com elas).
module.exports = async (req, res) => {
  try {
    const { categorias } = await lerLoja();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.json({ categorias });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível carregar as categorias.' });
  }
};
