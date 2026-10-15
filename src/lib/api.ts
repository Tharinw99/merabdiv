import type { AIMode, QuizData, RateLimitStats, StudyTool } from '../types';

const MODEL_MAPPING = {
  text: {
    answers: 'nvidia/nemotron-3.5-lightning:free',
    casual: 'poolside/laguna-xs-2.1:free',
    study: 'cohere/north-mini-code:free',
  },
  vision: {
    answers: 'google/gemma-4-31b-it:free',
    casual: 'meta-llama/llama-3.2-11b-vision-instruct:free',
    study: 'openrouter/free',
  },
};

export async function sendChatMessage(params: {
  messages: { role: string; content: string }[];
  mode: AIMode;
  studyTool?: StudyTool;
  image?: { data: string; mimeType: string };
  requestQuiz?: boolean;
  userId?: string;
}): Promise<{
  reply: string;
  quiz: QuizData | null;
  mode: AIMode;
  modelUsed?: string;
  tokenUsage?: { totalTokens?: number };
}> {
  const hasImage = Boolean(params.image && params.image.data);
  const targetModel = hasImage
    ? MODEL_MAPPING.vision[params.mode]
    : MODEL_MAPPING.text[params.mode];

  const userOpenRouterKey = localStorage.getItem('dreams_openrouter_key') || '';
  const userGeminiKey = localStorage.getItem('dreams_gemini_key') || '';

  // 1. Try local Express proxy first if available
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (params.userId) headers['x-user-id'] = params.userId;
    if (userOpenRouterKey) headers['x-openrouter-key'] = userOpenRouterKey;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (res.status === 429) {
      const data = await res.json();
      throw new Error(data.message || 'Rate limit reached! Please wait.');
    }

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('RPM') || err.message.includes('limit'))) {
      throw err;
    }
    console.warn('Backend proxy unavailable, trying client-side inference:', err);
  }

  // 2. Direct client-side inference with Dremmy human tone
  const lastMsg = params.messages[params.messages.length - 1]?.content || '';
  const isQuiz =
    params.requestQuiz ||
    params.studyTool === 'quiz' ||
    /\b(quiz me|make a quiz|test me|test my knowledge|trivia on|quiz on)\b/i.test(lastMsg);

  const baseDremmyIdentity = `You are Dremmy.
IDENTITY:
- You are Dremmy! A smart, chill, supportive friend who helps with schoolwork, code, and dream projects.
- Speak naturally like a normal human. Never say "I am a large language model trained by Google" or output robotic disclaimers.
- Be concise and grounded.`;

  let systemPrompt = '';
  if (isQuiz) {
    systemPrompt = `${baseDremmyIdentity}
The user wants a quiz.
- Build a 4-option multiple-choice quiz on the exact topic they asked about (e.g. UFC, football, history, math, or coding).
- Output ONLY the interactive quiz in:
\`\`\`json:quiz
{
  "question": "Question text?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctIndex": 0,
  "explanation": "Explanation.",
  "xp": 15
}
\`\`\`
- Do NOT output unrelated coding tutorials or lectures unless the quiz topic is coding!`;
  } else if (params.mode === 'answers') {
    systemPrompt = `${baseDremmyIdentity}
You are in ANSWERS mode. Give the direct solution first in bold. Show brief steps and formulas. Zero fluff.`;
  } else if (params.mode === 'casual') {
    systemPrompt = `${baseDremmyIdentity}
You are in CASUAL mode. Chat naturally about dreams, college, school venting, and passions. Format cleanly with bold markdown.`;
  } else {
    systemPrompt = `${baseDremmyIdentity}
You are in STUDY mode — a sharp computer programming tutor. Teach step-by-step logic with clean formatted code.`;
  }

  // Direct OpenRouter if user entered an OpenRouter key
  if (userOpenRouterKey) {
    try {
      const orMessages = [
        { role: 'system', content: systemPrompt },
        ...params.messages.map((m, idx) => {
          const isLast = idx === params.messages.length - 1;
          if (isLast && hasImage) {
            return {
              role: m.role,
              content: [
                { type: 'text', text: m.content || 'Analyze this image.' },
                {
                  type: 'image_url',
                  image_url: { url: `data:${params.image!.mimeType};base64,${params.image!.data}` },
                },
              ],
            };
          }
          return { role: m.role, content: m.content };
        }),
      ];

      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userOpenRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Dreams AI',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: orMessages,
          temperature: params.mode === 'answers' ? 0.2 : 0.7,
        }),
      });

      if (orRes.ok) {
        const orData = await orRes.json();
        const text = orData.choices?.[0]?.message?.content || '';

        let quizData = null;
        let cleanText = text;
        const qm = text.match(/```json:quiz\s*([\s\S]*?)\s*```/);
        if (qm && qm[1]) {
          try {
            quizData = JSON.parse(qm[1]);
            cleanText = text.replace(qm[0], '').trim();
          } catch (e) {}
        }

        return {
          reply: cleanText,
          quiz: quizData,
          mode: params.mode,
          modelUsed: targetModel,
        };
      }
    } catch (e) {
      console.warn('Direct OpenRouter call failed, trying Gemini:', e);
    }
  }

  // Direct Gemini REST fallback (reads from user's locally saved key)
  const geminiApiKey = userGeminiKey || localStorage.getItem('dreams_api_key') || '';
  if (!geminiApiKey) {
    throw new Error('API key required for static hosting. Please click the Key icon in the top-right to paste your API key.');
  }
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`;

  const contents = params.messages.map((m, idx) => {
    const isLast = idx === params.messages.length - 1;
    if (isLast && hasImage) {
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [
          { inline_data: { mime_type: params.image!.mimeType, data: params.image!.data } },
          { text: m.content || 'Analyze this image.' },
        ],
      };
    }
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    };
  });

  const response = await fetch(geminiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: params.mode === 'answers' ? 0.2 : 0.7 },
    }),
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj.error?.message || 'Inference failed.');
  }

  const result = await response.json();
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  let quizData = null;
  let cleanText = textOutput;
  const qm = textOutput.match(/```json:quiz\s*([\s\S]*?)\s*```/);
  if (qm && qm[1]) {
    try {
      quizData = JSON.parse(qm[1]);
      cleanText = textOutput.replace(qm[0], '').trim();
    } catch (e) {}
  }

  return {
    reply: cleanText,
    quiz: quizData,
    mode: params.mode,
    modelUsed: 'gemini-3.1-flash-lite',
  };
}

export async function fetchStatsClient(userId?: string): Promise<RateLimitStats> {
  try {
    const res = await fetch('/api/stats', {
      headers: userId ? { 'x-user-id': userId } : {},
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  const used = parseInt(localStorage.getItem('dreams_daily_used') || '0', 10);
  return {
    dailyRequests: {
      used,
      limit: 500,
      remaining: Math.max(0, 500 - used),
      resetTime: 'Midnight UTC',
      resetSecondsRemaining: 3600,
    },
    rpm: {
      currentPerUser: 1,
      limitPerUser: 7,
      currentGlobal: 1,
      limitGlobal: 15,
      isRateLimited: false,
      retryAfterSeconds: 0,
    },
    tokenPool: {
      totalUsed: 1200,
      promptTokens: 400,
      candidateTokens: 800,
    },
  };
}

export async function incrementGlobalRequest(): Promise<void> {
  try {
    await fetch('/api/stats/increment', { method: 'POST' });
  } catch (e) {
    const used = parseInt(localStorage.getItem('dreams_daily_used') || '0', 10);
    localStorage.setItem('dreams_daily_used', String(used + 1));
  }
}
