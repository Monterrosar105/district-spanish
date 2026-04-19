-- seed_admin.sql
-- Create initial admin user.
-- Replace password hash with a generated value before running.
-- Supported formats in worker:
-- 1) pbkdf2$<iterations>$<salt>$<hash_hex>
-- 2) sha256$<hash_hex>  (compatibility only)
-- 3) plain$<password>    (quick setup only; not recommended for production)

INSERT INTO admin_users (username, password_hash, display_name, role, is_active)
VALUES ('admin', 'pbkdf2$210000$REPLACE_WITH_RANDOM_SALT$REPLACE_WITH_HASH_HEX', 'Administrator', 'admin', 1)
ON CONFLICT(username) DO NOTHING;
