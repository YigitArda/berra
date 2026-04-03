import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  list(@Query('page') page?: string) {
    const p = Math.max(parseInt(page || '1', 10) || 1, 1);
    return this.contentService.list(p);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: FastifyRequest & { user: { id: number } }, @Body() body: { body: string }) {
    return this.contentService.create(req.user.id, body.body);
  }
}
