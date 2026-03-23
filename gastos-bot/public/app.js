// ══════════════════════════════════════════════════════════════════
//  GastosBot — app.js
// ══════════════════════════════════════════════════════════════════

// ── State ──────────────────────────────────────────────────────────
const state = {
  month: new Date().getMonth() + 1,
  year:  new Date().getFullYear(),
  allExpenses: [],   // todos os dados carregados da API
  categories: [],
  salary: { fixed: 3500, variable: 0 },
  monthlySalaries: {}, // { "3-2026": 3500, "4-2026": 4200, ... }
  investPortfolio: {}, // { "3-2026": 6858.93, ... } — saldo total da carteira por mês
  fixedExpenses: [],
  nextId: 1000,
};

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const CAT_ICONS = {
  'MEI':'🏢','Agencia/Ferramentas':'🛠️','Agência/Ferramentas':'🛠️',
  'Fatura Credito PF':'💳','Fatura Crédito PF':'💳',
  'Fatura Credito PJ':'🏦','Fatura Crédito PJ':'🏦',
  'Nubank':'💜','Investimento':'📈','INVESTIMENTO':'📈','Compra de Dolar':'💵','Compra de Dólar':'💵',
  'JAE':'📄','Visto Canada':'✈️','Visto Canadá':'✈️',
  'Alimentacao':'🍔','Alimentação':'🍔','Transporte':'🚗',
  'Saude':'🏥','Saúde':'🏥','Lazer':'🎬','Moradia':'🏠',
  'Assinatura':'📱','Outros':'📦',
};

const PALETTE = [
  '#00d4ff','#a855f7','#00ffa3','#ff4d6d','#ffd60a',
  '#f0abfc','#38bdf8','#fb923c','#4ade80','#e879f9',
  '#67e8f9','#fbbf24','#a3e635','#f472b6','#818cf8','#c084fc',
];

let chartEvo = null;
let chartCat = null;

const LS_EXPENSES   = 'gastosbot_expenses';
const LS_SALARY     = 'gastosbot_salary';
const LS_SHEETS_URL = 'gastosbot_sheets_url';
const LS_SCRIPT_URL = 'gastosbot_script_url';

function saveToStorage() {
  localStorage.setItem(LS_EXPENSES, JSON.stringify(state.allExpenses));
  localStorage.setItem(LS_SALARY,   JSON.stringify(state.salary));
}

// ── Google Sheets ────────────────────────────────────────────────────
function getSheetsUrl()  { return localStorage.getItem(LS_SHEETS_URL) || ''; }
function getScriptUrl()  { return localStorage.getItem(LS_SCRIPT_URL) || ''; }

function extractSheetId(url) {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function buildCsvUrl(sheetsUrl) {
  const id = extractSheetId(sheetsUrl);
  if (!id) return null;
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
}

function parseCSVLine(line) {
  const result = []; let cur = ''; let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function parseMoneyVal(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = String(val).trim().replace(/R\$\s*/g, '').trim();
  if (!s) return 0;
  // Formato brasileiro com milhar: 1.000,00
  if (s.includes(',') && s.includes('.')) return parseFloat(s.replace(/\./g,'').replace(',','.')) || 0;
  // Só vírgula como decimal: 86,05
  if (s.includes(','))  return parseFloat(s.replace(',','.')) || 0;
  // Ponto como decimal (saída do gviz): 86.05
  return parseFloat(s) || 0;
}

const MONTH_MAP = {
  'Março':    {num:3,  year:2026}, 'Marco':    {num:3,  year:2026}, 'março': {num:3,  year:2026},
  'Abril':    {num:4,  year:2026}, 'abril':    {num:4,  year:2026},
  'Maio':     {num:5,  year:2026}, 'maio':     {num:5,  year:2026},
  'Junho':    {num:6,  year:2026}, 'junho':    {num:6,  year:2026},
  'Julho':    {num:7,  year:2026}, 'julho':    {num:7,  year:2026},
  'Agosto':   {num:8,  year:2026}, 'agosto':   {num:8,  year:2026},
  'Setembro': {num:9,  year:2026}, 'setembro': {num:9,  year:2026},
  'Outubro':  {num:10, year:2026}, 'outubro':  {num:10, year:2026},
  'Novembro': {num:11, year:2026}, 'novembro': {num:11, year:2026},
  'Dezembro': {num:12, year:2026}, 'dezembro': {num:12, year:2026},
  'Janeiro':  {num:1,  year:2027}, 'janeiro':  {num:1,  year:2027},
  'Fevereiro':{num:2,  year:2027}, 'fevereiro':{num:2,  year:2027},
};
const CSV_SKIP = ['PAGTOS','MOVIMENTAÇÃO','MOVIMENTACAO','SALÁRIO','SALARIO','SALDO',''];

async function fetchFromSheets(sheetsUrl) {
  let csvUrl;

  if (sheetsUrl.includes('tqx=out:csv') || sheetsUrl.includes('output=csv') || sheetsUrl.includes('/pub?')) {
    csvUrl = sheetsUrl;
  } else {
    const id = extractSheetId(sheetsUrl);
    if (!id) throw new Error('URL inválida — cole o link da sua planilha');
    // gviz/tq funciona para qualquer planilha com acesso "Qualquer pessoa com o link"
    csvUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
  }

  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`Erro ${res.status} — verifique se a planilha está com acesso "Qualquer pessoa com o link"`);
  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Acesso negado — abra a planilha e clique em Compartilhar → "Qualquer pessoa com o link pode visualizar"');
  }
  return parseSheetsCSV(text);
}

