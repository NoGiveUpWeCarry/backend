import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaModule } from '@src/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module'; // AuthModule 추가

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
