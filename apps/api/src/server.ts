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
