import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const res = ctx.getResponse<FastifyReply>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const response = exception instanceof HttpException
      ? exception.getResponse()
      : 'Beklenmeyen bir hata oluştu.';

    const message = typeof response === 'string'
      ? response
      : (response as { message?: string | string[] }).message ?? 'Hata';

    res.status(status).send({
      statusCode: status,
      path: req.url,
      method: req.method,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