function parseSheetsCSV(csvText) {
  console.log('[Sheets] CSV recebido (primeiras linhas):', csvText.split('\n').slice(0,5).join('\n'));

  // Estrutura real da planilha:
  // Col A  (0)  : vazia
  // Col B–M(1–12): valores mensais (Março/2026 → Fevereiro/2027)
  // Col N  (13) : nome da categoria
  // Col P  (15) : label (ex: "Total")
  // Col Q  (16) : valor do salário quando label="Total"
  const MONTH_ORDER = [
    {num:3,year:2026},{num:4,year:2026},{num:5,year:2026},{num:6,year:2026},
    {num:7,year:2026},{num:8,year:2026},{num:9,year:2026},{num:10,year:2026},
    {num:11,year:2026},{num:12,year:2026},{num:1,year:2027},{num:2,year:2027},
  ];

  const SKIP_CATS = new Set([
    'PAGTOS','MOVIMENTAÇÃO','MOVIMENTACAO','SALÁRIO','SALARIO','SALDO',
    'DESCRIÇÃO','DESCRICAO','TOTAL','',
  ]);

  const lines = csvText.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
  const expenses = [];
  let id = 1;
  let salary = { fixed: 3500, variable: 0 };
  const monthlySalaries = {}; // { "3-2026": 3500.01, "4-2026": 3500, ... }
  const investPortfolio = {}; // { "3-2026": 6858.93, ... } — valor total da carteira por mês

  for (const line of lines) {
    const cols = parseCSVLine(line);

    // Detecta salário na coluna Q (índice 16) quando label "Total" está em P (15)
    if (cols[15]?.trim() === 'Total') {
      const v = parseMoneyVal(cols[16]);
      if (v) salary = { fixed: v, variable: 0 };
    }

    // Debug: loga qualquer linha que contenha "salário" em qualquer coluna
    const lineJoined = cols.join('|').toLowerCase();
    if (lineJoined.includes('sal') && lineJoined.includes('rio')) {
      console.log('[Sheets] Linha com SALÁRIO detectada:', JSON.stringify(cols.slice(0, 18)));
    }

    // Verifica SALÁRIO em col[13] (padrão) OU col[0] (algumas planilhas)
    const cat0 = cols[0]?.trim();
    const cat13 = cols[13]?.trim();
    const cat0Norm = (cat0 || '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const cat13Norm = (cat13 || '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const isSalario = cat0Norm === 'SALARIO' || cat13Norm === 'SALARIO';

    if (isSalario) {
      console.log('[Sheets] Linha SALÁRIO encontrada! cols[1-12]:', JSON.stringify(cols.slice(1, 13)));
      for (let c = 1; c <= 12; c++) {
        const v = parseMoneyVal(cols[c]);
        if (v) {
          const m = MONTH_ORDER[c - 1];
          monthlySalaries[`${m.num}-${m.year}`] = v;
        }
      }
      console.log('[Sheets] Salários mensais:', JSON.stringify(monthlySalaries));
      continue;
    }

    const cat = cat13;
    if (!cat) continue;
    const catNormUp = cat13Norm;

    // CARTEIRA = saldo total da carteira, não é gasto — armazenar separado no KPI
    if (catNormUp === 'CARTEIRA') {
      for (let c = 1; c <= 12; c++) {
        const v = parseMoneyVal(cols[c]);
        if (v) {
          const m = MONTH_ORDER[c - 1];
          investPortfolio[`${m.num}-${m.year}`] = v;
        }
      }
      continue;
    }

    if (SKIP_CATS.has(cat) || SKIP_CATS.has(catNormUp)) continue;
    if (cat.length > 50) continue;

    for (let c = 1; c <= 12; c++) {
      const amount = parseMoneyVal(cols[c]);
      if (!amount) continue;
      const m = MONTH_ORDER[c - 1];
      expenses.push({
        id: id++, amount, category: cat, description: cat,
        date: `${m.year}-${String(m.num).padStart(2,'0')}-01`,
        month: m.num, year: m.year,
      });
    }
  }

  console.log('[Sheets] Parsed:', expenses.length, 'gastos, salário:', JSON.stringify(salary), 'salários mensais:', JSON.stringify(monthlySalaries));
  return { expenses, salary, monthlySalaries, investPortfolio };
}

// Escrita via Apps Script usando image trick (sem CORS)
function syncExpenseToSheets(expense) {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) return;
  const total = state.allExpenses
    .filter(e => e.category === expense.category && e.month === expense.month && e.year === expense.year)
    .reduce((s, e) => s + e.amount, 0);
  const exists = state.sheetCategories && state.sheetCategories.includes(expense.category);
  const params = new URLSearchParams({
    action:   exists === false ? 'addRow' : 'update',
    category: expense.category,
    month:    expense.month,
    year:     expense.year,
    amount:   total,
  });
  const img = new Image();
  img.src = scriptUrl + '?' + params.toString();
}

function callSheets(scriptUrl, params) {
  if (!scriptUrl) return;
  const img = new Image();
  img.src = scriptUrl + '?' + new URLSearchParams(params).toString();
}

function updateSheetsPillUI() {
  const pill = document.getElementById('sheetsPill');
  const url  = getSheetsUrl();
  if (!pill) return;
  if (url) {
    pill.textContent = 'Conectado';
    pill.style.background = 'rgba(0,255,163,0.15)';
    pill.style.color = '#00ffa3';
  } else {
    pill.textContent = 'Desconectado';
    pill.style.background = '';
    pill.style.color = '';
  }
  const btnDisc = document.getElementById('btnDisconnectSheets');
  if (btnDisc) btnDisc.style.display = url ? 'block' : 'none';
}

// ── Boot ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  updateMonthLabel();
  renderDashboard();
  bindAll();
  setToday();
  loadApiKeyFromStorage();
});

