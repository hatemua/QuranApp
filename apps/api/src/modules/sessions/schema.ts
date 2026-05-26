import {z} from 'zod';

export const answerSchema = z.object({
  wordId: z.string().min(1).max(80),
  correct: z.boolean(),
  responseTimeMs: z.number().int().min(0).max(10 * 60 * 1000),
});
export type AnswerInput = z.infer<typeof answerSchema>;
