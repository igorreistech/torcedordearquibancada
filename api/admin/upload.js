const { salvarFoto, autorizado } = require('../../lib/catalogo');

const TIPOS = ['image/jpeg', 'image/webp', 'image/png'];

// Recebe a foto já reduzida pelo painel, em base64: { tipo, dados }.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  if (!autorizado(req)) return res.status(401).json({ erro: 'Senha incorreta.' });
  const { tipo, dados } = req.body || {};
  if (!TIPOS.includes(tipo) || typeof dados !== 'string') return res.status(400).json({ erro: 'Envie uma imagem JPG, PNG ou WebP.' });
  const buffer = Buffer.from(dados, 'base64');
  if (!buffer.length || buffer.length > 3 * 1024 * 1024) return res.status(400).json({ erro: 'Imagem muito grande (máx. 3 MB).' });
  try {
    res.json({ url: await salvarFoto(tipo, buffer) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível salvar a foto. Confira se o Blob está conectado ao projeto.' });
  }
};
