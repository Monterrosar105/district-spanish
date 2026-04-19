-- 001_init.sql
-- Base leads table for FREE Level Assessment form submissions.

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
