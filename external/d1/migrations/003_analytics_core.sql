-- 003_analytics_core.sql
-- Essential funnel analytics events and daily rollup counters.

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  source_page TEXT,
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
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
