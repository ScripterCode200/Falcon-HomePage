import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizAttempt extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  userEmail?: string;
  cycleKey: string;
  track: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  userAnswers: number[];
  timeSpentSeconds?: number;
  createdAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    userName: {
      type: String,
      default: 'Guest Scholar',
    },
    userEmail: {
      type: String,
      required: false,
    },
    cycleKey: {
      type: String,
      required: true,
      index: true,
    },
    track: {
      type: String,
      required: true,
      default: 'all',
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 20,
    },
    accuracy: {
      type: Number,
      required: true,
    },
    userAnswers: {
      type: [Number],
      default: [],
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
