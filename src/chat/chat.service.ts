import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // 채널 id를 리턴하는 로직
  async getChannelId(userId1, userId2) {
    // 매핑 테이블에서 파라미터로 전달된 유저 아이디에 해당하는 데이터 찾기
    const result = await this.prisma.channel_users.groupBy({
      by: ['channel_id'],
      where: {
        user_id: {
          in: [userId1, userId2],
        },
      },
      _count: {
        user_id: true,
      },
    });

    // user_id == 2 -> 두 유저가 모두 참여한 채널 필터링
    const channel = result.filter(data => data._count.user_id == 2)[0];

    // 참여한 채널이 있다면 채널 id 리턴
    if (channel) return channel.channel_id;

    // 없다면 새로운 채널 생성 후
    const newChannel = await this.prisma.channel.create({});

    // 매핑 테이블에 데이터 저장
    await this.prisma.channel_users.createMany({
      data: [
        {
          channel_id: newChannel.id,
          user_id: userId1,
        },
        {
          channel_id: newChannel.id,
          user_id: userId2,
        },
      ],
    });

    // 채널 id 리턴
    return newChannel.id;
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
        //authprovider 추가
      },
    });
    return data;
  }
  // 메세지 상태 업데이트
}
