import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ForumController],
  providers: [ForumService],
})
export class ForumModule {}
