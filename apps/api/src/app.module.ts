import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { FeedModule } from './feed/feed.module';
import { ForumModule } from './forum/forum.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { QueueModule } from './queue/queue.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    RealtimeModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    ContentModule,
    FeedModule,
    SearchModule,
    ForumModule,
    DiscoveryModule,
    BusinessesModule,
    BookmarksModule,
    ReportsModule,
    NotificationsModule,
    JobsModule,
  ],
})
export class AppModule {}
