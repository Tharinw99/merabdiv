import React, { useState, useEffect, useRef } from 'react';
import { HeaderPill } from './components/HeaderPill';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { MessageInput } from './components/MessageInput';
import { BuilderWorkspace } from './components/BuilderWorkspace';
import { ApiKeyModal } from './components/ApiKeyModal';
import { StatsModal } from './components/StatsModal';
import { sendChatMessage, fetchStatsClient, incrementGlobalRequest } from './lib/api';
import {
  onUserChanged,
  getUserChatSessions,
  saveChatSession,
  deleteChatSession,
  getChatMessages,
  saveChatMessage,
} from './lib/firebase';
import type { User } from 'firebase/auth';
import type { ChatMessage, ChatSession, AIMode, RateLimitStats, StudyTool } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active mode & specialized study tool
  const [currentMode, setCurrentMode] = useState<AIMode>('study');
  const [activeStudyTool, setActiveStudyTool] = useState<StudyTool>('mentor');

  // Build Mode state (Engineering / Lab Dremmy workspace)
  const [isBuildMode, setIsBuildMode] = useState<boolean>(false);

  // Chat sessions state - starts completely blank with 0 saved history
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Rate limit & server stats
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals & Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadStats = async () => {
    try {
      const data = await fetchStatsClient(currentUser?.uid);
      setStats(data);
      if (data.rpm?.isRateLimited && data.rpm?.retryAfterSeconds > 0) {
        triggerCooldown(data.rpm.retryAfterSeconds);
      }
    } catch (err) {
      console.warn('Stats fetch notice:', err);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 20000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const triggerCooldown = (seconds: number) => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    setCooldownSeconds(seconds);

    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auth listener & sessions loading
  useEffect(() => {
    const unsubscribe = onUserChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudSessions = await getUserChatSessions(user.uid);
          setSessions(cloudSessions);
          if (cloudSessions.length > 0) {
            setActiveSessionId(cloudSessions[0].id);
          }
        } catch (err) {
          console.error('Error loading cloud data:', err);
        }
      } else {
        const saved = localStorage.getItem('dreams_guest_sessions');
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ChatSession[];
            setSessions(parsed);
            if (parsed.length > 0) {
              setActiveSessionId(parsed[0].id);
            }
          } catch (e) {
            setSessions([]);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const loadSessionMessages = async () => {
      const active = sessions.find((s) => s.id === activeSessionId);
      if (active) {
        setCurrentMode(active.mode);
      }

      if (currentUser) {
        try {
          const cloudMessages = await getChatMessages(currentUser.uid, activeSessionId);
          setMessages(cloudMessages);
        } catch (err) {
          console.error('Failed to get cloud messages:', err);
        }
      } else {
        const key = `dreams_msgs_${activeSessionId}`;
        const local = localStorage.getItem(key);
        if (local) {
          try {
            setMessages(JSON.parse(local));
          } catch (e) {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }
    };

    loadSessionMessages();
  }, [activeSessionId, currentUser]);

  // Create new chat session
  const createNewSession = async (mode: AIMode = currentMode, uid = currentUser?.uid || 'guest') => {
    const newSession: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: uid,
      title: 'New Chat',
      mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setCurrentMode(mode);

    if (currentUser) {
      await saveChatSession(newSession);
    } else {
      localStorage.setItem('dreams_guest_sessions', JSON.stringify(updated));
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);

    if (currentUser) {
      await deleteChatSession(currentUser.uid, id);
    } else {
      localStorage.setItem('dreams_guest_sessions', JSON.stringify(updated));
      localStorage.removeItem(`dreams_msgs_${id}`);
    }

    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    image?: { data: string; mimeType: string }
  ) => {
    if ((!text.trim() && !image) || isLoading || cooldownSeconds > 0) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      const newSession: ChatSession = {
        id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: currentUser?.uid || 'guest',
        title: text.slice(0, 32) || 'New Chat',
        mode: currentMode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      targetSessionId = newSession.id;
      if (currentUser) await saveChatSession(newSession);
      else localStorage.setItem('dreams_guest_sessions', JSON.stringify([newSession, ...sessions]));
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      chatId: targetSessionId,
      userId: currentUser?.uid || 'guest',
      role: 'user',
      content: text,
      mode: currentMode,
      imageUrl: image ? `data:${image.mimeType};base64,${image.data}` : undefined,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    if (currentUser) {
      saveChatMessage(userMsg);
    } else {
      localStorage.setItem(`dreams_msgs_${targetSessionId}`, JSON.stringify(newMessages));
    }

    if (messages.length === 0) {
      const autoTitle = text.slice(0, 35) || (image ? 'Image Problem' : 'New Chat');
      setSessions((prev) =>
        prev.map((s) => (s.id === targetSessionId ? { ...s, title: autoTitle } : s))
      );
      const activeSess = sessions.find((s) => s.id === targetSessionId);
      if (activeSess) {
        const updatedSess = { ...activeSess, title: autoTitle, updatedAt: new Date().toISOString() };
        if (currentUser) saveChatSession(updatedSess);
        else {
          const updated = sessions.map((s) => (s.id === targetSessionId ? updatedSess : s));
          localStorage.setItem('dreams_guest_sessions', JSON.stringify(updated));
        }
      }
    }

    try {
      const data = await sendChatMessage({
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        mode: currentMode,
        studyTool: currentMode === 'study' ? activeStudyTool : undefined,
        image,
        userId: currentUser?.uid,
      });

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        chatId: targetSessionId,
        userId: currentUser?.uid || 'guest',
        role: 'assistant',
        content: data.reply || 'Answer provided.',
        mode: currentMode,
        quizData: data.quiz || null,
        tokenEstimate: data.tokenUsage?.totalTokens || 0,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      if (currentUser) {
        saveChatMessage(assistantMsg);
      } else {
        localStorage.setItem(`dreams_msgs_${targetSessionId}`, JSON.stringify(finalMessages));
      }

      loadStats();
    } catch (err: any) {
      console.error('Chat error:', err);
      if (err.message && (err.message.includes('RPM') || err.message.includes('wait'))) {
        const match = err.message.match(/(\d+)\s*s/);
        triggerCooldown(match ? parseInt(match[1], 10) : 15);
      }

      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        chatId: targetSessionId,
        userId: currentUser?.uid || 'guest',
        role: 'assistant',
        content: `**Notice:** ${err.message || 'Failed to communicate with Dremmy.'}`,
        mode: currentMode,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrementBuildRequest = () => {
    incrementGlobalRequest();
    loadStats();
  };

  return (
    <div className="flex flex-col h-screen bg-[#0c0a1a] text-gray-200 font-sans overflow-hidden">
      {/* Floating Header Pill: Dremmy Circle + Engineering Dremmy (Build Mode) + Daily Pool + Key Button */}
      {!isBuildMode && (
        <HeaderPill
          stats={stats}
          currentMode={currentMode}
          isBuildMode={isBuildMode}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleBuildMode={() => setIsBuildMode(!isBuildMode)}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
          onOpenStats={() => setIsStatsModalOpen(true)}
        />
      )}

      {/* Main Layout: If Build Mode is active, render BuilderWorkspace; else standard Chat */}
      {isBuildMode ? (
        <BuilderWorkspace
          onClose={() => setIsBuildMode(false)}
          onIncrementRequest={handleIncrementBuildRequest}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Drawer */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={createNewSession}
            onDeleteSession={handleDeleteSession}
            currentMode={currentMode}
          />

          {/* Central Chat View */}
          <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0e0b1d]">
            {/* Chat Area with Markdown & KaTeX */}
            <ChatArea
              messages={messages}
              currentMode={currentMode}
              isLoading={isLoading}
              onSendPreset={(prompt) => handleSendMessage(prompt)}
              onAnswerAward={() => {}}
            />

            {/* Bottom Message Input Bar with Drop-Up Model Selector */}
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              mode={currentMode}
              onSelectMode={(mode) => {
                setCurrentMode(mode);
                if (activeSessionId) {
                  setSessions((prev) =>
                    prev.map((s) => (s.id === activeSessionId ? { ...s, mode } : s))
                  );
                }
              }}
              studyTool={activeStudyTool}
              onSelectStudyTool={setActiveStudyTool}
              cooldownSeconds={cooldownSeconds}
            />
          </main>
        </div>
      )}

      {/* API Key Modal for Private Keys on GitHub Pages / Chromebooks */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
      />
    </div>
  );
}
