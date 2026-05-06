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

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (err) {
    // Network error (CORS, worker unreachable, etc.)
    return {
      response: { ok: false, status: 0 },
      data: { error: `Network error: ${err.message || 'Could not reach the server.'}` }
    };
  }
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
  await Promise.all([loadLeads(), loadReviews()]);
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
let currentLevel = '';
let currentSortBy = 'created_at';
let currentSortDir = 'desc';
let currentTotal = 0;
const pageSize = 20;
let reviewCurrentPage = 1;
let reviewCurrentQuery = '';
let reviewCurrentStatus = '';
let reviewCurrentTotal = 0;
const reviewPageSize = 15;

function wireDashboardEvents() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await apiFetch('/admin/logout', { method: 'POST' });
    clearToken();
    window.location.href = './index.html';
  });

  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadLeads();
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

  document.getElementById('levelFilter').addEventListener('change', async (event) => {
    currentLevel = event.target.value;
    currentPage = 1;
    await loadLeads();
  });

  document.querySelectorAll('.sort-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const sortBy = String(button.dataset.sort || '').trim();
      if (!sortBy) return;

      if (currentSortBy === sortBy) {
        currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortBy = sortBy;
        currentSortDir = sortBy === 'created_at' ? 'desc' : 'asc';
      }

      updateSortButtons();
      currentPage = 1;
      await loadLeads();
    });
  });

  updateSortButtons();

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

  const closeBtn = document.getElementById('closeLeadDetailModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLeadDetailModal);
  }

  document.querySelectorAll('[data-close-detail-modal="true"]').forEach((node) => {
    node.addEventListener('click', closeLeadDetailModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLeadDetailModal();
    }
  });

  document.getElementById('reviewRefreshBtn').addEventListener('click', async () => {
    await loadReviews();
  });

  document.getElementById('reviewSearchInput').addEventListener('input', async (event) => {
    reviewCurrentQuery = event.target.value.trim();
    reviewCurrentPage = 1;
    await loadReviews();
  });

  document.getElementById('reviewStatusFilter').addEventListener('change', async (event) => {
    reviewCurrentStatus = event.target.value;
    reviewCurrentPage = 1;
    await loadReviews();
  });

  document.getElementById('reviewPrevPageBtn').addEventListener('click', async () => {
    if (reviewCurrentPage > 1) {
      reviewCurrentPage -= 1;
      await loadReviews();
    }
  });

  document.getElementById('reviewNextPageBtn').addEventListener('click', async () => {
    const maxPage = Math.max(1, Math.ceil(reviewCurrentTotal / reviewPageSize));
    if (reviewCurrentPage < maxPage) {
      reviewCurrentPage += 1;
      await loadReviews();
    }
  });

  document.getElementById('importReviewBtn').addEventListener('click', async () => {
    await importReviewFromAdmin();
  });
}

async function loadLeads() {
  setStatus('dashboardStatus', 'Loading leads...');
  const params = new URLSearchParams({
    page: String(currentPage),
    limit: String(pageSize),
    sortBy: currentSortBy,
    sortDir: currentSortDir
  });

  if (currentQuery) params.set('q', currentQuery);
  if (currentStatus) params.set('status', currentStatus);
  if (currentLevel) params.set('level', currentLevel);

  const { response, data } = await apiFetch(`/admin/leads?${params.toString()}`);
  if (!response.ok) {
    setStatus('dashboardStatus', data.error || 'Unable to load leads.', true);
    return;
  }

  currentTotal = Number(data.pagination?.total || 0);
  renderLeadsTable(Array.isArray(data.leads) ? data.leads : []);
  renderLeadSummary(data.summary || {});
  renderStatusBreakdown(Array.isArray(data.statusBreakdown) ? data.statusBreakdown : []);
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${Math.max(1, Math.ceil(currentTotal / pageSize))}`;
  setStatus('dashboardStatus', `Loaded ${data.leads.length} lead(s).`);
}

async function loadReviews() {
  setStatus('reviewStatusMessage', 'Loading reviews...');

  const params = new URLSearchParams({
    page: String(reviewCurrentPage),
    limit: String(reviewPageSize)
  });

  if (reviewCurrentQuery) params.set('q', reviewCurrentQuery);
  if (reviewCurrentStatus) params.set('status', reviewCurrentStatus);

  const { response, data } = await apiFetch(`/admin/reviews?${params.toString()}`);
  if (!response.ok) {
    setStatus('reviewStatusMessage', data.error || 'Unable to load reviews.', true);
    return;
  }

  reviewCurrentTotal = Number(data.pagination?.total || 0);
  renderReviewsTable(Array.isArray(data.reviews) ? data.reviews : []);
  document.getElementById('reviewPageInfo').textContent = `Page ${reviewCurrentPage} of ${Math.max(1, Math.ceil(reviewCurrentTotal / reviewPageSize))}`;
  setStatus('reviewStatusMessage', `Loaded ${data.reviews.length} review(s).`);
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById('leadsTableBody');

  if (leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No leads found.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map((lead) => {
    const name = `${escapeHtml(lead.first_name || '')} ${escapeHtml(lead.last_name || '')}`.trim();
    return `
      <tr>
        <td data-label="Name">
          <button class="name-link" data-role="view" data-id="${lead.id}">${name || 'Unnamed lead'}</button>
        </td>
        <td data-label="Date Submitted">${formatDate(lead.created_at)}</td>
        <td data-label="Status">
          <select data-role="status" data-id="${lead.id}">
            ${statusOptionsMarkup(lead.status)}
          </select>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('select[data-role="status"]').forEach((selectNode) => {
    selectNode.addEventListener('change', async () => {
      await updateLeadStatus(Number(selectNode.dataset.id), selectNode.value);
    });
  });

  tbody.querySelectorAll('button[data-role="view"]').forEach((button) => {
    button.addEventListener('click', () => viewLeadDetail(Number(button.dataset.id)));
  });
}

