import React, { useState, useEffect } from 'react';
import { X, Key, Check, Shield, Bot } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOpenRouterKey(localStorage.getItem('dreams_openrouter_key') || '');
      setGeminiKey(localStorage.getItem('dreams_gemini_key') || '');
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (openRouterKey.trim()) {
      localStorage.setItem('dreams_openrouter_key', openRouterKey.trim());
    } else {
      localStorage.removeItem('dreams_openrouter_key');
    }

    if (geminiKey.trim()) {
      localStorage.setItem('dreams_gemini_key', geminiKey.trim());
      localStorage.setItem('dreams_api_key', geminiKey.trim());
    } else {
      localStorage.removeItem('dreams_gemini_key');
      localStorage.removeItem('dreams_api_key');
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-[#131028] rounded-3xl border-2 border-[#2e2652] shadow-2xl p-6 relative text-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-[#1f193d] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#a855f7]">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Private API Key</h3>
            <p className="text-xs text-purple-300/70 font-semibold">
              Stored locally on your device for GitHub Pages
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#1a1536] border border-[#2e2554] rounded-2xl mb-4 text-xs text-purple-200/80 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#a855f7] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Your key is saved only inside your browser’s local storage. It is never pushed to GitHub or shared publicly, making it 100% safe for static GitHub Pages and school Chromebooks.
          </p>
        </div>

        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-xs font-black text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-[#a855f7]" />
              OpenRouter Key (sk-or-v1-...)
            </label>
            <input
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder="Paste your OpenRouter API key here..."
              className="w-full px-3.5 py-2.5 bg-[#181333] border-2 border-[#2d2454] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#a855f7] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Optional Gemini key..."
              className="w-full px-3.5 py-2.5 bg-[#181333] border-2 border-[#2d2454] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#a855f7] transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-[#7c3aed] hover:bg-[#8b5cf6] active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider rounded-xl border-b-3 border-[#5b21b6] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Saved to Browser!</span>
            </>
          ) : (
            <span>Save Key to Browser</span>
          )}
        </button>
      </div>
    </div>
  );
};
