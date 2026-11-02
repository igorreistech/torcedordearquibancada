(() => {
  const $ = (s) => document.querySelector(s);
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const linkWhats = (msg) => `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  let produtos = [];
  const produto = (id) => produtos.find((p) => p.id === id);

  // ---------- Camisa ilustrada (usada quando o produto não tem foto) ----------
  const CORPO = 'M75 22 L50 30 L18 55 L34 88 L52 78 L52 182 L148 182 L148 78 L166 88 L182 55 L150 30 L125 22 Q100 42 75 22 Z';
  let seq = 0;

  function camisa(p) {
    const id = 'cm' + seq++;
    const [c1, c2, c3] = p.cores;
    let estampa = '';
    switch (p.padrao) {
      case 'listras-verticais':
        for (let x = 4; x < 200; x += 24) estampa += `<rect x="${x}" y="0" width="12" height="200" fill="${c2}"/>`;
        break;
      case 'listras-horizontais':
        for (let y = 30; y < 200; y += 22) estampa += `<rect x="0" y="${y}" width="200" height="11" fill="${c2}"/>`;
        break;
      case 'faixa-diagonal':
        estampa = `<polygon points="118,0 150,0 82,200 50,200" fill="${c2}"/>`;
        break;
      case 'faixa-horizontal':
        estampa = `<rect x="0" y="78" width="200" height="11" fill="${c2}"/><rect x="0" y="89" width="200" height="11" fill="${c3}"/>`;
        break;
      case 'metade':
        estampa = `<rect x="100" y="0" width="100" height="200" fill="${c2}"/>`;
        break;
    }
    return `<svg class="camisa" viewBox="0 0 200 200" role="img" aria-label="${esc(p.nome)}">
      <defs>
        <clipPath id="${id}c"><path d="${CORPO}"/></clipPath>
        <linearGradient id="${id}g" x1="0" x2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".18"/>
          <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".22"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#${id}c)">
        <rect width="200" height="200" fill="${c1}"/>${estampa}
        <line x1="18" y1="55" x2="34" y2="88" stroke="${c3}" stroke-width="10"/>
        <line x1="182" y1="55" x2="166" y2="88" stroke="${c3}" stroke-width="10"/>
        <rect width="200" height="200" fill="url(#${id}g)"/>
      </g>
      <path d="M75 22 Q100 44 125 22 L120 20 Q100 36 80 20 Z" fill="${c3}"/>
      <circle cx="124" cy="68" r="8" fill="${c3}" stroke="rgba(0,0,0,.25)"/>
      <path d="${CORPO}" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/>
    </svg>`;
  }

  const foto = (url, p) => `<img src="${esc(url)}" alt="${esc(p.nome)}" loading="lazy">`;
  const midia = (p) => (p.fotos?.length ? foto(p.fotos[0], p) : camisa(p));
  const ROTULOS = Object.fromEntries(TAGS.map((t) => [t.id, t.nome]));

  // ---------- Catálogo ----------
  const filtro = { categoria: 'todas', busca: '', ordem: 'destaque' };

  async function carregarProdutos() {
    // Abrindo o arquivo direto do computador não há servidor: mostra o catálogo inicial.
    if (location.protocol === 'file:') return PRODUTOS_PADRAO;
    const r = await fetch('/api/produtos');
    if (!r.ok) throw new Error();
    return (await r.json()).produtos;
  }

  function renderChips() {
    const todas = [{ id: 'todas', nome: 'Todas' }, ...CATEGORIAS];
    $('#chips').innerHTML = todas
      .map((c) => `<button class="chip${c.id === filtro.categoria ? ' ativo' : ''}" data-cat="${c.id}" role="tab" aria-selected="${c.id === filtro.categoria}">${c.nome}</button>`)
      .join('');
  }

  function card(p) {
    const desconto = p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) : 0;
    return `<article class="card" data-id="${p.id}" tabindex="0">
      <div class="card__midia${p.fotos?.length ? ' card__midia--foto' : ''}">
        ${midia(p)}
        <div class="card__tags">${p.tags.map((t) => `<span class="tag tag--${t}">${ROTULOS[t]}</span>`).join('')}</div>
        ${desconto ? `<span class="card__desconto">-${desconto}%</span>` : ''}
      </div>
      <div class="card__info">
        <h3>${esc(p.nome)} <span>${esc(p.temporada)}</span></h3>
        <p class="card__versao">Versão ${esc(p.versao)}</p>
        <p class="preco">${p.precoAntigo ? `<s>${brl(p.precoAntigo)}</s>` : ''}<strong>${brl(p.preco)}</strong></p>
        <p class="parcela">ou ${LOJA.maxParcelas}x de ${brl(p.preco / LOJA.maxParcelas)} no cartão</p>
        <button class="btn btn--primario btn--bloco">Escolher tamanho</button>
      </div>
    </article>`;
  }

  function renderGrade() {
    const busca = normalizar(filtro.busca.trim());
    const lista = produtos.filter(
      (p) => (filtro.categoria === 'todas' || p.categoria === filtro.categoria) && normalizar(`${p.nome} ${p.temporada} ${p.versao}`).includes(busca)
    );
    if (filtro.ordem === 'menor') lista.sort((a, b) => a.preco - b.preco);
    if (filtro.ordem === 'maior') lista.sort((a, b) => b.preco - a.preco);
    if (filtro.ordem === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    $('#grade').innerHTML = lista.length
      ? lista.map(card).join('')
      : `<p class="vazio">Nenhuma camisa encontrada. Não achou o seu time? <a href="${linkWhats('Olá! Vocês têm a camisa do ' + filtro.busca + '?')}" target="_blank" rel="noopener">Pergunta pra gente no WhatsApp</a>.</p>`;
  }

  // ---------- Modal do produto ----------
  const modal = $('#modal');
  let sel = null;

  function abrirProduto(id) {
    const p = produto(id);
    if (!p) return;
    sel = { p, tamanho: null, personalizar: false, qtd: 1 };
    const fotos = p.fotos || [];
    $('#modal-corpo').innerHTML = `
      <div class="modal__midia">
        <div class="modal__principal" id="m-principal">${midia(p)}</div>
        ${fotos.length > 1 ? `<div class="miniaturas">${fotos.map((u, i) => `<button type="button" data-foto="${i}" class="${i ? '' : 'ativo'}">${foto(u, p)}</button>`).join('')}</div>` : ''}
      </div>
      <div class="modal__info">
        <p class="card__versao">${esc(CATEGORIAS.find((c) => c.id === p.categoria)?.nome || '')} · Versão ${esc(p.versao)}</p>
        <h2>${esc(p.nome)} <span>${esc(p.temporada)}</span></h2>
        <p class="preco">${p.precoAntigo ? `<s>${brl(p.precoAntigo)}</s>` : ''}<strong>${brl(p.preco)}</strong></p>

        <p class="rotulo">Tamanho <a href="#medidas" class="link-medidas">ver medidas</a></p>
        <div class="tamanhos">${LOJA.tamanhos.map((t) => `<button type="button" data-tam="${t}">${t}</button>`).join('')}</div>

        <label class="check"><input type="checkbox" id="m-personalizar"> Personalizar com nome e número <b>+ ${brl(LOJA.precoPersonalizacao)}</b></label>
        <div class="personalizacao" id="m-campos" hidden>
          <input type="text" id="m-nome" maxlength="12" placeholder="NOME" aria-label="Nome na camisa">
          <input type="text" id="m-numero" maxlength="2" inputmode="numeric" placeholder="Nº" aria-label="Número na camisa">
        </div>

        <div class="modal__compra">
          <div class="qtd">
            <button type="button" data-qtd="-1" aria-label="Diminuir">−</button><span id="m-qtd">1</span><button type="button" data-qtd="1" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="btn btn--primario" id="m-adicionar">Adicionar · <span id="m-total"></span></button>
        </div>
        <p class="erro" id="m-erro"></p>
      </div>`;
    atualizarTotalModal();
    modal.showModal();
  }

  const precoUnit = (p, personalizado) => p.preco + (personalizado ? LOJA.precoPersonalizacao : 0);

  function atualizarTotalModal() {
    $('#m-qtd').textContent = sel.qtd;
    $('#m-total').textContent = brl(precoUnit(sel.p, sel.personalizar) * sel.qtd);
  }

  $('#modal-corpo').addEventListener('click', (e) => {
    const f = e.target.closest('[data-foto]');
    if (f) {
      $('#m-principal').innerHTML = foto(sel.p.fotos[f.dataset.foto], sel.p);
      document.querySelectorAll('[data-foto]').forEach((b) => b.classList.toggle('ativo', b === f));
    }
    const tam = e.target.closest('[data-tam]');
    if (tam) {
      sel.tamanho = tam.dataset.tam;
      document.querySelectorAll('[data-tam]').forEach((b) => b.classList.toggle('ativo', b === tam));
      $('#m-erro').textContent = '';
    }
    const q = e.target.closest('[data-qtd]');
    if (q) {
      sel.qtd = Math.max(1, Math.min(20, sel.qtd + Number(q.dataset.qtd)));
      atualizarTotalModal();
    }
    if (e.target.closest('.link-medidas')) modal.close();
    if (e.target.closest('#m-adicionar')) adicionarDoModal();
  });

  $('#modal-corpo').addEventListener('input', (e) => {
    if (e.target.id === 'm-personalizar') {
      sel.personalizar = e.target.checked;
      $('#m-campos').hidden = !sel.personalizar;
      atualizarTotalModal();
    }
    if (e.target.id === 'm-nome') e.target.value = e.target.value.toUpperCase();
    if (e.target.id === 'm-numero') e.target.value = e.target.value.replace(/\D/g, '');
  });

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

  function adicionarDoModal() {
    if (!sel.tamanho) return ($('#m-erro').textContent = 'Escolha um tamanho.');
    let nome = '', numero = '';
    if (sel.personalizar) {
      nome = $('#m-nome').value.trim();
      numero = $('#m-numero').value.trim();
      if (!nome && !numero) return ($('#m-erro').textContent = 'Preencha o nome e/ou o número da personalização.');
    }
    const chave = [sel.p.id, sel.tamanho, nome, numero].join('|');
    const existente = carrinho.find((i) => i.chave === chave);
    if (existente) existente.qtd = Math.min(20, existente.qtd + sel.qtd);
    else carrinho.push({ chave, id: sel.p.id, tamanho: sel.tamanho, nome, numero, qtd: sel.qtd });
    salvar();
    modal.close();
    aviso(`${sel.p.nome} adicionada ao carrinho`);
  }

  // ---------- Carrinho ----------
  const CHAVE_LS = 'tda-carrinho';
  let carrinho = [];
  try { carrinho = JSON.parse(localStorage.getItem(CHAVE_LS)) || []; } catch { carrinho = []; }

  function salvar() {
    try { localStorage.setItem(CHAVE_LS, JSON.stringify(carrinho)); } catch {}
    renderCarrinho();
  }

  const personalizado = (i) => Boolean(i.nome || i.numero);
  const totalItem = (i) => precoUnit(produto(i.id), personalizado(i)) * i.qtd;
  const pedidoAtual = () => calcularPedido(carrinho, produtos);

  function resumoHTML(p) {
    return `<div class="resumo">
      <div><span>Subtotal</span><span>${brl(p.subtotal)}</span></div>
      <div><span>Frete</span><span>${p.frete ? brl(p.frete) : 'Grátis'}</span></div>
      <div class="resumo__total"><span>Total no cartão</span><strong>${brl(p.total)}</strong></div>
      <div class="resumo__pix"><span>No Pix (${Math.round(LOJA.descontoPix * 100)}% off)</span><strong>${brl(p.totalPix)}</strong></div>
    </div>`;
  }

  function renderCarrinho() {
    const qtd = carrinho.reduce((s, i) => s + i.qtd, 0);
    $('#qtd-carrinho').textContent = qtd;
    $('#qtd-carrinho').classList.toggle('visivel', qtd > 0);
    $('#gaveta-rodape').hidden = etapa !== 'carrinho' || qtd === 0;
    $('#passos').hidden = qtd === 0 || etapa === 'resultado';

    $('#itens').innerHTML = carrinho.length
      ? carrinho
          .map((i) => {
            const p = produto(i.id);
            const extra = personalizado(i) ? `<br>Personalizada: ${esc([i.nome, i.numero].filter(Boolean).join(' '))}` : '';
            return `<div class="item" data-chave="${esc(i.chave)}">
              <div class="item__midia">${midia(p)}</div>
              <div class="item__info">
                <strong>${esc(p.nome)} ${esc(p.temporada)}</strong>
                <small>Versão ${esc(p.versao)} · Tam. ${i.tamanho}${extra}</small>
                <div class="item__linha">
                  <div class="qtd qtd--mini"><button data-acao="menos" aria-label="Diminuir">−</button><span>${i.qtd}</span><button data-acao="mais" aria-label="Aumentar">+</button></div>
                  <span>${brl(totalItem(i))}</span>
                </div>
              </div>
              <button class="item__remover" data-acao="remover" aria-label="Remover">×</button>
            </div>`;
          })
          .join('')
      : `<div class="carrinho-vazio"><p>Seu carrinho está vazio.</p><a href="#catalogo" class="btn btn--primario" data-fechar>Ver camisas</a></div>`;

    if (!qtd) return;
    const pedido = pedidoAtual();
    $('#resumo-carrinho').innerHTML = resumoHTML(pedido);
    const falta = LOJA.freteGratisAPartirDe - qtd;
    $('#frete').innerHTML = falta <= 0
      ? '✅ <b>Frete grátis</b> garantido!'
      : `Falta${falta > 1 ? 'm' : ''} <b>${falta} camisa${falta > 1 ? 's' : ''}</b> para o frete grátis.`;
  }

  $('#itens').addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar]')) return fecharCarrinho();
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const chave = btn.closest('.item').dataset.chave;
    const item = carrinho.find((i) => i.chave === chave);
    if (btn.dataset.acao === 'mais') item.qtd = Math.min(20, item.qtd + 1);
    if (btn.dataset.acao === 'menos') item.qtd -= 1;
    if (btn.dataset.acao === 'remover' || item.qtd < 1) carrinho = carrinho.filter((i) => i !== item);
    salvar();
  });

  // ---------- Etapas do checkout ----------
  const TITULOS = { carrinho: 'Seu carrinho', dados: 'Entrega', pagamento: 'Pagamento', resultado: 'Seu pedido' };
  const ORDEM = ['carrinho', 'dados', 'pagamento'];
  let etapa = 'carrinho';
  let cliente = null;

  function irPara(nova) {
    etapa = nova;
    document.querySelectorAll('[data-etapa]').forEach((el) => { el.hidden = el.dataset.etapa !== nova; });
    document.querySelectorAll('[data-passo]').forEach((el) => {
      const i = ORDEM.indexOf(el.dataset.passo);
      el.classList.toggle('ativo', el.dataset.passo === nova);
      el.classList.toggle('feito', i < ORDEM.indexOf(nova));
    });
    $('#gaveta-titulo').textContent = TITULOS[nova];
    $('#voltar').hidden = !(nova === 'dados' || nova === 'pagamento');
    gaveta.classList.toggle('larga', nova === 'pagamento');
    if (nova !== 'resultado') pararPix();
    if (nova === 'pagamento') montarBrick();
    else desmontarBrick();
    if (nova === 'dados') $('#dados-resumo').innerHTML = resumoHTML(pedidoAtual());
    $('#gaveta-corpo').scrollTop = 0;
    renderCarrinho();
  }

  $('#continuar').addEventListener('click', () => {
    try {
      pedidoAtual();
      irPara('dados');
    } catch (e) {
      aviso(e.message);
    }
  });
  $('#voltar').addEventListener('click', () => irPara(ORDEM[ORDEM.indexOf(etapa) - 1]));

  // Máscaras e busca de endereço pelo CEP
  const form = $('#form-dados');
  const mascaras = {
    cpf: (d) => d.slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    telefone: (d) => d.slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2'),
    cep: (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
  };
  form.addEventListener('input', async (e) => {
    const campo = e.target.name;
    if (mascaras[campo]) e.target.value = mascaras[campo](e.target.value.replace(/\D/g, ''));
    if (campo === 'uf') e.target.value = e.target.value.toUpperCase();
    if (campo === 'cep' && e.target.value.length === 9) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${e.target.value.replace('-', '')}/json/`);
        const end = await r.json();
        if (end.erro) return;
        form.rua.value = end.logradouro || form.rua.value;
        form.bairro.value = end.bairro || form.bairro.value;
        form.cidade.value = end.localidade || form.cidade.value;
        form.uf.value = end.uf || form.uf.value;
        form.numero.focus();
      } catch {}
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      cliente = validarCliente(Object.fromEntries(new FormData(form)));
      $('#dados-erro').textContent = '';
      irPara('pagamento');
    } catch (err) {
      $('#dados-erro').textContent = err.message;
    }
  });

  // ---------- Pagamento (Mercado Pago Payment Brick) ----------
  let mp = null, brick = null, sdk = null;

  function carregarSDK() {
    if (window.MercadoPago) return Promise.resolve();
    return (sdk ||= new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = 'https://sdk.mercadopago.com/js/v2';
      s.onload = ok;
      s.onerror = () => { sdk = null; falha(new Error('Não foi possível carregar o Mercado Pago. Verifique sua conexão.')); };
      document.head.append(s);
    }));
  }

  function desmontarBrick() {
    if (brick) { brick.unmount(); brick = null; }
  }

  async function montarBrick() {
    const pedido = pedidoAtual();
    $('#pag-resumo').innerHTML = resumoHTML(pedido);
    $('#pag-erro').textContent = '';
    desmontarBrick();
    $('#brick').innerHTML = '<p class="carregando">Carregando formas de pagamento…</p>';
    try {
      await carregarSDK();
      if (etapa !== 'pagamento') return;
      mp ||= new MercadoPago(LOJA.mercadoPagoPublicKey, { locale: 'pt-BR' });
      $('#brick').innerHTML = '';
      const criado = await mp.bricks().create('payment', 'brick', {
        initialization: { amount: pedido.total, payer: { email: cliente.email } },
        customization: {
          paymentMethods: { creditCard: 'all', bankTransfer: ['pix'], maxInstallments: LOJA.maxParcelas },
          visual: { style: { theme: 'dark', customVariables: { baseColor: '#ff6b00' } } },
        },
        callbacks: {
          onReady: () => {},
          onError: (erro) => console.error(erro),
          onSubmit: ({ formData }) => pagar(formData),
        },
      });
      if (etapa === 'pagamento') brick = criado;
      else criado.unmount();
    } catch (e) {
      $('#brick').innerHTML = '';
      $('#pag-erro').textContent = e.message || 'Não foi possível carregar o pagamento.';
    }
  }

  async function pagar(formData) {
    $('#pag-erro').textContent = '';
    const r = await fetch('/api/pagamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: carrinho, cliente, pagamento: formData, chave: uuid() }),
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) {
      $('#pag-erro').textContent = dados.erro || 'Não foi possível processar o pagamento.';
      throw new Error(dados.erro);
    }
    mostrarResultado(dados);
  }

  // ---------- Resultado ----------
  const MOTIVOS = {
    cc_rejected_insufficient_amount: 'Saldo ou limite insuficiente.',
    cc_rejected_bad_filled_security_code: 'Código de segurança inválido.',
    cc_rejected_bad_filled_date: 'Data de validade incorreta.',
    cc_rejected_bad_filled_card_number: 'Número do cartão incorreto.',
    cc_rejected_bad_filled_other: 'Confira os dados do cartão.',
    cc_rejected_call_for_authorize: 'Seu banco precisa autorizar o pagamento. Ligue para ele e tente de novo.',
    cc_rejected_card_disabled: 'Cartão inativo. Ative com seu banco ou use outro cartão.',
    cc_rejected_duplicated_payment: 'Você já fez um pagamento com esse valor. Use outro cartão ou o Pix.',
    cc_rejected_high_risk: 'Pagamento recusado por segurança. Tente outro cartão ou o Pix.',
    cc_rejected_max_attempts: 'Limite de tentativas atingido. Use outro cartão ou o Pix.',
  };
  let timerPix = null;
  let pixPendente = false;

  function pararPix() {
    clearInterval(timerPix);
    timerPix = null;
    pixPendente = false;
  }

  function concluirPedido(d, titulo, texto) {
    carrinho = [];
    salvar();
    const msg = `Olá! Fiz o pedido ${d.referencia} no site e quero acompanhar a entrega.`;
    $('#resultado').innerHTML = `<div class="resultado resultado--ok">
      <div class="resultado__icone">✓</div>
      <h3>${titulo}</h3>
      <p>Pedido <b>${esc(d.referencia)}</b> · ${brl(d.valor)}</p>
      <p>${texto}</p>
      <a class="btn btn--whats" href="${linkWhats(msg)}" target="_blank" rel="noopener">Acompanhar pelo WhatsApp</a>
    </div>`;
  }

  function mostrarResultado(d) {
    irPara('resultado');
    if (d.status === 'approved') {
      return concluirPedido(d, 'Pagamento aprovado!', `Enviamos a confirmação para <b>${esc(cliente.email)}</b>. Assim que a camisa for postada, mandamos o código de rastreio.`);
    }
    if (d.status === 'in_process') {
      return concluirPedido(d, 'Pagamento em análise', 'O Mercado Pago está analisando o pagamento, o que costuma levar poucos minutos. Você recebe a resposta por e-mail.');
    }
    if (d.status === 'pending' && d.pix) {
      pixPendente = true;
      $('#resultado').innerHTML = `<div class="resultado">
        <h3>Pague com Pix</h3>
        <p>Pedido <b>${esc(d.referencia)}</b> · <b>${brl(d.valor)}</b></p>
        <img class="pix-qr" src="data:image/png;base64,${d.pix.imagem}" alt="QR Code do Pix">
        <p class="pix-instrucao">Escaneie o QR Code no app do seu banco ou use o Pix Copia e Cola:</p>
        <textarea class="pix-codigo" id="pix-codigo" readonly rows="3">${esc(d.pix.codigo)}</textarea>
        <button type="button" class="btn btn--primario btn--bloco" id="copiar-pix">Copiar código Pix</button>
        <p class="pix-aguardando"><span class="pulso"></span> Aguardando pagamento… esta tela atualiza sozinha.</p>
      </div>`;
      $('#copiar-pix').addEventListener('click', async () => {
        const campo = $('#pix-codigo');
        try { await navigator.clipboard.writeText(campo.value); } catch { campo.select(); document.execCommand('copy'); }
        $('#copiar-pix').textContent = 'Código copiado!';
      });
      const inicio = Date.now();
      timerPix = setInterval(async () => {
        if (Date.now() - inicio > 30 * 60 * 1000) return pararPix();
        try {
          const s = await (await fetch(`/api/status?id=${d.id}`)).json();
          if (s.status === 'approved') {
            pararPix();
            concluirPedido(d, 'Pix recebido!', `Pagamento confirmado. Enviamos os detalhes para <b>${esc(cliente.email)}</b>.`);
          }
        } catch {}
      }, 5000);
      return;
    }
    $('#resultado').innerHTML = `<div class="resultado resultado--erro">
      <div class="resultado__icone">!</div>
      <h3>Pagamento não aprovado</h3>
      <p>${MOTIVOS[d.status_detail] || 'O pagamento foi recusado. Tente outro cartão ou pague com Pix.'}</p>
      <button type="button" class="btn btn--primario btn--bloco" id="tentar-novamente">Tentar novamente</button>
    </div>`;
    $('#tentar-novamente').addEventListener('click', () => irPara('pagamento'));
  }

  // ---------- Gaveta ----------
  const gaveta = $('#gaveta'), sombra = $('#sombra');
  function abrirCarrinho() {
    if (etapa === 'resultado' && !pixPendente) irPara('carrinho');
    sombra.hidden = false;
    requestAnimationFrame(() => { gaveta.classList.add('aberta'); sombra.classList.add('visivel'); });
    gaveta.setAttribute('aria-hidden', 'false');
    document.body.classList.add('travado');
  }
  function fecharCarrinho() {
    gaveta.classList.remove('aberta');
    sombra.classList.remove('visivel');
    gaveta.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('travado');
    setTimeout(() => { sombra.hidden = true; }, 250);
  }

  // ---------- Aviso ----------
  let timerAviso;
  function aviso(texto) {
    const el = $('#aviso');
    el.innerHTML = `${esc(texto)} <button type="button">Ver carrinho</button>`;
    el.classList.add('visivel');
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => el.classList.remove('visivel'), 3500);
  }
  $('#aviso').addEventListener('click', (e) => {
    if (e.target.closest('button')) { $('#aviso').classList.remove('visivel'); abrirCarrinho(); }
  });

  // ---------- Eventos gerais ----------
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    filtro.categoria = b.dataset.cat;
    renderChips();
    renderGrade();
  });
  $('#busca').addEventListener('input', (e) => { filtro.busca = e.target.value; renderGrade(); });
  $('#ordem').addEventListener('change', (e) => { filtro.ordem = e.target.value; renderGrade(); });
  $('#grade').addEventListener('click', (e) => {
    const c = e.target.closest('.card');
    if (c) abrirProduto(c.dataset.id);
  });
  $('#grade').addEventListener('keydown', (e) => {
    const c = e.target.closest('.card');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirProduto(c.dataset.id); }
  });
  $('#abrir-carrinho').addEventListener('click', abrirCarrinho);
  $('#fechar-carrinho').addEventListener('click', fecharCarrinho);
  sombra.addEventListener('click', fecharCarrinho);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && gaveta.classList.contains('aberta')) fecharCarrinho(); });

  // ---------- Inicialização ----------
  document.querySelectorAll('[data-whats]').forEach((a) => {
    a.href = linkWhats(`Olá! Vim pelo site da ${LOJA.nome} e quero tirar uma dúvida.`);
    a.target = '_blank';
    a.rel = 'noopener';
  });
  $('#link-instagram').href = `https://www.instagram.com/${LOJA.instagram}/`;
  $('#promo-qtd').textContent = LOJA.freteGratisAPartirDe;
  $('#ano').textContent = new Date().getFullYear();
  renderChips();

  carregarProdutos()
    .then((lista) => {
      produtos = lista;
      // Descarta do carrinho salvo o que saiu do catálogo
      carrinho = carrinho.filter((i) => produto(i.id) && LOJA.tamanhos.includes(i.tamanho));
      const destaque = produtos.slice(0, 2);
      $('#hero-camisas').innerHTML = destaque.map((p) => `<div class="hero__camisa">${midia(p)}</div>`).join('');
      renderGrade();
      salvar();
    })
    .catch(() => {
      $('#grade').innerHTML = '<p class="vazio">Não foi possível carregar as camisas. Atualize a página para tentar de novo.</p>';
    });
})();
