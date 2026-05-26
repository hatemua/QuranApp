import {Schema, model, type Model, type Types} from 'mongoose';
import type {MasteryState} from '@quranic-immersion/shared';

export interface UserWordStateDoc {
  userId: Types.ObjectId;
  lemma: string;
  mastery_state: MasteryState;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  error_count: number;
  last_answers: boolean[];
  next_review_at: Date;
  last_reviewed_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<UserWordStateDoc>(
  {
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    lemma: {type: String, required: true},
    mastery_state: {
      type: String,
      enum: ['unseen', 'seen', 'recognised', 'understood', 'retained', 'mastered'],
      default: 'seen',
    },
    ease_factor: {type: Number, default: 2.5},
    interval_days: {type: Number, default: 0},
    repetitions: {type: Number, default: 0},
    error_count: {type: Number, default: 0},
    last_answers: {type: [Boolean], default: []},
    next_review_at: {type: Date, default: () => new Date()},
    last_reviewed_at: {type: Date, default: null},
  },
  {timestamps: true, collection: 'user_word_states'},
);
schema.index({userId: 1, lemma: 1}, {unique: true});
schema.index({userId: 1, next_review_at: 1});

export const UserWordStateModel: Model<UserWordStateDoc> = model<UserWordStateDoc>(
  'UserWordState',
  schema,
);
