import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { ChatGateway } from './chat/chat.gateway';
import { ChatModule } from './chat/chat.module';
import { FeedModule } from './feed/feed.module';
import { ProjectModule } from '@modules/project/project.module';
import { SearchModule } from './search/search.module';
import { FollowModule } from '@modules/follow/follow.module';
import { NotificationModule } from '@modules/notification/notification.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경 변수를 글로벌하게 사용할 수 있도록 설정
    }),
    AuthModule, // Auth 모듈 추가
    UserModule,
    ChatModule,
    FeedModule,
    ProjectModule,
    SearchModule,
    FollowModule,
    NotificationModule,
  ],
  providers: [ChatGateway],
})
export class AppModule {}
