import type {HydratedDocument} from 'mongoose';
import argon2 from 'argon2';
import {UserModel, type UserDoc} from './model.js';
import {UserWordStateModel} from '../words/word-state-model.js';
import {hashPassword, verifyPassword} from '../../utils/password.js';
import {signAccessToken, signRefreshToken, verifyRefreshToken} from '../../utils/jwt.js';
import {ApiError} from '../../utils/errors.js';
import type {RegisterInput, LoginInput, UpdateMeInput} from './schema.js';

export interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: UserDoc['preferredLanguage'];
  dailyGoal: number;
  streakDays: number;
  masteryStats: {
    seen: number;
    recognised: number;
    understood: number;
    retained: number;
    mastered: number;
  };
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: MeResponse;
}

async function aggregateMastery(userId: string): Promise<MeResponse['masteryStats']> {
  const stats = {seen: 0, recognised: 0, understood: 0, retained: 0, mastered: 0};
  const rows = await UserWordStateModel.aggregate<{_id: string; count: number}>([
    {$match: {userId: new (await import('mongoose')).default.Types.ObjectId(userId)}},
    {$group: {_id: '$mastery_state', count: {$sum: 1}}},
  ]);
  for (const r of rows) {
    if (r._id in stats) stats[r._id as keyof typeof stats] = r.count;
  }
  return stats;
}

export async function toMeResponse(user: HydratedDocument<UserDoc>): Promise<MeResponse> {
  const id = user._id.toString();
  return {
    id,
    email: user.email,
    displayName: user.displayName,
    preferredLanguage: user.preferredLanguage,
    dailyGoal: user.dailyGoal,
    streakDays: user.streakCount,
    masteryStats: await aggregateMastery(id),
    createdAt: user.createdAt.toISOString(),
  };
}

async function issueSession(user: HydratedDocument<UserDoc>): Promise<AuthSession> {
  const userId = user._id.toString();
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  user.refreshTokenHash = await hashPassword(refreshToken);
  await user.save();
  return {accessToken, refreshToken, user: await toMeResponse(user)};
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const existing = await UserModel.findOne({email: input.email.toLowerCase()});
  if (existing) throw ApiError.conflict('Email already in use', 'EMAIL_TAKEN');
  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    email: input.email.toLowerCase(),
    passwordHash,
    displayName: input.displayName,
    preferredLanguage: input.preferredLanguage,
  });
  return issueSession(user);
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const user = await UserModel.findOne({email: input.email.toLowerCase()});
  if (!user) throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  return issueSession(user);
}

export async function refresh(refreshToken: string): Promise<{accessToken: string; refreshToken: string}> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH');
  }
  const user = await UserModel.findById(payload.sub);
  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized('Refresh revoked', 'REFRESH_REVOKED');
  }
  const matches = await argon2.verify(user.refreshTokenHash, refreshToken).catch(() => false);
  if (!matches) throw ApiError.unauthorized('Refresh revoked', 'REFRESH_REVOKED');
  const userId = user._id.toString();
  const newAccess = signAccessToken(userId);
  const newRefresh = signRefreshToken(userId);
  user.refreshTokenHash = await hashPassword(newRefresh);
  await user.save();
  return {accessToken: newAccess, refreshToken: newRefresh};
}

export async function logout(userId: string): Promise<void> {
  await UserModel.updateOne({_id: userId}, {$set: {refreshTokenHash: null}});
}

export async function getMe(userId: string): Promise<MeResponse> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  return toMeResponse(user);
}

export async function updateMe(userId: string, input: UpdateMeInput): Promise<MeResponse> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  if (input.displayName !== undefined) user.displayName = input.displayName;
  if (input.preferredLanguage !== undefined) user.preferredLanguage = input.preferredLanguage;
  if (input.dailyGoal !== undefined) user.dailyGoal = input.dailyGoal;
  await user.save();
  return toMeResponse(user);
}

export async function loadUserOrThrow(userId: string): Promise<HydratedDocument<UserDoc>> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
  return user;
}
