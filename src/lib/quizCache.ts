import { Question } from './quizData';

export interface CachedQuiz {
  questions: Question[];
  source: string;
  model?: string;
  lessonInfo?: any;
  isEnriching?: boolean;
  enrichedCount?: number;
}

// Global in-memory cache shared across API routes in the same Node.js process
export const memoryCache: Record<string, CachedQuiz> = {};
