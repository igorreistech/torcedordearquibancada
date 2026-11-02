const { LOJA } = require('../produtos.js');

// Serviços dos Correios no Melhor Envio
const SERVICOS = { 1: 'PAC', 2: 'SEDEX' };
const BASE = process.env.MELHORENVIO_SANDBOX ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
const arredondar = (v) => Math.round(v * 100) / 100;

// Cota PAC e SEDEX de LOJA.origem até o CEP do cliente, para qtd camisas.
// config: peso/medidas da embalagem, acréscimo e frete grátis (painel).
// Devolve [] quando não dá para cotar (sem token, CEP sem serviço, erro): o frete fica a combinar.
async function cotarFrete(cep, qtd, config) {
  const token = process.env.MELHORENVIO_TOKEN;
  const destino = String(cep || '').replace(/\D/g, '');
  if (!token || destino.length !== 8 || !(qtd > 0)) return [];

  const r = await fetch(`${BASE}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      // O Melhor Envio exige identificar a aplicação e um e-mail de contato técnico
      'User-Agent': `${LOJA.nome} (${process.env.MELHORENVIO_EMAIL || 'torcedordearquibancada.vercel.app'})`,
    },
    body: JSON.stringify({
      from: { postal_code: LOJA.origem.cep.replace(/\D/g, '') },
      to: { postal_code: destino },
      products: [{
        id: 'camisa',
        width: config.largura,
        height: config.altura,
        length: config.comprimento,
        weight: config.peso / 1000,
        insurance_value: 0,
        quantity: qtd,
      }],
      options: { receipt: false, own_hand: false },
      services: Object.keys(SERVICOS).join(','),
    }),
  });
  const dados = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(dados)) {
    console.error('Melhor Envio recusou a cotação', r.status, JSON.stringify(dados));
    return [];
  }

  const gratis = config.gratisAPartirDe > 0 && qtd >= config.gratisAPartirDe;
  return dados
    .filter((s) => !s.error && SERVICOS[s.id] && Number(s.custom_price ?? s.price) > 0)
    .map((s) => ({
      id: String(s.id),
      nome: SERVICOS[s.id],
      prazo: Number(s.custom_delivery_time ?? s.delivery_time) || null,
      valor: gratis && SERVICOS[s.id] === 'PAC' ? 0 : arredondar(Number(s.custom_price ?? s.price) + (config.acrescimo || 0)),
    }))
    .sort((a, b) => a.valor - b.valor);
}

module.exports = { cotarFrete };
