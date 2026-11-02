const { lerFrete } = require('../lib/catalogo');
const { cotarFrete } = require('../lib/melhorenvio');

// GET /api/frete             → regras públicas do frete (frete grátis a partir de N camisas)
// GET /api/frete?cep=&qtd=   → opções de PAC e SEDEX para o CEP, cotadas no Melhor Envio
module.exports = async (req, res) => {
  try {
    const config = await lerFrete();
    const resposta = { gratisAPartirDe: config.gratisAPartirDe };
    const cep = String(req.query.cep || '').replace(/\D/g, '');
    const qtd = Math.trunc(Number(req.query.qtd));
    if (cep) {
      if (cep.length !== 8 || !(qtd >= 1 && qtd <= 100)) return res.status(400).json({ erro: 'CEP ou quantidade inválidos.' });
      resposta.opcoes = await cotarFrete(cep, qtd, config);
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json(resposta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível calcular o frete.' });
  }
};
