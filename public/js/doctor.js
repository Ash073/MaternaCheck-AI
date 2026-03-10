/* ── Doctor Portal JS ── */

const API = 'https://materna-check-ai-4mmz.vercel.app/api/doctor';
let token = sessionStorage.getItem('doc_token');
let allSubmissions = [];

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  if (token) showDashboard();
  document.getElementById('loginPass')
    .addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

/* ══════════════════════════════════════
   AUTH
   ══════════════════════════════════════ */
async function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if (!user || !pass) { showErr('Please enter both fields.'); return; }

  try {
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { showErr(data.error || 'Login failed'); return; }
    token = data.token;
    sessionStorage.setItem('doc_token', token);
    showDashboard(data.name);
  } catch (e) {
    showErr('Server unreachable. Is the backend running?');
  }
}

function showErr(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
}

async function doLogout() {
  try { await fetch(API + '/logout', { method: 'POST', headers: authH() }); } catch (_) {}
  sessionStorage.removeItem('doc_token');
  token = null;
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('loginSection').style.display = '';
}

/* ══════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════ */
async function showDashboard(name) {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = '';

  /* Fetch doctor profile */
  try {
    const me = await apiFetch('/me');
    document.getElementById('dashGreeting').textContent = 'Welcome, ' + (name || me.name);
  } catch (_) {}

  await refreshDashboard();
}

async function refreshDashboard() {
  try {
    const [stats, subs] = await Promise.all([apiFetch('/stats'), apiFetch('/submissions')]);
    allSubmissions = subs.submissions || [];
    renderStats(stats);
    renderRiskBar(stats);
    renderPieChart(stats.commonSymptoms || {}, stats.preConditions || {}, stats.otherSymptoms || {});
    renderWeekChart(stats.weekDistribution || {});
    renderSymptoms(stats.commonSymptoms || {});
    renderConditions(stats.preConditions || {}, stats.otherSymptoms || {});
    renderTable(subs.submissions || allSubmissions);
  } catch (e) {
    if (e.message === '401') { doLogout(); return; }
    console.error('Dashboard error', e);
  }
}

/* ── API Helpers ── */
function authH() { return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }; }

async function apiFetch(path) {
  const res = await fetch(API + path, { headers: authH() });
  if (res.status === 401) throw new Error('401');
  if (!res.ok) throw new Error(res.status.toString());
  return res.json();
}

/* ══════════════════════════════════════
   RENDERERS
   ══════════════════════════════════════ */

/* ── Pie Chart — Major Cause Factors ── */
const PIE_COLORS = [
  '#ef5350','#ffa726','#66bb6a','#42a5f5','#ab47bc',
  '#ec407a','#26c6da','#ff7043','#9ccc65','#5c6bc0',
  '#8d6e63','#78909c','#d4e157','#29b6f6','#f06292'
];
let pieSlices = [];

function renderPieChart(commonSymptoms, preConditions, otherSymptoms) {
  const canvas = document.getElementById('pieChart');
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('pieTooltip');
  const legendEl = document.getElementById('pieLegend');
  const noDataEl = document.getElementById('pieNoData');

  /* Aggregate all cause factors into { label: count } */
  const factors = {};
  for (const [cat, vals] of Object.entries(commonSymptoms)) {
    for (const [val, count] of Object.entries(vals)) {
      if (val === 'none' || val === 'normal') continue;
      const label = cat.charAt(0).toUpperCase() + cat.slice(1) + ' \u2014 ' + val;
      factors[label] = (factors[label] || 0) + count;
    }
  }
  for (const [k, v] of Object.entries(preConditions))  factors['Pre-condition: ' + k] = (factors['Pre-condition: ' + k] || 0) + v;
  for (const [k, v] of Object.entries(otherSymptoms))  factors['Other: ' + k] = (factors['Other: ' + k] || 0) + v;

  const entries = Object.entries(factors).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    legendEl.innerHTML = '';
    noDataEl.style.display = '';
    canvas.style.display = 'none';
    pieSlices = [];
    return;
  }
  noDataEl.style.display = 'none';
  canvas.style.display = '';

  const total = entries.reduce((s, e) => s + e[1], 0);
  const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) - 10;

  /* Draw slices */
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieSlices = [];
  let angle = -Math.PI / 2;
  entries.forEach(([label, count], i) => {
    const sweep = (count / total) * 2 * Math.PI;
    const color = PIE_COLORS[i % PIE_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Draw percentage label inside slice if big enough */
    if (sweep > 0.25) {
      const mid = angle + sweep / 2;
      const lx = cx + r * 0.6 * Math.cos(mid);
      const ly = cy + r * 0.6 * Math.sin(mid);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((count / total * 100).toFixed(0) + '%', lx, ly);
    }

    pieSlices.push({ startAngle: angle, endAngle: angle + sweep, label, count, color, pct: (count / total * 100).toFixed(1) });
    angle += sweep;
  });

  /* Legend */
  legendEl.innerHTML = entries.map(([label, count], i) => {
    const color = PIE_COLORS[i % PIE_COLORS.length];
    const pct = (count / total * 100).toFixed(1);
    return '<div class="pie-legend-item"><span class="pie-dot" style="background:' + color + '"></span>' + esc(label) + ' <span class="pie-legend-count">' + count + ' (' + pct + '%)</span></div>';
  }).join('');

  /* Hover handler — attach once */
  if (!canvas._pieHover) {
    canvas._pieHover = true;
    canvas.addEventListener('mousemove', function(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const dx = mx - cx, dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) { tooltip.style.display = 'none'; return; }
      let a = Math.atan2(dy, dx);
      if (a < -Math.PI / 2) a += 2 * Math.PI;
      const hit = pieSlices.find(s => {
        let sa = s.startAngle, ea = s.endAngle;
        if (sa < -Math.PI / 2) { sa += 2 * Math.PI; ea += 2 * Math.PI; }
        return a >= sa && a < ea;
      });
      if (hit) {
        tooltip.innerHTML = '<strong>' + esc(hit.label) + '</strong><br>' + hit.count + ' entries &nbsp;(' + hit.pct + '%)';
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - rect.left + 14) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
      } else {
        tooltip.style.display = 'none';
      }
    });
    canvas.addEventListener('mouseleave', function() { tooltip.style.display = 'none'; });
  }
}

