import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, Code2, Bot } from 'lucide-react';
import { QuizCard } from './QuizCard';
import type { ChatMessage, AIMode } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentMode: AIMode;
  isLoading: boolean;
  onSendPreset: (prompt: string) => void;
  onAnswerAward: (xp: number) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentMode,
  isLoading,
  onSendPreset,
  onAnswerAward,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 pt-16 pb-4 space-y-4">
      {/* Clean nonchalant empty state */}
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center select-none py-20">
          <div className="text-center px-4 max-w-md">
            <div className="w-12 h-12 rounded-2xl bg-[#181333] border-2 border-[#2b244d] flex items-center justify-center mx-auto mb-3 text-[#a855f7]">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-purple-200">
              Ask Dremmy anything in your dreams
            </p>
            <p className="text-xs text-purple-400/60 mt-1 leading-relaxed">
              Crush homework fast, chat about your goals, or click the Engineering Dremmy to build apps and games.
            </p>
          </div>
        </div>
      )}

      {/* Message Feed */}
      {messages.map((message) => {
        const isUser = message.role === 'user';

        // Check if message is a pure quiz generation response
        const hasQuiz = Boolean(message.quizData);
        // If message has a quiz and also brief text, clean up text if it contains raw quiz json
        const cleanContent = message.content
          .replace(/```json:quiz[\s\S]*?```/g, '')
          .trim();

        return (
          <div
            key={message.id}
            className={`flex items-start gap-2 sm:gap-3 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[92%] sm:max-w-[82%] flex flex-col ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Bubble Card */}
              <div
                className={`p-3.5 sm:p-4 rounded-3xl text-sm font-medium shadow-md ${
                  isUser
                    ? 'bg-[#4338ca] text-white rounded-tr-xs border-b-4 border-[#312e81]'
                    : 'bg-[#141029] text-gray-200 rounded-tl-xs border-2 border-[#2b244d] border-b-4'
                }`}
              >
                {/* Uploaded or pasted image preview */}
                {message.imageUrl && (
                  <div className="mb-2.5 rounded-2xl overflow-hidden border-2 border-purple-500/20 max-w-sm">
                    <img
                      src={message.imageUrl}
                      alt="Uploaded"
                      className="w-full max-h-60 object-contain bg-black/40"
                    />
                  </div>
                )}

                {/* ReactMarkdown + KaTeX for text & math rendering */}
                {cleanContent && (
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        // Bold text rendering
                        strong: ({ children }) => (
                          <strong className="font-black text-white">{children}</strong>
                        ),
                        // Paragraphs
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed text-gray-200">{children}</p>
                        ),
                        // Headers
                        h1: ({ children }) => (
                          <h1 className="text-base sm:text-lg font-black text-white mt-3 mb-1.5">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm sm:text-base font-extrabold text-white mt-2.5 mb-1">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xs sm:text-sm font-bold text-purple-200 mt-2 mb-1">{children}</h3>
                        ),
                        // Lists
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 my-1.5 text-gray-300">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 my-1.5 text-gray-300">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        // Code blocks & inline code
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeText = String(children).replace(/\n$/, '');
                          const isInline = !match && !String(children).includes('\n');

                          if (isInline) {
                            return (
                              <code
                                className="bg-[#241e45] text-[#d8b4fe] px-1.5 py-0.5 rounded-md font-mono text-xs font-bold border border-[#3b3369]"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          const blockId = `code_${Math.random().toString(36).slice(2, 7)}`;
                          const language = match ? match[1] : 'code';

                          return (
                            <div className="my-2.5 rounded-2xl overflow-hidden border-2 border-[#2d2652] bg-[#0c0919] shadow-lg font-sans">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#171330] border-b border-[#251f42] text-purple-300 text-xs font-mono font-bold">
                                <span className="flex items-center gap-1.5 text-purple-400">
                                  <Code2 className="w-3.5 h-3.5 text-[#a855f7]" />
                                  {language}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(codeText, blockId)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-[#251f42] text-purple-300 text-[11px] transition-colors cursor-pointer"
                                >
                                  {copiedCodeId === blockId ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-3 text-xs sm:text-sm font-mono text-purple-200 overflow-x-auto leading-relaxed">
                                <code>{codeText}</code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {cleanContent}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Embedded Interactive Quiz Card */}
                {hasQuiz && (
                  <div className="mt-2">
                    <QuizCard
                      quiz={message.quizData!}
                      onAnswerAward={onAnswerAward}
                      onAskFollowup={onSendPreset}
                    />
                  </div>
                )}
              </div>

              {/* Bot label */}
              {!isUser && (
                <div className="flex items-center gap-1 mt-1 px-2 text-[10px] font-bold text-purple-400/50">
                  <Bot className="w-3 h-3 text-[#a855f7]" />
                  <span>{message.mode}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-start gap-2">
          <div className="p-3 bg-[#141029] rounded-3xl rounded-tl-xs border-2 border-[#2b244d] border-b-4 flex items-center gap-2 text-purple-300 font-extrabold text-xs shadow-md">
            <Bot className="w-4 h-4 text-[#a855f7] animate-pulse" />
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-bounce" />
            </div>
            <span>Processing...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
