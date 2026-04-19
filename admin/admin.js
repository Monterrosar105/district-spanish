const API_BASE = 'https://district-spanish-form.robmonterrosa105.workers.dev';
const TOKEN_KEY = 'districtSpanishAdminToken';

const pageType = document.body.dataset.page;

if (pageType === 'login') {
  initLoginPage();
} else if (pageType === 'dashboard') {
  initDashboardPage();
}

function setStatus(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? '#b72d2d' : '#556070';
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('loginStatus', 'Signing in...');

    const formData = new FormData(loginForm);
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '');

    const { response, data } = await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (!response.ok || !data.token) {
      setStatus('loginStatus', data.error || 'Invalid credentials.', true);
      return;
    }

    setToken(data.token);
    window.location.href = './dashboard.html';
  });
}

async function initDashboardPage() {
  const isAuthed = await ensureAuthenticated();
  if (!isAuthed) return;

  wireDashboardEvents();
  await Promise.all([loadAnalyticsSummary(), loadLeads()]);
}

async function ensureAuthenticated() {
  const token = getToken();
  if (!token) {
    window.location.href = './index.html';
    return false;
  }

  const { response } = await apiFetch('/admin/session', { method: 'GET' });
  if (!response.ok) {
    clearToken();
    window.location.href = './index.html';
    return false;
  }

  return true;
}

let currentPage = 1;
let currentQuery = '';
let currentStatus = '';
let currentTotal = 0;
const pageSize = 20;

function wireDashboardEvents() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await apiFetch('/admin/logout', { method: 'POST' });
    clearToken();
    window.location.href = './index.html';
  });

  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await Promise.all([loadLeads(), loadAnalyticsSummary()]);
  });

  document.getElementById('searchInput').addEventListener('input', async (event) => {
    currentQuery = event.target.value.trim();
    currentPage = 1;
    await loadLeads();
  });

  document.getElementById('statusFilter').addEventListener('change', async (event) => {
    currentStatus = event.target.value;
    currentPage = 1;
    await loadLeads();
  });

  document.getElementById('prevPageBtn').addEventListener('click', async () => {
    if (currentPage > 1) {
      currentPage -= 1;
      await loadLeads();
    }
  });

  document.getElementById('nextPageBtn').addEventListener('click', async () => {
    const maxPage = Math.max(1, Math.ceil(currentTotal / pageSize));
    if (currentPage < maxPage) {
      currentPage += 1;
      await loadLeads();
    }
  });
}

async function loadLeads() {
  setStatus('dashboardStatus', 'Loading leads...');
  const params = new URLSearchParams({
    page: String(currentPage),
    limit: String(pageSize)
  });

  if (currentQuery) params.set('q', currentQuery);
  if (currentStatus) params.set('status', currentStatus);

  const { response, data } = await apiFetch(`/admin/leads?${params.toString()}`);
  if (!response.ok) {
    setStatus('dashboardStatus', data.error || 'Unable to load leads.', true);
    return;
  }

  currentTotal = Number(data.pagination?.total || 0);
  renderLeadsTable(Array.isArray(data.leads) ? data.leads : []);
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${Math.max(1, Math.ceil(currentTotal / pageSize))}`;
  setStatus('dashboardStatus', `Loaded ${data.leads.length} lead(s).`);
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById('leadsTableBody');

  if (leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No leads found.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map((lead) => {
    const name = `${escapeHtml(lead.first_name || '')} ${escapeHtml(lead.last_name || '')}`.trim();
    return `
      <tr>
        <td>${name}</td>
        <td>${escapeHtml(lead.email || '')}</td>
        <td>${escapeHtml(lead.phone || '')}</td>
        <td>${escapeHtml(lead.spanish_level || '')}</td>
        <td>
          <select data-role="status" data-id="${lead.id}">
            ${statusOptionsMarkup(lead.status)}
          </select>
        </td>
        <td><input data-role="assigned" data-id="${lead.id}" value="${escapeHtml(lead.assigned_to || '')}" /></td>
        <td><textarea data-role="notes" data-id="${lead.id}" rows="2"></textarea></td>
        <td>
          <div class="actions">
            <button class="btn-secondary" data-role="save" data-id="${lead.id}">Save</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('button[data-role="save"]').forEach((button) => {
    button.addEventListener('click', () => updateLeadRow(Number(button.dataset.id)));
  });
}

function statusOptionsMarkup(currentValue) {
  const values = ['new', 'contacted', 'follow-up', 'trial-scheduled', 'enrolled', 'closed-lost'];
  return values.map((value) => {
    const selected = value === currentValue ? 'selected' : '';
    return `<option value="${value}" ${selected}>${value}</option>`;
  }).join('');
}

async function updateLeadRow(leadId) {
  const statusInput = document.querySelector(`select[data-role="status"][data-id="${leadId}"]`);
  const assignedInput = document.querySelector(`input[data-role="assigned"][data-id="${leadId}"]`);
  const notesInput = document.querySelector(`textarea[data-role="notes"][data-id="${leadId}"]`);

  const payload = {
    status: statusInput.value,
    assignedTo: assignedInput.value.trim(),
    adminNotes: notesInput.value.trim(),
    lastContactedAt: new Date().toISOString()
  };

  const { response, data } = await apiFetch(`/admin/leads/${leadId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    setStatus('dashboardStatus', data.error || 'Unable to update lead.', true);
    return;
  }

  setStatus('dashboardStatus', `Lead #${leadId} updated.`);
  await loadAnalyticsSummary();
}

async function loadAnalyticsSummary() {
  const { response, data } = await apiFetch('/admin/analytics/summary', { method: 'GET' });
  if (!response.ok) {
    setStatus('dashboardStatus', data.error || 'Unable to load analytics.', true);
    return;
  }

  const today = data.today || {};
  document.getElementById('metricPageViews').textContent = Number(today.page_views || 0);
  document.getElementById('metricCtaClicks').textContent = Number(today.cta_clicks || 0);
  document.getElementById('metricSubmitAttempts').textContent = Number(today.form_submit_attempts || 0);
  document.getElementById('metricSubmitSuccess').textContent = Number(today.form_submit_success || 0);

  const statusList = document.getElementById('statusBreakdownList');
  const statusRows = Array.isArray(data.leadStatus) ? data.leadStatus : [];
  statusList.innerHTML = statusRows.length === 0
    ? '<li>No lead status data yet.</li>'
    : statusRows.map((row) => `<li>${escapeHtml(row.status)}: ${Number(row.count || 0)}</li>`).join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
