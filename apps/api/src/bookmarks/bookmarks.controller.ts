import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  list(@Req() req: FastifyRequest & { user: { id: number } }, @Query('page') page?: string) {
    const parsed = Math.max(parseInt(page || '1', 10) || 1, 1);
    return this.bookmarksService.list(req.user.id, parsed);
  }

  @Post(':threadId')
  save(@Req() req: FastifyRequest & { user: { id: number } }, @Param('threadId', ParseIntPipe) threadId: number) {
    return this.bookmarksService.save(req.user.id, threadId);
  }

  @Delete(':threadId')
  remove(@Req() req: FastifyRequest & { user: { id: number } }, @Param('threadId', ParseIntPipe) threadId: number) {
    return this.bookmarksService.remove(req.user.id, threadId);
  }
}
