/**
 * Auth.js v5 用カスタム Neon アダプター
 *
 * @auth/pg-adapter をベースに @neondatabase/serverless の
 * HTTP クライアント向けに実装。
 *
 * 参考: https://authjs.dev/getting-started/adapters/custom
 */

import type { Adapter, AdapterUser, AdapterSession, AdapterAccount, VerificationToken } from "next-auth/adapters";
import { sql } from "./db";

export function NeonAdapter(): Adapter {
  return {
    // ─── User ───────────────────────────────────────────────
    async createUser(user) {
      const rows = await sql`
        INSERT INTO users (email, email_verified, name, image)
        VALUES (${user.email}, ${user.emailVerified ?? null}, ${user.name ?? null}, ${user.image ?? null})
        RETURNING id, email, email_verified, name, image
      `;
      return toUser(rows[0]);
    },

    async getUser(id) {
      const rows = await sql`
        SELECT id, email, email_verified, name, image
        FROM users WHERE id = ${id}
      `;
      return rows[0] ? toUser(rows[0]) : null;
    },

    async getUserByEmail(email) {
      const rows = await sql`
        SELECT id, email, email_verified, name, image
        FROM users WHERE email = ${email}
      `;
      return rows[0] ? toUser(rows[0]) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const rows = await sql`
        SELECT u.id, u.email, u.email_verified, u.name, u.image
        FROM users u
        JOIN accounts a ON a.user_id = u.id
        WHERE a.provider = ${provider}
          AND a.provider_account_id = ${providerAccountId}
      `;
      return rows[0] ? toUser(rows[0]) : null;
    },

    async updateUser(user) {
      const rows = await sql`
        UPDATE users
        SET
          email          = COALESCE(${user.email ?? null}, email),
          email_verified = COALESCE(${user.emailVerified ?? null}, email_verified),
          name           = COALESCE(${user.name ?? null}, name),
          image          = COALESCE(${user.image ?? null}, image)
        WHERE id = ${user.id}
        RETURNING id, email, email_verified, name, image
      `;
      return toUser(rows[0]);
    },

    async deleteUser(userId) {
      await sql`DELETE FROM users WHERE id = ${userId}`;
    },

    // ─── Account ─────────────────────────────────────────────
    async linkAccount(account) {
      await sql`
        INSERT INTO accounts (
          user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at,
          token_type, scope, id_token, session_state
        ) VALUES (
          ${account.userId},
          ${account.type},
          ${account.provider},
          ${account.providerAccountId},
          ${account.refresh_token ?? null},
          ${account.access_token ?? null},
          ${account.expires_at ?? null},
          ${account.token_type ?? null},
          ${account.scope ?? null},
          ${account.id_token ?? null},
          ${account.session_state ?? null}
        )
      `;
      return account as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await sql`
        DELETE FROM accounts
        WHERE provider = ${provider}
          AND provider_account_id = ${providerAccountId}
      `;
    },

    // ─── Session ─────────────────────────────────────────────
    async createSession(session) {
      const rows = await sql`
        INSERT INTO sessions (session_token, user_id, expires)
        VALUES (${session.sessionToken}, ${session.userId}, ${session.expires})
        RETURNING session_token, user_id, expires
      `;
      return toSession(rows[0]);
    },

    async getSessionAndUser(sessionToken) {
      const rows = await sql`
        SELECT
          s.session_token, s.user_id, s.expires,
          u.id, u.email, u.email_verified, u.name, u.image
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.session_token = ${sessionToken}
          AND s.expires > NOW()
      `;
      if (!rows[0]) return null;
      return {
        session: toSession(rows[0]),
        user: toUser(rows[0]),
      };
    },

    async updateSession(session) {
      const rows = await sql`
        UPDATE sessions
        SET expires = ${session.expires}
        WHERE session_token = ${session.sessionToken}
        RETURNING session_token, user_id, expires
      `;
      return rows[0] ? toSession(rows[0]) : null;
    },

    async deleteSession(sessionToken) {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    },

    // ─── VerificationToken ───────────────────────────────────
    async createVerificationToken(token) {
      const rows = await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${token.identifier}, ${token.token}, ${token.expires})
        RETURNING identifier, token, expires
      `;
      return toVerificationToken(rows[0]);
    },

    async useVerificationToken({ identifier, token }) {
      const rows = await sql`
        DELETE FROM verification_tokens
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING identifier, token, expires
      `;
      return rows[0] ? toVerificationToken(rows[0]) : null;
    },
  };
}

// ─── 型変換ヘルパー ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUser(row: any): AdapterUser {
  return {
    id: String(row.id),
    email: row.email,
    emailVerified: row.email_verified ? new Date(row.email_verified) : null,
    name: row.name ?? null,
    image: row.image ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSession(row: any): AdapterSession {
  return {
    sessionToken: row.session_token,
    userId: String(row.user_id),
    expires: new Date(row.expires),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVerificationToken(row: any): VerificationToken {
  return {
    identifier: row.identifier,
    token: row.token,
    expires: new Date(row.expires),
  };
}
