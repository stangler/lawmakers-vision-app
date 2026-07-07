import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { NeonAdapter } from "@/lib/auth-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: NeonAdapter(),

  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from:
        process.env.EMAIL_FROM ??
        process.env.RESEND_FROM_EMAIL ??
        "noreply@example.com",

      // ─── マジックリンクのメール本文をカスタマイズ ───
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        // 開発環境: APIキーがない場合はコンソールに出力
        if (!provider.apiKey && process.env.NODE_ENV === "development") {
          console.log(
            JSON.stringify({
              event: "magic_link_dev",
              to: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
              url,
              timestamp: new Date().toISOString(),
            }),
          );
          return;
        }

        const { Resend: ResendClient } = await import("resend");
        const client = new ResendClient(provider.apiKey);

        const fromEmail = provider.from || "noreply@example.com";
        const result = await client.emails.send({
          from: fromEmail,
          to: email,
          subject: "ログインリンク - 国会議員ビジョン",
          html: buildEmailHtml(url),
          text: buildEmailText(url),
        });

        if (result.error) {
          throw new Error(
            `Resend でメール送信に失敗しました: ${JSON.stringify(result.error)}`,
          );
        }
      },
    }),
  ],

  // ─── セッション戦略 ─────────────────────────────────────────
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30日
    updateAge: 24 * 60 * 60, // 24時間ごとに更新
  },

  // ─── ページ ─────────────────────────────────────────────────
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/login",
  },

  // ─── コールバック ────────────────────────────────────────────
  callbacks: {
    async session({ session, user }) {
      // デバッグログ
      if (process.env.NODE_ENV === "development") {
        console.log("[Session Callback]", {
          userId: user.id,
          userEmailVerified: user.emailVerified,
          sessionUserId: session.user?.id,
          sessionEmailVerified: session.user?.emailVerified,
        });
      }

      // セッションオブジェクトにユーザーIDとメール認証状態を追加
      if (session.user) {
        session.user.id = user.id;
        session.user.emailVerified = user.emailVerified;
      }
      return session;
    },
  },

  // ─── イベント ────────────────────────────────────────────────
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`[Auth] 新規ユーザー登録: ${user.email}`);
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
  trustHost: true,
});

// ─── メールテンプレート ──────────────────────────────────────────

function buildEmailHtml(url: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ログインリンク</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <!-- ヘッダー -->
          <tr>
            <td style="background:#1a56db;padding:24px 32px;">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                🗾 国会議員ビジョン
              </p>
            </td>
          </tr>
          <!-- 本文 -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#111;font-size:16px;line-height:1.6;">
                以下のボタンをクリックしてログインしてください。<br />
                このリンクは <strong>24時間</strong> 有効です。
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:14px;">
                ※ このメールに心当たりがない場合は無視してください。
              </p>
              <a href="${url}"
                 style="display:inline-block;background:#1a56db;color:#fff;
                        text-decoration:none;padding:14px 28px;border-radius:6px;
                        font-size:16px;font-weight:600;">
                ログインする
              </a>
            </td>
          </tr>
          <!-- フッター -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #eee;">
              <p style="margin:0;color:#999;font-size:12px;">
                ボタンが機能しない場合は下記URLをブラウザに貼り付けてください：<br />
                <a href="${url}" style="color:#1a56db;word-break:break-all;">${url}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildEmailText(url: string): string {
  return [
    "【国会議員ビジョン】ログインリンク",
    "",
    "以下のURLをクリックしてログインしてください（有効期限：24時間）",
    "",
    url,
    "",
    "このメールに心当たりがない場合は無視してください。",
  ].join("\n");
}
