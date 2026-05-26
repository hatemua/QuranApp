import type {FastifyInstance} from 'fastify';
import {requireAuth, type AuthedRequest} from '../auth/routes.js';
import * as wordsService from './service.js';

export async function registerWordsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/words/daily', {preHandler: requireAuth}, async req => {
    return wordsService.getDaily((req as AuthedRequest).userId);
  });

  app.get('/words/saved', {preHandler: requireAuth}, async req => {
    return wordsService.getSaved((req as AuthedRequest).userId);
  });

  app.get<{Params: {id: string}}>(
    '/words/:id',
    {preHandler: requireAuth},
    async req => {
      const id = decodeURIComponent(req.params.id);
      return wordsService.getById((req as unknown as AuthedRequest).userId, id);
    },
  );

  app.post<{Params: {id: string}}>(
    '/words/:id/save',
    {preHandler: requireAuth},
    async (req, reply) => {
      const id = decodeURIComponent(req.params.id);
      await wordsService.saveWord((req as unknown as AuthedRequest).userId, id);
      return reply.code(204).send();
    },
  );

  app.delete<{Params: {id: string}}>(
    '/words/:id/save',
    {preHandler: requireAuth},
    async (req, reply) => {
      const id = decodeURIComponent(req.params.id);
      await wordsService.unsaveWord((req as unknown as AuthedRequest).userId, id);
      return reply.code(204).send();
    },
  );
}
