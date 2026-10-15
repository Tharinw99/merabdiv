import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini API from environment variable
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: GEMINI_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

const DAILY_LIMIT = 500;
const USER_RPM_LIMIT = 7;
const GLOBAL_RPM_LIMIT = 15;

const userRequestTimestamps: Map<string, number[]> = new Map();
let globalRequestTimestamps: number[] = [];

let dailyUsage = {
  date: new Date().toISOString().slice(0, 10),
  requestsUsed: 0,
  promptTokens: 0,
  candidateTokens: 0,
  totalTokens: 0,
};

function checkAndResetDailyUsage() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyUsage.date !== today) {
    dailyUsage = {
      date: today,
      requestsUsed: 0,
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
    };
  }
}

function getSecondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function cleanTimestamps(timestamps: number[]): number[] {
  const now = Date.now();
  return timestamps.filter((t) => now - t < 60000);
}

function getUserIdentifier(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'anonymous';
  const customUserId = (req.headers['x-user-id'] as string) || '';
  return customUserId ? `${ip}_${customUserId}` : ip;
}

// Stats route
app.get('/api/stats', (req, res) => {
  checkAndResetDailyUsage();
  const userId = getUserIdentifier(req);

  globalRequestTimestamps = cleanTimestamps(globalRequestTimestamps);
  const userTimestamps = cleanTimestamps(userRequestTimestamps.get(userId) || []);
  userRequestTimestamps.set(userId, userTimestamps);

  const secondsToMidnight = getSecondsUntilMidnightUTC();
  const remainingDaily = Math.max(0, DAILY_LIMIT - dailyUsage.requestsUsed);

  let retryAfterSeconds = 0;
  if (userTimestamps.length >= USER_RPM_LIMIT) {
    const oldest = userTimestamps[0];
    retryAfterSeconds = Math.max(1, Math.ceil((60000 - (Date.now() - oldest)) / 1000));
  } else if (globalRequestTimestamps.length >= GLOBAL_RPM_LIMIT) {
    const oldest = globalRequestTimestamps[0];
    retryAfterSeconds = Math.max(1, Math.ceil((60000 - (Date.now() - oldest)) / 1000));
  }

  res.json({
    dailyRequests: {
      used: dailyUsage.requestsUsed,
      limit: DAILY_LIMIT,
      remaining: remainingDaily,
      resetTime: 'Midnight UTC',
      resetSecondsRemaining: secondsToMidnight,
    },
    rpm: {
      currentPerUser: userTimestamps.length,
      limitPerUser: USER_RPM_LIMIT,
      currentGlobal: globalRequestTimestamps.length,
      limitGlobal: GLOBAL_RPM_LIMIT,
      isRateLimited: retryAfterSeconds > 0,
      retryAfterSeconds,
    },
    tokenPool: {
      totalUsed: dailyUsage.totalTokens,
      promptTokens: dailyUsage.promptTokens,
      candidateTokens: dailyUsage.candidateTokens,
    },
  });
});

// Increment request counter endpoint (for builder actions)
app.post('/api/stats/increment', (req, res) => {
  checkAndResetDailyUsage();
  dailyUsage.requestsUsed += 1;
  res.json({ success: true, used: dailyUsage.requestsUsed });
});

