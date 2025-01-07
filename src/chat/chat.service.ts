import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // 채팅방 생성
  async creatRoom() {
    const result = await this.prisma.room.create({});
    // 생성한 채팅방 id 리턴
    return result.id;
  }

  // 채팅방 멤버 저장
  async joinRoom(roomId, userId1, userId2) {
    await this.prisma.room_users.createMany({
      data: [
        {
          room_id: roomId,
          user_id: userId1,
        },
        {
          room_id: roomId,
          user_id: userId2,
        },
      ],
    });
  }
}
