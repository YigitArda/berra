import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('models')
  listModels(@Query('page') page?: string, @Query('limit') limit?: string) {
    const parsedPage = Math.max(parseInt(page || '1', 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 50);
    return this.discoveryService.listModels(parsedPage, parsedLimit);
  }

  @Get('models/:slug')
  getModel(@Param('slug') slug: string) {
    return this.discoveryService.getModel(slug);
  }

  @Post('threads/:threadId/follow')
  @UseGuards(JwtAuthGuard)
  followThread(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    return this.discoveryService.followThread(req.user.id, threadId);
  }

  @Delete('threads/:threadId/follow')
  @UseGuards(JwtAuthGuard)
  unfollowThread(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    return this.discoveryService.unfollowThread(req.user.id, threadId);
  }

  @Post('models/:modelId/follow')
  @UseGuards(JwtAuthGuard)
  followModel(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Param('modelId', ParseIntPipe) modelId: number,
  ) {
    return this.discoveryService.followModel(req.user.id, modelId);
  }

  @Delete('models/:modelId/follow')
  @UseGuards(JwtAuthGuard)
  unfollowModel(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Param('modelId', ParseIntPipe) modelId: number,
  ) {
    return this.discoveryService.unfollowModel(req.user.id, modelId);
  }
}
