import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Socket ----

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
    const result = await this.prisma.user.findUnique({
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
        auth_provider: true,
      },
    });

    const data = {
      userId: result.id,
      email: result.email,
      nickname: result.nickname,
      profileUrl: result.profile_url,
      authProvide: result.auth_provider,
      roleId: result.role_id,
    };

    return data;
  }
  // 메세지 상태 업데이트

  // ---- HTTP ----

  // 유저가 참여한 채널 전체 조회
  async getAllChannels(id: number) {
    const result = await this.prisma.channel_users.findMany({
      where: { user_id: id },
      select: { channel_id: true },
    });

    return result;
  }

  // 채널 개별 조회
  async getChannel(userId: number, channelId: number) {
    try {
      // 유저 아이디가 채널에 속해있는지 확인
      const auth = await this.prisma.channel_users.findMany({
        where: {
          user_id: userId,
          channel_id: channelId,
        },
      });

      // 아닐 시 예외처리
      if (!auth.length) {
        throw new Error('권한 X');
      }

      // 채널 데이터 조회
      const result = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          Channel_users: {
            select: {
              user: {
                select: { nickname: true },
              },
            },
          },
          Message: {
            take: 1,
            orderBy: { id: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  nickname: true,
                  profile_url: true,
                  auth_provider: true,
                  role_id: true,
                },
              },
            },
          },
        },
      });

      // 채널 데이터 양식화
      const channel = {
        channelId: result.id,
        title: result.name,
        type: result.Channel_users.length > 2 ? 'group' : 'private',
        users: result.Channel_users.map(v => v.user.nickname),
        lastMessage: result.Message[0],
      };

      const message = {
        code: 200,
        text: '데이터 패칭 성공',
      };
      return { channel, message };
    } catch (err) {
      return err.message;
    }
  }

  // 온라인 유저 DB에 저장
  async addUserOnline(userId, clientId) {
    await this.prisma.online_users.create({
      data: {
        user_id: userId,
        client_id: clientId,
      },
    });
  }

  // 오프라인 유저 DB에서 삭제
  async deleteUserOnline(userId: number) {
    await this.prisma.online_users.deleteMany({
      where: {
        user_id: userId,
      },
    });
  }

  // 유저 아이디를 통해 유저의 소켓 아이디 가져오기
  async getSocketId(userId: number) {
    const socketId = await this.prisma.online_users.findMany({
      where: {
        user_id: userId,
      },
      select: {
        client_id: true,
      },
    });
    return socketId[0].client_id;
  }

  // 채널 메세지 조회
  async getMessages(userId, channelId, limit, currentPage) {
    try {
      // 유저 아이디가 채널에 속해있는지 확인
      const auth = await this.prisma.channel_users.findMany({
        where: {
          user_id: userId,
          channel_id: channelId,
        },
      });

      // 아닐 시 예외처리
      if (!auth.length) {
        throw new Error('권한 X');
      }

      // 메세지 데이터 조회
      const result = await this.prisma.message.findMany({
        where: {
          channel_id: channelId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              nickname: true,
              role: true,
              profile_url: true,
              auth_provider: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        take: limit,
      });

      // 메세지 데이터 양식화
      const data = result.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        channelId: msg.channel_id,
        date: msg.created_at,
        user: {
          id: msg.user.id,
          email: msg.user.email,
          nickname: msg.user.nickname,
          role: msg.user.role.name,
          profileUrl: msg.user.profile_url,
        },
      }));
      // 페이지네이션
      const pagenation = {
        totalMessageCount: data.length,
        currentPage: currentPage,
      };

      const message = {
        code: 200,
        text: '데이터 패칭 성공',
      };

      // 응답데이터 {메세지데이터, 페이지네이션}
      return { messages: data, pagenation, message };
    } catch (err) {
      return err.message;
    }
  }
}
