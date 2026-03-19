import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { NewsItem } from "@/types/news";

const RSS_FEEDS = [
  "https://www.nhk.or.jp/rss/news/cat0.xml",
  "https://www.nhk.or.jp/rss/news/cat1.xml",
  "https://www.nhk.or.jp/rss/news/cat2.xml",
  "https://www.nhk.or.jp/rss/news/cat3.xml",
  "https://www.nhk.or.jp/rss/news/cat4.xml",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  election: ["選挙", "投票", "立候補", "当選", "落選", "比例", "小選挙区"],
  diet: ["国会", "衆議院", "参議院", "法案", "予算", "審議", "本会議"],
  member: ["議員", "大臣", "首相", "総理", "党首", "幹事長"],
  politics: ["政治", "政党", "与党", "野党", "政権", "組閣"],
};

const PREFECTURE_KEYWORDS: Record<string, string[]> = {
  "01": ["北海道"],
  "02": ["青森"],
  "03": ["岩手"],
  "04": ["宮城"],
  "05": ["秋田"],
  "06": ["山形"],
  "07": ["福島"],
  "08": ["茨城"],
  "09": ["栃木"],
  "10": ["群馬"],
  "11": ["埼玉"],
  "12": ["千葉"],
  "13": ["東京"],
  "14": ["神奈川"],
  "15": ["新潟"],
  "16": ["富山"],
  "17": ["石川"],
  "18": ["福井"],
  "19": ["山梨"],
  "20": ["長野"],
  "21": ["岐阜"],
  "22": ["静岡"],
  "23": ["愛知"],
  "24": ["三重"],
  "25": ["滋賀"],
  "26": ["京都"],
  "27": ["大阪"],
  "28": ["兵庫"],
  "29": ["奈良"],
  "30": ["和歌山"],
  "31": ["鳥取"],
  "32": ["島根"],
  "33": ["岡山"],
  "34": ["広島"],
  "35": ["山口"],
  "36": ["徳島"],
  "37": ["香川"],
  "38": ["愛媛"],
  "39": ["高知"],
  "40": ["福岡"],
  "41": ["佐賀"],
  "42": ["長崎"],
  "43": ["熊本"],
  "44": ["大分"],
  "45": ["宮崎"],
  "46": ["鹿児島"],
  "47": ["沖縄"],
};

const KNOWN_POLITICIANS = [
  "岸田",
  "石破",
  "茂木",
  "松本",
  "猪口",
  "棚橋",
  "福田",
  "麻生",
  "河野",
  "林",
  "齊藤",
  "宮沢",
  "鈴木",
  "塩谷",
  "西村",
  "加藤",
  "佐藤",
  "田中",
  "高橋",
  "渡辺",
  "伊藤",
  "山本",
];

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function classifyCategory(title: string): NewsItem["category"] {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (title.includes(keyword)) return category as NewsItem["category"];
    }
  }
  return "other";
}

function detectMemberNames(title: string): string[] {
  return KNOWN_POLITICIANS.filter((name) => title.includes(name));
}

function detectPrefecture(title: string): string[] {
  const found: string[] = [];
  for (const [code, keywords] of Object.entries(PREFECTURE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        found.push(code);
        break;
      }
    }
  }
  return found;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "i",
  );
  return xml.match(re)?.[1]?.trim() ?? "";
}

function parseRssXml(
  xml: string,
): Array<{ title: string; link: string; pubDate: string }> {
  const items = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const chunk = m[1];
    const title = extractTag(chunk, "title");
    const link = extractTag(chunk, "link");
    const pubDate =
      extractTag(chunk, "pubDate") || extractTag(chunk, "dc:date");
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

async function fetchRssFeed(url: string): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "lawmakers-vision-app/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml).map(
      (item): NewsItem => ({
        id: hashString(item.link),
        title: item.title,
        link: item.link,
        source: "nhk",
        publishedAt: new Date(item.pubDate || Date.now()).toISOString(),
        category: classifyCategory(item.title),
        memberNames: detectMemberNames(item.title),
        prefectureCodes: detectPrefecture(item.title),
      }),
    );
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// OGP画像をサーバー側で取得（旧Workerと同じ役割）
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const match =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      ) ||
      html.match(
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      );

    return match?.[1] ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const revalidate = 60;

export async function GET(_req: NextRequest) {
  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchRssFeed));
    const allNews: NewsItem[] = [];
    const seenIds = new Set<string>();

    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const item of r.value) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allNews.push(item);
        }
      }
    }

    allNews.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    // 地図表示対象（都道府県コードあり）の先頭5件だけOGP取得
    const mapArticles = allNews
      .filter((item) => (item.prefectureCodes?.length ?? 0) > 0)
      .slice(0, 5);

    const ogResults = await Promise.allSettled(
      mapArticles.map((item) => fetchOgImage(item.link)),
    );

    mapArticles.forEach((item, i) => {
      const result = ogResults[i];
      if (result.status === "fulfilled" && result.value) {
        item.ogImageUrl = result.value;
      }
    });

    return NextResponse.json({
      news: allNews,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("News fetch error:", e);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 },
    );
  }
}
