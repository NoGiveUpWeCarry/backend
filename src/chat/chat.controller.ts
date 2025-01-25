import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { GetMessageDto } from './dto/getMessage.dto';

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
    @Query() getMessageDto: GetMessageDto
  ) {
    return await this.chatService.getMessages(
      req.user.user_id,
      channelId,
      getMessageDto
    );
  }

  @Get('channels/:id')
  @UseGuards(JwtAuthGuard)
  async getChannel(@Req() req: any, @Param('id') channelId: number) {
    return await this.chatService.getChannel(req.user.user_id, channelId);
  }

  // 채널 메세지 검색
  @Get('channels/:id/messages/search')
  @UseGuards(JwtAuthGuard)
  async searchChannelMessages(
    @Req() req: any,
    @Param('id') channelId: number,
    @Query('limit') limit: number,
    @Query('cursor') cursor: number,
    @Query('keyword') keyword: string,
    @Query('direction') direction: string
  ) {
    return await this.chatService.searchMessage(
      req.user.user_id,
      channelId,
      limit,
      cursor ? cursor : 0,
      keyword,
      direction
    );
  }
}