// ── API ────────────────────────────────────────────────────────────
async function api(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadAll() {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  let localExpenses = [], localSalary = { fixed: 3500, variable: 0 };
  const DEFAULT_CATS = [
    'MEI','Agencia/Ferramentas','Fatura Credito PF','Fatura Credito PJ',
    'Nubank','Investimento','Compra de Dolar','JAE','Visto Canada',
    'Alimentacao','Transporte','Saude','Lazer','Moradia','Assinatura','Outros',
  ];

  if (isLocal) {
    const [exp, cats, sal] = await Promise.all([
      api('/api/expenses').catch(() => []),
      api('/api/categories').catch(() => DEFAULT_CATS),
      api('/api/salary').catch(() => ({ fixed: 3500, variable: 0 })),
    ]);
    localExpenses = exp;
    localSalary   = sal;
    state.categories = cats;
  } else {
    state.categories = DEFAULT_CATS;
  }

  const sheetsUrl = getSheetsUrl();
  if (sheetsUrl) {
    try {
      toast('Sincronizando com Google Sheets...', 'info');
      const sheetData = await fetchFromSheets(sheetsUrl);
      state.allExpenses     = sheetData.expenses || [];
      state.salary          = sheetData.salary   || localSalary;
      state.monthlySalaries = sheetData.monthlySalaries || {};
      state.investPortfolio = sheetData.investPortfolio || {};
      state.sheetCategories = [...new Set(state.allExpenses.map(e => e.category))];
      // Adiciona categorias da planilha que não existem localmente
      state.sheetCategories.forEach(c => { if (!state.categories.includes(c)) state.categories.push(c); });
      saveToStorage();
      toast('Planilha sincronizada!', 'success');
    } catch (err) {
      console.warn('Sheets falhou, usando localStorage:', err);
      toast('Sheets indisponível — usando dados locais', 'error');
      const storedExpenses = localStorage.getItem(LS_EXPENSES);
      const storedSalary   = localStorage.getItem(LS_SALARY);
      state.allExpenses = storedExpenses ? JSON.parse(storedExpenses) : localExpenses;
      state.salary      = storedSalary   ? JSON.parse(storedSalary)   : localSalary;
    }
  } else {
    const storedExpenses = localStorage.getItem(LS_EXPENSES);
    const storedSalary   = localStorage.getItem(LS_SALARY);
    state.allExpenses = storedExpenses ? JSON.parse(storedExpenses) : localExpenses;
    state.salary      = storedSalary   ? JSON.parse(storedSalary)   : localSalary;
  }

  state.nextId = Math.max(...state.allExpenses.map(e => e.id), 999) + 1;
  fillCategorySelects();
  renderDistribution();
}

// ── Helpers ────────────────────────────────────────────────────────
function getMonthExpenses(month, year) {
  return state.allExpenses.filter(e => e.month === month && e.year === year)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getSummary(month, year) {
  const expenses  = getMonthExpenses(month, year);
  const total     = expenses.reduce((s, e) => s + e.amount, 0);
  // Usa salário do mês específico (linha 23 da planilha) se disponível
  const monthlyKey = `${month}-${year}`;
  const salaryFixed = (state.monthlySalaries && state.monthlySalaries[monthlyKey])
    ? state.monthlySalaries[monthlyKey]
    : state.salary.fixed;
  const salary = salaryFixed + (state.salary.variable || 0);
  // Valor da carteira de investimentos no mês selecionado (não é gasto, é indicador separado)
  const monthlyKey2 = `${month}-${year}`;
  const invest = (state.investPortfolio && state.investPortfolio[monthlyKey2]) || 0;
  const byCategory = Object.values(
    expenses.reduce((acc, e) => {
      acc[e.category] = acc[e.category] || { category: e.category, total: 0 };
      acc[e.category].total += e.amount;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  return { total, salary, balance: salary - total, invest, byCategory, count: expenses.length };
}

function getEvolution() {
  const months = {};
  state.allExpenses.forEach(e => {
    const key = `${e.year}-${String(e.month).padStart(2,'0')}`;
    months[key] = (months[key] || 0) + e.amount;
  });
  return Object.entries(months)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-12)
    .map(([k, total]) => {
      const [year, month] = k.split('-');
      return { month: parseInt(month), year: parseInt(year), total };
    });
}

// ── Render Dashboard ───────────────────────────────────────────────
function renderDashboard() {
  const summary   = getSummary(state.month, state.year);
  const evolution = getEvolution();
  const expenses  = getMonthExpenses(state.month, state.year);

  renderKPIs(summary);
  renderEvolution(evolution);
  renderDonut(summary.byCategory);
  renderRecentList(expenses.slice(0, 7));
  renderAllTx(expenses);
}

function renderKPIs(s) {
  setText('statTotal',   'R$ ' + fmt(s.total));
  setText('statSalary',  'R$ ' + fmt(s.salary));
  setText('statBalance', 'R$ ' + fmt(s.balance));
  setText('statInvest',  'R$ ' + fmt(s.invest));
  setText('donutTotal',  'R$ ' + fmtShort(s.total));
  setText('statCount',   s.count.toString());

  const balEl = document.getElementById('statBalance');
  if (balEl) balEl.style.color = s.balance >= 0 ? 'var(--green)' : 'var(--red)';

  const pct = s.salary > 0 ? Math.min((s.total / s.salary) * 100, 100) : 0;
  const bar = document.getElementById('spendBar');
  if (bar) bar.style.width = pct + '%';

  const pctLeft = s.salary > 0 ? ((s.balance / s.salary) * 100).toFixed(0) : 0;
  setText('statBalancePct', `${pctLeft}% do salário disponível`);

  // Variation vs previous month
  const pm = state.month === 1 ? 12 : state.month - 1;
  const py = state.month === 1 ? state.year - 1 : state.year;
  const prev = getSummary(pm, py).total;
  const varEl = document.getElementById('statVariation');
  if (varEl && prev > 0) {
    const v = ((s.total - prev) / prev * 100).toFixed(1);
    varEl.textContent = `${parseFloat(v) > 0 ? '▲' : '▼'} ${Math.abs(v)}% vs mês anterior`;
    varEl.className = `kpi-sub ${parseFloat(v) > 0 ? 'up' : 'down'}`;
  } else if (varEl) {
    varEl.textContent = 'sem dados do mês anterior';
    varEl.className = 'kpi-sub';
  }
}

function renderEvolution(data) {
  const ctx = document.getElementById('chartEvolution')?.getContext('2d');
  if (!ctx) return;
  if (chartEvo) chartEvo.destroy();

  const labels = data.map(d => MONTHS[d.month-1].slice(0,3) + '/' + String(d.year).slice(2));
  const values = data.map(d => d.total);

  chartEvo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Gastos', data: values,
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
          g.addColorStop(0, 'rgba(0,212,255,.7)');
          g.addColorStop(1, 'rgba(121,40,202,.2)');
          return g;
        },
        borderColor: 'rgba(0,212,255,.8)', borderWidth: 1.5,
        borderRadius: 8, borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor:'rgba(10,10,25,.95)', borderColor:'rgba(0,212,255,.2)', borderWidth:1,
          callbacks: { label: c => ` R$ ${fmt(c.parsed.y)}` } },
      },
      scales: {
        x: { grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'rgba(240,240,255,.4)',font:{size:11}} },
        y: { grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'rgba(240,240,255,.4)',font:{size:11},callback:v=>'R$'+fmtShort(v)} },
      },
    },
  });
}

