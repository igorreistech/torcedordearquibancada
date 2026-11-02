# Torcedor de Arquibancada

Loja de camisas: site estático + funções da Vercel (`api/`).

- **Site:** `index.html`, `app.js`, `styles.css`
- **Painel do dono:** `/admin` (`admin.html`, `admin.js`). Cadastra camisas, fotos, preços, selos e ordem.
- **Configuração da loja:** `produtos.js` (WhatsApp, Instagram, frete, InfiniteTag da InfinitePay)
- **Pagamento:** Checkout Integrado da InfinitePay (Pix ou cartão). O servidor gera o link com o valor recalculado pelo catálogo e confere o pagamento na volta (`payment_check`).
- **Catálogo e fotos:** Vercel Blob

## Configurar na Vercel

1. Importar este repositório (framework "Other", sem build).
2. **Storage → Create → Blob** e conectar ao projeto (cria `BLOB_READ_WRITE_TOKEN`).
3. **Settings → Environment Variables:**
   - `ADMIN_SENHA`: senha do painel
   - `INFINITEPAY_HANDLE`: InfiniteTag da conta, sem o $ (ou preencher `infinitepayHandle` em `produtos.js`)
   - `INFINITEPAY_API_KEY` (opcional): chave da InfinitePay, só se for usar opções avançadas
4. No app InfinitePay: Vendas → Checkout → Configurações → Habilitar Checkout Integrado.
5. Fazer um novo deploy depois de mudar variáveis.