function renderStats(s) {
  document.getElementById('statTotal').textContent = s.totalChecks || s.total || 0;
  document.getElementById('statAvg').textContent = (s.averageScore ?? s.avgScore ?? 0).toFixed(1);

  const rd = s.riskDistribution || {};
  document.getElementById('statNormal').textContent = rd.normal || 0;
  document.getElementById('statMonitor').textContent = rd.monitor || 0;
  document.getElementById('statEmergency').textContent = rd.emergency || 0;

  const total = s.totalChecks || s.total || 0;
  document.getElementById('noDataMsg').style.display = total === 0 ? '' : 'none';
}

function renderRiskBar(s) {
  const total = s.totalChecks || s.total || 1;
  const rd = s.riskDistribution || {};
  const pN = ((rd.normal || 0) / total * 100).toFixed(1);
  const pM = ((rd.monitor || 0) / total * 100).toFixed(1);
  const pE = ((rd.emergency || 0) / total * 100).toFixed(1);
  document.getElementById('barNormal').style.width = pN + '%';
  document.getElementById('barMonitor').style.width = pM + '%';
  document.getElementById('barEmergency').style.width = pE + '%';
}

function renderWeekChart(wd) {
  const el = document.getElementById('weekChart');
  const entries = Object.entries(wd).sort((a, b) => Number(a[0]) - Number(b[0]));
  if (!entries.length) { el.innerHTML = '<div class="no-data-msg">No gestational week data yet.</div>'; return; }
  const maxVal = Math.max(...entries.map(e => e[1]), 1);
  el.innerHTML = entries.map(([w, c]) => `
    <div class="wbar-row">
      <span class="wbar-label">W${w}</span>
      <div class="wbar-track"><div class="wbar-fill" style="width:${(c / maxVal * 100).toFixed(0)}%"></div></div>
      <span class="wbar-count">${c}</span>
    </div>
  `).join('');
}

function renderSymptoms(obj) {
  /* commonSymptoms is { contractions: { irregular: 1 }, ... } — flatten it */
  const flat = {};
  for (const [category, vals] of Object.entries(obj)) {
    for (const [val, count] of Object.entries(vals)) {
      if (val === 'none' || val === 'normal') continue;
      flat[category + ': ' + val] = (flat[category + ': ' + val] || 0) + count;
    }
  }
  renderFreqList('symptomFreq', flat);
}
function renderConditions(pre, other) {
  const merged = { ...pre };
  for (const [k, v] of Object.entries(other)) merged[k] = (merged[k] || 0) + v;
  renderFreqList('conditionFreq', merged);
}

function renderFreqList(id, obj) {
  const el = document.getElementById(id);
  const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (!entries.length) { el.innerHTML = '<div class="no-data-msg">No data yet.</div>'; return; }
  const max = entries[0][1] || 1;
  el.innerHTML = entries.map(([name, count]) => `
    <div class="freq-row">
      <span class="freq-name">${esc(name)}</span>
      <div class="freq-track"><div class="freq-fill" style="width:${(count / max * 100).toFixed(0)}%"></div></div>
      <span class="freq-count">${count}</span>
    </div>
  `).join('');
}

function renderTable(subs) {
  const tbody = document.getElementById('recentBody');
  if (!subs.length) { tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No submissions yet</td></tr>'; return; }

  const recent = subs.slice(-50).reverse();
  tbody.innerHTML = recent.map((s, i) => {
    const d = new Date(s.timestamp);
    const time = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rl = s.riskLevel || '—';
    const cls = rl === 'emergency' ? 'badge-red' : rl === 'monitor' ? 'badge-yellow' : 'badge-green';
    const flagCount = (s.emergencyReasons?.length) || 0;
    return `<tr>
      <td>${i + 1}</td>
      <td>${esc(time)}</td>
      <td>${s.gestWeek || s.symptoms?.gestWeek || '—'}</td>
      <td><span class="badge ${cls}">${rl.toUpperCase()}</span></td>
      <td>${s.score ?? '—'}</td>
      <td>${flagCount ? flagCount + ' flag(s)' : '—'}</td>
    </tr>`;
  }).join('');
}

/* ── Escape HTML ── */
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/* ══════════════════════════════════════
   CSV EXPORT
   ══════════════════════════════════════ */
function exportCSV() {
  if (!allSubmissions.length) { alert('No data to export. Submit some patient checks first, then refresh the dashboard.'); return; }
  const header = 'Timestamp,Week,RiskLevel,Score,EmergencyFlags\n';
  const rows = allSubmissions.map(s => {
    const ts = new Date(s.timestamp).toISOString();
    const w = s.symptoms?.gestWeek || s.gestWeek || '';
    const rl = s.result?.riskLevel || s.riskLevel || '';
    const sc = s.result?.score ?? s.score ?? '';
    const flags = (s.result?.emergencyReasons || s.emergencyReasons || []).join('; ').replace(/,/g, ' ');
    return `${ts},${w},${rl},${sc},"${flags}"`;
  }).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'materna-check-export.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
