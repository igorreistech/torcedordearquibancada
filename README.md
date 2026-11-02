# Torcedor de Arquibancada

Loja de camisas: site estático + funções da Vercel (`api/`).

- **Site:** `index.html`, `app.js`, `styles.css`
- **Painel do dono:** `/admin` (`admin.html`, `admin.js`). Cadastra camisas, fotos, preços, selos e ordem.
- **Configuração da loja:** `produtos.js` (WhatsApp, Instagram, frete, desconto no Pix, parcelas, chave pública do Mercado Pago)
- **Pagamento:** Mercado Pago (cartão e Pix) dentro do carrinho. O valor é sempre recalculado no servidor.
- **Catálogo e fotos:** Vercel Blob

## Configurar na Vercel

1. Importar este repositório (framework "Other", sem build).
2. **Storage → Create → Blob** e conectar ao projeto (cria `BLOB_READ_WRITE_TOKEN`).
3. **Settings → Environment Variables:**
   - `ADMIN_SENHA`: senha do painel
   - `MP_ACCESS_TOKEN`: Access Token do Mercado Pago
4. Colocar a **Public Key** do Mercado Pago em `produtos.js` (`mercadoPagoPublicKey`).
5. Fazer um novo deploy depois de mudar variáveis.
