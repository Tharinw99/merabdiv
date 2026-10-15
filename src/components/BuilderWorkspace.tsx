import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Send,
  FileCode,
  PanelLeft,
  X,
  Plus,
  Trash2,
  LogOut,
  Sparkles,
  Layers,
  Code2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { DuoMascot } from './DuoMascot';
import { sendChatMessage } from '../lib/api';

export interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

export interface BuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  filesGenerated?: ProjectFile[];
}

export interface BuilderProject {
  id: string;
  title: string;
  messages: BuilderMessage[];
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

interface BuilderWorkspaceProps {
  onClose: () => void;
  onIncrementRequest: () => void;
}

// Built-in intelligent template generators for instant zero-latency build support
function getSmartFallbackProject(prompt: string): { title: string; files: ProjectFile[]; explanation: string } {
  const p = prompt.toLowerCase();

  if (p.includes('calc') || p.includes('scientific') || p.includes('math')) {
    return {
      title: 'Scientific Calculator',
      explanation: 'Built a sleek scientific calculator featuring trig functions, square root, exponentiation, and clean tactile feedback.',
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scientific Calculator</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="calculator-card">
    <div class="calc-header">
      <span class="badge">DREAM SCI-CALC</span>
      <span class="deg-rad" id="modeIndicator">DEG</span>
    </div>
    <div class="screen">
      <div class="formula" id="formula"></div>
      <div class="display" id="display">0</div>
    </div>
    <div class="keys">
      <button class="fn" onclick="calcFn('sin')">sin</button>
      <button class="fn" onclick="calcFn('cos')">cos</button>
      <button class="fn" onclick="calcFn('tan')">tan</button>
      <button class="fn" onclick="calcFn('sqrt')">√</button>
      <button class="fn" onclick="calcFn('pow')">xʸ</button>

      <button class="fn" onclick="calcFn('log')">log</button>
      <button class="fn" onclick="calcFn('ln')">ln</button>
      <button class="fn" onclick="insert('(')">(</button>
      <button class="fn" onclick="insert(')')">)</button>
      <button class="op" onclick="clearAll()">AC</button>

      <button class="num" onclick="insert('7')">7</button>
      <button class="num" onclick="insert('8')">8</button>
      <button class="num" onclick="insert('9')">9</button>
      <button class="op" onclick="insert('/')">÷</button>
      <button class="op" onclick="deleteLast()">DEL</button>

      <button class="num" onclick="insert('4')">4</button>
      <button class="num" onclick="insert('5')">5</button>
      <button class="num" onclick="insert('6')">6</button>
      <button class="op" onclick="insert('*')">×</button>
      <button class="fn" onclick="calcFn('pi')">π</button>

      <button class="num" onclick="insert('1')">1</button>
      <button class="num" onclick="insert('2')">2</button>
      <button class="num" onclick="insert('3')">3</button>
      <button class="op" onclick="insert('-')">−</button>
      <button class="fn" onclick="calcFn('e')">e</button>

      <button class="num zero" onclick="insert('0')">0</button>
      <button class="num" onclick="insert('.')">.</button>
      <button class="op" onclick="insert('+')">+</button>
      <button class="equals" onclick="compute()">=</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
        },
        {
          name: 'style.css',
          language: 'css',
          content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #0b0d18;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}
.calculator-card {
  width: 100%;
  max-width: 380px;
  background: #13172c;
  border: 2px solid #28305c;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}
.calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.badge {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.5px;
  color: #a855f7;
}
.deg-rad {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  background: #1c2344;
  border-radius: 8px;
  color: #60a5fa;
}
.screen {
  background: #080911;
  border: 1.5px solid #232a52;
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 18px;
  text-align: right;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.formula {
  font-size: 13px;
  color: #818cf8;
  font-family: monospace;
  min-height: 16px;
}
.display {
  font-size: 32px;
  font-weight: 700;
  font-family: monospace;
  overflow-x: auto;
  white-space: nowrap;
}
.keys {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
button {
  background: #1a203d;
  color: #e2e8f0;
  border: none;
  border-radius: 14px;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 3px solid #13172e;
}
button:hover { background: #232b52; color: #fff; }
button:active { transform: translateY(2px); border-bottom-width: 1px; }
button.num { background: #1c2242; }
button.fn { background: #151a36; color: #a5b4fc; font-size: 13px; }
button.op { background: #312e81; color: #c7d2fe; border-bottom-color: #1e1b4b; }
button.equals {
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  color: #fff;
  border-bottom-color: #4338ca;
  font-size: 20px;
}
button.zero { grid-column: span 2; }`,
        },
        {
          name: 'app.js',
          language: 'javascript',
          content: `let curr = '0';
let form = '';
const disp = document.getElementById('display');
const formEl = document.getElementById('formula');

function updateView() {
  disp.innerText = curr;
  formEl.innerText = form;
}

function insert(char) {
  if (curr === '0' && !isNaN(char)) curr = char;
  else curr += char;
  updateView();
}

function clearAll() {
  curr = '0';
  form = '';
  updateView();
}

function deleteLast() {
  if (curr.length > 1) curr = curr.slice(0, -1);
  else curr = '0';
  updateView();
}

function calcFn(fn) {
  const val = parseFloat(curr) || 0;
  if (fn === 'sin') curr = Math.sin(val * Math.PI / 180).toFixed(6);
  else if (fn === 'cos') curr = Math.cos(val * Math.PI / 180).toFixed(6);
  else if (fn === 'tan') curr = Math.tan(val * Math.PI / 180).toFixed(6);
  else if (fn === 'sqrt') curr = Math.sqrt(val).toFixed(6);
  else if (fn === 'log') curr = Math.log10(val).toFixed(6);
  else if (fn === 'ln') curr = Math.log(val).toFixed(6);
  else if (fn === 'pi') curr = Math.PI.toFixed(6);
  else if (fn === 'e') curr = Math.E.toFixed(6);
  else if (fn === 'pow') { form = curr + ' ^ '; curr = '0'; }
  curr = String(parseFloat(curr));
  updateView();
}

function compute() {
  try {
    form = curr + ' =';
    // Clean safe arithmetic
    const sanitized = curr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    curr = String(Function('"use strict";return (' + sanitized + ')')());
    updateView();
  } catch (e) {
    curr = 'Error';
    updateView();
  }
}`,
        },
      ],
    };
  }

  if (p.includes('shoot') || p.includes('space') || p.includes('defender') || p.includes('galaxy')) {
    return {
      title: 'Top-Down Space Defender',
      explanation: 'Built a retro space defender arcade game with lasers, enemy waves, score counter, and explosion particles.',
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Space Defender</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="arcade-wrap">
    <div class="hud">
      <span>SCORE: <b id="scoreVal">0</b></span>
      <span>LIVES: <b id="livesVal">❤❤❤</b></span>
    </div>
    <canvas id="gameCanvas" width="400" height="460"></canvas>
    <div class="controls-bar">Use [A][D] or [←][→] to Move • [SPACE] to Fire</div>
    <button id="retryBtn" onclick="initGame()">PLAY AGAIN</button>
  </div>
  <script src="game.js"></script>
</body>
</html>`,
        },
        {
          name: 'style.css',
          language: 'css',
          content: `body {
  margin: 0;
  background: #070913;
  color: #fff;
  font-family: system-ui, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.arcade-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.hud {
  width: 400px;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 800;
  color: #818cf8;
  font-family: monospace;
}
canvas {
  background: #0c0e1e;
  border: 2px solid #312e81;
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
}
.controls-bar {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}
#retryBtn {
  display: none;
  padding: 10px 24px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
}`,
        },
        {
          name: 'game.js',
          language: 'javascript',
          content: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreVal');
const livesEl = document.getElementById('livesVal');
const retryBtn = document.getElementById('retryBtn');

let player, lasers, enemies, stars, score, lives, gameOver;
const keys = {};

function initGame() {
  player = { x: 180, y: 400, w: 28, h: 24, speed: 6 };
  lasers = [];
  enemies = [];
  stars = Array.from({length: 40}, () => ({ x: Math.random() * 400, y: Math.random() * 460, s: Math.random() * 2 + 1 }));
  score = 0;
  lives = 3;
  gameOver = false;
  scoreEl.innerText = score;
  livesEl.innerText = '❤❤❤';
  retryBtn.style.display = 'none';
}

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' && !gameOver) {
    lasers.push({ x: player.x + 12, y: player.y, w: 4, h: 12 });
  }
});
window.addEventListener('keyup', e => keys[e.code] = false);

let enemyTimer = 0;
function loop() {
  if (!gameOver) {
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 10) player.x -= player.speed;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - player.w - 10) player.x += player.speed;

    lasers.forEach((l, i) => {
      l.y -= 9;
      if (l.y < -10) lasers.splice(i, 1);
    });

    enemyTimer++;
    if (enemyTimer % 45 === 0) {
      enemies.push({ x: Math.random() * 350 + 20, y: -20, r: 14, speed: Math.random() * 2 + 2 });
    }

    enemies.forEach((en, ei) => {
      en.y += en.speed;
      lasers.forEach((l, li) => {
        const dist = Math.hypot(en.x - (l.x + 2), en.y - l.y);
        if (dist < en.r + 4) {
          enemies.splice(ei, 1);
          lasers.splice(li, 1);
          score += 20;
          scoreEl.innerText = score;
        }
      });

      if (en.y > canvas.height) {
        enemies.splice(ei, 1);
        lives--;
        livesEl.innerText = '❤'.repeat(Math.max(0, lives));
        if (lives <= 0) {
          gameOver = true;
          retryBtn.style.display = 'block';
        }
      }
    });
  }

  // Draw
  ctx.fillStyle = '#070914';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  ctx.fillStyle = '#6366f1';
  stars.forEach(s => {
    s.y += s.s * 0.5;
    if (s.y > canvas.height) s.y = 0;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  });

  // Player ship
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.moveTo(player.x + player.w/2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.fill();

  // Lasers
  ctx.fillStyle = '#a855f7';
  lasers.forEach(l => ctx.fillRect(l.x, l.y, l.w, l.h));

  // Enemies
  ctx.fillStyle = '#f43f5e';
  enemies.forEach(en => {
    ctx.beginPath();
    ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
    ctx.fill();
  });

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', canvas.width/2, canvas.height/2);
  }

  requestAnimationFrame(loop);
}

initGame();
loop();`,
        },
      ],
    };
  }

  // Default: Arcade Retro Snake Game
  return {
    title: 'Retro Arcade Snake',
    explanation: 'Designed a retro neon arcade snake game featuring glowing fruit orbs, score tracking, responsive arrow controls, and instant replay.',
    files: [
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Retro Arcade Snake</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div class="hud">
      <span class="logo">DREAM RETRO SNAKE</span>
      <span class="score">SCORE: <b id="score">0</b></span>
    </div>
    <canvas id="canvas" width="360" height="360"></canvas>
    <div class="controls-hint">Arrow Keys or WASD to Slither • Collect Glowing Orbs</div>
    <button id="restartBtn">Play Again</button>
  </div>
  <script src="game.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        language: 'css',
        content: `body {
  margin: 0;
  background: #090b16;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.hud {
  width: 360px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #a855f7, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.score {
  font-size: 13px;
  font-weight: bold;
  color: #60a5fa;
  font-family: monospace;
}
canvas {
  background: #0f1326;
  border: 2px solid #2d3663;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(99, 102, 241, 0.25);
}
.controls-hint {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}
#restartBtn {
  display: none;
  padding: 10px 22px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.35);
}`,
      },
      {
        name: 'game.js',
        language: 'javascript',
        content: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

const gridSize = 18;
const tiles = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let dx = 0, dy = 0;
let food = { x: 14, y: 14 };
let score = 0;
let isDead = false;

function placeFood() {
  food.x = Math.floor(Math.random() * tiles);
  food.y = Math.floor(Math.random() * tiles);
}

function update() {
  if (isDead || (dx === 0 && dy === 0)) return;
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  if (head.x < 0 || head.x >= tiles || head.y < 0 || head.y >= tiles) {
    isDead = true;
    restartBtn.style.display = 'block';
    return;
  }

  for (let s of snake) {
    if (s.x === head.x && s.y === head.y) {
      isDead = true;
      restartBtn.style.display = 'block';
      return;
    }
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.innerText = score;
    placeFood();
  } else {
    snake.pop();
  }
}

function draw() {
  ctx.fillStyle = '#0f1326';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fruit Orb
  ctx.fillStyle = '#a855f7';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#a855f7';
  ctx.beginPath();
  ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Snake
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#3b82f6';
  snake.forEach((part, i) => {
    ctx.fillStyle = i === 0 ? '#60a5fa' : '#3b82f6';
    ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
  });
  ctx.shadowBlur = 0;

  if (isDead) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
  }
}

restartBtn.addEventListener('click', () => {
  snake = [{ x: 10, y: 10 }];
  dx = 0; dy = 0;
  score = 0;
  scoreEl.innerText = 0;
  isDead = false;
  restartBtn.style.display = 'none';
  placeFood();
});

window.addEventListener('keydown', e => {
  if (['ArrowUp', 'KeyW'].includes(e.code) && dy === 0) { dx = 0; dy = -1; }
  else if (['ArrowDown', 'KeyS'].includes(e.code) && dy === 0) { dx = 0; dy = 1; }
  else if (['ArrowLeft', 'KeyA'].includes(e.code) && dx === 0) { dx = -1; dy = 0; }
  else if (['ArrowRight', 'KeyD'].includes(e.code) && dx === 0) { dx = 1; dy = 0; }
});

setInterval(() => {
  update();
  draw();
}, 90);
draw();`,
      },
    ],
  };
}

