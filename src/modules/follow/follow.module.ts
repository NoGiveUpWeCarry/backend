import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { FollowService } from '@modules/follow/follow.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '@src/prisma/prisma.service';
@Module({
  imports: [NotificationModule],
  controllers: [FollowController],
  providers: [FollowService, PrismaService],
})
export class FollowModule {}
