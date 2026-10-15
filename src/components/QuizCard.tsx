import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import type { QuizData } from '../types';

interface QuizCardProps {
  quiz: QuizData;
  onAnswerAward?: (xp: number) => void;
  onAskFollowup?: (question: string) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onAnswerAward,
  onAskFollowup,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const xpReward = quiz.xp || 15;

  const handleSelect = (index: number) => {
    if (hasAnswered) return;

    setSelectedIndex(index);
    setHasAnswered(true);

    const isCorrect = index === quiz.correctIndex;

    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#6366f1', '#c084fc', '#38bdf8'],
      });
      if (onAnswerAward) {
        onAnswerAward(xpReward);
      }
    }
  };

  const isCorrect = selectedIndex === quiz.correctIndex;

  return (
    <div className="my-3 p-4 sm:p-5 bg-[#141029] rounded-3xl border-2 border-[#2f2754] shadow-xl transition-all">
      {/* Quiz Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#c084fc] bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-700/50">
            Study Quiz
          </span>
          <h4 className="text-sm sm:text-base font-black text-white mt-1.5 leading-snug">
            {quiz.question}
          </h4>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-extrabold text-[#c084fc] bg-purple-900/40 px-2 py-0.5 rounded-lg border border-purple-700/40 shrink-0">
          <Sparkles className="w-3 h-3 text-[#a855f7]" />
          +{xpReward} XP
        </span>
      </div>

      {/* Options List with 3D buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
        {quiz.options.map((option, idx) => {
          let stateStyle = 'bg-[#1b1638] hover:bg-[#231d47] border-[#352c5e] text-purple-200';

          if (hasAnswered) {
            if (idx === quiz.correctIndex) {
              stateStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50';
            } else if (idx === selectedIndex) {
              stateStyle = 'bg-red-950/70 border-red-500 text-red-200 ring-1 ring-red-500/50';
            } else {
              stateStyle = 'bg-[#141029] border-[#251f42] text-gray-500 opacity-50';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={hasAnswered}
              className={`p-3 rounded-2xl border-2 border-b-4 text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer active:translate-y-0.5 select-none ${stateStyle}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#251f47] text-purple-300 font-black text-xs flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{option}</span>
              </div>

              {hasAnswered && idx === quiz.correctIndex && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {hasAnswered && idx === selectedIndex && idx !== quiz.correctIndex && (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      {hasAnswered && (
        <div
          className={`mt-3 p-3 rounded-2xl border text-xs sm:text-sm transition-all animate-in fade-in ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
              : 'bg-red-950/40 border-red-700/60 text-red-300'
          }`}
        >
          <div className="flex items-center gap-1.5 font-black text-sm mb-1">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Correct!</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 text-red-400" />
                <span>Incorrect</span>
              </>
            )}
          </div>
          <p className="text-xs font-medium leading-relaxed pl-5 text-gray-300">
            {quiz.explanation}
          </p>

          {onAskFollowup && (
            <div className="mt-2.5 pl-5">
              <button
                onClick={() =>
                  onAskFollowup(
                    `Explain why "${quiz.options[quiz.correctIndex]}" is the correct answer to: "${quiz.question}" in detail.`
                  )
                }
                className="text-[11px] font-bold text-purple-300 hover:text-white bg-[#221c45] px-2.5 py-1 rounded-xl border border-[#392f66] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Explain in detail</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
