import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShortcut extends Document {
  shortcutId: string;
  clientId: string;
  userId?: string;
  title: string;
  url: string;
  color?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShortcutSchema = new Schema<IShortcut>(
  {
    shortcutId: {
      type: String,
      required: true,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#1a73e8',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ShortcutSchema.index({ clientId: 1, shortcutId: 1 }, { unique: true });

export const ShortcutModel: Model<IShortcut> =
  mongoose.models.Shortcut || mongoose.model<IShortcut>('Shortcut', ShortcutSchema);
