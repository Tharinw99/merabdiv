import React from 'react';

export type MascotMood =
  | 'happy'
  | 'thinking'
  | 'studying'
  | 'coding'
  | 'cheering'
  | 'shocked'
  | 'answers'
  | 'casual'
  | 'engineering';

interface DuoMascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  speechBubble?: string;
}

export const DuoMascot: React.FC<DuoMascotProps> = ({
  mood = 'happy',
  size = 'md',
  className = '',
  speechBubble,
}) => {
  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const showGlasses =
    mood === 'answers' ||
    mood === 'casual' ||
    mood === 'studying' ||
    mood === 'coding';
  const isEngineering = mood === 'engineering';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {speechBubble && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1e1a38] text-purple-200 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-lg border border-[#3b3466] whitespace-nowrap z-20">
          {speechBubble}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e1a38] border-b border-r border-[#3b3466] rotate-45" />
        </div>
      )}

      <div className={`${sizeMap[size]} transition-transform duration-300 transform hover:scale-105`}>
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md overflow-visible">
          {/* Subtle Shadow beneath owl */}
          <ellipse cx="60" cy="112" rx="36" ry="6" fill="#000000" opacity="0.35" />

          {/* Feet */}
          <ellipse cx="46" cy="107" rx="8" ry="4" fill="#a855f7" />
          <ellipse cx="74" cy="107" rx="8" ry="4" fill="#a855f7" />

          {/* Main Body - Dark Blue Purple */}
          <path
            d="M 60,14 C 32,14 20,38 20,68 C 20,96 36,108 60,108 C 84,108 100,96 100,68 C 100,38 88,14 60,14 Z"
            fill={isEngineering ? '#4c1d95' : '#5b21b6'}
          />

          {/* Left Wing */}
          <path
            d="M 22,55 C 12,65 14,85 24,90 C 27,82 28,68 22,55 Z"
            fill="#4338ca"
          />

          {/* Right Wing */}
          <path
            d="M 98,55 C 108,65 106,85 96,90 C 93,82 92,68 98,55 Z"
            fill="#4338ca"
          />

          {/* Belly Feather Patch */}
          <path
            d="M 60,56 C 45,56 40,74 40,86 C 40,98 48,102 60,102 C 72,102 80,98 80,86 C 80,74 75,56 60,56 Z"
            fill={isEngineering ? '#06b6d4' : '#7c3aed'}
          />

          {/* Eye Patches */}
          <ellipse cx="44" cy="46" rx="18" ry="18" fill="#ffffff" />
          <ellipse cx="76" cy="46" rx="18" ry="18" fill="#ffffff" />

          {/* Pupils */}
          <ellipse cx="46" cy="46" rx="9" ry="9" fill="#1e1b4b" />
          <circle cx="49" cy="43" r="3" fill="#ffffff" />
          <ellipse cx="74" cy="46" rx="9" ry="9" fill="#1e1b4b" />
          <circle cx="77" cy="43" r="3" fill="#ffffff" />

          {/* Glasses for normal modes */}
          {showGlasses && !isEngineering && (
            <g>
              <rect x="25" y="32" width="30" height="26" rx="7" fill="none" stroke="#a855f7" strokeWidth="3.5" />
              <rect x="65" y="32" width="30" height="26" rx="7" fill="none" stroke="#a855f7" strokeWidth="3.5" />
              <line x1="55" y1="44" x2="65" y2="44" stroke="#a855f7" strokeWidth="3.5" />
              <line x1="30" y1="36" x2="38" y2="36" stroke="#e9d5ff" strokeWidth="2" strokeLinecap="round" />
              <line x1="70" y1="36" x2="78" y2="36" stroke="#e9d5ff" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* Engineering / Lab Dremmy Outfit: Lab Goggles + Headband + Hardhat / Wrench */}
          {isEngineering && (
            <g>
              {/* Engineering Safety Goggles */}
              <rect x="23" y="30" width="34" height="28" rx="8" fill="#06b6d4" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="3.5" />
              <rect x="63" y="30" width="34" height="28" rx="8" fill="#06b6d4" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="3.5" />
              <line x1="57" y1="44" x2="63" y2="44" stroke="#22d3ee" strokeWidth="4" />
              {/* Headband strap */}
              <path d="M 23,44 L 12,46" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 97,44 L 108,46" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
              {/* Mini Builder Hardhat / Lab Cap */}
              <path d="M 38,18 C 38,4 82,4 82,18 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
              <rect x="32" y="16" width="56" height="5" rx="2.5" fill="#f59e0b" />
              {/* Goggle highlight */}
              <line x1="28" y1="35" x2="36" y2="35" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="68" y1="35" x2="76" y2="35" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* Beak */}
          <polygon points="60,65 52,53 68,53" fill="#fb923c" />
        </svg>
      </div>
    </div>
  );
};
