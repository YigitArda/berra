import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessesService } from './businesses.service';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  list(@Query('city') city?: string, @Query('cat') cat?: string, @Query('page') page?: string) {
    const parsed = Math.max(parseInt(page || '1', 10) || 1, 1);
    return this.businessesService.list(city, cat, parsed);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Body() body: { name: string; category: string; address: string; city: string; phone?: string },
  ) {
    return this.businessesService.create(req.user.id, body);
  }
}
