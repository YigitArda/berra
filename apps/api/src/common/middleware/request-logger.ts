import { FastifyReply, FastifyRequest } from 'fastify';
import pinoHttp from 'pino-http';

const logger = pinoHttp({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export function requestLogger(req: FastifyRequest, res: FastifyReply, next: () => void) {
  logger(req.raw, res.raw);
  next();
}
