#!/bin/bash
# lawmakers-app Next.js セットアップスクリプト
# コンテナ作成後に一度だけ実行してください

set -e

echo "📦 Next.js プロジェクトを作成します..."

pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --import-alias "@/*" \
  --empty

echo "📦 依存関係をインストールします..."

# アプリ本体
pnpm add d3 topojson-client framer-motion

# 認証 (Auth.js v5 beta)
pnpm add next-auth@beta

# DB (Vercel Postgres)
pnpm add @vercel/postgres

# KV / レート制限 (Upstash)
pnpm add @upstash/redis @upstash/ratelimit

# メール送信 (Resend - 現行と同じ)
pnpm add resend

# 型定義
pnpm add -D @types/d3 @types/topojson-client @types/topojson-specification

# テスト (現行と同じVitest構成)
pnpm add -D vitest @vitest/coverage-v8 @vitest/ui \
  @testing-library/react @testing-library/jest-dom \
  @vitejs/plugin-react jsdom

# Playwright (E2E)
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium

echo "✅ セットアップ完了!"
echo ""
echo "次のステップ:"
echo "  1. .env.local を作成して環境変数を設定してください (README参照)"
echo "  2. pnpm dev でNext.js 開発サーバーを起動できます"
