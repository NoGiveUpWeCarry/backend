import { Module } from '@nestjs/common';
import { NotificationsController } from './notification.controller';
import { NotificationsService } from '@modules/notification/notification.service';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaModule } from '@src/prisma/prisma.module';
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationModule {}
