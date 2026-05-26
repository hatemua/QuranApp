import jwt from 'jsonwebtoken';
import {config} from '../config.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';

export interface AccessPayload {
  sub: string;
  type: 'access';
}

export interface RefreshPayload {
  sub: string;
  type: 'refresh';
}

export function signAccessToken(userId: string): string {
  return jwt.sign({sub: userId, type: 'access'} satisfies AccessPayload, config.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({sub: userId, type: 'refresh'} satisfies RefreshPayload, config.JWT_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET) as AccessPayload;
  if (decoded.type !== 'access') throw new Error('Wrong token type');
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET) as RefreshPayload;
  if (decoded.type !== 'refresh') throw new Error('Wrong token type');
  return decoded;
}
