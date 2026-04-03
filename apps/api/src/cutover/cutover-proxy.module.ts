import { Module } from '@nestjs/common';
import {
  BookmarksProxyController,
  BusinessesProxyController,
  DiscoveryProxyController,
  ForumProxyController,
  ReportsProxyController,
} from './cutover-proxy.controller';
import { CutoverProxyService } from './cutover-proxy.service';

@Module({
  controllers: [
    ForumProxyController,
    DiscoveryProxyController,
    BusinessesProxyController,
    BookmarksProxyController,
    ReportsProxyController,
  ],
  providers: [CutoverProxyService],
})
export class CutoverProxyModule {}
