import type {MasteryState} from '@quranic-immersion/shared';

// Classic SM-2 spaced repetition.
// quality: 0=blackout, 3=correct with hesitation, 5=perfect.
// We map mobile's binary "correct" + response time → quality 3 (correct) or 1 (incorrect).
export interface Sm2Input {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  quality: number;
}

export interface Sm2Output {
  nextReviewAt: Date;
  newEaseFactor: number;
  newIntervalDays: number;
  newRepetitions: number;
}

export function sm2(input: Sm2Input): Sm2Output {
  const {quality} = input;
  let {easeFactor, intervalDays, repetitions} = input;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const next = new Date();
  next.setDate(next.getDate() + intervalDays);

  return {
    nextReviewAt: next,
    newEaseFactor: easeFactor,
    newIntervalDays: intervalDays,
    newRepetitions: repetitions,
  };
}

export function qualityFromAnswer(correct: boolean, responseTimeMs: number): number {
  if (!correct) return responseTimeMs < 10_000 ? 1 : 0;
  if (responseTimeMs < 3_000) return 5;
  if (responseTimeMs < 8_000) return 4;
  return 3;
}

export function masteryFromState(input: {
  repetitions: number;
  intervalDays: number;
  errorCount: number;
  lastFiveCorrect: boolean[];
}): MasteryState {
  const {repetitions, intervalDays, errorCount, lastFiveCorrect} = input;
  if (
    intervalDays >= 30 &&
    errorCount === 0 &&
    lastFiveCorrect.length >= 5 &&
    lastFiveCorrect.every(c => c)
  ) {
    return 'mastered';
  }
  if (intervalDays >= 7 && repetitions >= 3) return 'retained';
  if (repetitions >= 3) return 'understood';
  if (repetitions >= 1) return 'recognised';
  return 'seen';
}
