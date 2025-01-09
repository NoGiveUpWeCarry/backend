import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  // 채팅방 참여
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { channelId: string; userId: string }
  ) {
    const { channelId, userId } = data;
    // 존재하는 채팅방인지 확인
    const exist = await this.chatService.channelExist(channelId);
    if (exist) return;

    // 채팅방 생성
    await this.chatService.createChannel(channelId);

    // userId JWT 토큰 값이라 디코딩 해야함
    const user = userId;
    // 채팅방 멤버 저장
    await this.chatService.joinChannel(channelId, userId);
  }
}
