// ============================================================
//  CONFIGURAÇÃO DA LOJA — edite aqui
// ============================================================
const LOJA = {
  nome: 'Torcedor de Arquibancada',
  whatsapp: '5565999999999',          // DDI + DDD + número, só dígitos
  instagram: 'torcedordearquibancada', // sem o @
  precoPersonalizacao: 25,            // nome + número
  freteGratisAPartirDe: 2,            // nº de camisas para frete grátis
  tamanhos: ['P', 'M', 'G', 'GG', 'XGG'],
};

const CATEGORIAS = [
  { id: 'brasileirao', nome: 'Brasileirão' },
  { id: 'europa', nome: 'Europa' },
  { id: 'selecoes', nome: 'Seleções' },
  { id: 'retro', nome: 'Retrô' },
];

// ============================================================
//  CATÁLOGO
//  cores:  [base, secundária, detalhe (gola/punho/escudo)]
//  padrao: solido | listras-verticais | listras-horizontais |
//          faixa-diagonal | faixa-horizontal | metade
//  imagem: caminho da foto (ex.: 'img/flamengo.jpg'). Se vazio,
//          o site desenha uma camisa ilustrada com as cores acima.
//  tags:   lancamento | promocao | mais-vendida
// ============================================================
const PRODUTOS = [
  { id: 'fla-25', nome: 'Flamengo I', temporada: '25/26', versao: 'Torcedor', categoria: 'brasileirao',
    preco: 149.9, precoAntigo: 199.9, cores: ['#c8102e', '#111111', '#111111'], padrao: 'listras-horizontais', tags: ['mais-vendida'], imagem: '' },
  { id: 'cor-25', nome: 'Corinthians I', temporada: '25/26', versao: 'Torcedor', categoria: 'brasileirao',
    preco: 149.9, precoAntigo: 199.9, cores: ['#f4f4f4', '#f4f4f4', '#111111'], padrao: 'solido', tags: [], imagem: '' },
  { id: 'pal-25', nome: 'Palmeiras I', temporada: '25/26', versao: 'Jogador', categoria: 'brasileirao',
    preco: 189.9, precoAntigo: 239.9, cores: ['#006437', '#006437', '#ffffff'], padrao: 'solido', tags: ['lancamento'], imagem: '' },
  { id: 'spfc-25', nome: 'São Paulo I', temporada: '25/26', versao: 'Torcedor', categoria: 'brasileirao',
    preco: 149.9, precoAntigo: null, cores: ['#ffffff', '#d7131d', '#111111'], padrao: 'faixa-horizontal', tags: [], imagem: '' },
  { id: 'gre-25', nome: 'Grêmio I', temporada: '25/26', versao: 'Torcedor', categoria: 'brasileirao',
    preco: 149.9, precoAntigo: null, cores: ['#0d80bf', '#111111', '#ffffff'], padrao: 'listras-verticais', tags: [], imagem: '' },
  { id: 'vas-25', nome: 'Vasco I', temporada: '25/26', versao: 'Torcedor', categoria: 'brasileirao',
    preco: 149.9, precoAntigo: 179.9, cores: ['#111111', '#ffffff', '#ffffff'], padrao: 'faixa-diagonal', tags: ['promocao'], imagem: '' },
  { id: 'rma-25', nome: 'Real Madrid I', temporada: '25/26', versao: 'Jogador', categoria: 'europa',
    preco: 189.9, precoAntigo: null, cores: ['#fafafa', '#fafafa', '#c9a227'], padrao: 'solido', tags: ['lancamento'], imagem: '' },
  { id: 'bar-25', nome: 'Barcelona I', temporada: '25/26', versao: 'Torcedor', categoria: 'europa',
    preco: 159.9, precoAntigo: 199.9, cores: ['#a50044', '#004d98', '#edbb00'], padrao: 'listras-verticais', tags: ['mais-vendida'], imagem: '' },
  { id: 'mci-25', nome: 'Manchester City I', temporada: '25/26', versao: 'Torcedor', categoria: 'europa',
    preco: 159.9, precoAntigo: null, cores: ['#6cabdd', '#6cabdd', '#ffffff'], padrao: 'solido', tags: [], imagem: '' },
  { id: 'bra-26', nome: 'Brasil I', temporada: '2026', versao: 'Torcedor', categoria: 'selecoes',
    preco: 169.9, precoAntigo: 219.9, cores: ['#ffdc02', '#ffdc02', '#009739'], padrao: 'solido', tags: ['lancamento', 'mais-vendida'], imagem: '' },
  { id: 'arg-26', nome: 'Argentina I', temporada: '2026', versao: 'Torcedor', categoria: 'selecoes',
    preco: 169.9, precoAntigo: null, cores: ['#ffffff', '#75aadb', '#111111'], padrao: 'listras-verticais', tags: [], imagem: '' },
  { id: 'bra-70', nome: 'Brasil Retrô', temporada: '1970', versao: 'Retrô', categoria: 'retro',
    preco: 169.9, precoAntigo: null, cores: ['#ffd400', '#ffd400', '#0a8f3c'], padrao: 'solido', tags: [], imagem: '' },
  { id: 'mil-89', nome: 'Milan Retrô', temporada: '88/89', versao: 'Retrô', categoria: 'retro',
    preco: 169.9, precoAntigo: 199.9, cores: ['#d40000', '#111111', '#ffffff'], padrao: 'listras-verticais', tags: ['promocao'], imagem: '' },
  { id: 'fla-81', nome: 'Flamengo Retrô', temporada: '1981', versao: 'Retrô', categoria: 'retro',
    preco: 169.9, precoAntigo: null, cores: ['#c8102e', '#111111', '#ffffff'], padrao: 'listras-horizontais', tags: [], imagem: '' },
];
