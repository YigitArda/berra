import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ForumService } from './forum.service';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('threads')
  threads(@Query('page') page?: string, @Query('category') category?: string) {
    const parsed = Math.max(parseInt(page || '1', 10) || 1, 1);
    return this.forumService.threads(parsed, category);
  }

  @Get('threads/:slug')
  thread(@Param('slug') slug: string, @Query('page') page?: string) {
    const parsed = Math.max(parseInt(page || '1', 10) || 1, 1);
    return this.forumService.threadDetail(slug, parsed);
  }

  @Post('threads')
  @UseGuards(JwtAuthGuard)
  createThread(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Body() body: { title: string; body: string; category_id: number },
  ) {
    if (!body.title?.trim() || !body.body?.trim() || !Number.isInteger(body.category_id)) {
      throw new BadRequestException('Geçersiz payload.');
    }
    return this.forumService.createThread(req.user.id, body);
  }

  @Post('threads/:slug/posts')
  @UseGuards(JwtAuthGuard)
  createPost(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Param('slug') slug: string,
    @Body() body: { body: string },
  ) {
    if (!body.body?.trim()) throw new BadRequestException('Yanıt boş olamaz.');
    return this.forumService.createPost(req.user.id, slug, body.body);
  }
}
