import React from 'react';
import { X, Gauge, ShieldCheck, Clock, Cpu } from 'lucide-react';
import { DuoMascot } from './DuoMascot';
import type { RateLimitStats } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: RateLimitStats | null;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  const dailyUsed = stats?.dailyRequests?.used ?? 0;
  const dailyLimit = stats?.dailyRequests?.limit ?? 500;
  const dailyRemaining = stats?.dailyRequests?.remaining ?? 500;
  const dailyPercent = Math.min(100, Math.round((dailyUsed / dailyLimit) * 100));

  const secondsRemaining = stats?.dailyRequests?.resetSecondsRemaining ?? 3600;
  const hoursLeft = Math.floor(secondsRemaining / 3600);
  const minutesLeft = Math.floor((secondsRemaining % 3600) / 60);

  const totalTokens = stats?.tokenPool?.totalUsed ?? 0;
  const promptTokens = stats?.tokenPool?.promptTokens ?? 0;
  const candidateTokens = stats?.tokenPool?.candidateTokens ?? 0;

  const currentRpmUser = stats?.rpm?.currentPerUser ?? 0;
  const limitPerUser = stats?.rpm?.limitPerUser ?? 7;
  const currentRpmGlobal = stats?.rpm?.currentGlobal ?? 0;
  const limitGlobal = stats?.rpm?.limitGlobal ?? 15;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-[#141029] rounded-3xl border-2 border-[#2f2754] shadow-2xl overflow-hidden p-6 relative text-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-[#201a40] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <DuoMascot mood="answers" size="sm" />
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Shared Pool &amp; Limits
            </h3>
            <p className="text-xs font-bold text-purple-400/70">
              Live rate monitoring for Dreams
            </p>
          </div>
        </div>

        {/* 1. Daily 500 Requests Pool Card */}
        <div className="p-4 bg-[#1b1638] border-2 border-[#332a59] rounded-2xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-300">
              <Gauge className="w-4 h-4 text-[#a855f7]" />
              Daily Shared Pool
            </span>
            <span className="text-xs font-black text-[#c084fc] bg-[#271f4f] px-2 py-0.5 rounded-lg border border-purple-500/30">
              {dailyRemaining} / {dailyLimit} Left
            </span>
          </div>

          <div className="w-full h-3.5 bg-[#120f26] rounded-full overflow-hidden p-0.5 border border-[#352c5c]">
            <div
              className="h-full rounded-full bg-[#a855f7] transition-all duration-500"
              style={{ width: `${Math.max(4, 100 - dailyPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] font-bold text-gray-400">
            <span>{dailyUsed} used today</span>
            <span className="flex items-center gap-1 text-purple-300">
              <Clock className="w-3 h-3 text-[#a855f7]" />
              Resets in {hoursLeft}h {minutesLeft}m (00:00 UTC)
            </span>
          </div>
        </div>

        {/* 2. RPM Safe Limiter Card */}
        <div className="p-4 bg-[#1b1638] border-2 border-[#332a59] rounded-2xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-300">
              <ShieldCheck className="w-4 h-4 text-[#a855f7]" />
              RPM Safe Limiter (Multi-User Safe)
            </span>
            <span className="text-[11px] font-black text-emerald-400 bg-[#271f4f] px-2 py-0.5 rounded-lg border border-purple-500/30">
              {currentRpmUser < limitPerUser ? '🟢 Safe' : '⏳ Cooling Down'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-300 mt-2">
            <div className="p-2.5 bg-[#141029] rounded-xl border border-[#2b244d]">
              <span className="text-[10px] text-gray-400 block font-extrabold uppercase">
                Your Rate
              </span>
              <span className="text-base font-black text-[#c084fc]">
                {currentRpmUser} / {limitPerUser}
              </span>
              <span className="text-[10px] text-gray-500 block">reqs in last 60s</span>
            </div>
            <div className="p-2.5 bg-[#141029] rounded-xl border border-[#2b244d]">
              <span className="text-[10px] text-gray-400 block font-extrabold uppercase">
                Global Limit
              </span>
              <span className="text-base font-black text-gray-200">
                {currentRpmGlobal} / {limitGlobal}
              </span>
              <span className="text-[10px] text-gray-500 block">fits 2 friends safely</span>
            </div>
          </div>
        </div>

        {/* 3. Token Pool Card */}
        <div className="p-4 bg-[#1b1638] border-2 border-[#332a59] rounded-2xl mb-5">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-purple-300 mb-1">
            <Cpu className="w-3.5 h-3.5 text-[#a855f7]" />
            Token Usage
          </span>
          <div className="text-xl font-black text-white">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-purple-400/80 mt-0.5">
            Prompt: {promptTokens.toLocaleString()} • Completion: {candidateTokens.toLocaleString()}
          </div>
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#7c3aed] hover:bg-[#8b5cf6] active:translate-y-1 active:border-b-0 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-[#5b21b6] transition-all cursor-pointer shadow-md select-none"
        >
          Close
        </button>
      </div>
    </div>
  );
};
