(() => {
  const $ = (s) => document.querySelector(s);
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const linkWhats = (msg) => `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;

  let produtos = [];
  let tabelaFrete = FRETE_PADRAO;
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

  async function carregarFrete() {
    if (location.protocol === 'file:') return FRETE_PADRAO;
    try {
      const r = await fetch('/api/frete');
      return r.ok ? await r.json() : FRETE_PADRAO;
    } catch {
      return FRETE_PADRAO;
    }
  }

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
        <div class="card__tags">${esgotado(p) ? '<span class="tag tag--esgotado">Esgotada</span>' : p.tags.map((t) => `<span class="tag tag--${t}">${ROTULOS[t]}</span>`).join('')}</div>
        ${desconto ? `<span class="card__desconto">-${desconto}%</span>` : ''}
      </div>
      <div class="card__info">
        <h3>${esc(p.nome)} <span>${esc(p.temporada)}</span></h3>
        <p class="card__versao">Versão ${esc(p.versao)}</p>
        <p class="preco">${p.precoAntigo ? `<s>${brl(p.precoAntigo)}</s>` : ''}<strong>${brl(p.preco)}</strong></p>
        <p class="parcela">no Pix ou em até ${LOJA.maxParcelas}x no cartão</p>
        ${esgotado(p) ? '<button class="btn btn--fantasma btn--bloco" disabled>Esgotada</button>' : '<button class="btn btn--primario btn--bloco">Escolher tamanho</button>'}
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
        <div class="tamanhos">${tamanhosDe(p).map((t) => `<button type="button" data-tam="${t}" ${disponivel(p, t) ? '' : 'disabled'}>${t}${p.estoque ? `<small>${disponivel(p, t) ? `${disponivel(p, t)} un.` : 'esgotado'}</small>` : ''}</button>`).join('')}</div>
        <p class="estoque-aviso" id="m-estoque">${p.estoque ? '' : 'Sob encomenda'}</p>

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

  // Quanto ainda dá para adicionar de um tamanho, descontando o que já está no carrinho.
  const restante = (p, tamanho) =>
    disponivel(p, tamanho) - carrinho.filter((i) => i.id === p.id && i.tamanho === tamanho).reduce((s, i) => s + i.qtd, 0);
  const limiteQtd = () => Math.min(20, sel.tamanho ? Math.max(1, restante(sel.p, sel.tamanho)) : 20);

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
      const tem = disponivel(sel.p, sel.tamanho);
      const pecas = `peça${tem > 1 ? 's' : ''}`;
      $('#m-estoque').textContent = !sel.p.estoque ? 'Sob encomenda'
        : tem <= 3 ? `Últimas ${tem} ${pecas} no tamanho ${sel.tamanho}!` : `${tem} ${pecas} em estoque no tamanho ${sel.tamanho}`;
      $('#m-estoque').classList.toggle('estoque-aviso--ultimas', Boolean(sel.p.estoque) && tem <= 3);
      sel.qtd = Math.min(sel.qtd, limiteQtd());
      atualizarTotalModal();
    }
    const q = e.target.closest('[data-qtd]');
    if (q) {
      sel.qtd = Math.max(1, Math.min(limiteQtd(), sel.qtd + Number(q.dataset.qtd)));
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
    const sobra = restante(sel.p, sel.tamanho);
    if (sel.qtd > sobra) {
      return ($('#m-erro').textContent = sobra > 0
        ? `Só dá para adicionar mais ${sobra} neste tamanho.`
        : 'Você já tem no carrinho todas as unidades deste tamanho.');
    }
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
      <div><span>Frete${p.modalidade ? ` (${p.modalidade.nome})` : ''}</span><span>${p.frete === null ? 'calculado na entrega' : p.freteACombinar ? 'a combinar' : p.frete ? brl(p.frete) : 'Grátis'}</span></div>
      <div class="resumo__total"><span>Total</span><strong>${brl(p.total)}</strong></div>
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
    renderSimOpcoes();
    let pedido;
    try {
      pedido = calcularPedido(carrinho, produtos, entregaPara(cepSimulado()));
    } catch {
      pedido = pedidoAtual();
    }
    $('#resumo-carrinho').innerHTML = resumoHTML(pedido);
    const minimo = tabelaFrete.gratisAPartirDe;
    const falta = minimo - qtd;
    $('#frete').hidden = !minimo;
    $('#frete').innerHTML = !minimo ? '' : falta <= 0
      ? '✅ <b>Frete PAC grátis</b> neste pedido!'
      : `Falta${falta > 1 ? 'm' : ''} <b>${falta} camisa${falta > 1 ? 's' : ''}</b> para o frete PAC grátis.`;
  }

  $('#itens').addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar]')) return fecharCarrinho();
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const chave = btn.closest('.item').dataset.chave;
    const item = carrinho.find((i) => i.chave === chave);
    if (btn.dataset.acao === 'mais') {
      if (restante(produto(item.id), item.tamanho) < 1) return aviso('Não temos mais unidades deste tamanho.');
      item.qtd = Math.min(20, item.qtd + 1);
    }
    if (btn.dataset.acao === 'menos') item.qtd -= 1;
    if (btn.dataset.acao === 'remover' || item.qtd < 1) carrinho = carrinho.filter((i) => i !== item);
    salvar();
  });

  // ---------- Etapas do checkout ----------
  const TITULOS = { carrinho: 'Seu carrinho', dados: 'Entrega', resultado: 'Seu pedido' };
  const ORDEM = ['carrinho', 'dados'];
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
    $('#voltar').hidden = nova !== 'dados';
    if (nova === 'dados') renderOpcoesFrete();
    $('#gaveta-corpo').scrollTop = 0;
    renderCarrinho();
  }

  $('#continuar').addEventListener('click', () => {
    try {
      pedidoAtual();
      conferirEstoque(carrinho, produtos);
      irPara('dados');
    } catch (e) {
      aviso(e.message);
    }
  });
  $('#voltar').addEventListener('click', () => irPara(ORDEM[ORDEM.indexOf(etapa) - 1]));

  // Máscaras e busca de endereço pelo CEP
  const form = $('#form-dados');
  const mascaras = {
    telefone: (d) => d.slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2'),
    cep: (d) => d.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
  };
  form.addEventListener('input', async (e) => {
    const campo = e.target.name;
    if (mascaras[campo]) e.target.value = mascaras[campo](e.target.value.replace(/\D/g, ''));
    if (campo === 'cep') renderOpcoesFrete();
    if (campo === 'modalidade') { modalidade = e.target.value; atualizarResumoDados(); }
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

  // Formas de envio (PAC/SEDEX) cotadas no Melhor Envio pelo CEP
  let modalidade = null;
  const cepDigitado = () => form.cep.value.replace(/\D/g, '');
  const qtdCarrinho = () => carrinho.reduce((s, i) => s + i.qtd, 0);

  // Cotações guardadas por CEP + quantidade, para não consultar de novo a cada clique.
  const cotacoes = {};
  const chaveCotacao = (cep) => `${cep}|${qtdCarrinho()}`;
  const opcoesDe = (cep) => cotacoes[chaveCotacao(cep)]?.opcoes; // undefined enquanto calcula
  const entregaPara = (cep) => (cep.length === 8 && opcoesDe(cep) ? { opcoes: opcoesDe(cep), modalidade } : null);

  function cotar(cep) {
    const chave = chaveCotacao(cep);
    if (cotacoes[chave]) return;
    cotacoes[chave] = { carregando: true };
    fetch('/api/frete?' + new URLSearchParams({ cep, qtd: qtdCarrinho() }))
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((d) => {
        cotacoes[chave] = { opcoes: d.opcoes || [] };
        renderCarrinho();
        if (etapa === 'dados') renderOpcoesFrete();
      });
  }

  function atualizarResumoDados() {
    try {
      $('#dados-resumo').innerHTML = resumoHTML(calcularPedido(carrinho, produtos, entregaPara(cepDigitado())));
    } catch {}
  }

  function renderOpcoesFrete() {
    const el = $('#opcoes-frete');
    if (cepDigitado().length !== 8) {
      el.innerHTML = '';
      modalidade = null;
      return atualizarResumoDados();
    }
    if (simCep.value !== form.cep.value) simCep.value = form.cep.value;
    el.innerHTML = opcoesHTML(cepDigitado(), 'modalidade', '<p class="rotulo">Forma de envio</p>');
    atualizarResumoDados();
  }

  // Lista PAC/SEDEX de um CEP. Mantém o envio já escolhido quando ele existe para o CEP.
  function opcoesHTML(cep, nome, titulo = '') {
    const opcoes = opcoesDe(cep);
    if (!opcoes) {
      cotar(cep);
      return '<p class="carregando-frete">Calculando frete pelos Correios…</p>';
    }
    if (!opcoes.some((o) => o.id === modalidade)) modalidade = opcoes[0]?.id || null;
    return opcoes.length
      ? titulo + opcoes.map((o) => `<label class="opcao-frete">
          <input type="radio" name="${nome}" value="${o.id}" ${o.id === modalidade ? 'checked' : ''}>
          <span><b>${o.nome}</b>${o.prazo ? `<small>até ${o.prazo} ${o.prazo > 1 ? 'dias úteis' : 'dia útil'}</small>` : ''}</span>
          <strong>${o.valor ? brl(o.valor) : 'Grátis'}</strong>
        </label>`).join('')
      : '<p class="frete">📦 Não conseguimos calcular o frete para este CEP agora. Ele será combinado pelo WhatsApp e não entra neste pagamento.</p>';
  }

  // ---------- Simulador de frete no carrinho ----------
  // O CEP e o envio escolhidos aqui seguem para a etapa de entrega.
  const simCep = $('#sim-cep');
  const cepSimulado = () => simCep.value.replace(/\D/g, '');

  function renderSimOpcoes() {
    const cep = cepSimulado();
    $('#sim-opcoes').innerHTML = cep.length === 8 ? opcoesHTML(cep, 'sim-modalidade') : '';
  }

  function simular() {
    const cep = cepSimulado();
    if (cep.length !== 8) {
      $('#sim-opcoes').innerHTML = '<p class="erro">Digite o CEP completo, com 8 números.</p>';
      return simCep.focus();
    }
    // Leva o CEP para o formulário de entrega (o endereço é buscado pelo CEP)
    if (form.cep.value.replace(/\D/g, '') !== cep) {
      form.cep.value = mascaras.cep(cep);
      form.cep.dispatchEvent(new Event('input', { bubbles: true }));
    }
    renderCarrinho();
  }

  simCep.addEventListener('input', () => { simCep.value = mascaras.cep(simCep.value.replace(/\D/g, '')); });
  simCep.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); simular(); } });
  $('#sim-calcular').addEventListener('click', simular);
  $('#sim-opcoes').addEventListener('change', (e) => {
    if (e.target.name !== 'sim-modalidade') return;
    modalidade = e.target.value;
    renderCarrinho();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      cliente = validarCliente(Object.fromEntries(new FormData(form)));
      if (!opcoesDe(cliente.cep)) return ($('#dados-erro').textContent = 'Aguarde o cálculo do frete.');
      $('#dados-erro').textContent = '';
      pagar();
    } catch (err) {
      $('#dados-erro').textContent = err.message;
    }
  });

  // ---------- Pagamento (link do Checkout InfinitePay) ----------
  async function pagar() {
    const botao = $('#ir-pagar');
    const texto = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Gerando pagamento…';
    try {
      const r = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: carrinho, cliente, modalidade }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok || !dados.url) throw new Error(dados.erro || 'Não foi possível gerar o pagamento. Tente de novo.');
      location.href = dados.url;
    } catch (e) {
      $('#dados-erro').textContent = e.message;
      botao.disabled = false;
      botao.textContent = texto;
    }
  }

  // ---------- Volta da InfinitePay ----------
  // Depois de pagar, a InfinitePay manda o cliente de volta com order_nsu, transaction_nsu e slug.
  // O servidor confere com a InfinitePay se o pagamento foi mesmo aprovado.
  async function conferirRetorno() {
    const q = new URLSearchParams(location.search);
    const pedido = q.get('order_nsu'), transacao = q.get('transaction_nsu'), slug = q.get('slug');
    if (!pedido || !transacao || !slug) return;
    history.replaceState(null, '', location.pathname);
    abrirCarrinho();
    irPara('resultado');
    $('#resultado').innerHTML = '<p class="carregando">Confirmando pagamento…</p>';

    let s = {};
    try {
      s = await (await fetch('/api/status?' + new URLSearchParams({ order_nsu: pedido, transaction_nsu: transacao, slug }))).json();
    } catch {}

    const whats = (msg) => `<a class="btn btn--whats" href="${linkWhats(msg)}" target="_blank" rel="noopener">Falar no WhatsApp</a>`;
    if (s.pago) {
      carrinho = [];
      salvar();
      const recibo = q.get('receipt_url') || '';
      const metodo = s.metodo === 'pix' ? ' · Pix' : s.metodo ? ' · Cartão' : '';
      $('#resultado').innerHTML = `<div class="resultado resultado--ok">
        <div class="resultado__icone">✓</div>
        <h3>Pagamento aprovado!</h3>
        <p>Pedido <b>${esc(pedido)}</b>${s.valor ? ` · ${brl(s.valor)}` : ''}${metodo}</p>
        <p>Recebemos seu pedido! Assim que a camisa for postada, mandamos o código de rastreio no seu WhatsApp.</p>
        ${/^https:\/\//.test(recibo) ? `<a class="btn btn--fantasma" href="${esc(recibo)}" target="_blank" rel="noopener">Ver comprovante</a>` : ''}
        ${whats(`Olá! Paguei o pedido ${pedido} no site e quero acompanhar a entrega.`)}
      </div>`;
    } else {
      $('#resultado').innerHTML = `<div class="resultado resultado--erro">
        <div class="resultado__icone">!</div>
        <h3>Pagamento não confirmado</h3>
        <p>Ainda não identificamos o pagamento do pedido <b>${esc(pedido)}</b>. Se você já pagou, chama a gente no WhatsApp com o número do pedido.</p>
        ${whats(`Olá! Fiz o pagamento do pedido ${pedido} e o site não confirmou.`)}
      </div>`;
    }
  }

  // ---------- Gaveta ----------
  const gaveta = $('#gaveta'), sombra = $('#sombra');
  function abrirCarrinho() {
    if (etapa === 'resultado') irPara('carrinho');
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
    if (c && !esgotado(produto(c.dataset.id))) abrirProduto(c.dataset.id);
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
  $('#ano').textContent = new Date().getFullYear();
  renderChips();

  Promise.all([carregarProdutos(), carregarFrete()])
    .then(([lista, frete]) => {
      produtos = lista;
      tabelaFrete = frete;
      // Descarta do carrinho salvo o que saiu do catálogo
      carrinho = carrinho.filter((i) => produto(i.id) && tamanhosDe(produto(i.id)).includes(i.tamanho));
      const destaque = produtos.slice(0, 2);
      $('#hero-camisas').innerHTML = destaque.map((p) => `<div class="hero__camisa">${midia(p)}</div>`).join('');
      renderGrade();
      salvar();
      conferirRetorno();
    })
    .catch(() => {
      $('#grade').innerHTML = '<p class="vazio">Não foi possível carregar as camisas. Atualize a página para tentar de novo.</p>';
    });
})();
