const { lerFrete } = require('../lib/catalogo');
const { cotarFrete } = require('../lib/melhorenvio');

// GET /api/frete             → regras públicas do frete (frete grátis a partir de N camisas)
// GET /api/frete?cep=&qtd=&gratis= → opções de PAC e SEDEX para o CEP, cotadas no Melhor Envio
//                                 (gratis: camisas que contam para o frete grátis)
module.exports = async (req, res) => {
  try {
    const config = await lerFrete();
    const { gratisAPartirDe, gratisSoNoEstado, gratisSemPromocao } = config;
    const resposta = { gratisAPartirDe, gratisSoNoEstado, gratisSemPromocao };
    const cep = String(req.query.cep || '').replace(/\D/g, '');
    const qtd = Math.trunc(Number(req.query.qtd));
    if (cep) {
      if (cep.length !== 8 || !(qtd >= 1 && qtd <= 100)) return res.status(400).json({ erro: 'CEP ou quantidade inválidos.' });
      const qtdGratis = Math.min(qtd, Math.max(0, Math.trunc(Number(req.query.gratis ?? qtd)) || 0));
      resposta.opcoes = await cotarFrete(cep, qtd, config, qtdGratis);
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json(resposta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível calcular o frete.' });
  }
};
