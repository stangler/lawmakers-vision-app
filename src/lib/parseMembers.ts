import type { SingleSeatMember, ProportionalMember } from '@/types/member';
import { PREFECTURE_NAME_TO_CODE } from '@/lib/prefectures';

// 全角数字を半角に変換
function normalizeNumber(str: string): string {
  return str.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
}

// 小選挙区データのパース
export function parseSingleSeatMarkdown(markdown: string): SingleSeatMember[] {
  const members: SingleSeatMember[] = [];
  const lines = markdown.split('\n');

  let currentPrefecture = '';
  let currentPrefectureCode = '';
  let currentDistrict = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 都道府県ヘッダー (## 北海道)
    if (line.startsWith('## ') && !line.includes('衆議院')) {
      currentPrefecture = line.replace('## ', '').trim();
      const prefName = currentPrefecture === '北海道' ? '北海道' :
                       currentPrefecture === '東京' ? '東京都' :
                       currentPrefecture === '京都' ? '京都府' :
                       currentPrefecture.endsWith('県') || currentPrefecture.endsWith('府') || currentPrefecture.endsWith('都')
                       ? currentPrefecture
                       : currentPrefecture + '県';
      currentPrefectureCode = PREFECTURE_NAME_TO_CODE.get(prefName) || '';
      continue;
    }

    // 選挙区ヘッダー (### １区)
    if (line.startsWith('### ')) {
      const districtRaw = line.replace('### ', '').trim();
      currentDistrict = normalizeNumber(districtRaw);
      continue;
    }

    if (!line) continue;

    if (currentDistrict && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine && !nextLine.startsWith('###') && !nextLine.startsWith('##') &&
          (nextLine.includes('　') || nextLine.includes(' ') || /^[\u4E00-\u9FAF]+$/.test(nextLine))) {
        const party = line;
        const name = nextLine.replace(/ /g, ' ').trim();
        const kana = lines[i + 2]?.trim() || '';

        const infoLine = lines[i + 3]?.trim() || '';
        const parsed = parseInfoLine(infoLine);

        const background = lines[i + 4]?.trim() || '';

        const idLine = lines[i + 5]?.trim() || '';
        const idMatch = idLine.match(/^ID:\s*(\d+)$/);
        const id = idMatch ? parseInt(idMatch[1], 10) : 0;

        members.push({
          id,
          prefecture: currentPrefecture,
          prefectureCode: currentPrefectureCode,
          district: currentDistrict,
          party,
          name,
          kana,
          age: parsed.age,
          status: parsed.status,
          terms: parsed.terms,
          recommendation: parsed.recommendation,
          background,
        });

        i += id ? 5 : 4;
      }
    }
  }

  return members;
}

// 情報行のパース
function parseInfoLine(line: string): {
  status: '新' | '前' | '元';
  age: number;
  terms: number;
  recommendation?: string;
} {
  const result: { status: '新' | '前' | '元'; age: number; terms: number; recommendation?: string } = {
    status: '新',
    age: 0,
    terms: 0,
  };

  if (line.startsWith('新')) result.status = '新';
  else if (line.startsWith('前')) result.status = '前';
  else if (line.startsWith('元')) result.status = '元';

  const ageMatch = line.match(/(\d+)歳/);
  if (ageMatch) result.age = parseInt(ageMatch[1], 10);

  const termsMatch = line.match(/当選：(\d+)回目/);
  if (termsMatch) result.terms = parseInt(termsMatch[1], 10);

  const recMatch = line.match(/推薦：([^\s]+)/);
  if (recMatch) result.recommendation = recMatch[1];

  return result;
}

// 比例代表データのパース
export function parseProportionalMarkdown(markdown: string): ProportionalMember[] {
  const members: ProportionalMember[] = [];
  const lines = markdown.split('\n');

  let currentBlock = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('## ') && line.includes('ブロック')) {
      currentBlock = line.replace('## ', '').trim();
      continue;
    }

    if (!line || line.startsWith('#')) continue;

    const possibleParties = ['自民', '中道', '国民', '維新', '共産', 'れいわ', '参政', 'みらい'];
    if (possibleParties.includes(line) && i + 5 < lines.length) {
      const party = line;
      const name = lines[i + 1]?.trim().replace(/ /g, ' ') || '';
      const kana = lines[i + 2]?.trim() || '';
      const statusRaw = lines[i + 3]?.trim() || '';
      const status = statusRaw as '新' | '前' | '元';

      const ageLine = lines[i + 4]?.trim() || '';
      const ageMatch = ageLine.match(/(\d+)歳/);
      const age = ageMatch ? parseInt(ageMatch[1], 10) : 0;

      const termsLine = lines[i + 5]?.trim() || '';
      const termsMatch = termsLine.match(/当選：(\d+)回目/);
      const terms = termsMatch ? parseInt(termsMatch[1], 10) : 0;

      const background = lines[i + 6]?.trim() || '';
      const originLine = lines[i + 7]?.trim() || '';

      const idLine = lines[i + 8]?.trim() || '';
      const idMatch = idLine.match(/^ID:\s*(\d+)$/);
      const id = idMatch ? parseInt(idMatch[1], 10) : 0;

      members.push({
        id,
        block: currentBlock,
        party,
        name,
        kana,
        status,
        age,
        terms,
        background,
        originDistrict: originLine === '比例単独' ? undefined : originLine,
      });

      i += id ? 8 : 7;
    }
  }

  return members;
}

// 政党カラーマップ
export const PARTY_COLORS: Record<string, string> = {
  '自民': '#E9546B',
  '中道': '#4A90D9',
  '国民': '#00A7CA',
  '維新': '#008C45',
  '共産': '#E02D2D',
  'れいわ': '#FF6B35',
  '参政': '#8B4513',
  'みらい': '#9370DB',
  '無': '#808080',
  '減ゆ': '#FFD700',
};
