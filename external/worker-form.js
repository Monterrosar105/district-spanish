// ============================================
// Cloudflare Worker - Form + Admin + Analytics API
// ============================================

const STATUS_VALUES = new Set([
  'new',
  'contacted',
  'follow-up',
  'trial-scheduled',
  'enrolled',
  'closed-lost'
]);

const DAILY_EVENT_COLUMN_MAP = {
  page_view: 'page_views',
  cta_click: 'cta_clicks',
  form_open: 'form_opens',
  form_submit_attempt: 'form_submit_attempts',
  form_submit_success: 'form_submit_success',
  form_submit_fail: 'form_submit_fail'
};

let analyticsEventDateColumnCache = null;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(env)
      });
    }

    try {
      if ((path === '/' || path === '/form') && request.method === 'POST') {
        return await handleFormSubmission(request, env);
      }

      if (path === '/analytics/events' && request.method === 'POST') {
        return await handleAnalyticsEvents(request, env);
      }

      if (path === '/admin/login' && request.method === 'POST') {
        return await handleAdminLogin(request, env);
      }

      if (path === '/admin/session' && request.method === 'GET') {
        return await handleAdminSession(request, env);
      }

      if (path === '/admin/logout' && request.method === 'POST') {
        return await handleAdminLogout(request, env);
      }

      if (path === '/admin/leads' && request.method === 'GET') {
        return await handleAdminLeads(request, env);
      }

      const leadPathMatch = path.match(/^\/admin\/leads\/(\d+)$/);
      if (leadPathMatch && request.method === 'PATCH') {
        return await handleAdminLeadUpdate(request, env, Number(leadPathMatch[1]));
      }

      if (leadPathMatch && request.method === 'GET') {
        return await handleAdminLeadDetail(request, env, Number(leadPathMatch[1]));
      }

      if (path === '/admin/analytics/summary' && request.method === 'GET') {
        return await handleAnalyticsSummary(request, env);
      }

      if (path === '/admin/analytics/debug' && request.method === 'GET') {
        return await handleAnalyticsDebug(request, env);
      }

      return jsonResponse({ error: 'Not found' }, 404, env);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, env);
    }
  }
};

