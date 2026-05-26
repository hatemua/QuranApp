import type {FastifyInstance, FastifyRequest} from 'fastify';
import * as authService from './service.js';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  updateMeSchema,
} from './schema.js';
import {ApiError} from '../../utils/errors.js';

export interface AuthedRequest extends FastifyRequest {
  userId: string;
}

export async function requireAuth(req: FastifyRequest): Promise<void> {
  try {
    const decoded = await req.jwtVerify<{sub: string; type: string}>();
    if (decoded.type !== 'access') throw new Error('wrong-type');
    (req as AuthedRequest).userId = decoded.sub;
  } catch {
    throw ApiError.unauthorized('Missing or invalid access token', 'INVALID_ACCESS');
  }
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', async (req, reply) => {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    return reply.code(201).send(result);
  });

  app.post('/auth/login', async req => {
    const input = loginSchema.parse(req.body);
    return authService.login(input);
  });

  app.post('/auth/refresh', async req => {
    const input = refreshSchema.parse(req.body);
    return authService.refresh(input.refreshToken);
  });

  app.post('/auth/logout', {preHandler: requireAuth}, async (req, reply) => {
    await authService.logout((req as AuthedRequest).userId);
    return reply.code(204).send();
  });

  app.get('/auth/me', {preHandler: requireAuth}, async req => {
    return authService.getMe((req as AuthedRequest).userId);
  });

  app.patch('/auth/me', {preHandler: requireAuth}, async req => {
    const input = updateMeSchema.parse(req.body);
    return authService.updateMe((req as AuthedRequest).userId, input);
  });
}
