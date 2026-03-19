import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ url: null }, { status: 400 });

  try {
    const parsed = new URL(url);
    if (
      !parsed.hostname.endsWith("nhk.or.jp") &&
      !parsed.hostname.endsWith("nhk.jp")
    ) {
      return NextResponse.json({ url: null }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) return NextResponse.json({ url: null });

    const html = await response.text();

    const ogMatch =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      );
    if (ogMatch?.[1]) return NextResponse.json({ url: ogMatch[1] });

    const twitterMatch =
      html.match(
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
      );
    if (twitterMatch?.[1]) return NextResponse.json({ url: twitterMatch[1] });

    return NextResponse.json({ url: null });
  } catch (e) {
    console.error("OGP fetch error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ url: null });
  } finally {
    clearTimeout(timer);
  }
}
