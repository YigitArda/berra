import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';

function buildQueryString(query: FastifyRequest['query']) {
  if (!query || typeof query !== 'object') return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, String(item));
      }
      continue;
    }
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

@Injectable()
export class CutoverProxyService {
  constructor(private readonly configService: ConfigService) {}

  async forward(
    req: FastifyRequest,
    reply: FastifyReply,
    namespace: 'forum' | 'discovery' | 'businesses' | 'bookmarks' | 'reports',
    nestedPath?: string,
  ) {
    const legacyOrigin = this.configService.get<string>('LEGACY_API_ORIGIN')?.replace(/\/$/, '');
    if (!legacyOrigin) {
      throw new ServiceUnavailableException(
        'Legacy proxy yapılandırılmadı. LEGACY_API_ORIGIN tanımlanmalı.',
      );
    }

    const suffix = nestedPath ? `/${nestedPath}` : '';
    const query = buildQueryString(req.query);
    const targetUrl = `${legacyOrigin}/api/${namespace}${suffix}${query}`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([k, v]) => {
      if (v == null) return;
      const key = k.toLowerCase();
      if (key === 'host' || key === 'content-length') return;
      if (Array.isArray(v)) {
        v.forEach((item) => headers.append(k, item));
        return;
      }
      headers.set(k, String(v));
    });

    const method = req.method.toUpperCase();
    const shouldSendBody = !['GET', 'HEAD'].includes(method);
    const body = shouldSendBody ? JSON.stringify(req.body ?? {}) : undefined;

    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    reply.status(res.status);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      reply.header(key, value);
    });

    const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType.includes('application/json')) {
      const payload = await res.json().catch(() => ({}));
      return reply.send(payload);
    }

    const text = await res.text();
    return reply.send(text);
  }
}
