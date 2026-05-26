import { Schema, model, type Model, type Types } from 'mongoose';

export interface SessionAnswerDoc {
  wordKey: string;
  correct: boolean;
  responseTimeMs: number;
  answeredAt: Date;
}

export interface SessionDoc {
  userId: Types.ObjectId;
  answers: SessionAnswerDoc[];
  completedAt: Date | null;
}

const sessionSchema = new Schema<SessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
      {
        wordKey: { type: String, required: true },
        correct: { type: Boolean, required: true },
        responseTimeMs: { type: Number, required: true, min: 0 },
        answeredAt: { type: Date, default: () => new Date() },
      },
    ],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'sessions' }
);
sessionSchema.index({ userId: 1, createdAt: -1 });

export const SessionModel: Model<SessionDoc> = model<SessionDoc>('Session', sessionSchema);
