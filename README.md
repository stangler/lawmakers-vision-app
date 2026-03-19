# Lawmakers App (Next.js)

日本の衆参議院議員をインタラクティブな地図で可視化するWebアプリ。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| 地図 | D3.js + TopoJSON |
| 認証 | Auth.js v5 (next-auth) |
| DB | Vercel Postgres (Neon) |
| KV / レート制限 | Upstash Redis |
| メール | Resend |
| テスト | Vitest + Playwright |
| ホスティング | Vercel |

## セットアップ

### 1. Dev Container で開く

VS Code で「Reopen in Container」を選択してください。
Node.js 24 + pnpm の環境が自動で構築されます。

### 2. プロジェクト初期化

コンテナ起動後、ターミナルで以下を実行：

```bash
chmod +x setup.sh
./setup.sh
```

### 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して各サービスのキーを設定してください。

#### Vercel Postgres のセットアップ
1. [Vercel ダッシュボード](https://vercel.com) でプロジェクトを作成
2. Storage タブから Postgres を追加
3. `.env.local` に接続情報を貼り付け

#### Upstash Redis のセットアップ
1. [Upstash](https://upstash.com) でRedisデータベースを作成
2. REST API の URL とトークンを `.env.local` に設定

#### Resend のセットアップ
1. [Resend](https://resend.com) でAPIキーを取得
2. 送信元ドメインを設定

### 4. DBマイグレーション

```bash
pnpm db:migrate
```

### 5. 開発サーバー起動

```bash
pnpm dev
```

http://localhost:3000 でアクセスできます。

## スクリプト

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm start        # プロダクションサーバー起動
pnpm test         # ユニットテスト
pnpm test:ui      # テストUI
pnpm test:e2e     # E2Eテスト (Playwright)
pnpm lint         # ESLint
pnpm type-check   # 型チェック
```

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # 地図トップ（公開）
│   ├── (auth)/                  # 認証不要グループ
│   │   ├── login/page.tsx
│   │   └── verify/page.tsx
│   ├── (protected)/             # 認証必須グループ
│   │   └── news/page.tsx
│   ├── members/
│   │   └── [id]/page.tsx        # 議員個別ページ（SSG）
│   └── api/
│       ├── auth/[...nextauth]/  # Auth.js
│       ├── news/route.ts        # RSS取得
│       └── ogp/route.ts        # OGP画像取得
├── components/                  # UIコンポーネント
├── hooks/                       # カスタムフック
├── lib/                         # ユーティリティ
├── types/                       # 型定義
└── middleware.ts                # ルート保護
```

## 旧プロジェクトからの移植

以下は変更なしでコピーできます：

- `src/lib/parseMembers.ts`
- `src/lib/memberMatcher.ts`
- `src/lib/memberImage.ts`
- `src/lib/prefectures.ts`
- `src/types/member.ts`
- `src/types/news.ts`
- `src/lib/*.test.ts`
- `public/japan-topo.json`
- `public/data/`（議員データ・画像）

以下は `"use client"` を先頭に追加するだけ：

- `JapanMap.tsx`、`MemberPanel.tsx`、`NewsPanel.tsx` など全コンポーネント
- `useMapZoom.ts`、`useNewsData.ts` などフック類
