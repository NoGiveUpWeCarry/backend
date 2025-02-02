import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaModule } from '@src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { S3Module } from '@src/s3/s3.module';
import { NotificationModule } from '@src/modules/notification/notification.module';

@Module({
  imports: [PrismaModule, JwtModule, S3Module, NotificationModule],
  providers: [ChatService],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