function renderDonut(byCategory) {
  const ctx = document.getElementById('chartCategory')?.getContext('2d');
  if (!ctx) return;
  if (chartCat) chartCat.destroy();

  const labels = byCategory.map(c => c.category);
  const values = byCategory.map(c => c.total);
  const colors = byCategory.map((_, i) => PALETTE[i % PALETTE.length]);

  if (!values.length) { chartCat = null; return; }

  chartCat = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels, datasets: [{ data: values,
        backgroundColor: colors.map(c => c + '33'), borderColor: colors,
        borderWidth: 2, hoverOffset: 8 }],
    },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:'70%',
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor:'rgba(10,10,25,.95)', borderColor:'rgba(0,212,255,.2)', borderWidth:1,
          callbacks: { label: c => ` R$ ${fmt(c.parsed)} — ${c.label}` } },
      },
    },
  });

  const lg = document.getElementById('legend');
  if (lg) lg.innerHTML = byCategory.map((c, i) => `
    <div class="cat-item">
      <span class="cat-dot" style="background:${PALETTE[i%PALETTE.length]};box-shadow:0 0 6px ${PALETTE[i%PALETTE.length]}80"></span>
      <span class="cat-name">${c.category}</span>
      <span class="cat-val">R$ ${fmt(c.total)}</span>
    </div>`).join('');
}

// ── Transaction rendering ──────────────────────────────────────────
function renderRecentList(list) {
  const el = document.getElementById('recentList');
  if (el) { el.innerHTML = list.length ? list.map(txHTML).join('') : emptyState(); bindTxActions(el); }
}

function renderAllTx(list) {
  const el = document.getElementById('transactionsList');
  if (!el) return;
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat    = document.getElementById('filterCategory')?.value || '';
  const filtered = list.filter(e =>
    (!search || (e.description||'').toLowerCase().includes(search) || e.category.toLowerCase().includes(search)) &&
    (!cat || e.category === cat)
  );
  el.innerHTML = filtered.length ? filtered.map(txHTML).join('') : emptyState('Nenhuma transação encontrada.');
  bindTxActions(el);
}

function txHTML(e) {
  const icon  = CAT_ICONS[e.category] || '📦';
  const color = PALETTE[state.categories.indexOf(e.category) % PALETTE.length] || '#00d4ff';
  const date  = e.date ? new Date(e.date + 'T12:00').toLocaleDateString('pt-BR') : '';
  return `
    <div class="tx-item" data-id="${e.id}">
      <div class="tx-icon" style="background:${color}18;box-shadow:0 0 12px ${color}22">${icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${e.description || e.category}</div>
        <div class="tx-meta">
          <span class="tx-date">${date}</span>
          <span class="tx-cat" style="background:${color}18;color:${color};border:1px solid ${color}33">${e.category}</span>
        </div>
      </div>
      <div class="tx-amount">−R$ ${fmt(e.amount)}</div>
      <div class="tx-actions">
        <button class="tx-btn edit" data-id="${e.id}" title="Editar">✏️</button>
        <button class="tx-btn del"  data-id="${e.id}" title="Excluir">🗑️</button>
      </div>
    </div>`;
}

function bindTxActions(container) {
  container.querySelectorAll('.tx-btn.edit').forEach(b => b.addEventListener('click', () => openEdit(+b.dataset.id)));
  container.querySelectorAll('.tx-btn.del').forEach(b  => b.addEventListener('click', () => deleteTx(+b.dataset.id)));
}

function emptyState(msg = 'Nenhum gasto registrado neste mês.') {
  return `<div class="empty"><div class="empty-icon">📭</div><p>${msg}</p></div>`;
}

// ── Fixed expenses ─────────────────────────────────────────────────
function renderFixed() {
  const items = state.fixedExpenses;
  const el    = document.getElementById('fixedList');
  if (!el) return;
  el.innerHTML = items.length ? items.map((f, i) => {
    const color = PALETTE[i % PALETTE.length];
    return `
      <div class="tx-item" data-id="${f.id}">
        <div class="tx-icon" style="background:${color}18">${CAT_ICONS[f.category]||'📦'}</div>
        <div class="tx-info">
          <div class="tx-desc">${f.description}</div>
          <div class="tx-meta"><span class="tx-cat" style="background:${color}18;color:${color};border:1px solid ${color}33">${f.category}</span></div>
        </div>
        <div class="tx-amount" style="color:var(--muted)">R$ ${fmt(f.amount)}</div>
        <div class="tx-actions">
          <button class="tx-btn del" data-id="${f.id}" title="Excluir">🗑️</button>
        </div>
      </div>`;
  }).join('') : emptyState('Nenhum gasto fixo cadastrado.');

  el.querySelectorAll('.tx-btn.del').forEach(b => b.addEventListener('click', () => {
    state.fixedExpenses = state.fixedExpenses.filter(f => f.id !== +b.dataset.id);
    renderFixed();
    toast('Removido!', 'success');
  }));

  const total = items.reduce((s, i) => s + i.amount, 0);
  const ft = document.getElementById('fixedTotal');
  if (ft) ft.innerHTML = `<span>Total mensal fixo</span><span style="color:var(--cyan);font-size:18px;font-weight:800">R$ ${fmt(total)}</span>`;
}

function renderDistribution() {
  const el = document.getElementById('distCards');
  if (!el) return;
  const f = state.salary.fixed, v = state.salary.variable;
  const fGastos = Math.round(f * 0.43), fInvest = Math.round(f * 0.29), fAgencia = f - fGastos - fInvest;
  const vGastos = Math.round(v * 0.25), vInvest = Math.round(v * 0.5), vAgencia = v - vGastos - vInvest;
  el.innerHTML = `
    <div class="dist-card">
      <div class="dist-title">SALÁRIO FIXO</div>
      <div class="dist-row"><span>Gastos Mensal</span><span>R$ ${fmt(fGastos)}</span></div>
      <div class="dist-row"><span>Investimento</span><span>R$ ${fmt(fInvest)}</span></div>
      <div class="dist-row"><span>Agência</span><span>R$ ${fmt(fAgencia)}</span></div>
      <div class="dist-row total"><span>Total</span><span>R$ ${fmt(f)}</span></div>
    </div>
    <div class="dist-card">
      <div class="dist-title">SALÁRIO VARIÁVEL</div>
      <div class="dist-row"><span>Gastos Mensal</span><span>R$ ${fmt(vGastos)}</span></div>
      <div class="dist-row"><span>Investimento</span><span>R$ ${fmt(vInvest)}</span></div>
      <div class="dist-row"><span>Agência</span><span>R$ ${fmt(vAgencia)}</span></div>
      <div class="dist-row total"><span>Total</span><span>R$ ${fmt(v)}</span></div>
    </div>`;
}

// ── Modal ──────────────────────────────────────────────────────────
function openAdd() {
  state.editingId = null;
  setText('modalTitle', 'Novo Gasto');
  clearForm();
  show('modalExpense');
}

