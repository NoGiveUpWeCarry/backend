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
    const userId = +client.handshake.query.userId;
    client.data.userId = userId; // userId 넘버로 저장

    // 유저 온라인 -> DB에 저장
    await this.chatService.addUserOnline(userId, client.id);
    console.log(`User ${userId} connected with socket ID ${client.id}`);

    // 유저가 참여한 전체 채널 조회
    const channels = await this.chatService.getAllChannels(userId);

    // channel(유저가 참여한 전체 채널) 배열 형태로 전송
    client.emit('fetchChannels', channels);
  }

  // 유저 소켓 접속 해제
  async handleDisconnect(client: Socket) {
    // 유저 아이디 소켓 객체(client)에서 가져옴
    const userId = client.data.userId;

    // 온라인 여부 DB에서 삭제
    await this.chatService.deleteUserOnline(userId);

    console.log(`User ${userId} disconnected.`);
  }

  // 1대1 새 채팅방 생성 (userId1(클라이언트/본인), userId2(상대방))
  @SubscribeMessage('createChannel')
  async handleCreateChannel(
    @MessageBody()
    data: { userId1: number; userId2: number },
    @ConnectedSocket() client: Socket
  ) {
    const { userId1, userId2 } = data;
    client.data.userId = userId1;

    // 채널 id 조회
    const channelId = await this.chatService.getChannelId(userId1, userId2);

    // 채널 객체 조회
    const channelData = await this.chatService.getChannel(userId1, channelId);
    const channel = channelData.channel;

    // 채널에 유저 참여, 채널리스트에 해당 채널 추가
    client.join(channelId.toString());
    client.emit('channelAdded', channel);

    console.log(`client ${client.data.userId}  ${channelId}번 채팅방 입장`);

    // B 유저 온라인 여부 확인
    const targetSocket = await this.chatService.getSocketIds([userId2]);

    // 온라인 일때
    if (targetSocket.length) {
      // 유저2의 소켓 가져오기
      const target = targetSocket[0];
      const sockets = await this.server.fetchSockets();
      const userSocket = sockets.find(
        socket => socket.id === target.toString()
      );

      // 유저2의 채널 리스트에 해당 채널 추가
      userSocket.emit('channelAdded', channel);
      console.log(`channel ${channelId} added in ${userId2} channel list`);
    } else {
      // 오프라인 일때
      console.log(`User ${userId2} is not connected.`);
    }

    // 클라이언트에 채널id 전달
    client.emit('channelCreated', channel);
  }

  // 그룹 채팅방 생성
  @SubscribeMessage('createGroup')
  async handleCreateGroup(
    @MessageBody()
    data: { userIds: number[]; title: string; thumnailUrl: string },
    @ConnectedSocket() client: Socket
  ) {
    const { userIds, title, thumnailUrl } = data;
    // userIds[0] => 클라이언트(그룹 채팅 마스터)
    const userId = userIds[0];

    // 채널 id 조회
    const channelId = await this.chatService.getGroupChannelId(
      userIds,
      title,
      thumnailUrl
    );

    // 채널 객체 조회
    const channelData = await this.chatService.getChannel(userId, channelId);
    const channel = channelData.channel;

    // 채널에 마스터 유저 참여 & 채널리스트에 추가
    client.join(channelId.toString());
    client.emit('channelAdded', channel);
    console.log(`client ${client.data.userId}  ${channelId}번 채팅방 입장`);

    // 나머지 유저 온라인 여부 확인
    const groupMemberIds = userIds.filter(id => id !== userId);
    const targetSockets = await this.chatService.getSocketIds(groupMemberIds);

    // 온라인인 유저가 있을 때
    if (targetSockets.length) {
      // 접속중인 모든 소켓 확인
      const sockets = await this.server.fetchSockets();

      // 채널 멤버들의 소켓만 조회하게 필터링
      const userSockets = sockets.filter(socket =>
        targetSockets.includes(socket.id)
      );

      // 각 멤버들의 채널 리스트에 해당 채널 추가
      userSockets.forEach(socket => {
        socket.emit('channelAdded', channel);
      });
    } else {
      // 오프라인 일때
      console.log('모든 유저가 오프라인 상태입니다.');
    }

    // 클라이언트에 채널id 전달
    client.emit('groupCreated', channel);
  }

  // 채널 참여
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @MessageBody() data: { userId: number; channelId: number },
    @ConnectedSocket() client: Socket
  ) {
    const { userId, channelId } = data;

    // 채널 참여
    client.join(channelId.toString());
    console.log(`유저 ${userId} 채널 ${channelId} 참여`);
    // 채널 객체
    const channelData = await this.chatService.getChannel(userId, channelId);
    const { channel } = channelData;

    // 클라이언트에 채널 객체 전달
    client.emit('channelJoined', channel);
  }

  // 메세지 송수신
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      type: string;
      content: string;
      userId: number;
      channelId: number;
    }
  ) {
    const { userId } = data;

    // 메세지 데이터 저장
    const messageData = await this.chatService.createMessage(
      data.type,
      data.channelId,
      userId,
      data.content
    );

    const messageId = messageData.id;

    // 유저 정보 추가
    const user = await this.chatService.getSenderProfile(userId);

    const date = new Date();

    // 전달 데이터 양식
    const sendData = {
      type: data.type,
      content: data.content,
      channelId: data.channelId,
      messageId,
      user,
      date,
    };
    console.log(sendData);
    this.server.to(data.channelId.toString()).emit('message', sendData);
  }
}
