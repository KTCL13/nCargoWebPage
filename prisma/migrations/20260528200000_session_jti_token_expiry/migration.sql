-- Add token_jti to user_sessions for per-session JWT invalidation.
-- The column is nullable so existing sessions remain valid during rollout.
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS token_jti VARCHAR(36);

-- Unique constraint — each issued JWT maps to at most one session row.
ALTER TABLE user_sessions
  ADD CONSTRAINT uq_user_sessions_token_jti UNIQUE (token_jti);

-- Index used by the per-request session validation query (auth-guard).
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_jti
  ON user_sessions(token_jti)
  WHERE token_jti IS NOT NULL;