function openEdit(id) {
  const e = state.allExpenses.find(x => x.id === id);
  if (!e) return;
  state.editingId = id;
  setText('modalTitle', 'Editar Gasto');
  document.getElementById('inputAmount').value      = e.amount;
  document.getElementById('inputCategory').value    = e.category;
  document.getElementById('inputDescription').value = e.description || '';
  document.getElementById('inputDate').value        = e.date || '';
  show('modalExpense');
}

function clearForm() {
  ['inputAmount','inputDescription'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const cat = document.getElementById('inputCategory'); if (cat) cat.value = '';
  setToday();
}

function saveExpense() {
  const amount      = parseFloat(document.getElementById('inputAmount')?.value);
  const category    = document.getElementById('inputCategory')?.value;
  const description = document.getElementById('inputDescription')?.value || category;
  const dateStr     = document.getElementById('inputDate')?.value || new Date().toISOString().split('T')[0];

  if (!amount || amount <= 0) { toast('Informe um valor válido.', 'error'); return; }
  if (!category)               { toast('Selecione uma categoria.', 'error'); return; }

  const d = new Date(dateStr + 'T12:00');
  if (state.editingId) {
    const idx = state.allExpenses.findIndex(e => e.id === state.editingId);
    if (idx !== -1) state.allExpenses[idx] = { ...state.allExpenses[idx], amount, category, description, date: dateStr, month: d.getMonth()+1, year: d.getFullYear() };
    toast('Gasto atualizado!', 'success');
  } else {
    state.allExpenses.unshift({ id: state.nextId++, amount, category, description, date: dateStr, month: d.getMonth()+1, year: d.getFullYear() });
    toast('Gasto registrado!', 'success');
  }

  hide('modalExpense');
  saveToStorage();
  renderDashboard();
}

function deleteTx(id) {
  if (!confirm('Excluir este gasto?')) return;
  const exp = state.allExpenses.find(e => e.id === id);
  state.allExpenses = state.allExpenses.filter(e => e.id !== id);
  saveToStorage();
  if (exp) syncExpenseToSheets(exp, true);
  toast('Excluído!', 'success');
  renderDashboard();
}

function addExpenseDirect({ amount, category, description, date }) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const d = new Date(dateStr + 'T12:00');
  const expense = { id: state.nextId++, amount, category, description: description || category, date: dateStr, month: d.getMonth()+1, year: d.getFullYear() };
  state.allExpenses.unshift(expense);
  saveToStorage();
  syncExpenseToSheets(expense);
  renderDashboard();
  return expense;
}

// ── Category selects ───────────────────────────────────────────────
function fillCategorySelects() {
  ['inputCategory','fixedCategory','filterCategory'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const first = id === 'filterCategory' ? '<option value="">Todas</option>' : '<option value="">Selecione...</option>';
    el.innerHTML = first + state.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  });
}

// ══════════════════════════════════════════════════════════════════
//  CHATBOT
// ══════════════════════════════════════════════════════════════════

let chatOpen    = false;
let chatHistory = [];   // {role, content}
let chatTyping  = false;

function toggleChat() {
  chatOpen = !chatOpen;
  const panel   = document.getElementById('chatPanel');
  const overlay = document.getElementById('chatOverlay');
  panel.classList.toggle('hidden', !chatOpen);
  overlay.classList.toggle('hidden', !chatOpen);
  if (chatOpen) document.getElementById('chatInput')?.focus();
}

