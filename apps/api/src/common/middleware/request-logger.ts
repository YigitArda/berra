import { FastifyReply, FastifyRequest } from 'fastify';
import pinoHttp from 'pino-http';

const logger = pinoHttp({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  genReqId: (req) => (req.headers['x-request-id'] as string) || `req-${Date.now()}`,
  customSuccessMessage: (req, res) => `${req.method} ${req.url} completed with ${res.statusCode}`,
  customErrorMessage: (req, res, error) => `${req.method} ${req.url} failed with ${res.statusCode}: ${error.message}`,
});

export function requestLogger(req: FastifyRequest, res: FastifyReply, next: () => void) {
  logger(req.raw, res.raw);
  next();
}
