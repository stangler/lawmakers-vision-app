"use client";

import { useState } from "react";
import type { NewsItem } from "@/types/news";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/news";

interface MapNewsCardProps {
  item: NewsItem;
  isSelected?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

const PREFECTURE_NAMES: Record<string, string> = {
  "01": "北海道",
  "02": "青森",
  "03": "岩手",
  "04": "宮城",
  "05": "秋田",
  "06": "山形",
  "07": "福島",
  "08": "茨城",
  "09": "栃木",
  "10": "群馬",
  "11": "埼玉",
  "12": "千葉",
  "13": "東京",
  "14": "神奈川",
  "15": "新潟",
  "16": "富山",
  "17": "石川",
  "18": "福井",
  "19": "山梨",
  "20": "長野",
  "21": "岐阜",
  "22": "静岡",
  "23": "愛知",
  "24": "三重",
  "25": "滋賀",
  "26": "京都",
  "27": "大阪",
  "28": "兵庫",
  "29": "奈良",
  "30": "和歌山",
  "31": "鳥取",
  "32": "島根",
  "33": "岡山",
  "34": "広島",
  "35": "山口",
  "36": "徳島",
  "37": "香川",
  "38": "愛媛",
  "39": "高知",
  "40": "福岡",
  "41": "佐賀",
  "42": "長崎",
  "43": "熊本",
  "44": "大分",
  "45": "宮崎",
  "46": "鹿児島",
  "47": "沖縄",
};

export function MapNewsCard({ item, isSelected }: MapNewsCardProps) {
  const [imageError, setImageError] = useState(false);
  const accentColor = CATEGORY_COLORS[item.category];
  const categoryLabel = CATEGORY_LABELS[item.category];
  const imageUrl = item.ogImageUrl ?? null;

  const prefectureNames = (item.prefectureCodes || [])
    .filter((code) => PREFECTURE_NAMES[code])
    .map((code) => PREFECTURE_NAMES[code])
    .slice(0, 2);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-56 bg-slate-900/95 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-200 cursor-pointer group hover:scale-105"
      style={{
        border: `1px solid ${isSelected ? accentColor : accentColor + "60"}`,
        boxShadow: `0 0 12px ${accentColor}30`,
      }}
    >
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      <div className="relative h-28 bg-slate-800 overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-cyan-500/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold backdrop-blur-sm"
            style={{
              color: accentColor,
              border: `1px solid ${accentColor}`,
              backgroundColor: "rgba(0,0,0,0.65)",
              textShadow: `0 0 8px ${accentColor}`,
            }}
          >
            {categoryLabel}
          </span>
        </div>
      </div>

      <div className="p-2.5">
        <p
          className="text-xs text-white/90 font-medium leading-snug mb-1.5"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-500">
            {timeAgo(item.publishedAt)}
          </span>
          {prefectureNames.length > 0 && (
            <div className="flex gap-1">
              {prefectureNames.map((name) => (
                <span
                  key={name}
                  className="text-[9px] px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: "rgba(255,0,255,0.15)",
                    color: "#ff88ff",
                    border: "1px solid rgba(255,0,255,0.3)",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute top-0 right-0 w-2 h-2"
        style={{
          borderTop: `1px solid ${accentColor}`,
          borderRight: `1px solid ${accentColor}`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-2 h-2"
        style={{
          borderBottom: `1px solid ${accentColor}`,
          borderLeft: `1px solid ${accentColor}`,
        }}
      />
    </a>
  );
}
