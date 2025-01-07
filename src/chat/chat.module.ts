import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaModule } from '@src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChatService],
})
export class ChatModule {}
