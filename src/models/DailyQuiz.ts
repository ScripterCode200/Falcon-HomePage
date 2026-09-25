import mongoose, { Schema, Document, Model } from 'mongoose';
import { Question } from '@/lib/quizData';

export interface IDailyQuiz extends Document {
  cycleKey: string; // e.g., "2026-09-25" (represents the 6:00 PM to 6:00 PM period)
  track: string;
  difficulty: string;
  totalQuestions: number;
  questions: Question[];
  source: 'gemini' | 'curated';
  modelUsed?: string;
  lessonInfo?: {
    courseTitle: string;
    courseFolder: string;
    fileName: string;
    lessonNumber: number;
    totalLessons: number;
    pageRangeLabel: string;
    categoryIcon: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DailyQuizSchema = new Schema<IDailyQuiz>(
  {
    cycleKey: {
      type: String,
      required: true,
      index: true,
    },
    track: {
      type: String,
      required: true,
      default: 'sequential',
      index: true,
    },
    difficulty: {
      type: String,
      default: 'Mixed',
    },
    totalQuestions: {
      type: Number,
      default: 20,
    },
    questions: {
      type: Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      enum: ['gemini', 'curated'],
      default: 'gemini',
    },
    modelUsed: {
      type: String,
      default: 'gemini-flash-lite-latest',
    },
    lessonInfo: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so one cycleKey has exactly one active daily quiz
DailyQuizSchema.index({ cycleKey: 1, track: 1 }, { unique: true });

export const DailyQuiz: Model<IDailyQuiz> =
  mongoose.models.DailyQuiz || mongoose.model<IDailyQuiz>('DailyQuiz', DailyQuizSchema);
