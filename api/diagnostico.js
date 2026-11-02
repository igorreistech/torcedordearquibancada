// Mostra quais variáveis o servidor enxerga (só sim/não, nunca o valor) e qual versão está no ar.
module.exports = (req, res) => {
  const tem = (nome) => Boolean(process.env[nome]);
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    versao: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7),
    ambiente: process.env.VERCEL_ENV || 'local',
    projeto: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
    variaveis: {
      ADMIN_SENHA: tem('ADMIN_SENHA'),
      BLOB_READ_WRITE_TOKEN: tem('BLOB_READ_WRITE_TOKEN'),
      INFINITEPAY_HANDLE: tem('INFINITEPAY_HANDLE'),
      MELHORENVIO_TOKEN: tem('MELHORENVIO_TOKEN'),
    },
  });
};
