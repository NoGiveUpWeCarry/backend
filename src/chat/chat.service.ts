import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // 채팅방 생성
  async createRoom(id: number, name: string) {
    const data = { id, name };
    await this.prisma.room.create({ data });
  }
}
