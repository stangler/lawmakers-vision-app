// News item type
export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: 'nhk';
  publishedAt: string;
  category: 'election' | 'diet' | 'member' | 'politics' | 'other';
  memberNames: string[];
  prefectureCodes?: string[];
  ogImageUrl?: string;
}

// API response type
export interface NewsApiResponse {
  news: NewsItem[];
  fetchedAt: string;
}

// Category labels
export const CATEGORY_LABELS: Record<NewsItem['category'], string> = {
  election: '衆院選',
  diet: '国会',
  member: '議員',
  politics: '政治',
  other: 'その他',
};

// Category colors
export const CATEGORY_COLORS: Record<NewsItem['category'], string> = {
  election: '#ff8800',
  diet: '#00ff88',
  member: '#ff00ff',
  politics: '#00ffff',
  other: '#808080',
};
