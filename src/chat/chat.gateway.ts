import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService
  ) {}

  // 채팅방 참여
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { channelId: string; userId: string }
  ) {
    const { channelId, userId } = data;

    // userId JWT 토큰 값이라 디코딩 해야함
    const user = this.jwtService.decode(userId);

    // 존재하는 채팅방인지 확인
    const existData = await this.chatService.channelExist(
      channelId,
      user.user_id
    );
    if (existData) return;

    // 채팅방 생성
    await this.chatService.createChannel(channelId);

    // 채팅방 멤버 저장
    await this.chatService.joinChannel(channelId, user.user_id);
  }
}
