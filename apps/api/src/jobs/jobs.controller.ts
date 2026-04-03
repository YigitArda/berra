import { Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('demo-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  demoEmail() {
    return this.jobsService.enqueueDemoEmail();
  }

  @Post('demo-media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  demoMedia() {
    return this.jobsService.enqueueDemoMedia(1, 1);
  }
}
