import {z} from 'zod';

export const supportedLanguageSchema = z.enum(['en', 'id', 'ur']);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).trim(),
  preferredLanguage: supportedLanguageSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const updateMeSchema = z.object({
  displayName: z.string().min(1).max(80).trim().optional(),
  preferredLanguage: supportedLanguageSchema.optional(),
  dailyGoal: z.number().int().min(1).max(50).optional(),
});
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