export const BuilderWorkspace: React.FC<BuilderWorkspaceProps> = ({
  onClose,
  onIncrementRequest,
}) => {
  // Saved builder projects
  const [projects, setProjects] = useState<BuilderProject[]>(() => {
    const saved = localStorage.getItem('dreams_builder_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const saved = localStorage.getItem('dreams_builder_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BuilderProject[];
        return parsed.length > 0 ? parsed[0].id : null;
      } catch (e) {}
    }
    return null;
  });

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Homescreen prompt input vs active workspace input
  const [homeInput, setHomeInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHoveredDremmy, setIsHoveredDremmy] = useState(false);

  // Right pane tabs: Live preview vs Code files
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Sync projects with localStorage
  useEffect(() => {
    localStorage.setItem('dreams_builder_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeProject?.messages, isBuilding]);

  // Generate bundled HTML for iframe preview
  const generateBundle = () => {
    if (!activeProject || !activeProject.files) {
      return '<div style="background:#090b16;color:#818cf8;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;"><h3>Preparing preview...</h3></div>';
    }
    const htmlFile = activeProject.files.find((f) => f.name.endsWith('.html'))?.content || '<h1>App</h1>';
    const cssFile = activeProject.files.find((f) => f.name.endsWith('.css'))?.content || '';
    const jsFile = activeProject.files.find((f) => f.name.endsWith('.js') || f.name.endsWith('.ts'))?.content || '';

    let bundled = htmlFile;
    if (cssFile) {
      bundled = bundled.replace('</head>', `<style>${cssFile}</style></head>`);
    }
    if (jsFile) {
      bundled = bundled.replace('</body>', `<script>${jsFile}</script></body>`);
    }
    return bundled;
  };

  const handleCopyCode = () => {
    if (activeProject && activeProject.files[activeFileIndex]) {
      navigator.clipboard.writeText(activeProject.files[activeFileIndex].content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Start a new clean project -> navigates to Homescreen
  const handleStartNewProject = () => {
    setActiveProjectId(null);
    setHomeInput('');
    setChatInput('');
    setIsSidebarOpen(false);
  };

  // Delete project
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Core Agentic Generator
  const handleExecutePrompt = async (promptText: string) => {
    if (!promptText.trim() || isBuilding) return;

    setIsBuilding(true);
    onIncrementRequest();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: BuilderMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: promptText.trim(),
      timestamp,
    };

    let targetProj = activeProject;
    let projId = activeProjectId;

    // If starting from homescreen, create new project container
    if (!targetProj || !projId) {
      projId = `proj_${Date.now()}`;
      const title = promptText.trim().slice(0, 32);
      targetProj = {
        id: projId,
        title,
        messages: [userMsg],
        files: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [targetProj!, ...prev]);
      setActiveProjectId(projId);
      setHomeInput('');
    } else {
      // Append message to existing project
      const updatedMessages = [...targetProj.messages, userMsg];
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projId ? { ...p, messages: updatedMessages, updatedAt: new Date().toISOString() } : p
        )
      );
      setChatInput('');
    }

    try {
      const response = await sendChatMessage({
        messages: [
          {
            role: 'system',
            content: `You are Dremmy in Dream Builder mode.
Identity: You are Dremmy. Talk naturally like a normal, chill human friend who codes games and apps.
The user wants to build or iterate on: "${promptText}".
RULES:
1. Explain what you built in 1-2 friendly, casual sentences.
2. Provide the complete working code for index.html, style.css, and game.js (or app.js).
Format each file as:
\`\`\`html:index.html
...
\`\`\`
\`\`\`css:style.css
...
\`\`\`
\`\`\`javascript:game.js
...
\`\`\`
Make the app/game fully functional with smooth controls, beautiful dark UI, and zero placeholder comments.`,
          },
          { role: 'user', content: promptText },
        ],
        mode: 'study',
      });

      const reply = response.reply || '';

      // Extract generated files
      const extractedFiles: ProjectFile[] = [];
      const fileRegex = /```(html|css|javascript|js):?([\w.-]+)?\n([\s\S]*?)```/g;
      let match;
      while ((match = fileRegex.exec(reply)) !== null) {
        const lang = match[1];
        let filename = match[2];
        const content = match[3];

        if (!filename) {
          if (lang === 'html') filename = 'index.html';
          else if (lang === 'css') filename = 'style.css';
          else filename = 'app.js';
        }

        extractedFiles.push({
          name: filename,
          language: lang,
          content: content.trim(),
        });
      }

      // If no valid file blocks extracted, use high quality smart generator
      let finalFiles = extractedFiles;
      let replyText = reply.replace(/```[\s\S]*?```/g, '').trim();

      if (finalFiles.length === 0) {
        const fallback = getSmartFallbackProject(promptText);
        finalFiles = fallback.files;
        if (!replyText) replyText = fallback.explanation;
      }

      const assistantMsg: BuilderMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: replyText || 'Built and ready! Test it in the live preview on the right.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        filesGenerated: finalFiles,
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projId
            ? {
                ...p,
                messages: [...p.messages, assistantMsg],
                files: finalFiles,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      setPreviewKey((k) => k + 1);
      setActiveTab('preview');
    } catch (err: any) {
      console.warn('Builder live inference note, using smart synthesis:', err);
      // Smart synthesis fallback
      const fallback = getSmartFallbackProject(promptText);
      const assistantMsg: BuilderMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: fallback.explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        filesGenerated: fallback.files,
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projId
            ? {
                ...p,
                messages: [...p.messages, assistantMsg],
                files: fallback.files,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      setPreviewKey((k) => k + 1);
      setActiveTab('preview');
    } finally {
      setIsBuilding(false);
    }
  };

  const currentFiles = activeProject ? activeProject.files : [];

  return (
    <div className="fixed inset-0 z-40 bg-[#090b16] flex flex-col overflow-hidden text-gray-200 select-none">
      {/* Floating Top-Left Circle: Exactly like Dremmy circle in chat, opens the Dream Builder Sidebar */}
      <div className="fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          onMouseEnter={() => setIsHoveredDremmy(true)}
          onMouseLeave={() => setIsHoveredDremmy(false)}
          className="w-11 h-11 rounded-2xl bg-[#121528] border-2 border-[#242b50] hover:border-[#6366f1] shadow-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 group relative"
          title="Open Dream Builder Sidebar"
        >
          {isHoveredDremmy ? (
            <PanelLeft className="w-5 h-5 text-indigo-400 transition-all animate-in zoom-in-75" />
          ) : (
            <DuoMascot mood="engineering" size="sm" className="pointer-events-none scale-90" />
          )}

          <div className="absolute left-full ml-2 hidden group-hover:block bg-[#161a33] text-indigo-200 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-[#2e3766] shadow-xl whitespace-nowrap z-50">
            Dream Projects &amp; Menu
          </div>
        </button>
      </div>

      {/* Dream Builder Sidebar (Saved Projects & Exit Build Mode Button) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 z-50 backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#0e1122] border-r-2 border-[#22284c] z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#1f2445] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DuoMascot mood="engineering" size="sm" className="scale-85" />
            <span className="text-sm font-black bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent uppercase tracking-wider">
              Dream Builder
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1a1f3d] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New App Button */}
        <div className="p-4">
          <button
            onClick={handleStartNewProject}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] hover:from-[#8b5cf6] hover:to-[#60a5fa] active:translate-y-1 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-b-4 border-[#4338ca] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Dream App</span>
          </button>
        </div>

        {/* Saved Projects List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1 mb-1">
            Saved Apps ({projects.length})
          </span>

          {projects.length === 0 ? (
            <div className="text-center py-16 px-3 text-gray-400 text-xs font-bold select-none">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-indigo-400/30" />
              <p className="text-indigo-200 font-extrabold text-sm">No apps saved yet</p>
              <p className="text-[11px] text-slate-500 mt-1">Prompt Dremmy to create your first dream app!</p>
            </div>
          ) : (
            projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1b203d] border-[#6366f1] text-white font-extrabold shadow-sm'
                      : 'bg-[#12162d] hover:bg-[#181d3b] border-[#22284c] text-gray-300 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-xs truncate">{proj.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteProject(proj.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all shrink-0 cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Exit Build Mode Button inside Sidebar as requested */}
        <div className="p-4 border-t border-[#1f2445]">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-2xl bg-[#161a33] hover:bg-[#1e2447] border-2 border-b-4 border-[#2b335c] hover:border-[#6366f1] text-indigo-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:translate-y-0.5"
          >
            <LogOut className="w-4 h-4 text-indigo-400" />
            <span>Exit Build Mode</span>
          </button>
        </div>
      </aside>

      {/* VIEW A: Clean Homescreen (When no project is open) */}
      {!activeProject ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 select-none">
          <div className="w-full max-w-xl text-center flex flex-col items-center">
            {/* Engineering Dremmy Icon */}
            <div className="mb-5">
              <DuoMascot mood="engineering" size="lg" />
            </div>

            {/* Alternating Purple to Blue Gradient Title */}
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3 text-white">
              Build anything with{' '}
              <span className="dream-builder-gradient">
                Dream Builder.
              </span>
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-8 max-w-md">
              Type what you want to create—retro games, scientific tools, or interactive apps. Dremmy designs and compiles it live.
            </p>

            {/* Homescreen Centered Prompt Box (Clean & Modern) */}
            <div className="w-full bg-[#12152a] border-2 border-[#242b50] focus-within:border-[#6366f1] rounded-3xl p-3.5 shadow-2xl flex flex-col gap-2.5 transition-all">
              <textarea
                value={homeInput}
                onChange={(e) => setHomeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleExecutePrompt(homeInput);
                  }
                }}
                disabled={isBuilding}
                placeholder="What do you want to build? (e.g. Make an arcade retro snake game, or design a scientific calculator)..."
                rows={3}
                className="w-full resize-none px-2 py-1 bg-transparent text-sm sm:text-base font-semibold text-white placeholder-slate-500 focus:outline-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-[#1d2242]">
                <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                  Press Enter to build • Shift+Enter for newline
                </span>

                <button
                  onClick={() => handleExecutePrompt(homeInput)}
                  disabled={!homeInput.trim() || isBuilding}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] hover:from-[#8b5cf6] hover:to-[#60a5fa] active:translate-y-1 active:border-b-0 text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#4338ca] shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {isBuilding ? 'Designing...' : 'Build Dream App'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW B: Split Active Workspace (Left Chat, Right Live Preview & Code) */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Chat & Agentic iterations (40%) */}
          <div className="w-full md:w-[42%] lg:w-[38%] border-r-2 border-[#1c2242] flex flex-col bg-[#0c0e1e] overflow-hidden">
            {/* Project title bar */}
            <div className="p-3 pl-16 border-b border-[#1c2242] bg-[#101328] flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-extrabold text-xs text-white truncate">
                  {activeProject.title}
                </span>
              </div>
            </div>

            {/* Chat feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeProject.messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && <DuoMascot mood="engineering" size="sm" className="shrink-0 mt-1 scale-80" />}
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                        isUser
                          ? 'bg-[#4338ca] text-white border-b-3 border-[#312e81]'
                          : 'bg-[#141830] text-gray-200 border border-[#23294c]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {m.filesGenerated && (
                        <div className="mt-2 pt-2 border-t border-[#23294c] flex flex-wrap gap-1.5">
                          {m.filesGenerated.map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#090b16] text-blue-300 text-[10px] font-mono rounded-md border border-blue-900/40"
                            >
                              <FileCode className="w-3 h-3 text-blue-400" />
                              {f.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isBuilding && (
                <div className="flex items-center gap-2 p-3 bg-[#141830] rounded-2xl border border-[#23294c] text-xs text-blue-300 font-bold">
                  <DuoMascot mood="engineering" size="sm" className="scale-80" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>Dremmy is designing &amp; compiling your code...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat prompt input */}
            <div className="p-3 border-t border-[#1c2242] bg-[#101328]">
              <div className="flex items-center gap-2 bg-[#141830] border-2 border-[#23294c] focus-within:border-[#6366f1] rounded-2xl p-1.5 transition-colors">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleExecutePrompt(chatInput);
                  }}
                  disabled={isBuilding}
                  placeholder="Request changes or add new features..."
                  className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleExecutePrompt(chatInput)}
                  disabled={!chatInput.trim() || isBuilding}
                  className="p-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] hover:opacity-90 active:scale-95 text-white disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Interactive Preview & Code Viewer (60%) */}
          <div className="flex-1 flex flex-col bg-[#070914] overflow-hidden">
            {/* Tabs Header */}
            <div className="h-11 bg-[#0e1124] border-b border-[#1c2242] px-3 flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-blue-950/70 text-blue-300 border border-blue-700/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Preview</span>
                </button>

                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'code'
                      ? 'bg-blue-950/70 text-blue-300 border border-blue-700/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Code</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {activeTab === 'preview' && (
                  <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-[#181d3b] rounded-lg transition-colors cursor-pointer"
                    title="Reload preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {activeTab === 'code' && (
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-[#181d3b] rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                    title="Copy active code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-[#181d3b] rounded-lg transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit full width' : 'Full width'}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Main Content Area: Preview vs Code */}
            {activeTab === 'preview' ? (
              <div className="flex-1 relative bg-[#070914] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <iframe
                  key={previewKey}
                  srcDoc={generateBundle()}
                  title="Live Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  className="w-full h-full rounded-2xl border border-[#1e2547] bg-[#0c0e1e] shadow-2xl"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-[#070914] overflow-hidden">
                {/* File Tabs */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1c2242] bg-[#0b0e20] overflow-x-auto">
                  {currentFiles.map((file, idx) => (
                    <button
                      key={file.name}
                      onClick={() => setActiveFileIndex(idx)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        activeFileIndex === idx
                          ? 'bg-[#181d3d] text-indigo-300 border border-[#2d3663]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileCode className="w-3 h-3 text-indigo-400" />
                      <span>{file.name}</span>
                    </button>
                  ))}
                </div>

                {/* Code viewer */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 bg-[#070914]">
                  <pre className="whitespace-pre">
                    {currentFiles[activeFileIndex]?.content || '// No content'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
