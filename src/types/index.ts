export type AIMode = 'answers' | 'casual' | 'study';

export type StudyTool = 'quiz' | 'mentor' | 'debug' | 'roadmap' | 'analogy';

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xp?: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode: AIMode;
  imageUrl?: string;
  quizData?: QuizData | null;
  tokenEstimate?: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  mode: AIMode;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface UserProfile {
  userId: string;
  streak: number;
  xp: number;
  gems: number;
  totalRequests?: number;
  updatedAt?: string;
}

export interface RateLimitStats {
  dailyRequests: {
    used: number;
    limit: number;
    remaining: number;
    resetTime: string;
    resetSecondsRemaining: number;
  };
  rpm: {
    currentPerUser: number;
    limitPerUser: number;
    currentGlobal: number;
    limitGlobal: number;
    isRateLimited: boolean;
    retryAfterSeconds: number;
  };
  tokenPool: {
    totalUsed: number;
    promptTokens: number;
    candidateTokens: number;
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openrouter' | 'gemini';
  textModel: string;
  visionModel: string;
}
