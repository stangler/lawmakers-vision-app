-- =====================================================
-- Auth.js v5 用テーブル
-- Neon (PostgreSQL) に対して実行してください
-- =====================================================

-- UUID 拡張（Neon ではデフォルト有効）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── users ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name           TEXT,
  email          TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── accounts ────────────────────────────────────────
-- OAuth / メールプロバイダのアカウントリンク
CREATE TABLE IF NOT EXISTS accounts (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL,              -- "email" | "oauth" | "oidc"
  provider             TEXT NOT NULL,
  provider_account_id  TEXT NOT NULL,
  refresh_token        TEXT,
  access_token         TEXT,
  expires_at           BIGINT,
  token_type           TEXT,
  scope                TEXT,
  id_token             TEXT,
  session_state        TEXT,
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);

-- ─── sessions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT UNIQUE NOT NULL,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- ─── verification_tokens ─────────────────────────────
-- メール認証用のマジックリンクトークン
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- =====================================================
-- 確認用クエリ
-- =====================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
