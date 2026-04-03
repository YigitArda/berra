import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessesController],
  providers: [BusinessesService],
})
export class BusinessesModule {}
