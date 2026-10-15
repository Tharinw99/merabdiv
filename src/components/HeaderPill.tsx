import React, { useState } from 'react';
import { PanelLeft, Bot, Key, Hammer } from 'lucide-react';
import { DuoMascot } from './DuoMascot';
import type { AIMode, RateLimitStats } from '../types';

interface HeaderPillProps {
  stats: RateLimitStats | null;
  currentMode: AIMode;
  isBuildMode: boolean;
  onToggleSidebar: () => void;
  onToggleBuildMode: () => void;
  onOpenKeyModal: () => void;
  onOpenStats: () => void;
}

export const HeaderPill: React.FC<HeaderPillProps> = ({
  stats,
  currentMode,
  isBuildMode,
  onToggleSidebar,
  onToggleBuildMode,
  onOpenKeyModal,
  onOpenStats,
}) => {
  const [isHoveredDuo, setIsHoveredDuo] = useState(false);
  const [isHoveredBuilder, setIsHoveredBuilder] = useState(false);

  const dailyUsed = stats?.dailyRequests?.used ?? 0;
  const dailyLimit = stats?.dailyRequests?.limit ?? 500;
  const dailyRemaining = stats?.dailyRequests?.remaining ?? 500;
  const dailyPercent = Math.min(100, Math.round((dailyUsed / dailyLimit) * 100));

  const mascotMood = currentMode === 'answers' ? 'answers' : currentMode === 'casual' ? 'casual' : 'studying';

  return (
    <div className="fixed top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between select-none">
      {/* Left Action Buttons: Dremmy Circle + Engineering Dremmy (Build Mode) */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Dremmy circle button: opens saved chats sidebar */}
        <button
          onClick={onToggleSidebar}
          onMouseEnter={() => setIsHoveredDuo(true)}
          onMouseLeave={() => setIsHoveredDuo(false)}
          className="w-11 h-11 rounded-2xl bg-[#141029] border-2 border-[#2e2652] hover:border-[#a855f7] shadow-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group relative"
          title="Open saved chats"
        >
          {isHoveredDuo ? (
            <PanelLeft className="w-5 h-5 text-[#a855f7] transition-all animate-in zoom-in-75" />
          ) : (
            <DuoMascot mood={mascotMood} size="sm" className="pointer-events-none scale-90" />
          )}

          <div className="absolute left-full ml-2 hidden group-hover:block bg-[#1a1538] text-purple-200 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-[#3b3166] shadow-xl whitespace-nowrap z-50">
            Saved Chats
          </div>
        </button>

        {/* Engineering / Lab Dremmy button: Toggles Build Mode */}
        <button
          onClick={onToggleBuildMode}
          onMouseEnter={() => setIsHoveredBuilder(true)}
          onMouseLeave={() => setIsHoveredBuilder(false)}
          className={`h-11 px-2.5 rounded-2xl border-2 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 group relative shadow-xl ${
            isBuildMode
              ? 'bg-[#0891b2]/30 border-[#06b6d4] text-[#22d3ee] ring-2 ring-[#06b6d4]/40'
              : 'bg-[#141029] border-[#2e2652] hover:border-[#06b6d4] text-purple-200'
          }`}
          title="Build Mode: Agentic Game & App Generator"
        >
          <DuoMascot mood="engineering" size="sm" className="scale-90" />
          <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
            {isBuildMode ? 'Exit Build' : 'Build Mode'}
          </span>
          <Hammer className={`w-3.5 h-3.5 ${isBuildMode ? 'text-[#22d3ee] animate-bounce' : 'text-purple-400'}`} />

          <div className="absolute left-full ml-2 hidden group-hover:block bg-[#16213e] text-cyan-200 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-[#06b6d4]/40 shadow-xl whitespace-nowrap z-50">
            {isBuildMode ? 'Switch back to standard chat' : 'Engineering Dremmy • Build games & apps'}
          </div>
        </button>
      </div>

      {/* Right Floating Pill: Daily Pool & Private Key Settings */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div
          onClick={onOpenStats}
          className="group relative flex items-center gap-2.5 px-3 py-1.5 bg-[#141029]/90 backdrop-blur-md border-2 border-[#2c2450] hover:border-[#a855f7] rounded-2xl shadow-xl cursor-pointer transition-all"
        >
          <Bot className="w-4 h-4 text-[#a855f7]" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-purple-200">
              <span>{dailyRemaining}</span>
              <span className="text-purple-400/50">/ {dailyLimit} left</span>
            </div>
            <div className="w-16 h-1 bg-[#20193d] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#a855f7] rounded-full transition-all"
                style={{ width: `${Math.max(5, 100 - dailyPercent)}%` }}
              />
            </div>
          </div>

          <div className="absolute top-full right-0 mt-2 hidden group-hover:flex flex-col items-end bg-[#1b153b] text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-2xl border border-[#3f346b] whitespace-nowrap z-50 pointer-events-none">
            <span className="text-purple-200">{dailyRemaining} requests remaining today</span>
            <span className="text-gray-400 text-[10px]">
              {dailyUsed} / 500 daily requests • Resets at 00:00 UTC
            </span>
            <div className="absolute -top-1 right-5 w-2 h-2 bg-[#1b153b] border-t border-l border-[#3f346b] rotate-45" />
          </div>
        </div>

        <button
          onClick={onOpenKeyModal}
          className="p-2 bg-[#141029]/90 backdrop-blur-md border-2 border-[#2c2450] hover:border-[#a855f7] rounded-2xl text-purple-300 hover:text-white shadow-xl transition-all cursor-pointer"
          title="Private API keys for GitHub Pages / school Chromebook"
        >
          <Key className="w-4 h-4 text-purple-400" />
        </button>
      </div>
    </div>
  );
};