function appendMsg(role, html, isTyping = false) {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = `chat-msg ${role}${isTyping ? ' typing' : ''}`;
  div.innerHTML = `<div class="chat-bubble">${html}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function removeTyping() {
  document.querySelector('.chat-msg.typing')?.remove();
}

async function handleChatMessage(text) {
  if (!text.trim() || chatTyping) return;
  chatTyping = true;

  appendMsg('user', escHtml(text));
  chatHistory.push({ role: 'user', content: text });

  const typing = appendMsg('bot', '<div class="typing-dots"><span></span><span></span><span></span></div>', true);
  document.getElementById('chatSend').disabled = true;

  try {
    const apiKey = localStorage.getItem('anthropic_api_key');
    let response;

    if (apiKey) {
      response = await claudeChat(text, apiKey);
    } else {
      response = await localChat(text);
    }

    removeTyping();
    const botMsg = appendMsg('bot', response.html);
    chatHistory.push({ role: 'assistant', content: response.text });

    if (response.action) response.action();
  } catch (err) {
    removeTyping();
    appendMsg('bot', `❌ Erro: ${escHtml(err.message)}`);
  }

  chatTyping = false;
  document.getElementById('chatSend').disabled = false;
}

// ── Claude API Chat ────────────────────────────────────────────────
async function claudeChat(userMsg, apiKey) {
  const summary  = getSummary(state.month, state.year);
  const expenses = getMonthExpenses(state.month, state.year);
  const monthName = MONTHS[state.month - 1];

  const systemPrompt = `Você é um assistente financeiro inteligente integrado ao GastosBot.

DADOS ATUAIS (${monthName} ${state.year}):
- Total gasto: R$ ${fmt(summary.total)}
- Salário: R$ ${fmt(summary.salary)}
- Saldo: R$ ${fmt(summary.balance)}
- Investimento: R$ ${fmt(summary.invest)}
- Número de transações: ${summary.count}
- Categorias com gastos: ${summary.byCategory.map(c => `${c.category}: R$ ${fmt(c.total)}`).join(', ')}

ÚLTIMAS TRANSAÇÕES:
${expenses.slice(0,10).map(e => `- [ID:${e.id}] ${e.description} — R$ ${fmt(e.amount)} (${e.category}) em ${e.date}`).join('\n')}

CATEGORIAS DISPONÍVEIS: ${state.categories.join(', ')}

AÇÕES QUE VOCÊ PODE REALIZAR (retorne um JSON de ação quando necessário):
1. Registrar gasto: {"action":"add","amount":150,"category":"Alimentacao","description":"Mercado","date":"2026-03-22"}
2. Deletar gasto por ID: {"action":"delete","id":5}
3. Navegar para página: {"action":"navigate","page":"transactions|dashboard|fixed|settings"}
4. Mudar mês: {"action":"month","month":3,"year":2026}
5. Atualizar salário: {"action":"salary","fixed":3500,"variable":2000}

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro
- Seja conciso e amigável
- Se o usuário pedir para registrar um gasto, extraia valor, categoria e descrição e inclua o JSON de ação no final
- Se pedir para deletar, inclua o JSON de ação
- Formate valores monetários como R$ X.XXX,XX
- Se não entender, peça esclarecimento
- Ao final da resposta, se houver uma ação a executar, adicione em uma linha separada: ACTION_JSON:{"action":...}`;

  const messages = [
    ...chatHistory.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMsg },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-client-side-api-key-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Erro na API');
  }

  const data = await res.json();
  const raw  = data.content[0].text;

  // Extract action JSON if present
  let action = null;
  const actionMatch = raw.match(/ACTION_JSON:(\{.+\})/);
  if (actionMatch) {
    try {
      const act = JSON.parse(actionMatch[1]);
      action = () => executeAction(act);
    } catch {}
  }

  const cleanText = raw.replace(/ACTION_JSON:\{.+\}/, '').trim();
  return { html: formatBotText(cleanText), text: cleanText, action };
}

// ── Local Chat (without API key) ───────────────────────────────────
async function localChat(text) {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 400));

  const lower = text.toLowerCase().trim();
  const summary  = getSummary(state.month, state.year);
  const expenses = getMonthExpenses(state.month, state.year);
  const monthName = MONTHS[state.month - 1];

  // ── Add expense ──
  const addMatch = lower.match(/(?:gast|pagu|compr|invest|conta|fatura|boleto|coloca|adiciona|registra)[^\d]*(\d+(?:[.,]\d{1,2})?)/i)
    || lower.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|r\$)/i);

  if (addMatch) {
    const amount = parseFloat(addMatch[1].replace(',', '.'));
    const category = detectCategory(lower);
    const desc = text.length > 80 ? text.slice(0,80) : text;
    const expense = addExpenseDirect({ amount, category, description: desc });
    const newSummary = getSummary(state.month, state.year);
    return {
      html: `✅ <strong>Gasto registrado!</strong><br><br>
💰 Valor: <strong>R$ ${fmt(amount)}</strong><br>
📂 Categoria: <span class="tx-tag">${category}</span><br>
📅 ${new Date().toLocaleDateString('pt-BR')}<br><br>
📊 Total do mês: <strong>R$ ${fmt(newSummary.total)}</strong><br>
💳 Saldo restante: <strong>R$ ${fmt(newSummary.balance)}</strong>`,
      text: `Gasto de R$ ${fmt(amount)} registrado em ${category}.`,
      action: null,
    };
  }

  // ── Delete last ──
  if (/deleta|remove|exclu|apaga/.test(lower) && /(último|ultimo|last|recente)/.test(lower)) {
    if (expenses.length === 0) return { html: '❌ Não há gastos para excluir neste mês.', text: '', action: null };
    const last = expenses[0];
    return {
      html: `🗑️ Excluir <strong>${last.description}</strong> (R$ ${fmt(last.amount)})?<br><br>
<span class="chip" data-action="delete" data-id="${last.id}">✓ Confirmar exclusão</span>`,
      text: '', action: null,
    };
  }

  // ── Delete by category ──
  const delCat = /(?:deleta|remove|exclu|apaga)\s+(?:o\s+)?(?:gasto\s+de\s+)?(.+)/i.exec(text);
  if (delCat && /deleta|remove|exclu|apaga/.test(lower)) {
    const catName = delCat[1].trim();
    const found = expenses.find(e => e.category.toLowerCase().includes(catName.toLowerCase()) || (e.description||'').toLowerCase().includes(catName.toLowerCase()));
    if (found) {
      return {
        html: `🗑️ Excluir <strong>${found.description}</strong> (R$ ${fmt(found.amount)})?<br><br>
<span class="chip" data-action="delete" data-id="${found.id}">✓ Confirmar exclusão</span>`,
        text: '', action: null,
      };
    }
  }

  // ── Summary / balance ──
  if (/quanto gast|total|resumo|extrato|relat/.test(lower)) {
    return {
      html: `📊 <strong>Resumo — ${monthName} ${state.year}</strong><br><br>
💸 Gastos: <strong>R$ ${fmt(summary.total)}</strong><br>
💼 Salário: <strong>R$ ${fmt(summary.salary)}</strong><br>
✅ Saldo: <strong style="color:${summary.balance>=0?'var(--green)':'var(--red)'}">R$ ${fmt(summary.balance)}</strong><br>
📈 Investimento: <strong>R$ ${fmt(summary.invest)}</strong><br>
📋 Lançamentos: <strong>${summary.count}</strong><br><br>
<strong>Por categoria:</strong><br>
${summary.byCategory.map(c => `• ${c.category}: R$ ${fmt(c.total)}`).join('<br>')}`,
      text: '', action: null,
    };
  }

  // ── Balance only ──
  if (/saldo|sobr|rest/.test(lower)) {
    const color = summary.balance >= 0 ? 'var(--green)' : 'var(--red)';
    return {
      html: `💰 Seu saldo em <strong>${monthName}</strong>:<br><br>
Salário: R$ ${fmt(summary.salary)}<br>
Gastos: −R$ ${fmt(summary.total)}<br>
<strong style="color:${color};font-size:18px">= R$ ${fmt(summary.balance)}</strong>`,
      text: '', action: null,
    };
  }

  // ── List expenses ──
  if (/lista|mostra|gastos|transaç/.test(lower)) {
    const list = expenses.slice(0, 8);
    if (!list.length) return { html: `📭 Nenhum gasto registrado em ${monthName} ${state.year}.`, text: '', action: null };
    return {
      html: `📃 <strong>Gastos de ${monthName} ${state.year}:</strong><br><br>` +
        list.map(e => `• <span class="tx-tag">${e.category}</span> ${e.description} — <strong>R$ ${fmt(e.amount)}</strong>`).join('<br>') +
        `<br><br>Total: <strong>R$ ${fmt(summary.total)}</strong>`,
      text: '', action: null,
    };
  }

  // ── Navigate ──
  if (/transaç|lançamento/.test(lower)) return { html: '📋 Abrindo transações...', text: '', action: () => { navigate('transactions'); } };
  if (/fixo/.test(lower))              return { html: '🔁 Abrindo gastos fixos...', text: '', action: () => { navigate('fixed'); } };
  if (/config|salário|configur/.test(lower)) return { html: '⚙️ Abrindo configurações...', text: '', action: () => { navigate('settings'); } };
  if (/dashboard|início|home/.test(lower))   return { html: '📊 Voltando ao dashboard...', text: '', action: () => { navigate('dashboard'); } };

  // ── Help ──
  if (/ajuda|help|como usar|o que/.test(lower)) {
    return {
      html: `👋 <strong>O que posso fazer:</strong><br><br>
💸 <strong>Registrar gasto:</strong><br>
&nbsp;&nbsp;"Gastei R$150 no mercado"<br>
&nbsp;&nbsp;"Paguei R$86 de MEI"<br><br>
📊 <strong>Consultar:</strong><br>
&nbsp;&nbsp;"Quanto gastei esse mês?"<br>
&nbsp;&nbsp;"Qual meu saldo?"<br>
&nbsp;&nbsp;"Resumo de março"<br><br>
🗑️ <strong>Excluir:</strong><br>
&nbsp;&nbsp;"Deleta o último gasto"<br>
&nbsp;&nbsp;"Remove o gasto de Nubank"<br><br>
📋 <strong>Navegar:</strong><br>
&nbsp;&nbsp;"Mostra transações"<br>
&nbsp;&nbsp;"Abre configurações"<br><br>
💡 <strong>Dica:</strong> adicione sua API Key da Anthropic em Configurações para respostas mais inteligentes!`,
      text: '', action: null,
    };
  }

  return {
    html: `🤔 Não entendi. Posso te ajudar com:<br><br>
<span class="chip" data-msg="Quanto gastei esse mês?">📊 Resumo</span>
<span class="chip" data-msg="Qual meu saldo?">💰 Saldo</span>
<span class="chip" data-msg="Lista os gastos">📃 Gastos</span>
<span class="chip" data-msg="Ajuda">❓ Ajuda</span>`,
    text: '', action: null,
  };
}

function executeAction(act) {
  switch (act.action) {
    case 'add':
      addExpenseDirect({ amount: act.amount, category: act.category, description: act.description, date: act.date });
      toast(`✅ Gasto de R$ ${fmt(act.amount)} registrado!`, 'success');
      break;
    case 'delete':
      state.allExpenses = state.allExpenses.filter(e => e.id !== act.id);
      saveToStorage();
      toast('🗑️ Gasto excluído!', 'success');
      renderDashboard();
      break;
    case 'navigate':
      navigate(act.page);
      break;
    case 'month':
      state.month = act.month;
      state.year  = act.year;
      updateMonthLabel();
      renderDashboard();
      break;
    case 'salary':
      state.salary = { fixed: act.fixed, variable: act.variable };
      saveToStorage();
      renderDashboard();
      renderDistribution();
      toast('💼 Salário atualizado!', 'success');
      break;
  }
}

function detectCategory(text) {
  if (/mei/i.test(text))                      return 'MEI';
  if (/ag[eê]ncia|ferramenta|software/i.test(text)) return 'Agencia/Ferramentas';
  if (/invest/i.test(text))                   return 'Investimento';
  if (/nubank/i.test(text))                   return 'Nubank';
  if (/d[oó]lar|dollar|câmbio/i.test(text))  return 'Compra de Dolar';
  if (/jae/i.test(text))                      return 'JAE';
  if (/visto|canada/i.test(text))             return 'Visto Canada';
  if (/fatura.*pf|credito.*pf/i.test(text))  return 'Fatura Credito PF';
  if (/fatura.*pj|credito.*pj/i.test(text))  return 'Fatura Credito PJ';
  if (/mercado|supermercado|alimenta|comida|restaurante|ifood/i.test(text)) return 'Alimentacao';
  if (/uber|taxi|gasolina|combustível|transport/i.test(text)) return 'Transporte';
  if (/m[eé]dico|sa[uú]de|farm[aá]cia|consulta/i.test(text)) return 'Saude';
  if (/cinema|netflix|spotify|lazer|show|ingresso/i.test(text)) return 'Lazer';
  if (/aluguel|condomínio|moradia|luz|[aá]gua|internet/i.test(text)) return 'Moradia';
  return 'Outros';
}

function formatBotText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/R\$ ([\d.,]+)/g, '<strong>R$ $1</strong>');
}

function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function loadApiKeyFromStorage() {
  const key = localStorage.getItem('anthropic_api_key');
  const el  = document.getElementById('inputApiKey');
  if (el && key) el.value = key;
}

// ── Event Binding ──────────────────────────────────────────────────
function bindAll() {
  // Navigation
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.page); });
  });
  document.querySelectorAll('[data-page]:not(.nav-link)').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.page); });
  });

  // Month
  document.getElementById('prevMonth').addEventListener('click', () => shiftMonth(-1));
  document.getElementById('nextMonth').addEventListener('click', () => shiftMonth(1));

  // Expense modal
  document.getElementById('btnAddExpense')?.addEventListener('click', openAdd);
  document.getElementById('fab')?.addEventListener('click', openAdd);
  document.getElementById('closeModal')?.addEventListener('click',  () => hide('modalExpense'));
  document.getElementById('cancelModal')?.addEventListener('click', () => hide('modalExpense'));
  document.getElementById('saveExpense')?.addEventListener('click', saveExpense);

  // Fixed modal
  document.getElementById('btnAddFixed')?.addEventListener('click', () => show('modalFixed'));
  document.getElementById('closeModalFixed')?.addEventListener('click', () => hide('modalFixed'));
  document.getElementById('cancelFixed')?.addEventListener('click', () => hide('modalFixed'));
  document.getElementById('saveFixed')?.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('fixedAmount')?.value);
    const cat    = document.getElementById('fixedCategory')?.value;
    const desc   = document.getElementById('fixedDescription')?.value;
    if (!amount || !cat || !desc) { toast('Preencha todos os campos.', 'error'); return; }
    state.fixedExpenses.unshift({ id: state.nextId++, amount, category: cat, description: desc });
    hide('modalFixed');
    toast('Gasto fixo adicionado!', 'success');
    renderFixed();
  });

  // Filters
  document.getElementById('searchInput')?.addEventListener('input', () => renderAllTx(getMonthExpenses(state.month, state.year)));
  document.getElementById('filterCategory')?.addEventListener('change', () => renderAllTx(getMonthExpenses(state.month, state.year)));

  // Google Sheets
  document.getElementById('btnSaveSheetsUrl')?.addEventListener('click', async () => {
    const sheetsUrl = document.getElementById('inputSheetsUrl')?.value.trim();
    const scriptUrl = document.getElementById('inputScriptUrl')?.value.trim();
    if (!sheetsUrl) { toast('Cole o link da planilha.', 'error'); return; }
    if (!extractSheetId(sheetsUrl)) { toast('Link inválido — copie direto da barra de endereço do Google Sheets.', 'error'); return; }
    localStorage.setItem(LS_SHEETS_URL, sheetsUrl);
    if (scriptUrl) localStorage.setItem(LS_SCRIPT_URL, scriptUrl);
    updateSheetsPillUI();
    toast('Conectando à planilha...', 'info');
    try {
      const sheetData = await fetchFromSheets(sheetsUrl);
      state.allExpenses     = sheetData.expenses || [];
      state.salary          = sheetData.salary   || state.salary;
      state.sheetCategories = [...new Set(state.allExpenses.map(e => e.category))];
      state.nextId          = Math.max(...state.allExpenses.map(e => e.id), 999) + 1;
      saveToStorage();
      renderDashboard();
      toast('Planilha conectada com sucesso!', 'success');
    } catch (err) {
      toast('Erro: ' + err.message, 'error');
    }
  });
  document.getElementById('btnDisconnectSheets')?.addEventListener('click', () => {
    localStorage.removeItem(LS_SHEETS_URL);
    localStorage.removeItem(LS_SCRIPT_URL);
    updateSheetsPillUI();
    toast('Planilha desconectada.', 'success');
  });
  // Preenche campos se já salvos
  const savedUrl = getSheetsUrl();
  const savedScript = getScriptUrl();
  if (savedUrl)    document.getElementById('inputSheetsUrl').value  = savedUrl;
  if (savedScript) document.getElementById('inputScriptUrl').value  = savedScript;
  updateSheetsPillUI();

  // Salary
  document.getElementById('btnSaveSalary')?.addEventListener('click', () => {
    state.salary.fixed    = parseFloat(document.getElementById('inputSalaryFixed')?.value) || 3500;
    state.salary.variable = parseFloat(document.getElementById('inputSalaryVariable')?.value) || 0;
    saveToStorage();
    if (getScriptUrl()) callSheets(getScriptUrl(), { action: 'salary', fixed: state.salary.fixed });
    renderDashboard();
    renderDistribution();
    toast('Salário salvo!', 'success');
  });

  // API Key
  document.getElementById('btnSaveApiKey')?.addEventListener('click', () => {
    const key = document.getElementById('inputApiKey')?.value.trim();
    if (key) { localStorage.setItem('anthropic_api_key', key); toast('Chave salva!', 'success'); }
    else { localStorage.removeItem('anthropic_api_key'); toast('Chave removida.', 'success'); }
  });

  // Sync button
  document.getElementById('btnSyncSheets')?.addEventListener('click', async () => {
    const url = getSheetsUrl();
    if (!url) return;
    const btn = document.getElementById('btnSyncSheets');
    btn.classList.add('syncing');
    try {
      const sheetData = await fetchFromSheets(url);
      state.allExpenses     = sheetData.expenses || [];
      state.salary          = sheetData.salary   || state.salary;
      state.sheetCategories = [...new Set(state.allExpenses.map(e => e.category))];
      state.nextId          = Math.max(...state.allExpenses.map(e => e.id), 999) + 1;
      saveToStorage();
      renderDashboard();
      toast('Planilha sincronizada!', 'success');
    } catch { toast('Erro ao sincronizar.', 'error'); }
    finally { btn.classList.remove('syncing'); }
  });

  // Mostra/esconde botão sync conforme Sheets configurado
  function updateSyncBtn() {
    const btn = document.getElementById('btnSyncSheets');
    if (btn) btn.style.display = getSheetsUrl() ? 'flex' : 'none';
  }
  updateSyncBtn();

  // Chatbot
  document.getElementById('btnChat')?.addEventListener('click', toggleChat);
  document.getElementById('chatClose')?.addEventListener('click', toggleChat);
  document.getElementById('chatOverlay')?.addEventListener('click', toggleChat);

  const chatInput = document.getElementById('chatInput');
  const chatSend  = document.getElementById('chatSend');

  chatSend?.addEventListener('click', () => {
    const msg = chatInput?.value.trim();
    if (msg) { chatInput.value = ''; handleChatMessage(msg); }
  });
  chatInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend?.click(); }
  });

  // Chips (delegated)
  document.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    if (chip.dataset.msg) {
      const chatInput = document.getElementById('chatInput');
      if (chatInput) { chatInput.value = chip.dataset.msg; document.getElementById('chatSend')?.click(); }
    }
    if (chip.dataset.action === 'delete' && chip.dataset.id) {
      state.allExpenses = state.allExpenses.filter(ex => ex.id !== +chip.dataset.id);
      saveToStorage();
      toast('🗑️ Gasto excluído!', 'success');
      renderDashboard();
      chip.closest('.chat-bubble').innerHTML += '<br>✅ <strong>Excluído!</strong>';
    }
  });

  // Mobile sidebar
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // Modals close on backdrop
  ['modalExpense','modalFixed'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => { if (e.target === e.currentTarget) hide(id); });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { hide('modalExpense'); hide('modalFixed'); if(chatOpen) toggleChat(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openAdd(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggleChat(); }
  });
}

// ── Navigation ─────────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page${cap(page)}`));
  if (page === 'transactions') renderAllTx(getMonthExpenses(state.month, state.year));
  if (page === 'fixed') renderFixed();
  document.getElementById('sidebar')?.classList.remove('open');
}

async function shiftMonth(d) {
  state.month += d;
  if (state.month > 12) { state.month = 1;  state.year++; }
  if (state.month < 1)  { state.month = 12; state.year--; }
  updateMonthLabel();
  renderDashboard();
}

function updateMonthLabel() {
  setText('monthLabel', `${MONTHS[state.month-1]} ${state.year}`);
}

// ── Utils ──────────────────────────────────────────────────────────
function fmt(n)      { return (n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtShort(n) { if(n>=1000) return (n/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+'k'; return (n||0).toLocaleString('pt-BR',{maximumFractionDigits:0}); }
function setText(id,v) { const el=document.getElementById(id); if(el) el.textContent=v; }
function show(id)    { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id)    { document.getElementById(id)?.classList.add('hidden'); }
function cap(s)      { return s.charAt(0).toUpperCase()+s.slice(1); }
function setToday()  { const el=document.getElementById('inputDate'); if(el) el.value=new Date().toISOString().split('T')[0]; }

let toastTimer;
function toast(msg, type='success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}
