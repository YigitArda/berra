import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Math.max(parseInt(page || '1', 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 100);
    return this.notificationsService.listForUser(req.user.id, parsedPage, parsedLimit);
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@Req() req: FastifyRequest & { user: { id: number } }) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Post('system-test')
  @UseGuards(JwtAuthGuard)
  async systemTest(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Body() body: { message?: string },
  ) {
    const message = (body.message || 'Sistem bildirimi test mesajı').slice(0, 200);
    const job = await this.notificationsService.sendSystemNotification(req.user.id, message);

    return {
      message: 'Bildirim kuyruğa alındı.',
      jobId: job.id,
    };
  }

  @Post('email-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async emailTest(@Body() body: { to: string; subject: string; html: string }) {
    const job = await this.notificationsService.sendEmail(body.to, body.subject, body.html);

    return {
      message: 'E-posta kuyruğa alındı.',
      jobId: job.id,
    };
  }
}
