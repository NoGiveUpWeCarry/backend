import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // 이미 존재하는 채팅방인지 확인
  // 없다면 생성, 있다면 매핑 테이블 확인
  // 매핑 테이블 유저 데이터 있다면 대화 내용 불러오기, 없다면 매핑 테이블에 유저 데이터 생성
  async channelExist(channelId, userId) {
    const exist = await this.prisma.channel.count({
      where: { id: channelId },
    });

    // 존재하지 않으면 함수 종료 후 컨트롤러에서 채팅방 생성 로직 재개
    if (!exist) return false;

    // 매핑 테이블 channel_users에 유저 데이터 있는지 확인
    const userExist = await this.prisma.channel_users.findFirst({
      where: {
        channel_id: channelId,
        user_id: userId,
      },
    });

    // 있다면 대화내용 불러오기
    if (userExist) {
      const message = await this.prisma.message.findMany({
        where: {
          channel_id: channelId,
        },
      });
      return message;
    } else {
      // 없다면 매핑 테이블에 유저 데이터 추가
      await this.prisma.channel_users.create({
        data: {
          channel_id: channelId,
          user_id: userId,
        },
      });
      const notice = `${userId}님이 채팅방에 참가했습니다`;
      return { notice };
    }
  }

  // 채팅방 생성
  async createChannel(id) {
    await this.prisma.channel.create({ data: { id } });
  }

  // 채팅방 멤버 저장
  async joinChannel(channelId, userId) {
    await this.prisma.channel_users.create({
      data: {
        channel_id: channelId,
        user_id: userId,
      },
    });
  }
  // 메세지 저장
  async createMessage(type, channelId, userId, content) {
    await this.prisma.message.create({
      data: {
        type,
        content,
        channel_id: channelId,
        user_id: userId,
      },
    });
  }

  // 유저 정보 확인
  async getSenderProfile(userId) {
    const data = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role_id: true,
        profile_url: true,
      },
    });
    return data;
  }
  // 메세지 상태 업데이트
}