async function handleFormSubmission(request, env) {
  const db = requireDb(env);
  const formData = await request.json();

  const requiredFields = ['email', 'firstName', 'lastName', 'phone', 'level', 'referralSource'];
  const missingFields = requiredFields.filter(field => !formData[field] || String(formData[field]).trim() === '');
  if (missingFields.length > 0) {
    return jsonResponse({ error: `Missing required fields: ${missingFields.join(', ')}` }, 400, env);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return jsonResponse({ error: 'Invalid email format' }, 400, env);
  }

  const metadata = {
    ipAddress: request.headers.get('CF-Connecting-IP') || null,
    userAgent: request.headers.get('User-Agent') || null,
    referrer: request.headers.get('Referer') || null,
    utmSource: formData.utmSource || null,
    utmMedium: formData.utmMedium || null,
    utmCampaign: formData.utmCampaign || null,
    formVersion: formData.formVersion || 'v1'
  };

  const externalId = `lead_${crypto.randomUUID()}`;
  const scheduleJson = JSON.stringify(Array.isArray(formData.schedule) ? formData.schedule : []);

  const insertResult = await db.prepare(`
    INSERT INTO leads (
      external_id,
      first_name,
      last_name,
      email,
      phone,
      spanish_level,
      spanish_experience,
      schedule_json,
      schedule_other,
      referral_source,
      referral_other,
      comments,
      status,
      ip_address,
      user_agent,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      form_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    externalId,
    safeString(formData.firstName),
    safeString(formData.lastName),
    safeString(formData.email),
    safeString(formData.phone),
    safeString(formData.level),
    safeString(formData.experience),
    scheduleJson,
    safeString(formData.scheduleOther),
    safeString(formData.referralSource),
    safeString(formData.referralOther),
    safeString(formData.comments),
    metadata.ipAddress,
    metadata.userAgent,
    metadata.referrer,
    metadata.utmSource,
    metadata.utmMedium,
    metadata.utmCampaign,
    metadata.formVersion
  ).run();

  const leadId = insertResult.meta?.last_row_id;
  const emailHtml = generateEmailHtml(formData);
  const emailResponse = await sendEmailWithResend(env.RESEND_API_KEY, emailHtml, formData.email);

  if (!emailResponse.success) {
    await db.prepare(`
      UPDATE leads
      SET email_delivery_status = 'failed',
          email_error_message = ?,
          updated_at = datetime('now'),
          updated_by = 'system'
      WHERE id = ?
    `).bind(JSON.stringify(emailResponse.error), leadId).run();

    return jsonResponse({ error: 'Failed to send email' }, 500, env);
  }

  await db.prepare(`
    UPDATE leads
    SET email_delivery_status = 'sent',
        email_sent_at = datetime('now'),
        updated_at = datetime('now'),
        updated_by = 'system'
    WHERE id = ?
  `).bind(leadId).run();

  return jsonResponse({ success: true, message: 'Form submitted successfully', leadId, externalId }, 200, env);
}

async function handleAnalyticsEvents(request, env) {
  const db = requireDb(env);
  const body = await request.json();
  const events = Array.isArray(body.events) ? body.events : [];

  if (events.length === 0) {
    return jsonResponse({ error: 'No events provided' }, 400, env);
  }

  const ipAddress = request.headers.get('CF-Connecting-IP') || null;
  const userAgent = request.headers.get('User-Agent') || null;
  const metricDate = resolveMetricDate(events);
  const hasEventDateColumn = await analyticsEventsHasEventDateColumn(db);

  let inserted = 0;
  let rolledUp = 0;
  let skipped = 0;

  await db.prepare(`
    INSERT INTO daily_metrics (metric_date)
    VALUES (?)
    ON CONFLICT(metric_date) DO NOTHING
  `).bind(metricDate).run();

  for (const event of events) {
    const sessionId = safeString(event.sessionId) || `anon_${crypto.randomUUID()}`;
    const eventName = safeString(event.eventName);
    if (!eventName) {
      skipped += 1;
      continue;
    }

    const eventCategory = safeString(event.eventCategory) || 'site';
    const sourcePage = safeString(event.page) || '/';
    const metadata = event && typeof event.metadata === 'object' && event.metadata !== null
      ? event.metadata
      : {};

    // event_date = browser-local calendar date; fixes UTC timezone mismatch
    const eventDate = isValidMetricDate(safeString(metadata.localDate))
      ? safeString(metadata.localDate)
      : metricDate;

    if (hasEventDateColumn) {
      await db.prepare(`
        INSERT INTO analytics_events (
          session_id,
          event_name,
          event_category,
          source_page,
          metadata_json,
          ip_address,
          user_agent,
          event_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sessionId,
        eventName,
        eventCategory,
        sourcePage,
        JSON.stringify(metadata),
        ipAddress,
        userAgent,
        eventDate
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO analytics_events (
          session_id,
          event_name,
          event_category,
          source_page,
          metadata_json,
          ip_address,
          user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sessionId,
        eventName,
        eventCategory,
        sourcePage,
        JSON.stringify(metadata),
        ipAddress,
        userAgent
      ).run();
    }
    inserted += 1;

    const metricColumn = DAILY_EVENT_COLUMN_MAP[eventName];
    if (metricColumn) {
      await db.prepare(`
        UPDATE daily_metrics
        SET ${metricColumn} = ${metricColumn} + 1,
            updated_at = datetime('now')
        WHERE metric_date = ?
      `).bind(metricDate).run();
      rolledUp += 1;
    }
  }

  return jsonResponse({
    success: true,
    accepted: events.length,
    inserted,
    rolledUp,
    skipped,
    metricDate
  }, 200, env);
}

