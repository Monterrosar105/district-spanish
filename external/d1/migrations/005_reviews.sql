-- 005_reviews.sql
-- Moderated review submissions for homepage testimonials feed.

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_initial TEXT NOT NULL,
  location TEXT NOT NULL,
  review_text TEXT NOT NULL,
  review_spanish TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  approved_at TEXT,
  approved_by TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved_at ON reviews(approved_at DESC);
