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
    @MessageBody() data: { userId1: number; userId2: number },
    @ConnectedSocket() client: Socket
  ) {
    const { userId1, userId2 } = data;

    // 채널 id 조회
    const channelId = await this.chatService.getChannelId(userId1, userId2);

    // 채널에 유저 참여
    client.to(userId1.toString()).socketsJoin(channelId);
    client.to(userId2.toString()).socketsJoin(channelId);

    // 클라이언트에 채널id 전달
    this.server.emit('channelId', channelId);
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
