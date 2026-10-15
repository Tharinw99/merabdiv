import React, { useState, useRef, useEffect } from 'react';
import { Bot, ChevronUp, Check, Bug, Compass, Lightbulb, Code } from 'lucide-react';
import type { AIMode, StudyTool } from '../types';

interface DropUpModelSelectorProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  activeStudyTool: StudyTool;
  onSelectStudyTool: (tool: StudyTool) => void;
}

export const DropUpModelSelector: React.FC<DropUpModelSelectorProps> = ({
  currentMode,
  onSelectMode,
  activeStudyTool,
  onSelectStudyTool,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modes: {
    id: AIMode;
    label: string;
    modelName: string;
    description: string;
  }[] = [
    {
      id: 'answers',
      label: 'Answers',
      modelName: 'nemotron-3.5',
      description: 'Fast definitions & homework solver',
    },
    {
      id: 'casual',
      label: 'Casual',
      modelName: 'laguna-xs-2.1',
      description: 'Chill talk, dreams & school venting',
    },
    {
      id: 'study',
      label: 'Study',
      modelName: 'north-mini-code',
      description: 'College CS tutor & programming agent',
    },
  ];

  const studyTools: { id: StudyTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'mentor', label: 'Code Mentor', icon: Code },
    { id: 'debug', label: 'Debug Code', icon: Bug },
    { id: 'roadmap', label: 'College CS Prep', icon: Compass },
    { id: 'analogy', label: 'Explain Simpler', icon: Lightbulb },
  ];

  return (
    <div ref={containerRef} className="relative inline-block select-none">
      {/* Drop-Up Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 rounded-xl bg-[#1e173d] hover:bg-[#281f52] border border-[#382b6e] text-purple-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
        title="Select AI Model & Mode"
      >
        <Bot className="w-3.5 h-3.5 text-[#a855f7]" />
        <span className="capitalize">{currentMode}</span>
        <ChevronUp className={`w-3.5 h-3.5 text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Drop-Up Floating Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#141029] border-2 border-[#2f2554] rounded-2xl shadow-2xl p-2.5 z-50 text-gray-200 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400/70 block px-2 mb-1.5">
            Select Model
          </span>

          <div className="space-y-1 mb-2">
            {modes.map((m) => {
              const isSelected = currentMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectMode(m.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#291f54] text-white font-extrabold border border-[#a855f7]/60'
                      : 'hover:bg-[#1c163b] text-purple-200/80 font-bold border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className={`w-3.5 h-3.5 ${isSelected ? 'text-[#a855f7]' : 'text-gray-400'}`} />
                    <div>
                      <div className="text-xs leading-none">{m.label}</div>
                      <div className="text-[10px] text-purple-400/60 mt-0.5 leading-none">
                        {m.modelName}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#a855f7]" />}
                </button>
              );
            })}
          </div>

          {/* If Study Mode: Specialized Sub-tools */}
          {currentMode === 'study' && (
            <div className="pt-2 border-t border-[#231b45]">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400/70 block px-2 mb-1.5">
                Study Focus
              </span>
              <div className="grid grid-cols-2 gap-1">
                {studyTools.map((st) => {
                  const ToolIcon = st.icon;
                  const isActive = activeStudyTool === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        onSelectStudyTool(st.id);
                        setIsOpen(false);
                      }}
                      className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#3b2b7a] text-white border border-[#a855f7]'
                          : 'bg-[#181233] text-purple-300 hover:bg-[#201845]'
                      }`}
                    >
                      <ToolIcon className="w-3 h-3 text-[#a855f7]" />
                      <span className="truncate">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
