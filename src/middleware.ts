import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証が必要なルート
const PROTECTED_ROUTES = ["/", "/news"];

// 認証済みユーザーがアクセスできないルート（ログイン済みなら / にリダイレクト）
const AUTH_ROUTES = ["/login", "/verify"];

export default auth((req: NextRequest) => {
  const { nextUrl } = req;
  const session = (req as any).auth;

  // デバッグログ
  if (process.env.NODE_ENV === "development") {
    console.log("[Middleware]", {
      path: nextUrl.pathname,
      hasSession: !!session,
      hasUser: !!session?.user,
      emailVerified: session?.user?.emailVerified,
      isLoggedIn: !!session?.user && !!session.user?.emailVerified,
    });
  }

  const isLoggedIn = !!session?.user && !!session.user?.emailVerified;

  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/"),
  );

  const isAuthRoute = AUTH_ROUTES.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/"),
  );

  // 未ログイン → 保護ルートへのアクセスは /login にリダイレクト
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済み → ログイン/確認ページへのアクセスは / にリダイレクト
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Auth.js 内部ルート・静的ファイル・画像は除外
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|json|md)).*)",
  ],
};
