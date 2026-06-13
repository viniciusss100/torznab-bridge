import { Providers } from '../lib/filter.js';
import { SOURCE_OPTIONS } from './source.js';

export function renderConfigurePage({
  selectedProviders = [],
  selectedSources = [],
  baseUrl = '',
  saved = false,
  configPath = '',
} = {}) {
  const selected = new Set(selectedProviders);
  const selectedSourceSet = new Set(selectedSources);
  const providerButtons = Providers.options.map(provider => {
    const isSelected = selected.has(provider.key);
    const badge = provider.foreign ? `<span class="flag">${escapeHtml(provider.foreign)}</span>` : '';
    return `
      <label class="provider-pill${isSelected ? ' active' : ''}">
        <input type="checkbox" name="providers" value="${escapeHtml(provider.key)}"${isSelected ? ' checked' : ''}>
        ${badge}<span>${escapeHtml(provider.label)}</span>
      </label>
    `;
  }).join('');
  const sourceButtons = SOURCE_OPTIONS.map(source => {
    const isSelected = selectedSourceSet.has(source.key);
    return `
      <label class="source-card${isSelected ? ' active' : ''}">
        <input type="checkbox" name="sources" value="${escapeHtml(source.key)}"${isSelected ? ' checked' : ''}>
        <span class="source-title">${escapeHtml(source.label)}</span>
        <span class="source-description">${escapeHtml(source.description)}</span>
      </label>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Torznab Bridge Configuration</title>
  <style>
    :root {
      --bg: #0b1220;
      --panel: #121c30;
      --panel-2: #18243b;
      --text: #e8eefc;
      --muted: #98a7c7;
      --line: rgba(255, 255, 255, 0.1);
      --accent: #00c27a;
      --accent-2: #1a7f5a;
      --shadow: rgba(0, 0, 0, 0.35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background:
        radial-gradient(circle at top, rgba(0, 194, 122, 0.16), transparent 28%),
        linear-gradient(180deg, #08101c 0%, var(--bg) 100%);
      color: var(--text);
      min-height: 100vh;
    }
    .wrap {
      width: min(960px, calc(100% - 32px));
      margin: 32px auto;
      background: rgba(18, 28, 48, 0.92);
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: 0 24px 60px var(--shadow);
      overflow: hidden;
    }
    .hero {
      padding: 28px 28px 20px;
      border-bottom: 1px solid var(--line);
      background: linear-gradient(135deg, rgba(0, 194, 122, 0.12), transparent 50%);
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(1.8rem, 3vw, 2.6rem);
      letter-spacing: -0.03em;
    }
    .muted {
      color: var(--muted);
      line-height: 1.5;
      margin: 0;
    }
    .status {
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(0, 194, 122, 0.12);
      border: 1px solid rgba(0, 194, 122, 0.32);
      color: #c4ffe5;
      font-size: 0.95rem;
    }
    form { padding: 24px 28px 28px; }
    .toolbar, .footer {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font: inherit;
      cursor: pointer;
      transition: transform 120ms ease, opacity 120ms ease, background 120ms ease;
    }
    button:hover { transform: translateY(-1px); }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), #0bb36d);
      color: #042614;
      font-weight: 700;
    }
    .btn-secondary {
      background: var(--panel-2);
      color: var(--text);
      border: 1px solid var(--line);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin: 24px 0;
    }
    .source-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin: 22px 0 8px;
    }
    .section-title {
      margin: 24px 0 8px;
      font-size: 1rem;
      letter-spacing: 0.01em;
    }
    .source-card {
      display: grid;
      gap: 6px;
      padding: 14px 16px;
      border-radius: 18px;
      background: var(--panel-2);
      border: 1px solid transparent;
      cursor: pointer;
    }
    .source-card.active {
      border-color: rgba(0, 194, 122, 0.6);
      box-shadow: inset 0 0 0 1px rgba(0, 194, 122, 0.2);
      background: linear-gradient(135deg, rgba(0, 194, 122, 0.22), rgba(24, 36, 59, 0.96));
    }
    .source-card input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
      margin: 0 0 2px;
    }
    .source-title {
      font-weight: 700;
    }
    .source-description {
      color: var(--muted);
      line-height: 1.35;
      font-size: 0.92rem;
    }
    .provider-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 52px;
      padding: 12px 14px;
      border-radius: 18px;
      background: var(--panel-2);
      border: 1px solid transparent;
      color: var(--text);
      cursor: pointer;
      user-select: none;
    }
    .provider-pill.active {
      border-color: rgba(0, 194, 122, 0.6);
      box-shadow: inset 0 0 0 1px rgba(0, 194, 122, 0.2);
      background: linear-gradient(135deg, rgba(0, 194, 122, 0.22), rgba(24, 36, 59, 0.96));
    }
    .provider-pill input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
      margin: 0;
      flex: 0 0 auto;
    }
    .flag {
      opacity: 0.8;
      font-size: 0.95rem;
    }
    .meta {
      color: var(--muted);
      font-size: 0.92rem;
    }
    code {
      font-family: "SFMono-Regular", Consolas, monospace;
      color: #c5d7ff;
      word-break: break-all;
    }
    a { color: #7acbff; text-decoration: none; }
    @media (max-width: 640px) {
      .wrap { width: min(100%, calc(100% - 18px)); margin: 10px auto; border-radius: 18px; }
      .hero, form { padding-left: 18px; padding-right: 18px; }
      .footer { align-items: flex-start; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>Configuracao do Torznab Bridge</h1>
      <p class="muted">Ative as fontes desejadas e filtre os providers que o bridge deve aceitar. O save persiste a selecao e as proximas buscas ja passam a usar essa combinacao.</p>
      ${saved ? '<div class="status">Configuracao salva com sucesso.</div>' : ''}
    </section>
    <form method="post" action="/configure">
      <div class="toolbar">
        <div class="meta">
          Endpoint atual:
          <a href="${escapeHtml(baseUrl)}/api?t=caps"><code>${escapeHtml(baseUrl)}/api</code></a>
        </div>
        <div class="actions">
          <button class="btn-secondary" type="button" id="sources-default">Fontes padrao</button>
          <button class="btn-secondary" type="button" id="select-all">Selecionar tudo</button>
          <button class="btn-secondary" type="button" id="select-none">Limpar</button>
        </div>
      </div>
      <h2 class="section-title">Fontes</h2>
      <div class="source-grid">${sourceButtons}</div>
      <h2 class="section-title">Providers Torrentio</h2>
      <div class="grid">${providerButtons}</div>
      <div class="footer">
        <div class="meta">Arquivo persistido: <code>${escapeHtml(configPath || 'nao configurado')}</code></div>
        <button class="btn-primary" type="submit">Salvar configuracao</button>
      </div>
    </form>
  </main>
  <script>
    const checkboxes = Array.from(document.querySelectorAll('input[name="providers"]'));
    const sourceCheckboxes = Array.from(document.querySelectorAll('input[name="sources"]'));
    const syncPills = () => {
      for (const checkbox of checkboxes) {
        checkbox.closest('.provider-pill')?.classList.toggle('active', checkbox.checked);
      }
      for (const checkbox of sourceCheckboxes) {
        checkbox.closest('.source-card')?.classList.toggle('active', checkbox.checked);
      }
    };
    document.getElementById('select-all')?.addEventListener('click', () => {
      for (const checkbox of checkboxes) checkbox.checked = true;
      syncPills();
    });
    document.getElementById('select-none')?.addEventListener('click', () => {
      for (const checkbox of checkboxes) checkbox.checked = false;
      syncPills();
    });
    document.getElementById('sources-default')?.addEventListener('click', () => {
      for (const checkbox of sourceCheckboxes) {
        checkbox.checked = checkbox.value === 'stremio' || checkbox.value === 'betor';
      }
      syncPills();
    });
    for (const checkbox of [...checkboxes, ...sourceCheckboxes]) checkbox.addEventListener('change', syncPills);
    syncPills();
  </script>
</body>
</html>`;
}

function escapeHtml(value) {
  return `${value || ''}`
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}