async function handleAdminLogin(request, env) {
  const db = requireDb(env);
  const { username, password } = await request.json();

  if (!username || !password) {
    return jsonResponse({ error: 'Username and password are required' }, 400, env);
  }

  const user = await db.prepare(`
    SELECT id, username, password_hash, display_name, role, is_active
    FROM admin_users
    WHERE username = ?
    LIMIT 1
  `).bind(String(username).trim()).first();

  if (!user || Number(user.is_active) !== 1) {
    return jsonResponse({ error: 'Invalid credentials' }, 401, env);
  }

  const isValidPassword = await verifyPassword(String(password), user.password_hash);
  if (!isValidPassword) {
    return jsonResponse({ error: 'Invalid credentials' }, 401, env);
  }

  const token = `sess_${crypto.randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + (12 * 60 * 60 * 1000)).toISOString();
  const ipAddress = request.headers.get('CF-Connecting-IP') || null;
  const userAgent = request.headers.get('User-Agent') || null;

  await db.prepare(`
    INSERT INTO admin_sessions (token, user_id, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(token, user.id, expiresAt, ipAddress, userAgent).run();

  await db.prepare(`
    UPDATE admin_users
    SET last_login_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(user.id).run();

  return jsonResponse({
    success: true,
    token,
    expiresAt,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username,
      role: user.role
    }
  }, 200, env);
}

async function handleAdminSession(request, env) {
  const session = await requireAdminSession(request, env);
  if (!session.ok) return session.response;

  return jsonResponse({
    authenticated: true,
    user: {
      id: session.data.userId,
      username: session.data.username,
      displayName: session.data.displayName,
      role: session.data.role
    },
    expiresAt: session.data.expiresAt
  }, 200, env);
}

async function handleAdminLogout(request, env) {
  const db = requireDb(env);
  const token = extractBearerToken(request);
  if (!token) {
    return jsonResponse({ error: 'Missing session token' }, 401, env);
  }

  await db.prepare(`
    UPDATE admin_sessions
    SET is_revoked = 1,
        last_seen_at = datetime('now')
    WHERE token = ?
  `).bind(token).run();

  return jsonResponse({ success: true }, 200, env);
}

async function handleAdminLeads(request, env) {
  const session = await requireAdminSession(request, env);
  if (!session.ok) return session.response;

  const db = requireDb(env);
  const url = new URL(request.url);
  const status = safeString(url.searchParams.get('status'));
  const level = safeString(url.searchParams.get('level'));
  const query = safeString(url.searchParams.get('q'));
  const sortByRaw = safeString(url.searchParams.get('sortBy')) || 'created_at';
  const sortDirRaw = (safeString(url.searchParams.get('sortDir')) || 'desc').toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 25)));
  const offset = (page - 1) * limit;

  const allowedSortBy = new Set(['created_at', 'first_name', 'last_name', 'email', 'phone', 'spanish_level', 'name']);
  const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : 'created_at';
  const sortDir = sortDirRaw === 'asc' ? 'ASC' : 'DESC';
  let orderByClause = 'created_at DESC';
  if (sortBy === 'name') {
    orderByClause = `last_name ${sortDir}, first_name ${sortDir}`;
  } else {
    orderByClause = `${sortBy} ${sortDir}`;
  }

  const where = [];
  const params = [];

  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  if (level) {
    where.push('spanish_level = ?');
    params.push(level);
  }

  if (query) {
    const q = `%${query}%`;
    where.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    params.push(q, q, q, q);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const leadsResult = await db.prepare(`
    SELECT
      id,
      external_id,
      first_name,
      last_name,
      email,
      phone,
      spanish_level,
      referral_source,
      status,
      assigned_to,
      last_contacted_at,
      created_at,
      updated_at
    FROM leads
    ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  const countResult = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM leads
    ${whereClause}
  `).bind(...params).first();

  const summaryResult = await db.prepare(`
    SELECT
      COUNT(*) AS total_leads,
      SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS leads_today,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_leads,
      SUM(CASE WHEN status = 'enrolled' THEN 1 ELSE 0 END) AS enrolled_leads
    FROM leads
    ${whereClause}
  `).bind(...params).first();

  const statusBreakdown = await db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM leads
    ${whereClause}
    GROUP BY status
    ORDER BY count DESC
  `).bind(...params).all();

  return jsonResponse({
    leads: leadsResult.results || [],
    pagination: {
      page,
      limit,
      total: Number(countResult?.count || 0)
    },
    summary: {
      totalLeads: Number(summaryResult?.total_leads || 0),
      leadsToday: Number(summaryResult?.leads_today || 0),
      newLeads: Number(summaryResult?.new_leads || 0),
      enrolledLeads: Number(summaryResult?.enrolled_leads || 0)
    },
    statusBreakdown: statusBreakdown.results || []
  }, 200, env);
}

async function handleAdminLeadUpdate(request, env, leadId) {
  const session = await requireAdminSession(request, env);
  if (!session.ok) return session.response;

  const db = requireDb(env);
  const payload = await request.json();
  const updates = [];
  const params = [];

  if (payload.status !== undefined) {
    const status = safeString(payload.status);
    if (!STATUS_VALUES.has(status)) {
      return jsonResponse({ error: 'Invalid status value' }, 400, env);
    }
    updates.push('status = ?');
    params.push(status);
  }

  if (payload.adminNotes !== undefined) {
    updates.push('admin_notes = ?');
    params.push(safeString(payload.adminNotes));
  }

  if (payload.assignedTo !== undefined) {
    updates.push('assigned_to = ?');
    params.push(safeString(payload.assignedTo));
  }

  if (payload.lastContactedAt !== undefined) {
    updates.push('last_contacted_at = ?');
    params.push(safeString(payload.lastContactedAt));
  }

  if (updates.length === 0) {
    return jsonResponse({ error: 'No valid fields to update' }, 400, env);
  }

  updates.push("updated_at = datetime('now')");
  updates.push('updated_by = ?');
  params.push(session.data.username, leadId);

  const result = await db.prepare(`
    UPDATE leads
    SET ${updates.join(', ')}
    WHERE id = ?
  `).bind(...params).run();

  if ((result.meta?.changes || 0) === 0) {
    return jsonResponse({ error: 'Lead not found' }, 404, env);
  }

  return jsonResponse({ success: true }, 200, env);
}

async function handleAdminLeadDetail(request, env, leadId) {
  const session = await requireAdminSession(request, env);
  if (!session.ok) return session.response;

  const db = requireDb(env);
  const row = await db.prepare(`
    SELECT *
    FROM leads
    WHERE id = ?
    LIMIT 1
  `).bind(leadId).first();

  if (!row) {
    return jsonResponse({ error: 'Lead not found' }, 404, env);
  }

  return jsonResponse({ lead: row }, 200, env);
}

async function handleAnalyticsSummary(request, env) {
  const session = await requireAdminSession(request, env);
  if (!session.ok) return session.response;

  const db = requireDb(env);
  const url = new URL(request.url);
  const rawDate = safeString(url.searchParams.get('date'));
  const selectedDate = isValidMetricDate(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10);
  const hasEventDateColumn = await analyticsEventsHasEventDateColumn(db);
  const dateExpr = hasEventDateColumn
    ? "COALESCE(event_date, json_extract(metadata_json, '$.localDate'), date(created_at))"
    : "COALESCE(json_extract(metadata_json, '$.localDate'), date(created_at))";

  // Single source of truth: query analytics_events directly.
  // COALESCE(event_date, date(created_at)) handles rows written before
  // migration 004 that have no event_date column value.
  const dailyFromEvents = await db.prepare(`
    SELECT
      SUM(CASE WHEN event_name = 'page_view'           THEN 1 ELSE 0 END) AS page_views,
      SUM(CASE WHEN event_name = 'cta_click'           THEN 1 ELSE 0 END) AS cta_clicks,
      SUM(CASE WHEN event_name = 'form_open'           THEN 1 ELSE 0 END) AS form_opens,
      SUM(CASE WHEN event_name = 'form_submit_attempt' THEN 1 ELSE 0 END) AS form_submit_attempts,
      SUM(CASE WHEN event_name = 'form_submit_success' THEN 1 ELSE 0 END) AS form_submit_success,
      SUM(CASE WHEN event_name = 'form_submit_fail'    THEN 1 ELSE 0 END) AS form_submit_fail
    FROM analytics_events
    WHERE ${dateExpr} = ?
  `).bind(selectedDate).first();

  const daily = {
    metric_date:           selectedDate,
    page_views:            Number(dailyFromEvents?.page_views            || 0),
    cta_clicks:            Number(dailyFromEvents?.cta_clicks            || 0),
    form_opens:            Number(dailyFromEvents?.form_opens            || 0),
    form_submit_attempts:  Number(dailyFromEvents?.form_submit_attempts  || 0),
    form_submit_success:   Number(dailyFromEvents?.form_submit_success   || 0),
    form_submit_fail:      Number(dailyFromEvents?.form_submit_fail      || 0)
  };

  const statusRows = await db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM leads
    GROUP BY status
    ORDER BY count DESC
  `).all();

  const dailyHistoryRows = await db.prepare(`
    SELECT
      ${dateExpr}                                                             AS metric_date,
      SUM(CASE WHEN event_name = 'page_view'           THEN 1 ELSE 0 END)   AS page_views,
      SUM(CASE WHEN event_name = 'cta_click'           THEN 1 ELSE 0 END)   AS cta_clicks,
      SUM(CASE WHEN event_name = 'form_open'           THEN 1 ELSE 0 END)   AS form_opens,
      SUM(CASE WHEN event_name = 'form_submit_attempt' THEN 1 ELSE 0 END)   AS form_submit_attempts,
      SUM(CASE WHEN event_name = 'form_submit_success' THEN 1 ELSE 0 END)   AS form_submit_success,
      SUM(CASE WHEN event_name = 'form_submit_fail'    THEN 1 ELSE 0 END)   AS form_submit_fail
    FROM analytics_events
    GROUP BY ${dateExpr}
    ORDER BY metric_date DESC
    LIMIT 30
  `).all();

  return jsonResponse({
    selectedDate,
    daily,
    today: daily,
    dailyHistory: normalizeDailyRows(dailyHistoryRows.results || []),
    leadStatus: statusRows.results || []
  }, 200, env);
}

async function handleAnalyticsDebug(request, env) {
  const session = await requireAdminSession(request, env);
  if (!session.ok) return session.response;

  const db = requireDb(env);
  const hasEventDateColumn = await analyticsEventsHasEventDateColumn(db);
  const dateExpr = hasEventDateColumn
    ? "COALESCE(event_date, json_extract(metadata_json, '$.localDate'), date(created_at))"
    : "COALESCE(json_extract(metadata_json, '$.localDate'), date(created_at))";

  const recentEvents = hasEventDateColumn
    ? await db.prepare(`
      SELECT id, event_name, event_category, source_page, event_date, created_at
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT 20
    `).all()
    : await db.prepare(`
      SELECT id, event_name, event_category, source_page, NULL AS event_date, created_at
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

  const eventDateSummary = await db.prepare(`
    SELECT
      ${dateExpr} AS event_date,
      COUNT(*) AS total_events,
      SUM(CASE WHEN event_name = 'page_view'           THEN 1 ELSE 0 END) AS page_views,
      SUM(CASE WHEN event_name = 'form_submit_success' THEN 1 ELSE 0 END) AS form_submit_success
    FROM analytics_events
    GROUP BY ${dateExpr}
    ORDER BY event_date DESC
    LIMIT 14
  `).all();

  return jsonResponse({
    recentEvents: recentEvents.results || [],
    eventDateSummary: eventDateSummary.results || []
  }, 200, env);
}

function buildCorsHeaders(env) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function jsonResponse(payload, status, env) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: buildCorsHeaders(env)
  });
}

