import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 유저가 참여한 채널 전체 조회
  @Get('channels')
  @UseGuards(JwtAuthGuard)
  async getAllChannels(@Req() req: any) {
    const userId = +req.user.user_id;
    return this.chatService.getAllChannels(userId);
  }
}
