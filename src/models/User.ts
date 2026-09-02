import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserShortcut {
  id: string;
  title: string;
  url: string;
  color?: string;
}

export interface IUserQuizStats {
  currentStreak: number;
  highestStreak: number;
  totalQuizzesPlayed: number;
  totalCorrectAnswers: number;
  totalQuestionsAnswered: number;
  lastPlayedDate: string;
  history?: Record<string, any>;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  shortcuts: IUserShortcut[];
  quizStats: IUserQuizStats;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default in queries
    },
    shortcuts: {
      type: [
        {
          id: String,
          title: String,
          url: String,
          color: String,
        },
      ],
      default: [],
    },
    quizStats: {
      type: Object,
      default: {
        currentStreak: 0,
        highestStreak: 0,
        totalQuizzesPlayed: 0,
        totalCorrectAnswers: 0,
        totalQuestionsAnswered: 0,
        lastPlayedDate: '',
        history: {},
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation error in development
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
