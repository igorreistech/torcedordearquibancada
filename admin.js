(() => {
  const $ = (s) => document.querySelector(s);
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const CHAVE_SENHA = 'tda-admin';

  let senha = '';
  try { senha = sessionStorage.getItem(CHAVE_SENHA) || ''; } catch {}
  let produtos = [];
  let busca = '';
  let loja = CONFIG_LOJA_PADRAO; // categorias e tabela de preços

  // ---------- API ----------
  async function api(metodo, caminho, corpo) {
    const r = await fetch(caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'x-admin-senha': encodeURIComponent(senha) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const dados = await r.json().catch(() => ({}));
    if (r.status === 401) sair();
    if (!r.ok) throw new Error(dados.erro || `Erro ${r.status}`);
    return dados;
  }

  async function salvarTudo(nova) {
    const { produtos: salvos } = await api('PUT', '/api/admin/produtos', { produtos: nova });
    produtos = salvos;
    renderLista();
    aviso('Salvo ✓ — o site atualiza em até 2 minutos');
  }

  // ---------- Login ----------
  async function entrar() {
    try {
      produtos = (await api('GET', '/api/admin/produtos')).produtos;
      loja = (await api('GET', '/api/admin/loja')).loja;
      renderCategoriasSelect();
      renderTabelaChips();
      try { sessionStorage.setItem(CHAVE_SENHA, senha); } catch {}
      $('#login').hidden = true;
      $('#painel').hidden = false;
      $('#sair').hidden = false;
      renderLista();
    } catch (e) {
      $('#login').hidden = false;
      $('#login-erro').textContent = senha ? e.message : '';
    }
  }

  function sair() {
    senha = '';
    try { sessionStorage.removeItem(CHAVE_SENHA); } catch {}
    $('#painel').hidden = true;
    $('#sair').hidden = true;
    $('#login').hidden = false;
  }

  $('#login').addEventListener('submit', (e) => {
    e.preventDefault();
    senha = e.target.senha.value;
    $('#login-erro').textContent = '';
    entrar();
  });
  $('#sair').addEventListener('click', sair);

  // ---------- Lista ----------
  const categoria = (id) => loja.categorias.find((c) => c.id === id)?.nome || '—';
  const capa = (p) =>
    p.fotos?.length
      ? `<img src="${esc(p.fotos[0])}" alt="">`
      : `<span class="adm-amostra" style="background:linear-gradient(135deg, ${p.cores[0]} 0 50%, ${p.cores[1]} 50%)"></span>`;

  function textoEstoque(p) {
    if (!p.estoque) return 'sob encomenda';
    const total = p.estoque.reduce((s, e) => s + e.qtd, 0);
    if (!total) return '<b>esgotada</b>';
    return `${total} peça${total > 1 ? 's' : ''} (${p.estoque.filter((e) => e.qtd).map((e) => `${esc(e.tamanho)}: ${e.qtd}`).join(', ')})`;
  }

  function renderLista() {
    const ativos = produtos.filter((p) => p.ativo !== false).length;
    $('#contagem').textContent = `${produtos.length} camisas · ${ativos} visíveis no site`;
    const termo = normalizar(busca.trim());
    const linhas = produtos
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => normalizar(`${p.nome} ${p.temporada} ${p.versao}`).includes(termo));
    $('#lista').innerHTML = linhas.length
      ? linhas
          .map(({ p, i }) => `<div class="adm-item${p.ativo === false ? ' adm-item--oculto' : ''}" data-i="${i}">
            <div class="adm-item__capa">${capa(p)}</div>
            <div class="adm-item__info">
              <strong>${esc(p.nome)} <span>${esc(p.temporada)}</span></strong>
              <small>${esc(categoria(p.categoria))} · ${esc(p.versao)} · ${p.fotos?.length || 0} foto(s) · ${textoEstoque(p)}${p.ativo === false ? ' · <b>oculta</b>' : ''}</small>
            </div>
            <div class="adm-item__preco">${p.precoAntigo ? `<s>${brl(p.precoAntigo)}</s>` : ''}<strong>${brl(p.preco)}</strong></div>
            <div class="adm-item__acoes">
              <button data-acao="subir" title="Mover para cima" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button data-acao="descer" title="Mover para baixo" ${i === produtos.length - 1 ? 'disabled' : ''}>↓</button>
              <button data-acao="visivel" title="${p.ativo === false ? 'Mostrar no site' : 'Esconder do site'}">${p.ativo === false ? '🙈' : '👁'}</button>
              <button data-acao="editar" class="adm-editar">Editar</button>
              <button data-acao="excluir" title="Excluir" class="adm-excluir">🗑</button>
            </div>
          </div>`)
          .join('')
      : '<p class="vazio">Nenhuma camisa. Clique em “Nova camisa” para cadastrar.</p>';
  }

  $('#adm-busca').addEventListener('input', (e) => { busca = e.target.value; renderLista(); });

  $('#lista').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const i = Number(btn.closest('[data-i]').dataset.i);
    const p = produtos[i];
    const nova = [...produtos];
    switch (btn.dataset.acao) {
      case 'editar': return abrirEditor(i);
      case 'subir': [nova[i - 1], nova[i]] = [nova[i], nova[i - 1]]; break;
      case 'descer': [nova[i + 1], nova[i]] = [nova[i], nova[i + 1]]; break;
      case 'visivel': nova[i] = { ...p, ativo: p.ativo === false }; break;
      case 'excluir':
        if (!confirm(`Excluir "${p.nome} ${p.temporada}"? As fotos dela também serão apagadas.`)) return;
        nova.splice(i, 1);
        break;
    }
    document.querySelectorAll('.adm-item__acoes button').forEach((b) => { b.disabled = true; });
    try { await salvarTudo(nova); } catch (err) { aviso(err.message); renderLista(); }
  });

  // ---------- Editor ----------
  const editor = $('#editor');
  const form = $('#form-produto');
  let editando = -1; // índice, ou -1 para nova
  let fotos = [];
  let enviando = 0;

  $('#padrao').innerHTML = PADROES.map((p) => `<option value="${p.id}">${p.nome}</option>`).join('');
  // Linhas "Tamanho | Quantidade" do estoque
  const linhaEstoque = (tamanho = '', qtd = '') => `<div class="adm-estoque__linha">
      <input name="est-tam" value="${esc(tamanho)}" placeholder="Tamanho" maxlength="8" aria-label="Tamanho">
      <input name="est-qtd" type="number" value="${esc(qtd)}" placeholder="Qtd." min="0" max="9999" step="1" inputmode="numeric" aria-label="Quantidade">
      <button type="button" class="adm-estoque__tirar" aria-label="Remover tamanho">×</button>
    </div>`;
  const preencherEstoque = (linhas) => { $('#estoque').innerHTML = linhas.map((e) => linhaEstoque(e.tamanho, e.qtd)).join(''); };
  const mostrarEstoque = () => {
    const encomenda = form.encomenda.checked;
    $('#estoque-area').hidden = encomenda;
    $('#estoque-ajuda').textContent = encomenda
      ? `Vende sem limite, nos tamanhos ${LOJA.tamanhos.join(', ')}.`
      : 'Informe cada tamanho e quantas peças tem. Tamanho com 0 aparece esgotado no site. O estoque baixa sozinho a cada venda paga.';
  };
  $('#encomenda').addEventListener('change', mostrarEstoque);
  $('#mais-tamanho').addEventListener('click', () => {
    $('#estoque').insertAdjacentHTML('beforeend', linhaEstoque());
    $('#estoque').lastElementChild.querySelector('input').focus();
  });
  $('#estoque-area').addEventListener('click', (e) => {
    if (e.target.closest('.adm-estoque__tirar')) e.target.closest('.adm-estoque__linha').remove();
    const grade = e.target.closest('[data-grade]');
    if (grade) {
      const atuais = Object.fromEntries(lerLinhasEstoque().map((x) => [x.tamanho, x.qtd]));
      preencherEstoque(grade.dataset.grade.split(',').map((t) => ({ tamanho: t, qtd: atuais[t] ?? '' })));
    }
  });
  const lerLinhasEstoque = () =>
    [...document.querySelectorAll('.adm-estoque__linha')]
      .map((l) => ({ tamanho: l.querySelector('[name=est-tam]').value.trim().toUpperCase(), qtd: l.querySelector('[name=est-qtd]').value }))
      .filter((x) => x.tamanho);
  $('#tags').innerHTML = TAGS.map((t) => `<label class="check"><input type="checkbox" name="tag" value="${t.id}"> ${t.nome}</label>`).join('');

  const paraNumero = (v) => Number(String(v).replace(/\./g, '').replace(',', '.'));
  const paraTexto = (v) => (v == null ? '' : String(v).replace('.', ','));

  // Versões: as padrão, as que já estão em uso nas camisas e as cadastradas agora
  const VERSOES_PADRAO = ['Torcedor', 'Jogador', 'Feminina'];
  const versoesNovas = [];
  const NOVA = '__nova';

  function renderVersoes(atual) {
    const lista = [...new Set([...VERSOES_PADRAO, ...produtos.map((p) => p.versao).filter(Boolean), ...versoesNovas])];
    if (atual && !lista.includes(atual)) lista.push(atual);
    $('#versao').innerHTML = lista.map((v) => `<option>${esc(v)}</option>`).join('') + `<option value="${NOVA}">+ Cadastrar nova versão…</option>`;
    $('#versao').value = atual || lista[0];
    $('#nova-versao').hidden = true;
  }

  function adicionarVersao() {
    const nome = $('#nova-versao-nome').value.trim();
    if (!nome) return $('#nova-versao-nome').focus();
    const versao = nome[0].toUpperCase() + nome.slice(1);
    versoesNovas.push(versao);
    renderVersoes(versao);
  }

  $('#versao').addEventListener('change', () => {
    if ($('#versao').value !== NOVA) return ($('#nova-versao').hidden = true);
    $('#nova-versao').hidden = false;
    $('#nova-versao-nome').value = '';
    $('#nova-versao-nome').focus();
  });
  $('#nova-versao-ok').addEventListener('click', adicionarVersao);
  $('#nova-versao-nome').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); adicionarVersao(); }
  });

  // Personalização: em branco usa o padrão da loja (LOJA.precoPersonalizacao)
  function atualizarPersonalizacao() {
    $('#campo-personalizacao').hidden = !form.personalizavel.checked;
    form.precoPersonalizacao.placeholder = `Em branco = padrão: ${brl(LOJA.precoPersonalizacao)}`;
  }
  form.personalizavel.addEventListener('change', atualizarPersonalizacao);

  // Atalhos da tabela de preços (cadastrada no botão "Tabela e categorias")
  const GRADES = { infantil: ['2', '4', '6', '8', '10', '12', '14', '16'], feminina: ['P', 'M', 'G', 'GG'] };

  function renderTabelaChips() {
    $('#tabela-precos').innerHTML = loja.tabelaPrecos.length
      ? '<p class="ajuda">Tabela de preços (clique para preencher):</p>' + loja.tabelaPrecos
        .map((t, n) => `<button type="button" class="adm-chip" data-tabela="${n}">${esc(t.nome)} · <b>${precoTabela(t)}</b>${t.precoPersonalizada ? ` · personalizada <b>${brl(t.precoPersonalizada)}</b>` : ''}</button>`)
        .join('')
      : '';
  }

  $('#tabela-precos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tabela]');
    if (!b) return;
    const t = loja.tabelaPrecos[b.dataset.tabela];
    document.querySelectorAll('[data-tabela]').forEach((x) => x.classList.toggle('ativo', x === b));
    if (t.versao) renderVersoes(t.versao);
    if (t.temporada) form.temporada.value = t.temporada;
    if (t.categoria && loja.categorias.some((c) => c.id === t.categoria)) form.categoria.value = t.categoria;
    if (t.promocao) form.querySelector('[name=tag][value=promocao]').checked = true;
    // Grade de tamanhos pela versão, só se nenhuma quantidade foi preenchida ainda
    const grade = GRADES[normalizar(t.versao || '')];
    if (grade && !form.encomenda.checked && lerLinhasEstoque().every((x) => x.qtd === '')) {
      preencherEstoque(grade.map((tamanho) => ({ tamanho, qtd: '' })));
    }
    if (t.preco) {
      form.preco.value = paraTexto(t.preco);
      form.preco.placeholder = 'Ex.: 145,00';
    } else {
      form.preco.value = '';
      form.preco.placeholder = `De ${paraTexto(t.precoDe)} a ${paraTexto(t.precoAte)}`;
      form.preco.focus();
    }
    // "Personalizada R$ 220" com preço R$ 170 → personalização de R$ 50 nesta camisa
    if (t.precoPersonalizada && t.preco) {
      form.personalizavel.checked = true;
      form.precoPersonalizacao.value = paraTexto(t.precoPersonalizada - t.preco);
      atualizarPersonalizacao();
    }
  });

  function abrirEditor(i) {
    editando = i;
    const p = produtos[i] || { categoria: loja.categorias[0].id, versao: 'Torcedor', cores: ['#ffffff', '#111111', '#111111'], padrao: 'solido', tags: [], fotos: [], ativo: true };
    $('#editor-titulo').textContent = i < 0 ? 'Nova camisa' : 'Editar camisa';
    form.reset();
    form.nome.value = p.nome || '';
    form.temporada.value = p.temporada || '';
    renderVersoes(p.versao || 'Torcedor');
    form.categoria.value = p.categoria;
    form.preco.value = paraTexto(p.preco);
    form.precoAntigo.value = paraTexto(p.precoAntigo);
    form.preco.placeholder = 'Ex.: 145,00';
    document.querySelectorAll('[data-tabela]').forEach((x) => x.classList.remove('ativo'));
    form.ativo.checked = p.ativo !== false;
    form.personalizavel.checked = p.personalizavel !== false;
    form.precoPersonalizacao.value = paraTexto(p.precoPersonalizacao ?? null);
    atualizarPersonalizacao();
    form.querySelectorAll('[name=tag]').forEach((c) => { c.checked = p.tags.includes(c.value); });
    p.cores.forEach((cor, n) => { form[`cor${n}`].value = cor; });
    form.padrao.value = p.padrao;
    // Camisa nova começa com a grade adulta para preencher; camisa antiga sem estoque é sob encomenda.
    form.encomenda.checked = i >= 0 && !p.estoque;
    preencherEstoque(p.estoque || LOJA.tamanhos.map((t) => ({ tamanho: t, qtd: '' })));
    mostrarEstoque();
    fotos = [...(p.fotos || [])];
    $('#envio-status').textContent = '';
    $('#editor-erro').textContent = '';
    renderFotos();
    editor.showModal();
  }

  function renderFotos() {
    $('#fotos').innerHTML = fotos
      .map((u, n) => `<div class="adm-foto" data-n="${n}">
        <img src="${esc(u)}" alt="">
        ${n === 0 ? '<span class="adm-foto__capa">Capa</span>' : ''}
        <div class="adm-foto__acoes">
          <button type="button" data-foto="esq" ${n === 0 ? 'disabled' : ''} aria-label="Mover para a esquerda">←</button>
          <button type="button" data-foto="tirar" aria-label="Remover foto">×</button>
          <button type="button" data-foto="dir" ${n === fotos.length - 1 ? 'disabled' : ''} aria-label="Mover para a direita">→</button>
        </div>
      </div>`)
      .join('');
    $('.adm-enviar').hidden = fotos.length >= 8;
  }

  $('#fotos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-foto]');
    if (!b) return;
    const n = Number(b.closest('[data-n]').dataset.n);
    if (b.dataset.foto === 'tirar') fotos.splice(n, 1);
    if (b.dataset.foto === 'esq') [fotos[n - 1], fotos[n]] = [fotos[n], fotos[n - 1]];
    if (b.dataset.foto === 'dir') [fotos[n + 1], fotos[n]] = [fotos[n], fotos[n + 1]];
    renderFotos();
  });

  // Reduz a foto no navegador (máx. 1400 px, JPEG) antes de enviar.
  async function reduzir(arquivo) {
    const bmp = await createImageBitmap(arquivo);
    const escala = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const tela = document.createElement('canvas');
    tela.width = Math.round(bmp.width * escala);
    tela.height = Math.round(bmp.height * escala);
    tela.getContext('2d').drawImage(bmp, 0, 0, tela.width, tela.height);
    const blob = await new Promise((ok) => tela.toBlob(ok, 'image/jpeg', 0.85));
    const url = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
    return url.split(',')[1];
  }

  $('#arquivos').addEventListener('change', async (e) => {
    const arquivos = [...e.target.files].slice(0, 8 - fotos.length);
    e.target.value = '';
    for (const arq of arquivos) {
      enviando++;
      $('#envio-status').textContent = `Enviando ${arq.name}…`;
      try {
        const { url } = await api('POST', '/api/admin/upload', { tipo: 'image/jpeg', dados: await reduzir(arq) });
        fotos.push(url);
        renderFotos();
        $('#envio-status').textContent = '';
      } catch (err) {
        $('#envio-status').textContent = `Não foi possível enviar ${arq.name}: ${err.message || 'formato não suportado'}`;
      } finally {
        enviando--;
      }
    }
  });

  function slug(t) {
    return normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return ($('#editor-erro').textContent = 'Aguarde terminar o envio das fotos.');
    if (form.versao.value === NOVA) {
      if (!$('#nova-versao-nome').value.trim()) return ($('#editor-erro').textContent = 'Digite o nome da nova versão e clique em Adicionar.');
      adicionarVersao();
    }
    const atual = produtos[editando];
    const dados = {
      id: atual?.id || `${slug(`${form.nome.value} ${form.temporada.value}`) || 'camisa'}-${Math.random().toString(36).slice(2, 6)}`,
      nome: form.nome.value,
      temporada: form.temporada.value,
      versao: form.versao.value,
      categoria: form.categoria.value,
      preco: paraNumero(form.preco.value),
      precoAntigo: form.precoAntigo.value.trim() ? paraNumero(form.precoAntigo.value) : null,
      tags: [...form.querySelectorAll('[name=tag]:checked')].map((c) => c.value),
      cores: [form.cor0.value, form.cor1.value, form.cor2.value],
      padrao: form.padrao.value,
      fotos,
      ativo: form.ativo.checked,
      personalizavel: form.personalizavel.checked,
      precoPersonalizacao: form.precoPersonalizacao.value.trim() ? paraNumero(form.precoPersonalizacao.value) : null,
      estoque: form.encomenda.checked ? null : lerLinhasEstoque(),
    };
    if (!form.encomenda.checked) {
      const linhas = lerLinhasEstoque();
      if (!linhas.length) return ($('#editor-erro').textContent = 'Adicione pelo menos um tamanho, ou marque "Sob encomenda".');
      if (linhas.some((x) => x.qtd === '')) return ($('#editor-erro').textContent = 'Informe a quantidade de cada tamanho (use 0 se não tiver).');
      if (new Set(linhas.map((x) => x.tamanho)).size !== linhas.length) return ($('#editor-erro').textContent = 'Há tamanhos repetidos.');
    }
    let produto;
    try { produto = validarProduto(dados, loja.categorias); } catch (err) { return ($('#editor-erro').textContent = err.message); }

    const nova = [...produtos];
    if (editando < 0) nova.unshift(produto);
    else nova[editando] = produto;
    $('#salvar').disabled = true;
    try {
      await salvarTudo(nova);
      editor.close();
    } catch (err) {
      $('#editor-erro').textContent = err.message;
    } finally {
      $('#salvar').disabled = false;
    }
  });

  $('#nova').addEventListener('click', () => abrirEditor(-1));
  $('#fechar-editor').addEventListener('click', () => editor.close());
  $('#cancelar').addEventListener('click', () => editor.close());

  // ---------- Tabela de preços e categorias ----------
  const dlgLoja = $('#dlg-loja');
  const formLoja = $('#form-loja');
  const precoTabela = (t) => (t.preco ? brl(t.preco) : `${brl(t.precoDe)} a ${brl(t.precoAte)}`);

  function renderCategoriasSelect() {
    const atual = form.categoria.value;
    $('#categoria').innerHTML = loja.categorias.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');
    if (loja.categorias.some((c) => c.id === atual)) form.categoria.value = atual;
  }

  const linhaCategoria = (c = {}) => `<div class="adm-linha-cat" data-id="${esc(c.id || '')}">
      <input data-c="nome" value="${esc(c.nome || '')}" placeholder="Nome da categoria" maxlength="30" aria-label="Nome da categoria">
      <button type="button" class="adm-estoque__tirar" data-tirar aria-label="Remover">×</button>
    </div>`;

  // Categorias como estão na janela (as novas ganham o id pelo nome)
  const categoriasDaJanela = () => [...document.querySelectorAll('.adm-linha-cat')]
    .map((l) => ({ id: l.dataset.id || slug(l.querySelector('[data-c=nome]').value), nome: l.querySelector('[data-c=nome]').value.trim() }))
    .filter((c) => c.nome);

  const opcoesCategoria = (atual) => '<option value="">Qualquer categoria</option>' + categoriasDaJanela()
    .map((c) => `<option value="${esc(c.id)}" ${c.id === atual ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');

  const linhaTabela = (t = {}) => `<div class="adm-linha-tab">
      <input data-c="nome" value="${esc(t.nome || '')}" placeholder="Nome (ex.: Temporada 26/27 · Torcedor)" maxlength="40" aria-label="Nome">
      <label>Preço<input data-c="preco" value="${esc(t.preco ? paraTexto(t.preco) : t.precoDe ? `${paraTexto(t.precoDe)} a ${paraTexto(t.precoAte)}` : '')}" placeholder="145 ou 90 a 140"></label>
      <label>Personalizada<input data-c="precoPersonalizada" value="${esc(paraTexto(t.precoPersonalizada ?? null))}" placeholder="opcional" inputmode="decimal"></label>
      <label>Versão<input data-c="versao" value="${esc(t.versao || '')}" placeholder="opcional" maxlength="20"></label>
      <label>Temporada<input data-c="temporada" value="${esc(t.temporada || '')}" placeholder="opcional" maxlength="12"></label>
      <label>Categoria<select data-c="categoria">${opcoesCategoria(t.categoria)}</select></label>
      <label class="check"><input type="checkbox" data-c="promocao" ${t.promocao ? 'checked' : ''}> Promoção</label>
      <button type="button" class="adm-estoque__tirar" data-tirar aria-label="Remover">×</button>
    </div>`;

  function atualizarSelectsCategoria() {
    document.querySelectorAll('.adm-linha-tab [data-c=categoria]').forEach((s) => {
      const atual = s.value;
      s.innerHTML = opcoesCategoria(atual);
    });
  }

  $('#abrir-loja').addEventListener('click', () => {
    $('#lista-categorias').innerHTML = loja.categorias.map(linhaCategoria).join('');
    $('#lista-tabela').innerHTML = loja.tabelaPrecos.map(linhaTabela).join('');
    $('#loja-erro').textContent = '';
    dlgLoja.showModal();
  });
  document.querySelectorAll('[data-fechar-loja]').forEach((b) => b.addEventListener('click', () => dlgLoja.close()));
  $('#mais-categoria').addEventListener('click', () => {
    $('#lista-categorias').insertAdjacentHTML('beforeend', linhaCategoria());
    $('#lista-categorias').lastElementChild.querySelector('input').focus();
  });
  $('#mais-tabela').addEventListener('click', () => {
    $('#lista-tabela').insertAdjacentHTML('beforeend', linhaTabela());
    $('#lista-tabela').lastElementChild.querySelector('input').focus();
  });
  formLoja.addEventListener('click', (e) => {
    const x = e.target.closest('[data-tirar]');
    if (!x) return;
    x.parentElement.remove();
    atualizarSelectsCategoria();
  });
  $('#lista-categorias').addEventListener('change', atualizarSelectsCategoria);

  formLoja.addEventListener('submit', async (e) => {
    e.preventDefault();
    const valor = (l, c) => l.querySelector(`[data-c=${c}]`).value.trim();
    const tabelaPrecos = [...document.querySelectorAll('.adm-linha-tab')].map((l) => {
      const preco = valor(l, 'preco');
      const faixa = preco.match(/^([\d.,]+)\s*(?:a|-|até)\s*([\d.,]+)$/i);
      return {
        nome: valor(l, 'nome'),
        ...(faixa ? { precoDe: paraNumero(faixa[1]), precoAte: paraNumero(faixa[2]) } : { preco: preco ? paraNumero(preco) : null }),
        precoPersonalizada: valor(l, 'precoPersonalizada') ? paraNumero(valor(l, 'precoPersonalizada')) : null,
        versao: valor(l, 'versao'),
        temporada: valor(l, 'temporada'),
        categoria: l.querySelector('[data-c=categoria]').value,
        promocao: l.querySelector('[data-c=promocao]').checked,
      };
    });
    const dados = { categorias: categoriasDaJanela(), tabelaPrecos };
    try { validarLoja(dados); } catch (err) { return ($('#loja-erro').textContent = err.message); }
    try {
      loja = (await api('PUT', '/api/admin/loja', { loja: dados })).loja;
      renderCategoriasSelect();
      renderTabelaChips();
      renderLista();
      dlgLoja.close();
      aviso('Salvo ✓ — o site atualiza em até 1 minuto');
    } catch (err) {
      $('#loja-erro').textContent = err.message;
    }
  });

  // ---------- Frete ----------
  const dlgFrete = $('#dlg-frete');
  const formFrete = $('#form-frete');
  $('#abrir-frete').addEventListener('click', async () => {
    try {
      const { frete } = await api('GET', '/api/admin/frete');
      for (const campo of ['peso', 'largura', 'altura', 'comprimento']) formFrete[campo].value = frete[campo];
      formFrete.acrescimo.value = frete.acrescimo ? paraTexto(frete.acrescimo) : '';
      formFrete.gratis.value = frete.gratisAPartirDe || 0;
      formFrete.soNoEstado.checked = frete.gratisSoNoEstado !== false;
      formFrete.semPromocao.checked = frete.gratisSemPromocao !== false;
      $('#frete-erro').textContent = '';
      dlgFrete.showModal();
    } catch (e) {
      aviso(e.message);
    }
  });
  document.querySelectorAll('[data-fechar-frete]').forEach((b) => b.addEventListener('click', () => dlgFrete.close()));

  formFrete.addEventListener('submit', async (e) => {
    e.preventDefault();
    const campo = (nome) => formFrete[nome].value.trim();
    const dados = {
      gratisAPartirDe: campo('gratis'),
      gratisSoNoEstado: formFrete.soNoEstado.checked,
      gratisSemPromocao: formFrete.semPromocao.checked,
      acrescimo: campo('acrescimo').replace(/^R\$\s*/, ''),
      peso: campo('peso'),
      largura: campo('largura'),
      altura: campo('altura'),
      comprimento: campo('comprimento'),
    };
    try { validarFrete(dados); } catch (err) { return ($('#frete-erro').textContent = err.message); }
    try {
      await api('PUT', '/api/admin/frete', { frete: dados });
      dlgFrete.close();
      aviso('Frete salvo ✓');
    } catch (err) {
      $('#frete-erro').textContent = err.message;
    }
  });

  // ---------- Aviso ----------
  let timerAviso;
  function aviso(texto) {
    const el = $('#aviso');
    el.textContent = texto;
    el.classList.add('visivel');
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => el.classList.remove('visivel'), 3500);
  }

  if (senha) entrar();
  else $('#login').hidden = false;
})();
