import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
