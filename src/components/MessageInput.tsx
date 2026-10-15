import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Image as ImageIcon, X, AlertCircle, Clock } from 'lucide-react';
import { DropUpModelSelector } from './DropUpModelSelector';
import type { AIMode, StudyTool } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, image?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
  mode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  studyTool: StudyTool;
  onSelectStudyTool: (tool: StudyTool) => void;
  cooldownSeconds: number;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  mode,
  onSelectMode,
  studyTool,
  onSelectStudyTool,
  cooldownSeconds,
}) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // Clipboard Paste (Ctrl+V) listener for screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleSend = () => {
    if ((!text.trim() && !selectedImage) || isLoading || cooldownSeconds > 0) return;

    onSendMessage(
      text.trim(),
      selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined
    );

    setText('');
    setSelectedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBlocked = cooldownSeconds > 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-full max-w-4xl mx-auto px-2 sm:px-4 pb-4 select-none relative"
    >
      {/* Drag and Drop Active Overlay */}
      {isDragging && (
        <div className="absolute inset-x-2 inset-y-0 bg-[#291e54]/90 border-2 border-dashed border-[#a855f7] rounded-3xl flex items-center justify-center z-40 backdrop-blur-xs text-purple-200 text-sm font-black">
          Drop screenshot here for Dremmy to inspect!
        </div>
      )}

      {/* RPM Cooldown Warning Banner */}
      {isBlocked && (
        <div className="mb-2 p-3 bg-red-950/60 border-2 border-red-700/80 rounded-2xl flex items-center justify-between gap-3 text-red-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="text-xs sm:text-sm font-bold">
              Cooldown active: Please wait{' '}
              <span className="font-extrabold text-red-200 underline decoration-wavy decoration-red-400">
                {cooldownSeconds}s
              </span>{' '}
              before sending.
            </div>
          </div>
          <div className="flex items-center gap-1 bg-red-900/60 text-red-200 font-black px-2.5 py-1 rounded-xl text-xs shrink-0 border border-red-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{cooldownSeconds}s</span>
          </div>
        </div>
      )}

      {/* Image Preview Thumbnail */}
      {selectedImage && (
        <div className="mb-2 p-2 bg-[#1b1736] rounded-2xl border-2 border-[#2f2757] inline-flex items-center gap-3 shadow-md">
          <img
            src={selectedImage.previewUrl}
            alt="Upload preview"
            className="w-14 h-14 object-cover rounded-xl border border-purple-500/30"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-purple-200">Image attached</span>
            <span className="text-[10px] text-purple-400/70">Pasted or dropped</span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors ml-2 cursor-pointer"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Dark Input Box */}
      <div className="bg-[#141029] rounded-3xl border-2 border-[#2c2450] shadow-xl p-2.5 flex flex-col gap-2 focus-within:border-[#a855f7] transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isBlocked}
          placeholder={
            isBlocked
              ? `Waiting for cooldown (${cooldownSeconds}s left)...`
              : 'Ask Dremmy anything in your dreams...'
          }
          rows={1}
          className="w-full resize-none px-3 py-1.5 text-sm sm:text-base font-semibold text-gray-100 placeholder-purple-300/40 focus:outline-none bg-transparent max-h-40 leading-relaxed"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#231b45]">
          <div className="flex items-center gap-2">
            {/* Drop-Up Model Selector */}
            <DropUpModelSelector
              currentMode={mode}
              onSelectMode={onSelectMode}
              activeStudyTool={studyTool}
              onSelectStudyTool={onSelectStudyTool}
            />

            {/* Attach Image button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isBlocked}
              className="p-1.5 text-purple-300/70 hover:text-purple-200 hover:bg-[#201845] rounded-xl transition-colors cursor-pointer border border-transparent hover:border-[#382b6e] flex items-center gap-1 text-xs font-bold"
              title="Attach homework screenshot or code image (or press Ctrl+V)"
            >
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Image</span>
            </button>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!text.trim() && !selectedImage) || isLoading || isBlocked}
            className={`px-4 sm:px-6 py-2 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              (!text.trim() && !selectedImage) || isLoading || isBlocked
                ? 'bg-[#221c3d] text-gray-500 border-b-2 border-[#2b244d] cursor-not-allowed'
                : 'bg-[#7c3aed] hover:bg-[#8b5cf6] active:translate-y-1 active:border-b-0 text-white border-b-4 border-[#5b21b6] shadow-md'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Thinking...</span>
              </div>
            ) : isBlocked ? (
              <span>Wait {cooldownSeconds}s</span>
            ) : (
              <>
                <span>Send</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
