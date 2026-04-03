import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(
    @Req() req: FastifyRequest & { user: { id: number } },
    @Body() body: { target_type: string; target_id: number; reason: string },
  ) {
    return this.reportsService.create(req.user.id, body);
  }
}
