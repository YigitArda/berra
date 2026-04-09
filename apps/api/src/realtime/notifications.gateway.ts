import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { FastifyRequest } from 'fastify';
import IORedis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { REALTIME_EVENT } from '../shared';

@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly configService: ConfigService) {}

  async afterInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) return;

    try {
      const pubClient = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.ping(), subClient.ping()]);
      this.server.adapter(createAdapter(pubClient, subClient));
      subClient.subscribe('realtime.events');
      subClient.on('message', (_channel, message) => {
        this.forwardRedisEvent(message);
      });
      this.logger.log('Socket.IO Redis adapter ready');
    } catch (err) {
      this.logger.warn(`Redis adapter init skipped: ${(err as Error).message}`);
    }
  }

  handleConnection(client: Socket) {
    const user = this.authenticateClient(client);
    if (!user) {
      client.disconnect(true);
      return;
    }

    const userRoom = `user:${user.id}`;
    client.join(userRoom);
    client.data.user = user;
    this.logger.debug(`Socket connected: ${client.id} user=${user.id}`);
  }

  @SubscribeMessage('entity.join')
  joinEntityRoom(@ConnectedSocket() client: Socket, @MessageBody() body: { entity: string; id: string | number }) {
    if (!client.data.user) return { ok: false, error: 'unauthorized' };
    const room = `${body.entity}:${body.id}`;
    client.join(room);
    return { ok: true, room };
  }

  emitNotificationCreated(payload: { userId: number; notificationId?: number; message: string }) {
    this.server.to(`user:${payload.userId}`).emit(REALTIME_EVENT.notificationCreated, payload);
  }

  emitContentUpdated(payload: { contentId: number; entityRoom?: string; action: 'created' | 'updated' }) {
    if (payload.entityRoom) {
      this.server.to(payload.entityRoom).emit(REALTIME_EVENT.contentUpdated, payload);
      return;
    }
    this.server.emit(REALTIME_EVENT.contentUpdated, payload);
  }

  emitMessageReceived(payload: { userId: number; fromUserId?: number; message: string }) {
    this.server.to(`user:${payload.userId}`).emit('message.received', payload);
  }

  private forwardRedisEvent(message: string) {
    try {
      const envelope = JSON.parse(message) as
        | { event: typeof REALTIME_EVENT.notificationCreated; payload: { userId: number; notificationId: number; message: string } }
        | { event: typeof REALTIME_EVENT.contentUpdated; payload: { contentId: number; action: 'created' | 'updated'; entityRoom?: string } };

      if (envelope.event === REALTIME_EVENT.notificationCreated) {
        this.emitNotificationCreated(envelope.payload);
        return;
      }

      if (envelope.event === REALTIME_EVENT.contentUpdated) {
        this.emitContentUpdated(envelope.payload);
      }
    } catch (err) {
      this.logger.warn(`Realtime event parse failed: ${(err as Error).message}`);
    }
  }

  private authenticateClient(client: Socket) {
    const bearer = typeof client.handshake.auth?.token === 'string'
      ? client.handshake.auth.token
      : null;

    const cookieToken = this.extractCookieToken(client.request as unknown as FastifyRequest);
    const token = cookieToken || bearer;
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, this.configService.getOrThrow<string>('JWT_SECRET')) as {
        id: number;
        username: string;
        role: 'user' | 'mod' | 'admin';
      };
      return decoded;
    } catch {
      return null;
    }
  }

  private extractCookieToken(req: FastifyRequest) {
    const rawCookie = req.headers?.cookie;
    if (!rawCookie) return null;

    const parts = rawCookie.split(';').map((v) => v.trim());
    for (const part of parts) {
      if (part.startsWith('token=')) {
        return decodeURIComponent(part.slice('token='.length));
      }
    }
    return null;
  }
}
