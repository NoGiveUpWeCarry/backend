import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // 이미 존재하는 채팅방인지 확인
  async channelExist(channelId) {
    const result = await this.prisma.channel.count({
      where: { id: channelId },
    });
    return result;
  }

  // 채팅방 생성
  async creatRoom() {
    const result = await this.prisma.channel.create({});
    // 생성한 채팅방 id 리턴
    return result.id;
  }

  // 채팅방 멤버 저장
  async joinChannel(channelId, userId1) {
    await this.prisma.room_users.create({
      data: {
        room_id: channelId,
        user_id: userId1,
      },
    });
  }

  // 메세지 저장
  // 메세지 상태 업데이트
}