// Chat route
app.post('/api/chat', async (req, res) => {
  checkAndResetDailyUsage();
  const userId = getUserIdentifier(req);
  const now = Date.now();

  // Daily limit check
  if (dailyUsage.requestsUsed >= DAILY_LIMIT) {
    const seconds = getSecondsUntilMidnightUTC();
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return res.status(429).json({
      error: 'daily_limit',
      message: `Daily limit of 500 requests reached. Resets in ${hours}h ${mins}m.`,
      resetSecondsRemaining: seconds,
    });
  }

  // RPM check
  globalRequestTimestamps = cleanTimestamps(globalRequestTimestamps);
  const userTimestamps = cleanTimestamps(userRequestTimestamps.get(userId) || []);

  if (userTimestamps.length >= USER_RPM_LIMIT) {
    const oldest = userTimestamps[0];
    const retryAfter = Math.max(1, Math.ceil((60000 - (now - oldest)) / 1000));
    return res.status(429).json({
      error: 'rpm_limit',
      message: `RPM limit reached! Please wait ${retryAfter}s.`,
      retryAfterSeconds: retryAfter,
    });
  }

  const {
    messages,
    mode = 'study',
    studyTool,
    image,
    requestQuiz = false,
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'invalid_messages', message: 'Messages array is required.' });
  }

  const hasImage = Boolean(image && image.data && image.mimeType);
  const selectedMode = (mode as 'answers' | 'casual' | 'study') || 'study';

  const targetModel = hasImage
    ? MODEL_MAPPING.vision[selectedMode]
    : MODEL_MAPPING.text[selectedMode];

  const lastMsg = messages[messages.length - 1]?.content || '';
  const isQuizIntent = requestQuiz || studyTool === 'quiz' || /\b(quiz me|make a quiz|test me|test my knowledge|trivia on|quiz on)\b/i.test(lastMsg);

  // DREMMY NATURAL HUMAN PERSONA
  const baseDremmyIdentity = `You are Dremmy.
IDENTITY RULES:
- You are Dremmy, a smart, relaxed, highly capable companion who helps users crush schoolwork fast so they have time for their real dreams.
- NEVER say "I am a large language model trained by Google" or give corporate disclaimers. If asked who you are or what model you are, answer naturally like a person: "I'm Dremmy! Here to help you breeze through schoolwork and build your dream projects."
- Speak in a normal, chill human tone. Be concise, direct, and conversational without trying too hard or being cringy.`;

  let systemInstruction = '';
  if (isQuizIntent) {
    systemInstruction = `${baseDremmyIdentity}
The user wants a quiz.
- Detect the topic they asked about (e.g. UFC, football, basketball, gaming, math, history, coding).
- Build a 4-option multiple-choice quiz STRICTLY about that topic.
- Output ONLY the quiz block formatted as:
\`\`\`json:quiz
{
  "question": "Question text here?",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctIndex": 0,
  "explanation": "Brief explanation of the right answer.",
  "xp": 15
}
\`\`\`
- Do NOT output unrelated coding tutorials or unsolicited programming lessons unless the quiz topic is coding!`;
  } else if (selectedMode === 'answers') {
    systemInstruction = `${baseDremmyIdentity}
You are in ANSWERS mode.
- Give the direct solution first in bold (**solution**).
- Follow with brief steps, formulas, and working.
- Zero fluff. Use LaTeX math ($...$ or $$...$$) where applicable.`;
  } else if (selectedMode === 'casual') {
    systemInstruction = `${baseDremmyIdentity}
You are in CASUAL mode.
- Chat naturally about dreams, college, passions, gaming, tech, and school stress.
- Keep the tone real, grounded, and friendly. Use bold markdown for key points.`;
  } else {
    // study mode
    let toolSpecific = '';
    if (studyTool === 'debug') {
      toolSpecific = 'Quickly pinpoint the bug in 1-2 lines, then provide the corrected working code block with clean comments.';
    } else if (studyTool === 'roadmap') {
      toolSpecific = 'Provide clear, practical guidance for college computer science and high-paying software jobs without burnout.';
    } else if (studyTool === 'analogy') {
      toolSpecific = 'Explain the concept using a clean everyday analogy first before syntax.';
    } else {
      toolSpecific = 'Teach step-by-step programming logic with clean commented code.';
    }

    systemInstruction = `${baseDremmyIdentity}
You are in STUDY mode — a sharp, friendly computer programming tutor.
${toolSpecific}
- Format code blocks with language tags (e.g. \`\`\`python).
- Use **bold** markdown for key concepts and LaTeX math ($...$) if relevant.`;
  }

  // OpenRouter key check
  const openRouterKey = (req.headers['x-openrouter-key'] as string) || process.env.OPENROUTER_API_KEY;

  if (openRouterKey) {
    try {
      const openRouterMessages = [
        { role: 'system', content: systemInstruction },
        ...messages.map((m: any, idx: number) => {
          const isLast = idx === messages.length - 1;
          if (isLast && hasImage) {
            return {
              role: m.role,
              content: [
                { type: 'text', text: m.content || 'Analyze this image.' },
                {
                  type: 'image_url',
                  image_url: { url: `data:${image.mimeType};base64,${image.data}` },
                },
              ],
            };
          }
          return { role: m.role, content: m.content };
        }),
      ];

      const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreams.local',
          'X-Title': 'Dreams AI',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: openRouterMessages,
          temperature: selectedMode === 'answers' ? 0.2 : 0.7,
        }),
      });

      if (orResponse.ok) {
        const orData = await orResponse.json();
        const rawReply = orData.choices?.[0]?.message?.content || '';

        let quizData = null;
        let cleanText = rawReply;
        const quizMatch = rawReply.match(/```json:quiz\s*([\s\S]*?)\s*```/);
        if (quizMatch && quizMatch[1]) {
          try {
            quizData = JSON.parse(quizMatch[1]);
            cleanText = rawReply.replace(quizMatch[0], '').trim();
          } catch (e) {
            console.warn('Quiz parse error:', e);
          }
        }

        userTimestamps.push(now);
        userRequestTimestamps.set(userId, userTimestamps);
        globalRequestTimestamps.push(now);
        dailyUsage.requestsUsed += 1;

        return res.json({
          reply: cleanText,
          quiz: quizData,
          mode: selectedMode,
          modelUsed: targetModel,
          tokenUsage: orData.usage || { total_tokens: 450 },
        });
      }
    } catch (e) {
      console.warn('OpenRouter request failed, falling back to Gemini:', e);
    }
  }

  // Fallback to Gemini with Dremmy Persona
  try {
    const contents: any[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLast = i === messages.length - 1;

      if (isLast && hasImage) {
        contents.push({
          role: 'user',
          parts: [
            { inlineData: { data: image.data, mimeType: image.mimeType } },
            { text: msg.content || 'Analyze this image.' },
          ],
        });
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        systemInstruction,
        temperature: selectedMode === 'answers' ? 0.2 : 0.7,
      },
    });

    userTimestamps.push(now);
    userRequestTimestamps.set(userId, userTimestamps);
    globalRequestTimestamps.push(now);
    dailyUsage.requestsUsed += 1;

    const rawText = response.text || '';
    let quizData = null;
    let cleanText = rawText;
    const quizMatch = rawText.match(/```json:quiz\s*([\s\S]*?)\s*```/);
    if (quizMatch && quizMatch[1]) {
      try {
        quizData = JSON.parse(quizMatch[1]);
        cleanText = rawText.replace(quizMatch[0], '').trim();
      } catch (err) {
        console.warn('Failed to parse quiz json:', err);
      }
    }

    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const candidateTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = response.usageMetadata?.totalTokenCount || promptTokens + candidateTokens;

    dailyUsage.promptTokens += promptTokens;
    dailyUsage.candidateTokens += candidateTokens;
    dailyUsage.totalTokens += totalTokens;

    res.json({
      reply: cleanText,
      quiz: quizData,
      mode: selectedMode,
      modelUsed: 'gemini-3.1-flash-lite',
      tokenUsage: { promptTokens, candidateTokens, totalTokens },
    });
  } catch (err: any) {
    console.error('Server generation error:', err);
    res.status(500).json({ error: 'failed', message: err?.message || 'Inference error' });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dreams server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server launch failed:', err);
});
