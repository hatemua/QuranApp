import {pathToFileURL} from 'node:url';
import Fastify, {type FastifyInstance, type FastifyReply, type FastifyRequest} from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import {ZodError} from 'zod';
import {config} from './config.js';
import {connectMongo} from './db.js';
import {ApiError} from './utils/errors.js';
import {registerAuthRoutes} from './modules/auth/routes.js';
import {registerQuranRoutes} from './modules/quran/routes.js';
import {registerWordsRoutes} from './modules/words/routes.js';
import {registerSessionsRoutes} from './modules/sessions/routes.js';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      transport:
        config.NODE_ENV === 'development'
          ? {target: 'pino-pretty', options: {translateTime: 'HH:MM:ss'}}
          : undefined,
    },
  });

  await app.register(cors, {origin: true});
  await app.register(fastifyJwt, {secret: config.JWT_SECRET});

  // Allow POST endpoints to be called without a body even when Content-Type is
  // application/json. Fastify's default JSON parser rejects empty bodies with
  // FST_ERR_CTP_EMPTY_JSON_BODY; we treat empty body as an empty object.
  app.removeContentTypeParser(['application/json']);
  app.addContentTypeParser(
    'application/json',
    {parseAs: 'string'},
    (_req, body, done) => {
      const raw = body as string;
      if (!raw || raw.length === 0) {
        done(null, {});
        return;
      }
      try {
        done(null, JSON.parse(raw));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  app.setErrorHandler((err, _req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof ApiError) {
      return reply.code(err.statusCode).send({
        message: err.message,
        code: err.code,
        details: err.details,
      });
    }
    if (err instanceof ZodError) {
      return reply.code(400).send({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten(),
      });
    }
    app.log.error({err}, 'Unhandled error');
    return reply
      .code(err.statusCode ?? 500)
      .send({message: err.message ?? 'Internal Server Error', code: err.code ?? 'INTERNAL'});
  });

  app.get('/health', async () => ({status: 'ok'}));

  await app.register(registerAuthRoutes);
  await app.register(registerQuranRoutes);
  await app.register(registerWordsRoutes);
  await app.register(registerSessionsRoutes);

  return app;
}

async function main(): Promise<void> {
  await connectMongo();
  const app = await buildServer();
  await app.listen({port: config.API_PORT, host: '0.0.0.0'});
}

const entrypointPath = process.argv[1];
const isEntrypoint =
  !!entrypointPath && import.meta.url === pathToFileURL(entrypointPath).href;
if (isEntrypoint) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
