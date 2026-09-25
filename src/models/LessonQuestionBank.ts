import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILessonQuestion extends Document {
  courseFolder: string;
  courseTitle: string;
  lessonNumber: number;
  questionText: string;
  cycleKey: string;
  createdAt: Date;
}

const LessonQuestionBankSchema = new Schema<ILessonQuestion>(
  {
    courseFolder: {
      type: String,
      required: true,
      index: true,
    },
    courseTitle: {
      type: String,
      required: true,
    },
    lessonNumber: {
      type: Number,
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    cycleKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for querying past questions by course & lesson
LessonQuestionBankSchema.index({ courseFolder: 1, lessonNumber: 1 });
LessonQuestionBankSchema.index({ courseFolder: 1, lessonNumber: 1, questionText: 1 }, { unique: true });

export const LessonQuestionBank: Model<ILessonQuestion> =
  mongoose.models.LessonQuestionBank ||
  mongoose.model<ILessonQuestion>('LessonQuestionBank', LessonQuestionBankSchema);