function requireDb(env) {
  if (!env.DB) {
    throw new Error('Missing D1 binding. Bind database as env.DB.');
  }
  return env.DB;
}

function extractBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

async function requireAdminSession(request, env) {
  const token = extractBearerToken(request);
  if (!token) {
    return { ok: false, response: jsonResponse({ error: 'Missing session token' }, 401, env) };
  }

  const db = requireDb(env);
  const sessionRow = await db.prepare(`
    SELECT
      s.token,
      s.user_id,
      s.expires_at,
      s.is_revoked,
      u.username,
      u.display_name,
      u.role,
      u.is_active
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.token = ?
    LIMIT 1
  `).bind(token).first();

  if (!sessionRow || Number(sessionRow.is_revoked) === 1 || Number(sessionRow.is_active) !== 1) {
    return { ok: false, response: jsonResponse({ error: 'Invalid session' }, 401, env) };
  }

  const expiresAt = new Date(sessionRow.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    return { ok: false, response: jsonResponse({ error: 'Session expired' }, 401, env) };
  }

  await db.prepare(`
    UPDATE admin_sessions
    SET last_seen_at = datetime('now')
    WHERE token = ?
  `).bind(token).run();

  return {
    ok: true,
    data: {
      token: sessionRow.token,
      userId: sessionRow.user_id,
      username: sessionRow.username,
      displayName: sessionRow.display_name || sessionRow.username,
      role: sessionRow.role,
      expiresAt: sessionRow.expires_at
    }
  };
}

