const STORAGE_KEY = 'kaais-finance-dashboard';

const form = document.getElementById('transaction-form');
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');
const typeEl = document.getElementById('type');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');

const viewSelect = document.getElementById('view-select');
const yearSelect = document.getElementById('year-select');
const monthSelect = document.getElementById('month-select');
const monthGroup = document.getElementById('month-group');

const summaryIncome = document.getElementById('summary-income');
const summaryExpenses = document.getElementById('summary-expenses');
const summaryBalance = document.getElementById('summary-balance');
const summarySavings = document.getElementById('summary-savings');

const annualIncome = document.getElementById('annual-income');
const annualExpenses = document.getElementById('annual-expenses');
const annualNet = document.getElementById('annual-net');
const annualCount = document.getElementById('annual-count');
const annualTable = document.getElementById('annual-table');

const monthlyIncome = document.getElementById('monthly-income');
const monthlyExpenses = document.getElementById('monthly-expenses');
const monthlyNet = document.getElementById('monthly-net');
const monthlyCount = document.getElementById('monthly-count');
const transactionTable = document.getElementById('transaction-table');
const monthlySection = document.getElementById('monthly-section');

const categoryCtx = document.getElementById('categoryChart');
const trendCtx = document.getElementById('trendChart');

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let categoryChart;
let trendChart;

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

dateEl.valueAsDate = new Date();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function parseDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return { year: dt.getFullYear(), month: dt.getMonth(), date: dt };
}

function getYearOptions() {
  const years = new Set([new Date().getFullYear()]);
  transactions.forEach(t => years.add(parseDate(t.date).year));
  return [...years].sort((a,b)=>b-a);
}

function fillYears() {
  yearSelect.innerHTML = '';
  getYearOptions().forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });
  yearSelect.value = String(new Date().getFullYear());
}

function byDateDesc(a,b){ return new Date(b.date) - new Date(a.date); }

function annualSummary(year) {
  const list = transactions.filter(t => parseDate(t.date).year === year);
  const income = list.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0);
  const expenses = list.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0);
  const net = income - expenses;
  return { list, income, expenses, net, count: list.length };
}

function monthlySummary(year, month) {
  const list = transactions.filter(t => {
    const p = parseDate(t.date);
    return p.year === year && p.month === month;
  }).sort(byDateDesc);
  const income = list.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0);
  const expenses = list.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0);
  const net = income - expenses;
  return { list, income, expenses, net, count: list.length };
}

function categoryTotals(year, month = null) {
  const filtered = transactions.filter(t => {
    const p = parseDate(t.date);
    return p.year === year && (month === null || p.month === month) && t.type === 'expense';
  });
  const totals = {};
  filtered.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
  return totals;
}

function monthlyTotals(year) {
  return months.map((_, m) => {
    const list = transactions.filter(t => {
      const p = parseDate(t.date);
      return p.year === year && p.month === m;
    });
    const income = list.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0);
    const expenses = list.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0);
    return { income, expenses, net: income - expenses };
  });
}

function updateSummaryCards(sum) {
  summaryIncome.textContent = money(sum.income);
  summaryExpenses.textContent = money(sum.expenses);
  summaryBalance.textContent = money(sum.net);
  summarySavings.textContent = sum.income > 0 ? `${Math.round((sum.net / sum.income) * 100)}%` : '0%';
}

function renderAnnualTable(year) {
  const totals = monthlyTotals(year);
  annualTable.innerHTML = totals.map((m, i) => `
    <tr>
      <td>${months[i]}</td>
      <td>${money(m.income)}</td>
      <td>${money(m.expenses)}</td>
      <td>${money(m.net)}</td>
    </tr>
  `).join('');
}

function renderTransactions(list) {
  transactionTable.innerHTML = list.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${escapeHtml(t.description)}</td>
      <td>${escapeHtml(t.category)}</td>
      <td>${t.type}</td>
      <td class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
        ${t.type === 'income' ? '+' : '-'}${money(t.amount)}
      </td>
      <td><button class="action-btn" data-id="${t.id}">Delete</button></td>
    </tr>
  `).join('') || `<tr><td colspan="6">No transactions for this period.</td></tr>`;

  transactionTable.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      transactions = transactions.filter(t => t.id !== btn.dataset.id);
      save();
      refresh();
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCharts(year, month, isAnnual) {
  const categoryData = categoryTotals(year, isAnnual ? null : month);
  const labels = Object.keys(categoryData);
  const values = Object.values(categoryData);

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['No expenses'],
      datasets: [{
        data: values.length ? values : [1],
        backgroundColor: ['#e8bfd2','#d9c9ef','#f3d9c9','#cde7e1','#f6d6e5','#d9def5','#f0e2b7','#d8d8d8'],
        borderWidth: 0
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } }
    }
  });

  const monthly = monthlyTotals(year);
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(trendCtx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: monthly.map(m => m.income),
          backgroundColor: '#d9c9ef'
        },
        {
          label: 'Expenses',
          data: monthly.map(m => m.expenses),
          backgroundColor: '#e8bfd2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function refresh() {
  fillYears();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);
  const annual = annualSummary(year);
  const monthly = monthlySummary(year, month);

  updateSummaryCards(viewSelect.value === 'annual' ? annual : monthly);

  annualIncome.textContent = money(annual.income);
  annualExpenses.textContent = money(annual.expenses);
  annualNet.textContent = money(annual.net);
  annualCount.textContent = annual.count;

  monthlyIncome.textContent = money(monthly.income);
  monthlyExpenses.textContent = money(monthly.expenses);
  monthlyNet.textContent = money(monthly.net);
  monthlyCount.textContent = monthly.count;

  renderAnnualTable(year);
  renderTransactions(viewSelect.value === 'annual' ? annual.list.sort(byDateDesc) : monthly.list);
  renderCharts(year, month, viewSelect.value === 'annual');
}

viewSelect.addEventListener('change', () => {
  monthGroup.style.display = viewSelect.value === 'annual' ? 'none' : 'flex';
  monthlySection.style.display = viewSelect.value === 'annual' ? 'none' : 'block';
  refresh();
});

yearSelect.addEventListener('change', refresh);
monthSelect.addEventListener('change', refresh);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = descriptionEl.value.trim();
  const amount = Number(amountEl.value);
  if (!desc || !amount || amount <= 0) return;

  transactions.push({
    id: id(),
    description: desc,
    amount: amount,
    type: typeEl.value,
    category: categoryEl.value,
    date: dateEl.value
  });

  save();
  form.reset();
  dateEl.valueAsDate = new Date();
  refresh();
});

transactions.sort(byDateDesc);
monthGroup.style.display = 'none';
monthlySection.style.display = 'none';
refresh();