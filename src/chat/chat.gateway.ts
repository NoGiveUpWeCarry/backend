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
import { Namespace, Socket } from 'socket.io';
import { NotificationsService } from '@src/modules/notification/notification.service';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationsService
  ) {}

  @WebSocketServer() server: Namespace;

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

      // 알람 기능
      const sender = await this.chatService.getSenderProfile(userId1);

      const message = `${sender.nickname}님과의 개인 채팅방이 생성되었습니다.`;

      // 알람 DB에 저장
      const createdNotification =
        await this.notificationService.createNotification(
          userId2,
          userId1,
          'privateChat',
          message
        );

      // 전송할 알림 데이터 객체
      const notificationData = {
        notificationId: createdNotification.notificationId, // 포함된 notificationId
        type: 'privateChat',
        message,
        senderNickname: sender.nickname,
        senderProfileUrl: sender.profileUrl,
      };

      // SSE를 통해 실시간 알림 전송
      this.notificationService.sendRealTimeNotification(
        userId2,
        notificationData
      );
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

      const sender = await this.chatService.getSenderProfile(userId);
      const message = `${sender.nickname}님이 단체 채팅방을 생성했습니다.`;

      // 각 멤버들의 채널 리스트에 해당 채널 추가
      userSockets.forEach(async socket => {
        socket.emit('channelAdded', channel);

        const createdNotification =
          await this.notificationService.createNotification(
            socket.data.userId,
            userId,
            'groupChat',
            message
          );

        // 전송할 알림 데이터 객체
        const notificationData = {
          notificationId: createdNotification.notificationId, // 포함된 notificationId
          type: 'groupChat',
          message,
          senderNickname: sender.nickname,
          senderProfileUrl: sender.profileUrl,
        };

        // SSE를 통해 실시간 알림 전송
        this.notificationService.sendRealTimeNotification(
          socket.data.userId,
          notificationData
        );
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

    // 라스트 메세지 id 확인
    const lastMessage = await this.chatService.getLastMessageId(
      userId,
      channelId
    );

    // 라스트 메세지보다 id가 큰 값(최신 메세지) 리드 카운트 증가
    const lastMessageId = lastMessage ? lastMessage.last_message_id : 0;
    await this.chatService.updateReadCount(lastMessageId, channelId);

    // 채널 라스트 메세지 조회
    const channelLastMessage =
      await this.chatService.getChannelLastMessage(channelId);

    const channelLastMessageId = channelLastMessage?.id;

    if (channelLastMessageId) {
      // 채널 입장 시 채널의 마지막 메세지 last message로 저장
      await this.chatService.setLastMessageId(
        userId,
        channelId,
        channelLastMessageId
      );
    }
    // 채널 객체
    const channelData = await this.chatService.getChannel(userId, channelId);
    const { channel } = channelData;

    // 클라이언트에 채널 객체 전달
    client.emit('channelJoined', channel);
    this.server.to(channelId.toString()).emit('broadcastChannelJoined');
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
    let messageData;

    // 전달 타입에 따라 메세지 데이터 저장
    if (data.type == 'image') {
      const result = await this.chatService.handleChatFiles(
        userId,
        data.content
      );

      messageData = await this.chatService.createMessage(
        data.type,
        data.channelId,
        userId,
        result.imageUrl
      );
    } else {
      messageData = await this.chatService.createMessage(
        data.type,
        data.channelId,
        userId,
        data.content
      );
    }

    const messageId = messageData.id;

    // 유저 정보 추가
    const user = await this.chatService.getSenderProfile(userId);

    const date = new Date();

    // 전달 데이터 양식
    const sendData = {
      type: data.type,
      content: messageData.content,
      channelId: data.channelId,
      messageId,
      user,
      date,
      readCount: messageData.read_count,
    };
    console.log(sendData);
    this.server.to(data.channelId.toString()).emit('message', sendData);
  }

  @SubscribeMessage('exitChannel')
  async handleLeaveChannel(
    @MessageBody()
    data: { userId: number; channelId: number },
    @ConnectedSocket() client: Socket
  ) {
    const { userId, channelId } = data;

    // 채널 나가기
    client.leave(channelId.toString());
    // 채널 나간 후 클라이언트에게 채널 아이디 전달
    client.emit('channelExited', channelId);

    // DB에서 유저 삭제 + 채널 탈퇴 메세지 DB 저장 후 반환
    const leaveMessage = await this.chatService.deleteUser(userId, channelId);

    this.server.to(channelId.toString()).emit('message', leaveMessage);
  }

  // 메세지 실시간 읽음처리
  @SubscribeMessage('readMessage')
  async handleReadCount(
    @MessageBody()
    data: {
      userId: number;
      messageId: number;
      channelId: number;
    }
  ) {
    const { userId, channelId, messageId } = data;
    await this.chatService.increaseReadCount(messageId);
    await this.chatService.setLastMessageId(userId, channelId, messageId);
    this.server.to(data.channelId.toString()).emit('readCounted', messageId);
  }
}
