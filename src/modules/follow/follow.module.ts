import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { FollowService } from '@modules/follow/follow.service';
@Module({
  imports: [PrismaModule],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
