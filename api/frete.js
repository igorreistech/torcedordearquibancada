const { lerFrete } = require('../lib/catalogo');

// Tabela de frete pública (o site calcula as opções pelo CEP do cliente).
module.exports = async (req, res) => {
  try {
    const frete = await lerFrete();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.json(frete);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível carregar o frete.' });
  }
};
