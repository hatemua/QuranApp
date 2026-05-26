import {Types} from 'mongoose';
import type {MasteryState} from '@quranic-immersion/shared';
import {SessionModel} from './model.js';
import {UserModel} from '../auth/model.js';
import {UserWordStateModel} from '../words/word-state-model.js';
import {sm2, qualityFromAnswer, masteryFromState} from '../../utils/sm2.js';
import {ApiError} from '../../utils/errors.js';
import * as wordsService from '../words/service.js';
import type {AnswerInput} from './schema.js';

export interface SessionStartResponse {
  sessionId: string;
  words: wordsService.DailyWord[];
}

export interface SessionAnswerResponse {
  newMasteryState: MasteryState;
}

export interface SessionCompleteResponse {
  wordsLearned: number;
  accuracy: number;
  newMasteries: Array<{word_id: string; mastery_state: MasteryState}>;
}

export async function startSession(userId: string): Promise<SessionStartResponse> {
  const daily = await wordsService.getDaily(userId);
  const session = await SessionModel.create({userId: new Types.ObjectId(userId)});
  return {sessionId: session._id.toString(), words: daily.words};
}

export async function answer(
  userId: string,
  sessionId: string,
  input: AnswerInput,
): Promise<SessionAnswerResponse> {
  if (!Types.ObjectId.isValid(sessionId)) {
    throw ApiError.badRequest('Invalid session id', 'INVALID_SESSION');
  }
  const session = await SessionModel.findById(sessionId);
  if (!session || session.userId.toString() !== userId) {
    throw ApiError.notFound('Session not found', 'SESSION_NOT_FOUND');
  }
  if (session.completedAt) {
    throw ApiError.badRequest('Session already completed', 'SESSION_COMPLETED');
  }

  const lemma = input.wordId;
  const existing = await UserWordStateModel.findOne({userId, lemma});
  const easeFactor = existing?.ease_factor ?? 2.5;
  const intervalDays = existing?.interval_days ?? 0;
  const repetitions = existing?.repetitions ?? 0;
  const errorCount = existing?.error_count ?? 0;
  const lastAnswers = existing?.last_answers ?? [];

  const quality = qualityFromAnswer(input.correct, input.responseTimeMs);
  const sm = sm2({easeFactor, intervalDays, repetitions, quality});

  const newLastAnswers = [...lastAnswers, input.correct].slice(-5);
  const newErrorCount = input.correct ? errorCount : errorCount + 1;
  const newMastery = masteryFromState({
    repetitions: sm.newRepetitions,
    intervalDays: sm.newIntervalDays,
    errorCount: newErrorCount,
    lastFiveCorrect: newLastAnswers,
  });

  await UserWordStateModel.updateOne(
    {userId, lemma},
    {
      $set: {
        userId: new Types.ObjectId(userId),
        lemma,
        mastery_state: newMastery,
        ease_factor: sm.newEaseFactor,
        interval_days: sm.newIntervalDays,
        repetitions: sm.newRepetitions,
        error_count: newErrorCount,
        last_answers: newLastAnswers,
        next_review_at: sm.nextReviewAt,
        last_reviewed_at: new Date(),
      },
    },
    {upsert: true},
  );

  session.answers.push({
    wordKey: lemma,
    correct: input.correct,
    responseTimeMs: input.responseTimeMs,
    answeredAt: new Date(),
  });
  await session.save();

  return {newMasteryState: newMastery};
}

export async function complete(
  userId: string,
  sessionId: string,
): Promise<SessionCompleteResponse> {
  if (!Types.ObjectId.isValid(sessionId)) {
    throw ApiError.badRequest('Invalid session id', 'INVALID_SESSION');
  }
  const session = await SessionModel.findById(sessionId);
  if (!session || session.userId.toString() !== userId) {
    throw ApiError.notFound('Session not found', 'SESSION_NOT_FOUND');
  }
  if (!session.completedAt) {
    session.completedAt = new Date();
    await session.save();
  }

  const total = session.answers.length;
  const correctCount = session.answers.filter(a => a.correct).length;
  const accuracy = total === 0 ? 0 : correctCount / total;
  const lemmas = Array.from(new Set(session.answers.map(a => a.wordKey)));
  const states = lemmas.length
    ? await UserWordStateModel.find({userId, lemma: {$in: lemmas}})
        .select('lemma mastery_state')
        .lean()
    : [];

  await updateStreak(userId);

  return {
    wordsLearned: lemmas.length,
    accuracy,
    newMasteries: states.map(s => ({word_id: s.lemma, mastery_state: s.mastery_state})),
  };
}

async function updateStreak(userId: string): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  if (last) last.setHours(0, 0, 0, 0);

  if (last && last.getTime() === today.getTime()) {
    return;
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (last && last.getTime() === yesterday.getTime()) {
    user.streakCount += 1;
  } else {
    user.streakCount = 1;
  }
  user.lastActiveDate = today;
  await user.save();
}