function renderReviewsTable(reviews) {
  const tbody = document.getElementById('reviewsTableBody');

  if (reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No reviews found.</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map((review) => {
    const name = `${escapeHtml(review.first_name || '')} ${escapeHtml(review.last_initial || '')}.`.trim();
    const reviewText = escapeHtml(review.review_text || '');
    return `
      <tr>
        <td data-label="Name">${name || 'Anonymous'}</td>
        <td data-label="Location">${escapeHtml(review.location || '-')}</td>
        <td data-label="Review">${reviewText}</td>
        <td data-label="Status">
          <select data-role="review-status" data-id="${review.id}">
            ${reviewStatusOptionsMarkup(review.status)}
          </select>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('select[data-role="review-status"]').forEach((selectNode) => {
    selectNode.addEventListener('change', async () => {
      await updateReviewStatus(Number(selectNode.dataset.id), selectNode.value);
    });
  });
}

function statusOptionsMarkup(currentValue) {
  const values = ['new', 'contacted', 'follow-up', 'trial-scheduled', 'enrolled', 'closed-lost'];
  return values.map((value) => {
    const selected = value === currentValue ? 'selected' : '';
    return `<option value="${value}" ${selected}>${value}</option>`;
  }).join('');
}

function reviewStatusOptionsMarkup(currentValue) {
  const values = ['pending', 'approved', 'rejected'];
  return values.map((value) => {
    const selected = value === currentValue ? 'selected' : '';
    return `<option value="${value}" ${selected}>${value}</option>`;
  }).join('');
}

async function updateLeadStatus(leadId, statusValue) {
  const payload = {
    status: statusValue,
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

  setStatus('dashboardStatus', `Status updated for lead #${leadId}.`);
  await loadLeads();
}

async function updateReviewStatus(reviewId, statusValue) {
  const { response, data } = await apiFetch(`/admin/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: statusValue })
  });

  if (!response.ok) {
    setStatus('reviewStatusMessage', data.error || 'Unable to update review status.', true);
    return;
  }

  setStatus('reviewStatusMessage', `Status updated for review #${reviewId}.`);
  await loadReviews();
}

async function importReviewFromAdmin() {
  const firstName = String(document.getElementById('importReviewFirstName').value || '').trim();
  const lastInitial = String(document.getElementById('importReviewLastInitial').value || '').trim();
  const location = String(document.getElementById('importReviewLocation').value || '').trim();
  const email = String(document.getElementById('importReviewEmail').value || '').trim();
  const reviewSpanish = String(document.getElementById('importReviewSpanish').value || '').trim();
  const status = String(document.getElementById('importReviewStatus').value || '').trim();
  const reviewText = String(document.getElementById('importReviewText').value || '').trim();

  if (!firstName || !lastInitial || !location || !reviewText) {
    setStatus('reviewStatusMessage', 'First name, last initial, location, and review text are required.', true);
    return;
  }

  const payload = {
    firstName,
    lastInitial,
    location,
    email,
    reviewSpanish,
    status,
    reviewText
  };

  const { response, data } = await apiFetch('/admin/reviews/import', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    setStatus('reviewStatusMessage', data.error || 'Unable to import review.', true);
    return;
  }

  document.getElementById('importReviewFirstName').value = '';
  document.getElementById('importReviewLastInitial').value = '';
  document.getElementById('importReviewLocation').value = '';
  document.getElementById('importReviewEmail').value = '';
  document.getElementById('importReviewSpanish').value = '';
  document.getElementById('importReviewText').value = '';
  document.getElementById('importReviewStatus').value = 'approved';

  setStatus('reviewStatusMessage', 'Review imported successfully.');
  reviewCurrentPage = 1;
  await loadReviews();
}

function renderLeadSummary(summary) {
  document.getElementById('metricTotalLeads').textContent = Number(summary.totalLeads || 0);
  document.getElementById('metricLeadsToday').textContent = Number(summary.leadsToday || 0);
  document.getElementById('metricEnrolledLeads').textContent = Number(summary.enrolledLeads || 0);
}

function renderStatusBreakdown(rows) {
  const statusList = document.getElementById('statusBreakdownList');
  if (!statusList) return;

  statusList.innerHTML = rows.length === 0
    ? '<li>No matching lead status data.</li>'
    : rows.map((row) => `<li>${escapeHtml(row.status)}: ${Number(row.count || 0)}</li>`).join('');
}

function updateSortButtons() {
  document.querySelectorAll('.sort-btn').forEach((button) => {
    const sortKey = String(button.dataset.sort || '');
    const isActive = sortKey === currentSortBy;
    const indicator = isActive ? (currentSortDir === 'asc' ? ' \u2191' : ' \u2193') : '';
    button.textContent = button.textContent.replace(/\s[\u2191\u2193]$/, '') + indicator;
    button.classList.toggle('is-active', isActive);
    if (isActive) {
      button.setAttribute('aria-sort', currentSortDir === 'asc' ? 'ascending' : 'descending');
    } else {
      button.removeAttribute('aria-sort');
    }
  });
}

async function viewLeadDetail(leadId) {
  setStatus('dashboardStatus', `Loading full record for lead #${leadId}...`);
  const { response, data } = await apiFetch(`/admin/leads/${leadId}`, { method: 'GET' });

  if (!response.ok) {
    setStatus('dashboardStatus', data.error || 'Unable to load lead details.', true);
    return;
  }

  openLeadDetailModal(data.lead || {});
  setStatus('dashboardStatus', `Showing full record for lead #${leadId}.`);
}

function openLeadDetailModal(lead) {
  const modal = document.getElementById('leadDetailModal');
  const content = document.getElementById('leadDetailContent');
  if (!modal || !content) return;

  content.innerHTML = renderLeadDetailHtml(lead);
  modal.classList.add('is-visible');
  modal.setAttribute('aria-hidden', 'false');
}

function closeLeadDetailModal() {
  const modal = document.getElementById('leadDetailModal');
  if (!modal) return;
  modal.classList.remove('is-visible');
  modal.setAttribute('aria-hidden', 'true');
}

function renderLeadDetailHtml(lead) {
  const scheduleValue = formatScheduleValue(lead.schedule_json, lead.schedule_other);
  const referralValue = [lead.referral_source, lead.referral_other].filter(Boolean).join(' | ');

  return [
    renderDetailSection('Contact Information', [
      ['Name', `${safeText(lead.first_name)} ${safeText(lead.last_name)}`.trim() || '-'],
      ['Email', safeText(lead.email) || '-'],
      ['Phone', safeText(lead.phone) || '-']
    ]),
    renderDetailSection('Spanish Background', [
      ['Level', safeText(lead.spanish_level) || '-'],
      ['Experience', safeText(lead.spanish_experience) || '-']
    ]),
    renderDetailSection('Availability', [
      ['Schedule', scheduleValue || '-'],
      ['Schedule Other', safeText(lead.schedule_other) || '-']
    ]),
    renderDetailSection('Referral & Notes', [
      ['Referral Source', safeText(referralValue) || '-'],
      ['Comments', safeText(lead.comments) || '-'],
      ['Admin Notes', safeText(lead.admin_notes) || '-']
    ]),
    renderDetailSection('Submission Metadata', [
      ['Date Submitted', formatDate(lead.created_at)],
      ['Status', safeText(lead.status) || '-']
    ])
  ].join('');
}

function renderDetailSection(title, fields) {
  const items = fields.map(([label, value]) => {
    return `<div class="detail-field"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
  }).join('');

  return `<section class="detail-section"><h4>${escapeHtml(title)}</h4><div class="detail-grid">${items}</div></section>`;
}

function formatScheduleValue(scheduleJson, scheduleOther) {
  let parsedSchedule = [];
  if (typeof scheduleJson === 'string' && scheduleJson.trim()) {
    try {
      const parsed = JSON.parse(scheduleJson);
      if (Array.isArray(parsed)) parsedSchedule = parsed;
    } catch (_error) {
      parsedSchedule = [scheduleJson];
    }
  }

  const values = parsedSchedule.map((item) => safeText(item)).filter(Boolean);
  if (scheduleOther) {
    values.push(`Other: ${safeText(scheduleOther)}`);
  }
  return values.join(', ');
}

function safeText(value) {
  return String(value || '').trim();
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value.includes('T') ? value : `${value}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
