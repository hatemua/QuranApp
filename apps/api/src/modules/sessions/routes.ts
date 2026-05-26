import type {FastifyInstance} from 'fastify';
import {requireAuth, type AuthedRequest} from '../auth/routes.js';
import * as sessionsService from './service.js';
import {answerSchema} from './schema.js';

export async function registerSessionsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/sessions/start', {preHandler: requireAuth}, async req => {
    return sessionsService.startSession((req as AuthedRequest).userId);
  });

  app.post<{Params: {id: string}}>(
    '/sessions/:id/answer',
    {preHandler: requireAuth},
    async req => {
      const body = answerSchema.parse(req.body);
      return sessionsService.answer(
        (req as unknown as AuthedRequest).userId,
        req.params.id,
        body,
      );
    },
  );

  app.post<{Params: {id: string}}>(
    '/sessions/:id/complete',
    {preHandler: requireAuth},
    async req => {
      return sessionsService.complete(
        (req as unknown as AuthedRequest).userId,
        req.params.id,
      );
    },
  );
}
