const IMAGE_BASE_PATH = '/data';

/**
 * 議員IDから画像URLを取得
 * @param id 議員ID
 * @returns 画像URL、または画像がない場合はnull
 */
export function getMemberImageUrl(id: number): string | null {
  const imageMapping: Record<number, string> = {
    1: '1_katou-takahiro.jpg',
    2: '2_takahashi-yuusuke.jpg',
    3: '3_takagi-hirohisa.jpg',
    4: '4_nakamura-hiroyuki.jpg',
    5: '5_wada-yoshiaki.jpg',
    6: '6_azuma-kuniyoshi.jpg',
    7: '7_suzuki-takako.jpg',
    8: '8_mukouyama-jyun.jpg',
    9: '9_matsushita-hideki.jpg',
    10: '10_kamiya-hiroshi.jpg',
    11: '11_nakagawa-koichi.jpg',
    12: '12_takebe-arata.jpg',
  };

  const filename = imageMapping[id];
  if (!filename) {
    return null;
  }

  return `${IMAGE_BASE_PATH}/${filename}`;
}
