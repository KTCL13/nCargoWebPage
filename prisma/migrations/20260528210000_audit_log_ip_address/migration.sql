-- Add ip_address to audit_logs for mandatory IP tracking on sensitive actions.
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
