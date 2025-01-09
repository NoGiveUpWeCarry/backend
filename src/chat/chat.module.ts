import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaModule } from '@src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule],
  providers: [ChatService],
})
export class ChatModule {}
