// Escudo da loja, desenhado em SVG. Preenche todo elemento com [data-escudo].
// Para usar o arquivo original do logo, troque o conteúdo por <img src="img/logo.png">.
(() => {
  let n = 0;

  function escudo() {
    const id = 'esc' + n++;
    const torcida = Array.from({ length: 11 }, (_, i) => {
      const x = 52 + i * 19.6;
      const y = 98 + (i % 2) * 5;
      const bracos = i % 3 === 0
        ? `<path d="M${x - 6} ${y + 10} L${x - 13} ${y - 18} M${x + 6} ${y + 10} L${x + 13} ${y - 18}" stroke="#0b0b0b" stroke-width="4.5" stroke-linecap="round"/>`
        : '';
      return `${bracos}<circle cx="${x}" cy="${y}" r="7.5"/><rect x="${x - 10}" y="${y + 7}" width="20" height="30" rx="8"/>`;
    }).join('');

    return `<svg class="escudo" viewBox="0 0 300 320" role="img" aria-label="Torcedor de Arquibancada 67">
      <defs>
        <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a1f"/><stop offset="1" stop-color="#e65400"/></linearGradient>
        <clipPath id="${id}t"><path d="M150 30 L262 63 L258 122 L42 122 L38 63 Z"/></clipPath>
      </defs>
      <path d="M150 8 L282 48 L272 196 Q256 266 150 312 Q44 266 28 196 L18 48 Z" fill="#0b0b0b" stroke="url(#${id}l)" stroke-width="12" stroke-linejoin="round"/>
      <path d="M150 30 L262 63 L258 122 L42 122 L38 63 Z" fill="url(#${id}l)"/>
      <g clip-path="url(#${id}t)" fill="#0b0b0b">${torcida}</g>
      <g font-family="'Barlow Condensed', Impact, sans-serif" font-weight="800" font-style="italic" text-anchor="middle">
        <text x="150" y="176" font-size="60" fill="#fff" letter-spacing="-1">TORCEDOR</text>
        <path d="M36 190 L264 190 L254 222 L46 222 Z" fill="url(#${id}l)"/>
        <text x="150" y="214" font-size="26" fill="#0b0b0b">DE ARQUIBANCADA</text>
        <text x="150" y="268" font-size="46" fill="#ff7a00">67</text>
      </g>
      <circle cx="150" cy="290" r="11" fill="#fff"/>
      <path d="M150 284 l5.5 4 -2 6.5 h-7 l-2 -6.5 z" fill="#0b0b0b"/>
    </svg>`;
  }

  document.querySelectorAll('[data-escudo]').forEach((el) => { el.innerHTML = escudo(); });
})();
