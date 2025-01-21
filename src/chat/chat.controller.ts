import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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

  // 채널 메세지 조회
  @Get('channels/:id/messages')
  @UseGuards(JwtAuthGuard)
  async getChannelsMessages(
    @Req() req: any,
    @Param('id') channelId: number,
    @Query('limit') limit: number,
    @Query('currentPage') currentPage: number
  ) {
    return await this.chatService.getMessages(
      req.user.user_id,
      channelId,
      limit,
      currentPage
    );
  }

  @Get('channels/:id')
  @UseGuards(JwtAuthGuard)
  async getChannel(@Req() req: any, @Param('id') channelId: number) {
    return await this.chatService.getChannel(req.user.user_id, channelId);
  }

  // 메세지 검색
  @Post(':id/search')
  async searchMessage(@Body() body, @Param('id') id: number) {
    return await this.chatService.searchMessage(id, body.keyword);
  }
}
