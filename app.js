(() => {
  const $ = (s) => document.querySelector(s);
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const produto = (id) => PRODUTOS.find((p) => p.id === id);
  const linkWhats = (msg) => `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;

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

  const midia = (p) => (p.imagem ? `<img src="${esc(p.imagem)}" alt="${esc(p.nome)}" loading="lazy">` : camisa(p));
  const ROTULOS = { lancamento: 'Lançamento', promocao: 'Promoção', 'mais-vendida': 'Mais vendida' };

  // ---------- Catálogo ----------
  const filtro = { categoria: 'todas', busca: '', ordem: 'destaque' };

  function renderChips() {
    const todas = [{ id: 'todas', nome: 'Todas' }, ...CATEGORIAS];
    $('#chips').innerHTML = todas
      .map((c) => `<button class="chip${c.id === filtro.categoria ? ' ativo' : ''}" data-cat="${c.id}" role="tab" aria-selected="${c.id === filtro.categoria}">${c.nome}</button>`)
      .join('');
  }

  function card(p) {
    const desconto = p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) : 0;
    return `<article class="card" data-id="${p.id}" tabindex="0">
      <div class="card__midia">
        ${midia(p)}
        <div class="card__tags">${p.tags.map((t) => `<span class="tag tag--${t}">${ROTULOS[t]}</span>`).join('')}</div>
        ${desconto ? `<span class="card__desconto">-${desconto}%</span>` : ''}
      </div>
      <div class="card__info">
        <h3>${esc(p.nome)} <span>${esc(p.temporada)}</span></h3>
        <p class="card__versao">Versão ${esc(p.versao)}</p>
        <p class="preco">${p.precoAntigo ? `<s>${brl(p.precoAntigo)}</s>` : ''}<strong>${brl(p.preco)}</strong></p>
        <p class="parcela">ou 3x de ${brl(p.preco / 3)} sem juros</p>
        <button class="btn btn--primario btn--bloco">Escolher tamanho</button>
      </div>
    </article>`;
  }

  function renderGrade() {
    const busca = normalizar(filtro.busca.trim());
    const lista = PRODUTOS.filter(
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
    sel = { p, tamanho: null, personalizar: false, nome: '', numero: '', qtd: 1 };
    $('#modal-corpo').innerHTML = `
      <div class="modal__midia">${midia(p)}</div>
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
    if (existente) existente.qtd += sel.qtd;
    else carrinho.push({ chave, id: sel.p.id, tamanho: sel.tamanho, nome, numero, qtd: sel.qtd });
    salvar();
    modal.close();
    aviso(`${sel.p.nome} adicionada ao carrinho`);
  }

  // ---------- Carrinho ----------
  const CHAVE_LS = 'tda-carrinho';
  let carrinho = [];
  try { carrinho = JSON.parse(localStorage.getItem(CHAVE_LS)) || []; } catch { carrinho = []; }
  carrinho = carrinho.filter((i) => produto(i.id));

  function salvar() {
    try { localStorage.setItem(CHAVE_LS, JSON.stringify(carrinho)); } catch {}
    renderCarrinho();
  }

  const personalizado = (i) => Boolean(i.nome || i.numero);
  const totalItem = (i) => precoUnit(produto(i.id), personalizado(i)) * i.qtd;

  function renderCarrinho() {
    const qtd = carrinho.reduce((s, i) => s + i.qtd, 0);
    const subtotal = carrinho.reduce((s, i) => s + totalItem(i), 0);
    $('#qtd-carrinho').textContent = qtd;
    $('#qtd-carrinho').classList.toggle('visivel', qtd > 0);
    $('#gaveta-rodape').hidden = qtd === 0;

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

    $('#subtotal').textContent = brl(subtotal);
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

  const gaveta = $('#gaveta'), sombra = $('#sombra');
  function abrirCarrinho() {
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

  $('#cli-cep').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 8);
    e.target.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  });

  $('#finalizar').addEventListener('click', () => {
    if (!carrinho.length) return;
    const linhas = carrinho.map((i) => {
      const p = produto(i.id);
      const pers = personalizado(i) ? ` — Personalizada: ${[i.nome, i.numero].filter(Boolean).join(' ')}` : '';
      return `• ${i.qtd}x ${p.nome} ${p.temporada} (${p.versao}) — Tam. ${i.tamanho}${pers} — ${brl(totalItem(i))}`;
    });
    const qtd = carrinho.reduce((s, i) => s + i.qtd, 0);
    const nome = $('#cli-nome').value.trim();
    const cep = $('#cli-cep').value.trim();
    const msg = [
      `Olá! Quero fazer um pedido na ${LOJA.nome} 🏟️`,
      '',
      ...linhas,
      '',
      `Subtotal: ${brl(carrinho.reduce((s, i) => s + totalItem(i), 0))}`,
      qtd >= LOJA.freteGratisAPartirDe ? 'Frete: grátis' : null,
      `Pagamento: ${$('#cli-pagamento').value}`,
      nome ? `Nome: ${nome}` : null,
      cep ? `CEP: ${cep}` : null,
    ].filter((l) => l !== null).join('\n');
    window.open(linkWhats(msg), '_blank', 'noopener');
  });

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
  $('#link-instagram').href = `https://instagram.com/${LOJA.instagram}`;
  $('#promo-qtd').textContent = LOJA.freteGratisAPartirDe;
  $('#ano').textContent = new Date().getFullYear();
  $('#hero-camisas').innerHTML = ['bar-25', 'bra-26', 'fla-25']
    .map(produto).filter(Boolean)
    .map((p) => `<div class="hero__camisa">${camisa(p)}</div>`).join('');

  renderChips();
  renderGrade();
  renderCarrinho();
})();
