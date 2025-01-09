import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService
  ) {}
  @WebSocketServer() server: Server;
  // 채팅방 참여
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { channelId: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { channelId, userId } = data;

    // userId JWT 토큰 값이라 디코딩 해야함
    const user = this.jwtService.decode(userId);

    // 존재하는 채팅방인지 확인
    const existData = await this.chatService.channelExist(channelId, user.id);
    if (existData) {
      // 채팅방 참여
      client.join(channelId);
      return existData;
    }

    // 채팅방 생성
    await this.chatService.createChannel(channelId);

    // 채팅방 참여
    client.join(channelId);

    // 채팅방 멤버 저장
    await this.chatService.joinChannel(channelId, user.id);
  }

  // 메세지 송수신
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      type: string;
      content: string;
      user: any;
      channelId: string;
    }
  ) {
    // user 디코딩
    const user = this.jwtService.decode(data.user);

    // 메세지 데이터 저장
    await this.chatService.createMessage(
      data.type,
      data.channelId,
      user.id,
      data.content
    );

    // 유저 정보 추가
    const userData = await this.chatService.getSenderProfile(user.id);
    data.user = userData;
    const createdAt = new Date();
    const sendData = { ...data, createdAt };

    this.server.to(data.channelId).emit('message', sendData);
  }
}
