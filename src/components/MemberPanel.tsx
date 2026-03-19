'use client';

import { useState, useMemo } from 'react';
import type { SingleSeatMember, ProportionalMember } from '@/types/member';
import type { NewsItem } from '@/types/news';
import { MemberCard } from '@/components/MemberCard';
import { NewsCard } from '@/components/NewsCard';
import { PREFECTURE_MAP } from '@/lib/prefectures';
import { matchNewsForMember } from '@/lib/memberMatcher';

interface MemberPanelProps {
  selectedPrefecture: string | null;
  selectedBlock: string | null;
  members: SingleSeatMember[];
  proportionalMembers: ProportionalMember[];
  mode: 'single-seat' | 'proportional';
  news: NewsItem[];
}

export function MemberPanel({
  selectedPrefecture,
  selectedBlock,
  members,
  proportionalMembers,
  mode,
  news,
}: MemberPanelProps) {
  const [selectedMember, setSelectedMember] = useState<SingleSeatMember | ProportionalMember | null>(null);

  const singleSeatMembers = mode === 'single-seat'
    ? members.filter((m) => m.prefectureCode === selectedPrefecture)
    : [];

  const propMembers = mode === 'proportional'
    ? proportionalMembers.filter((m) => m.block === selectedBlock)
    : [];

  const title = mode === 'single-seat' && selectedPrefecture
    ? PREFECTURE_MAP.get(selectedPrefecture)?.name || ''
    : mode === 'proportional' && selectedBlock
    ? selectedBlock
    : '';

  const singleSeatByParty = singleSeatMembers.reduce((acc, member) => {
    const party = member.party;
    if (!acc[party]) acc[party] = [];
    acc[party].push(member);
    return acc;
  }, {} as Record<string, SingleSeatMember[]>);

  const propByParty = propMembers.reduce((acc, member) => {
    const party = member.party;
    if (!acc[party]) acc[party] = [];
    acc[party].push(member);
    return acc;
  }, {} as Record<string, ProportionalMember[]>);

  const totalCount = singleSeatMembers.length + propMembers.length;

  const memberNews = useMemo(() => {
    if (!selectedMember) return [];
    return matchNewsForMember(news, selectedMember);
  }, [news, selectedMember]);

  const handleMemberClick = (member: SingleSeatMember | ProportionalMember) => {
    setSelectedMember(prev => prev?.name === member.name ? null : member);
  };

  if (!selectedPrefecture && !selectedBlock) {
    return (
      <div className="w-80 bg-slate-900/80 border-l border-cyan-500/30 p-4 flex flex-col">
        <h2 className="text-cyan-400 font-bold text-lg mb-4">議員一覧</h2>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          地図上の都道府県または<br />ブロックを選択してください
        </div>
      </div>
    );
  }

  if (selectedMember) {
    return (
      <div className="w-80 bg-slate-900/80 border-l border-cyan-500/30 flex flex-col">
        <div className="p-3 border-b border-cyan-500/30">
          <button
            onClick={() => setSelectedMember(null)}
            className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            ← 戻る
          </button>
        </div>

        <div className="p-3 border-b border-cyan-500/30">
          <h2 className="text-cyan-400 font-bold text-lg mb-1">{selectedMember.name}</h2>
          <p className="text-gray-400 text-sm">{selectedMember.party}</p>
          <p className="text-gray-500 text-xs mt-1">
            {memberNews.length}件の関連ニュース
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {memberNews.length > 0 ? (
            memberNews.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">📰</div>
              <div className="text-sm">関連するニュースはありません</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900/80 border-l border-cyan-500/30 p-4 flex flex-col overflow-hidden">
      <h2 className="text-cyan-400 font-bold text-lg mb-2">{title}</h2>
      <p className="text-gray-400 text-sm mb-4">
        {totalCount}名の議員
      </p>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Single-seat mode */}
        {mode === 'single-seat' && Object.entries(singleSeatByParty).map(([party, partyMembers]) => (
          <div key={party}>
            <h3 className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
              <span>{party}</span>
              <span className="text-gray-500">({partyMembers.length}名)</span>
            </h3>
            <div className="space-y-2">
              {partyMembers.map((member, index) => (
                <div
                  key={`${member.name}-${index}`}
                  onClick={() => handleMemberClick(member)}
                  className="cursor-pointer hover:opacity-80"
                >
                  <MemberCard member={member} showDistrict={true} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Proportional mode */}
        {mode === 'proportional' && Object.entries(propByParty).map(([party, partyMembers]) => (
          <div key={party}>
            <h3 className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
              <span>{party}</span>
              <span className="text-gray-500">({partyMembers.length}名)</span>
            </h3>
            <div className="space-y-2">
              {partyMembers.map((member, index) => (
                <div
                  key={`${member.name}-${index}`}
                  onClick={() => handleMemberClick(member)}
                  className="cursor-pointer hover:opacity-80"
                >
                  <MemberCard member={member} showDistrict={false} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