function safeString(value) {
  if (value === undefined || value === null) return null;
  return String(value).trim();
}

function isValidMetricDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function resolveMetricDate(events) {
  for (const event of events) {
    const directDate = safeString(event?.metricDate);
    if (isValidMetricDate(directDate)) return directDate;

    const metadataDate = safeString(event?.metadata?.localDate);
    if (isValidMetricDate(metadataDate)) return metadataDate;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeDailyRows(rows) {
  return rows.map((row) => ({
    metric_date: row.metric_date,
    page_views: Number(row.page_views || 0),
    cta_clicks: Number(row.cta_clicks || 0),
    form_opens: Number(row.form_opens || 0),
    form_submit_attempts: Number(row.form_submit_attempts || 0),
    form_submit_success: Number(row.form_submit_success || 0),
    form_submit_fail: Number(row.form_submit_fail || 0)
  }));
}

async function analyticsEventsHasEventDateColumn(db) {
  if (typeof analyticsEventDateColumnCache === 'boolean') {
    return analyticsEventDateColumnCache;
  }

  try {
    const tableInfo = await db.prepare(`
      PRAGMA table_info('analytics_events')
    `).all();

    analyticsEventDateColumnCache = Boolean(
      (tableInfo.results || []).some((column) => safeString(column.name) === 'event_date')
    );
  } catch (_error) {
    analyticsEventDateColumnCache = false;
  }

  return analyticsEventDateColumnCache;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  // Compatibility mode for quick setup only.
  // Store as: plain$YourPasswordHere
  if (storedHash.startsWith('plain$')) {
    const expected = storedHash.slice(6);
    return timingSafeEqual(password, expected);
  }

  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;

    const iterations = Number(parts[1]);
    const salt = parts[2];
    const expectedHex = parts[3];
    if (!iterations || !salt || !expectedHex) return false;

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: encoder.encode(salt),
        iterations
      },
      keyMaterial,
      256
    );

    const derivedHex = bufferToHex(new Uint8Array(derivedBits));
    return timingSafeEqual(derivedHex, expectedHex);
  }

  if (storedHash.startsWith('sha256$')) {
    const expectedHex = storedHash.split('$')[1];
    if (!expectedHex) return false;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const digestHex = bufferToHex(new Uint8Array(digest));
    return timingSafeEqual(digestHex, expectedHex);
  }

  return false;
}

