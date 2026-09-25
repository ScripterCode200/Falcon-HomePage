// --- Core Interfaces ---

export interface DeepDiveSection {
  heading: string;
  content: string;
}

export interface ComprehensiveNote {
  overview: string;
  coreMechanism?: string;
  deepDiveSections?: DeepDiveSection[];
  examTrapsAndTips?: string;
  isGenerating?: boolean;
}

export interface LearningNode {
  conceptSummary: string;
  terminologies: { term: string; definition: string }[];
  certificationTakeaway: string;
  comprehensiveNote?: ComprehensiveNote;
}

export interface Question {
  id: number;
  category: string;
  categoryIcon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  funFact: string;
  learningNode?: LearningNode;
}

export interface QuizProgress {
  date: string;
  completed: boolean;
  score: number;
  totalQuestions: number;
  selectedAnswers: number[];
  completedAt: string;
}

export interface UserStats {
  currentStreak: number;
  highestStreak: number;
  totalQuizzesPlayed: number;
  totalCorrectAnswers: number;
  totalQuestionsAnswered: number;
  lastPlayedDate: string;
  history: Record<string, QuizProgress>;
}

// --- 6:00 PM Cycle Key ---
// Quiz refreshes at 6:00 PM IST daily.
// A "cycle" runs from today 6:00 PM to tomorrow 6:00 PM.
// Before 6:00 PM today, the active cycle started yesterday at 6:00 PM.

export function getCurrentCycleKey(): string {
  const now = new Date();
  const REFRESH_HOUR = 18; // 6:00 PM

  // If current hour < 18 (before 6 PM), the cycle started yesterday at 6 PM
  if (now.getHours() < REFRESH_HOUR) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }
  // After 6 PM, the cycle started today
  return formatDate(now);
}

export function getTimeUntilNextRefresh(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const REFRESH_HOUR = 18;

  const target = new Date(now);
  if (now.getHours() >= REFRESH_HOUR) {
    // Next refresh is tomorrow at 6 PM
    target.setDate(target.getDate() + 1);
  }
  target.setHours(REFRESH_HOUR, 0, 0, 0);

  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Fetch today's 20-question daily quiz from the backend ---
export async function fetchDailyQuiz(): Promise<{
  questions: Question[];
  cycleKey: string;
  source: 'gemini' | 'curated';
  model?: string;
  lessonInfo?: {
    courseTitle: string;
    courseFolder: string;
    fileName: string;
    lessonNumber: number;
    totalLessons: number;
    pageRangeLabel: string;
    categoryIcon: string;
  } | null;
}> {
  try {
    const res = await fetch('/api/quiz/daily');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        return {
          questions: data.questions,
          cycleKey: data.cycleKey,
          source: data.source,
          model: data.model,
          lessonInfo: data.lessonInfo || null,
        };
      }
    }
  } catch (err) {
    console.error('[fetchDailyQuiz] Error:', err);
  }
  // Client-side fallback
  const { SAS_CERTIFICATION_20_BANK } = await import('./sasKnowledgeBase');
  const shuffled = [...SAS_CERTIFICATION_20_BANK].sort(() => 0.5 - Math.random());
  return {
    questions: shuffled.slice(0, 20),
    cycleKey: getCurrentCycleKey(),
    source: 'curated',
    lessonInfo: null,
  };
}

// --- Submit quiz attempt to backend ---
export async function submitQuizAttempt(payload: {
  cycleKey: string;
  track: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  userAnswers: number[];
}): Promise<{ success: boolean; attempt?: any }> {
  try {
    const res = await fetch('/api/quiz/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[submitQuizAttempt] Error:', err);
  }
  return { success: false };
}

// --- Fetch quiz history from backend ---
export async function fetchQuizHistory(): Promise<any[]> {
  try {
    const res = await fetch('/api/quiz/history');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        return data.history;
      }
    }
  } catch (err) {
    console.error('[fetchQuizHistory] Error:', err);
  }
  return [];
}

// --- LocalStorage helpers for Stats & Streaks ---
const STATS_STORAGE_KEY = 'falcon_quiz_stats_v2';

export function loadUserQuizStats(): UserStats {
  if (typeof window === 'undefined') {
    return emptyStats();
  }
  try {
    const data = localStorage.getItem(STATS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return emptyStats();
}

function emptyStats(): UserStats {
  return {
    currentStreak: 0,
    highestStreak: 0,
    totalQuizzesPlayed: 0,
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    lastPlayedDate: '',
    history: {},
  };
}

export function recordQuizCompletion(
  cycleKey: string,
  score: number,
  totalQuestions: number,
  selectedAnswers: number[]
): UserStats {
  const currentStats = loadUserQuizStats();
  const todayKey = getCurrentCycleKey();

  const isAlreadyDone = !!currentStats.history[cycleKey]?.completed;

  let newCurrentStreak = currentStats.currentStreak;
  if (!isAlreadyDone) {
    // Simple streak: played on consecutive cycle keys
    if (currentStats.lastPlayedDate && currentStats.lastPlayedDate !== todayKey) {
      // Check if last played was previous cycle
      const lastDate = new Date(currentStats.lastPlayedDate);
      const thisDate = new Date(todayKey);
      const diffDays = Math.round((thisDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newCurrentStreak += 1;
      } else {
        newCurrentStreak = 1;
      }
    } else if (!currentStats.lastPlayedDate) {
      newCurrentStreak = 1;
    }
  }

  const newHighestStreak = Math.max(currentStats.highestStreak, newCurrentStreak);

  const updatedProgress: QuizProgress = {
    date: cycleKey,
    completed: true,
    score,
    totalQuestions,
    selectedAnswers,
    completedAt: new Date().toISOString(),
  };

  const updatedStats: UserStats = {
    ...currentStats,
    currentStreak: newCurrentStreak,
    highestStreak: newHighestStreak,
    totalQuizzesPlayed: isAlreadyDone ? currentStats.totalQuizzesPlayed : currentStats.totalQuizzesPlayed + 1,
    totalCorrectAnswers: currentStats.totalCorrectAnswers + score,
    totalQuestionsAnswered: currentStats.totalQuestionsAnswered + totalQuestions,
    lastPlayedDate: todayKey,
    history: {
      ...currentStats.history,
      [cycleKey]: updatedProgress,
    },
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updatedStats));
  }

  return updatedStats;
}

// --- User Settings (localStorage) ---
const SETTINGS_KEY = 'falcon_quiz_settings_v1';

export interface QuizSettings {
  track: 'all' | 'ml' | 'stats' | 'text';
}

export function loadQuizSettings(): QuizSettings {
  if (typeof window === 'undefined') return { track: 'all' };
  try {
    const d = localStorage.getItem(SETTINGS_KEY);
    if (d) return JSON.parse(d);
  } catch { /* ignore */ }
  return { track: 'all' };
}

export function saveQuizSettings(settings: QuizSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
