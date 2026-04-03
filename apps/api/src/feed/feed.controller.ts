import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateFeedCommentDto } from './dto/create-feed-comment.dto';
import { CreateFeedDto } from './dto/create-feed.dto';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  list(@Query('page') page?: string) {
    const parsed = Math.max(parseInt(page || '1', 10) || 1, 1);
    return this.feedService.list(parsed);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: FastifyRequest & { user: { id: number } }, @Body() body: CreateFeedDto) {
    return this.feedService.create(req.user.id, body.body);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest & { user: { id: number } }) {
    return this.feedService.like(id, req.user.id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unlike(@Param('id', ParseIntPipe) id: number, @Req() req: FastifyRequest & { user: { id: number } }) {
    return this.feedService.unlike(id, req.user.id);
  }

  @Get(':id/comments')
  comments(@Param('id', ParseIntPipe) id: number) {
    return this.feedService.comments(id);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  comment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: FastifyRequest & { user: { id: number; username: string } },
    @Body() body: CreateFeedCommentDto,
  ) {
    return this.feedService.createComment(id, req.user.id, body.text, req.user.username);
  }
}
