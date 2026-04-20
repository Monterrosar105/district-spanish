-- Consolidated D1 schema for District Spanish
-- Generated from migrations. Keep this file in sync with migration files.

CREATE TABLE IF NOT EXISTS leads (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	external_id TEXT NOT NULL UNIQUE,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	email TEXT NOT NULL,
	phone TEXT NOT NULL,
	spanish_level TEXT NOT NULL,
	spanish_experience TEXT,
	schedule_json TEXT NOT NULL DEFAULT '[]',
	schedule_other TEXT,
	referral_source TEXT NOT NULL,
	referral_other TEXT,
	comments TEXT,
	status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'follow-up', 'trial-scheduled', 'enrolled', 'closed-lost')),
	admin_notes TEXT,
	assigned_to TEXT,
	last_contacted_at TEXT,
	ip_address TEXT,
	user_agent TEXT,
	referrer TEXT,
	utm_source TEXT,
	utm_medium TEXT,
	utm_campaign TEXT,
	form_version TEXT DEFAULT 'v1',
	email_sent_at TEXT,
	email_delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_delivery_status IN ('pending', 'sent', 'failed')),
	email_error_message TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

CREATE TABLE IF NOT EXISTS admin_users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	display_name TEXT,
	role TEXT NOT NULL DEFAULT 'admin',
	is_active INTEGER NOT NULL DEFAULT 1,
	last_login_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
	token TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
	ip_address TEXT,
	user_agent TEXT,
	is_revoked INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS analytics_events (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	session_id TEXT NOT NULL,
	event_name TEXT NOT NULL,
	event_category TEXT,
	source_page TEXT,
	metadata_json TEXT,
	ip_address TEXT,
	user_agent TEXT,
	event_date TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

CREATE TABLE IF NOT EXISTS daily_metrics (
	metric_date TEXT PRIMARY KEY,
	page_views INTEGER NOT NULL DEFAULT 0,
	cta_clicks INTEGER NOT NULL DEFAULT 0,
	form_opens INTEGER NOT NULL DEFAULT 0,
	form_submit_attempts INTEGER NOT NULL DEFAULT 0,
	form_submit_success INTEGER NOT NULL DEFAULT 0,
	form_submit_fail INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
