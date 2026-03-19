/**
 * Rate Limiting Library
 * Upstash Redis + @upstash/ratelimit を使用（Next.js版）
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================
// Redis & Ratelimit インスタンス
// ============================================

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// レート制限設定（旧 RATE_LIMITS と同じウィンドウ・上限）
const LIMITERS = {
  signup: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'rl:signup',
    }),
  login: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'rl:login',
    }),
  resend: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'rl:resend',
    }),
} as const;

type Action = keyof typeof LIMITERS;

// ============================================
// Public Functions
// ============================================

/**
 * レート制限チェック & インクリメント
 * @returns allowed: 許可されたか, remaining: 残り回数
 */
export async function checkAndIncrementRate(
  action: Action,
  identifier: string   // IP または "email:hash" など
): Promise<{ allowed: boolean; remaining: number }> {
  // ローカル開発や環境変数未設定時はスキップ
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { allowed: true, remaining: Infinity };
  }

  try {
    const limiter = LIMITERS[action]();
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    // Redis 接続エラーはスキップ（フォールオープン）
    console.error(`Rate limit check failed for ${action}:`, error);
    return { allowed: true, remaining: Infinity };
  }
}

export async function checkAndIncrementSignupRate(
  ip: string,
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  // IP とメールの両方チェックし、厳しい方を採用
  const [ipResult, emailResult] = await Promise.all([
    checkAndIncrementRate('signup', `ip:${ip}`),
    checkAndIncrementRate('signup', `email:${email}`),
  ]);

  return {
    allowed: ipResult.allowed && emailResult.allowed,
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
  };
}

export async function checkAndIncrementLoginRate(
  ip: string,
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  const [ipResult, emailResult] = await Promise.all([
    checkAndIncrementRate('login', `ip:${ip}`),
    checkAndIncrementRate('login', `email:${email}`),
  ]);

  return {
    allowed: ipResult.allowed && emailResult.allowed,
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
  };
}

export async function checkAndIncrementResendRate(
  ip: string,
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  const [ipResult, emailResult] = await Promise.all([
    checkAndIncrementRate('resend', `ip:${ip}`),
    checkAndIncrementRate('resend', `email:${email}`),
  ]);

  return {
    allowed: ipResult.allowed && emailResult.allowed,
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
  };
}

// ============================================
// IP Extraction（Next.js Request 対応）
// ============================================

/**
 * Next.js の Request / headers からクライアント IP を取得
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;

  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = request.headers.get('X-Real-IP');
  if (realIp) return realIp;

  return 'unknown';
}
