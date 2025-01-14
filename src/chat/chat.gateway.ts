import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer() server: Server;

  // 유저 소켓 접속
  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    client.data.userId = userId;

    await this.chatService.addUserOnline(userId, client.id);
    console.log(`User ${userId} connected with socket ID ${client.id}`);
  }

  // 유저 소켓 접속 해제
  handleDisconnect(client: Socket) {
    console.log('유저 연결 해제', client.data.userId);
    // 유저가 연결 끊을 때, 온라인 유저 목록에서 삭제
    this.onlineUsers.delete(client.data.userId);
  }

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
    client.join(channelId.toString());
    console.log(`client ${client.data.userId}  ${channelId}번 채팅방 입장`);

    // B 유저 온라인 여부 확인
    const targetSocket = this.onlineUsers.get(userId2.toString());
    if (targetSocket) {
      // 온라인
      targetSocket.join(channelId.toString()); // B 유저도 채널에 입장
      targetSocket.emit('channelJoined', { channelId: channelId.toString() });
      console.log(
        `client ${userId2} ${channelId}번 채팅방 입장 (온라인 바로 입장)`
      );
    } else {
      // 오프라인
      // 채팅 요청에 올려둠
      this.chatRequest.set(userId2.toString(), channelId.toString());
      console.log(`client ${userId2} 오프라인 `);
    }

    // 클라이언트에 채널id 전달
    client.emit('channelJoined', { channelId: channelId.toString() });
  }

  // 메세지 송수신
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      type: string;
      content: string;
      userId: number;
      channelId: string;
    }
  ) {
    const { userId, ...resData } = data;

    // 메세지 데이터 저장
    await this.chatService.createMessage(
      data.type,
      data.channelId,
      userId,
      data.content
    );

    // 유저 정보 추가
    const user = await this.chatService.getSenderProfile(userId);
    const date = new Date();

    // 전달 데이터 양식
    const sendData = { ...resData, user, date };
    console.log(sendData);
    this.server.to(data.channelId).emit('message', sendData);
  }
}
