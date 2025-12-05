import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Plus, Trash2, Check, Zap,
  Volume2, VolumeX, Maximize2, Minimize2, Coffee, Brain,
  Moon, Sparkles, Loader2, Lightbulb, ChevronRight,
} from 'lucide-react';

// --- API Configuration ---
// FOR VERCEL DEPLOYMENT:
// 1. Create a .env file locally with: VITE_GEMINI_API_KEY=your_key_here
// 2. In Vercel settings, add the Environment Variable: VITE_GEMINI_API_KEY
// 3. Uncomment the 'import.meta' line below and comment out the 'apiKey = ""' line.

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
// const apiKey = ""; // Keep empty for immediate preview (the environment injects it)

// --- Types ---
interface SubTask {
  id: number;
  text: string;
  completed: boolean;
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
  subtasks?: SubTask[];
  isExpanded?: boolean;
}

// --- Custom Hooks ---

// Hook for persistent local storage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// --- Components ---

const Button = ({ onClick, children, className, variant = 'primary', disabled = false }: any) => {
  const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    ghost: "text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50",
    danger: "text-rose-400 hover:bg-rose-900/20 hover:text-rose-300",
    magic: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  // --- State ---
  const [tasks, setTasks] = useLocalStorage<Task[]>('zenfocus-tasks', []);
  const [newTask, setNewTask] = useState('');

  // AI State
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  // Timer State
  const [timerMode, setTimerMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useLocalStorage('zenfocus-sound', true);

  // UI State
  const [zenMode, setZenMode] = useState(false);
  const timerRef = useRef<number | null>(null);

  // --- Constants ---
  const MODES = {
    focus: { time: 25 * 60, color: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Focus Flow' },
    short: { time: 5 * 60, color: 'text-cyan-400', bg: 'bg-cyan-500', label: 'Short Break' },
    long: { time: 15 * 60, color: 'text-indigo-400', bg: 'bg-indigo-500', label: 'Long Break' }
  };

  // --- Gemini API Helper ---
  const callGemini = async (prompt: string) => {
    // Safety check for missing API key
    // Note: In the preview environment, apiKey is empty but injected by the system.
    // In production/Vercel, you must set the environment variable.

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) throw new Error('AI Response failed');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error("Gemini API Error:", error);
      alert("AI Error: Check console for details (likely API quota or key issue).");
      return null;
    }
  };

  // --- AI Features ---
  const handleSmartBreakdown = async (taskId: number, taskText: string) => {
    setLoadingTaskId(taskId);

    const prompt = `Act as a productivity expert. Break down the task "${taskText}" into 3 to 5 small, actionable, concrete sub-steps. Return ONLY a raw JSON array of strings (e.g. ["Step 1", "Step 2"]). Do not include markdown formatting or "json" tags.`;

    const result = await callGemini(prompt);

    if (result) {
      try {
        // Clean up potential markdown formatting if the model adds it despite instructions
        const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const steps = JSON.parse(cleanJson);

        if (Array.isArray(steps)) {
          const newSubtasks = steps.map((step: string) => ({
            id: Date.now() + Math.random(),
            text: step,
            completed: false
          }));

          setTasks(tasks.map(t =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks], isExpanded: true }
              : t
          ));
        }
      } catch (e) {
        console.error("Failed to parse AI response", e);
        alert("Couldn't break down this task automatically. Try again!");
      }
    }
    setLoadingTaskId(null);
  };

  const getZenCoachTip = async () => {
    setIsCoachLoading(true);
    const activeTaskText = tasks.find(t => !t.completed)?.text || "general focus";
    const prompt = `I am using a focus timer app. My current main task is: "${activeTaskText}". Give me one single, short, powerful sentence of advice (Stoic, productivity, or motivational) to help me start or focus on this specific task. Keep it under 20 words.`;

    const tip = await callGemini(prompt);
    if (tip) setCoachTip(tip);
    setIsCoachLoading(false);
  };

  // --- Effects ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (soundEnabled) playNotification();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    // Update document title with timer
    document.title = `${formatTime(timeLeft)} - ZenFocus`;
  }, [timeLeft]);

  // --- Helpers ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playNotification = () => {
    // Simple oscillator beep for "shippable" audio without external assets
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const switchMode = (mode: 'focus' | 'short' | 'long') => {
    setIsActive(false);
    setTimerMode(mode);
    setTimeLeft(MODES[mode].time);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[timerMode].time);
  };

  // --- Task Handlers ---
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, completed: false, subtasks: [], isExpanded: false }]);
    setNewTask('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleSubtask = (taskId: number, subtaskId: number) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks?.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
      };
    }));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleExpand = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isExpanded: !t.isExpanded } : t));
  };

  const activeTask = tasks.find(t => !t.completed);

  // --- Render Helpers ---
  const progress = 100 - (timeLeft / MODES[timerMode].time) * 100;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 transition-all duration-700 ${zenMode ? 'overflow-hidden' : ''}`}>

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] transition-all duration-1000 ${isActive ? 'opacity-100 scale-105' : 'opacity-50 scale-100'}`} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-12 flex flex-col min-h-screen">

        {/* Header */}
        <header className={`flex justify-between items-center mb-16 transition-all duration-500 ${zenMode ? 'opacity-0 translate-y-[-20px] pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Zap className="text-emerald-400 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              ZenFocus
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={getZenCoachTip} disabled={isCoachLoading}>
              {isCoachLoading ? <Loader2 className="animate-spin" size={20} /> : <Lightbulb size={20} />}
            </Button>
            <Button variant="ghost" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </Button>
            <Button variant="ghost" onClick={() => setZenMode(true)}>
              <Maximize2 size={20} />
            </Button>
          </div>
        </header>

        {/* Coach Tip Banner */}
        {coachTip && !zenMode && (
          <div className="mb-8 p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
            <Sparkles className="text-violet-400 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm text-violet-200 font-medium italic">"{coachTip}"</p>
            </div>
            <button onClick={() => setCoachTip(null)} className="text-slate-500 hover:text-slate-300">
              <Minimize2 size={14} />
            </button>
          </div>
        )}

        {/* Main Focus Area */}
        <main className="flex-1 flex flex-col items-center relative z-10">

          {/* Timer Circle */}
          <div className="relative group mb-12">
            {/* Outer Glow */}
            <div className={`absolute -inset-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-20 transition duration-1000 ${isActive ? 'animate-pulse' : ''}`}></div>

            <div className="relative w-72 h-72 rounded-full bg-slate-900 border-4 border-slate-800 flex flex-col items-center justify-center shadow-2xl">
              {/* Progress Ring SVG */}
              <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="144" cy="144" r="136"
                  fill="none" stroke="currentColor" strokeWidth="4"
                  className="text-slate-800"
                />
                <circle
                  cx="144" cy="144" r="136"
                  fill="none" stroke="currentColor" strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 136}
                  strokeDashoffset={2 * Math.PI * 136 * (1 - progress / 100)}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-linear ${MODES[timerMode].color}`}
                />
              </svg>

              <span className={`text-6xl font-mono font-bold tracking-tighter mb-2 ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                {formatTime(timeLeft)}
              </span>
              <span className={`text-sm font-medium uppercase tracking-widest ${MODES[timerMode].color} bg-slate-800/50 px-3 py-1 rounded-full`}>
                {isActive ? 'Flowing' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className={`flex flex-col items-center gap-8 w-full transition-all duration-500 ${zenMode ? 'opacity-0 scale-95 pointer-events-none absolute bottom-0' : 'opacity-100'}`}>

            {/* Timer Toggles */}
            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <button onClick={() => switchMode('focus')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${timerMode === 'focus' ? 'bg-slate-800 text-emerald-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <div className="flex items-center gap-2"><Brain size={16} /> Focus</div>
              </button>
              <button onClick={() => switchMode('short')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${timerMode === 'short' ? 'bg-slate-800 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <div className="flex items-center gap-2"><Coffee size={16} /> Short Break</div>
              </button>
              <button onClick={() => switchMode('long')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${timerMode === 'long' ? 'bg-slate-800 text-indigo-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <div className="flex items-center gap-2"><Moon size={16} /> Long Break</div>
              </button>
            </div>

            {/* Main Actions */}
            <div className="flex gap-4">
              <Button onClick={toggleTimer} className="w-32 justify-center py-4 text-lg">
                {isActive ? <><Pause fill="currentColor" /> Pause</> : <><Play fill="currentColor" /> Start</>}
              </Button>
              <Button variant="secondary" onClick={resetTimer} className="w-16 justify-center">
                <RotateCcw size={20} />
              </Button>
            </div>

            {/* Tasks Section */}
            <div className="w-full max-w-md mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Current Priorities</h2>
                <span className="text-slate-600 text-xs">{tasks.filter(t => t.completed).length}/{tasks.length} Done</span>
              </div>

              <form onSubmit={addTask} className="relative mb-6 group">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
                <button type="submit" className="absolute right-2 top-2 p-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-emerald-400 transition-colors">
                  <Plus size={20} />
                </button>
              </form>

              <div className="space-y-3">
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-800/50 rounded-xl">
                    No tasks yet. Add one to start flowing.
                  </div>
                )}
                {tasks.map(task => (
                  <div key={task.id} className="flex flex-col gap-2">
                    <div
                      className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${task.completed
                        ? 'bg-slate-900/30 border-slate-900 text-slate-600'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-200 hover:border-emerald-500/30'
                        }`}
                    >
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className={`text-slate-500 hover:text-slate-300 transition-transform ${task.isExpanded ? 'rotate-90' : ''}`}
                      >
                        {task.subtasks && task.subtasks.length > 0 ? <ChevronRight size={16} /> : <div className="w-4" />}
                      </button>

                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'border-emerald-900 bg-emerald-900/20 text-emerald-700' : 'border-slate-600 hover:border-emerald-500 text-transparent'
                          }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>

                      <span className={`flex-1 text-sm ${task.completed ? 'line-through' : ''}`}>{task.text}</span>

                      {!task.completed && (
                        <button
                          onClick={() => handleSmartBreakdown(task.id, task.text)}
                          disabled={loadingTaskId === task.id}
                          className="opacity-0 group-hover:opacity-100 p-2 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
                          title="Auto-generate subtasks with Gemini"
                        >
                          {loadingTaskId === task.id ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        </button>
                      )}

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Subtasks List */}
                    {task.isExpanded && task.subtasks && task.subtasks.length > 0 && (
                      <div className="pl-12 pr-4 space-y-2 animate-in slide-in-from-top-2">
                        {task.subtasks.map(st => (
                          <div key={st.id} className="flex items-center gap-3 text-sm text-slate-400">
                            <button
                              onClick={() => toggleSubtask(task.id, st.id)}
                              className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${st.completed ? 'border-emerald-900 bg-emerald-900/20 text-emerald-700' : 'border-slate-600 hover:border-emerald-500 text-transparent'
                                }`}
                            >
                              <Check size={10} strokeWidth={3} />
                            </button>
                            <span className={st.completed ? 'line-through opacity-50' : ''}>{st.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Zen Mode Overlay */}
      {zenMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-500">
          <Button variant="ghost" onClick={() => setZenMode(false)} className="absolute top-8 right-8">
            <Minimize2 size={24} />
          </Button>

          <div className="text-center space-y-8">
            <div className="relative w-96 h-96">
              <div className={`absolute inset-0 bg-emerald-500 rounded-full blur-[100px] transition-all duration-[4000ms] ${isActive ? 'opacity-20 scale-125' : 'opacity-5 scale-100'}`} />
              <div className="relative h-full flex flex-col items-center justify-center">
                <div className="text-9xl font-bold text-slate-200 tracking-tighter mb-6">
                  {formatTime(timeLeft)}
                </div>
                {activeTask ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="text-2xl text-emerald-400 font-medium max-w-2xl px-8 text-center">
                      "{activeTask.text}"
                    </div>
                    {activeTask.subtasks && activeTask.subtasks.some(st => !st.completed) && (
                      <div className="text-sm text-slate-500 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                        Next Step: {activeTask.subtasks.find(st => !st.completed)?.text}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xl text-slate-500">No active task</div>
                )}
              </div>
            </div>

            <div className="flex gap-6 justify-center">
              <Button onClick={toggleTimer} className="w-40 py-4 text-xl shadow-2xl shadow-emerald-900/50">
                {isActive ? 'Pause' : 'Focus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}