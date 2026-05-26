import { Schema, model, type Model } from 'mongoose';
import type { SupportedLanguage } from '@quranic-immersion/shared';

export interface UserDoc {
  email: string;
  passwordHash: string;
  displayName: string;
  preferredLanguage: SupportedLanguage;
  dailyGoal: number;
  readingAbility: 'none' | 'slow' | 'fluent';
  goal: 'salah' | 'vocabulary' | 'both';
  preferredHour: number;
  streakCount: number;
  lastActiveDate: Date | null;
  refreshTokenHash: string | null;
  isAdmin: boolean;
  savedLemmas: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    preferredLanguage: { type: String, enum: ['en', 'id', 'ur'], required: true },
    dailyGoal: { type: Number, default: 5, min: 1, max: 50 },
    readingAbility: { type: String, enum: ['none', 'slow', 'fluent'], default: 'none' },
    goal: { type: String, enum: ['salah', 'vocabulary', 'both'], default: 'both' },
    preferredHour: { type: Number, default: 7, min: 0, max: 23 },
    streakCount: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    refreshTokenHash: { type: String, default: null },
    isAdmin: { type: Boolean, default: false },
    savedLemmas: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'users' }
);

export const UserModel: Model<UserDoc> = model<UserDoc>('User', userSchema);
