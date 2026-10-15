import React, { useState } from 'react';
import { Plus, Trash2, X, Bot, MessageSquare } from 'lucide-react';
import type { ChatSession, AIMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: (mode?: AIMode) => void;
  onDeleteSession: (id: string) => void;
  currentMode: AIMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  currentMode,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile & Desktop Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#120f26] border-r-2 border-[#2b254a] z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header - Just "Saved Chats" */}
        <div className="p-4 border-b border-[#241e3d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#a855f7]" />
            <span className="text-sm font-extrabold text-purple-300 uppercase tracking-wider">
              Saved Chats
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1f1a3a] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat 3D Purple Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewSession(currentMode);
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-[#7c3aed] hover:bg-[#8b5cf6] active:translate-y-1 active:border-b-0 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-[#5b21b6] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Saved Chats History List - No Emojis */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="text-center py-16 px-3 text-gray-400 text-xs font-bold select-none">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-400/30" />
              <p className="text-purple-300/80 font-extrabold text-sm">No saved chats yet</p>
              <p className="text-[11px] text-gray-500 mt-1">Make your first chat to begin!</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isConfirmingDelete = deleteConfirmId === session.id;

              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#231d45] border-[#a855f7] text-white font-extrabold shadow-xs'
                      : 'bg-[#181430] hover:bg-[#1e193d] border-[#2c264f] text-gray-300 font-bold'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                    <Bot className="w-3.5 h-3.5 text-[#a855f7] shrink-0" />
                    <span className="text-xs truncate">{session.title || 'Untitled Chat'}</span>
                  </div>

                  {isConfirmingDelete ? (
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          onDeleteSession(session.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700"
                      >
                        Del
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-[10px] font-bold rounded-lg"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
