-- 004_analytics_event_date.sql
-- Adds event_date column (local calendar date from browser) to analytics_events.
-- This fixes the UTC timezone mismatch that caused dashboard metrics to show
-- zeros when admins are in non-UTC timezones.
--
-- Existing rows will have event_date = NULL.
-- All queries use COALESCE(event_date, date(created_at)) so old data still shows.

ALTER TABLE analytics_events ADD COLUMN event_date TEXT;

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_date
  ON analytics_events(event_date);