function bufferToHex(buffer) {
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate HTML email content from form data 
 */
function generateEmailHtml(formData) {
  const scheduleList = Array.isArray(formData.schedule)
    ? formData.schedule.join(', ')
    : formData.schedule || 'Not specified';

  const referralOther = formData.referralSource === 'Other' ? formData.referralOther : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e6294; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h2 { margin: 0; }
        .section { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px; }
        .section:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #1e6294; margin-top: 10px; }
        .value { margin-left: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
        </div>

        <div class="section">
          <div class="label">First Name:</div>
          <div class="value">${escapeHtml(formData.firstName)}</div>
        </div>

        <div class="section">
          <div class="label">Last Name:</div>
          <div class="value">${escapeHtml(formData.lastName)}</div>
        </div>

        <div class="section">
          <div class="label">Email:</div>
          <div class="value"><a href="mailto:${escapeHtml(formData.email)}">${escapeHtml(formData.email)}</a></div>
        </div>

        <div class="section">
          <div class="label">Phone:</div>
          <div class="value">${escapeHtml(formData.phone)}</div>
        </div>

        <div class="section">
          <div class="label">Spanish Level:</div>
          <div class="value">${escapeHtml(formData.level)}</div>
        </div>

        <div class="section">
          <div class="label">Experience:</div>
          <div class="value">${formData.experience ? escapeHtml(formData.experience) : 'Not provided'}</div>
        </div>

        <div class="section">
          <div class="label">Available Schedule:</div>
          <div class="value">${scheduleList}</div>
        </div>

        ${formData.scheduleOther ? `
        <div class="section">
          <div class="label">Schedule - Other:</div>
          <div class="value">${escapeHtml(formData.scheduleOther)}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="label">Referral Source:</div>
          <div class="value">${escapeHtml(formData.referralSource)}</div>
        </div>

        ${referralOther ? `
        <div class="section">
          <div class="label">Referral - Other:</div>
          <div class="value">${escapeHtml(referralOther)}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="label">Comments:</div>
          <div class="value">${formData.comments ? escapeHtml(formData.comments) : 'None'}</div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f69521; color: #999; font-size: 12px;">
          <p>This email was sent from the District Spanish contact form.</p>
          <p>Submitted on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send email using Resend API
 */
async function sendEmailWithResend(apiKey, htmlContent, senderEmail) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'noreply@districtspanish.com',
        to: 'team@districtspanish.com',
        subject: `New Contact Form Submission from ${senderEmail}`,
        html: htmlContent,
        reply_to: senderEmail
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Escape HTML special characters for security
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
