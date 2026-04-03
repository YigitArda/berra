import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, RolesGuard],
})
export class JobsModule {}
