import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { GetMessageDto } from './dto/getMessage.dto';
import { SearchMessageDto } from './dto/serchMessage.dto';
import { S3Service } from '@src/s3/s3.service';
import * as fileType from 'file-type';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service
  ) {}

  // 온라인 유저 DB에 저장
  async addUserOnline(userId: number, clientId: string) {
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
  async getSocketIds(Ids: number[]) {
    const socketIds = await this.prisma.online_users.findMany({
      where: { user_id: { in: Ids } },
      select: { client_id: true },
    });

    return socketIds.map(id => id.client_id);
  }

  // 기존 채널 조회 or 새 채널 생성
  // 채널id 리턴 (개인 채팅방)
  async getChannelId(userId1: number, userId2: number) {
    // 매핑 테이블에서 파라미터로 전달된 유저 아이디에 해당하는 데이터 찾기

    const privateChannel = await this.prisma.channel.findMany({
      where: { type: 'private' },
      select: { id: true },
    });

    const privateChannelIds = [];

    privateChannel.map(res => {
      privateChannelIds.push(res.id);
    });

    const result = await this.prisma.channel_users.groupBy({
      by: ['channel_id'],
      where: {
        channel_id: {
          in: privateChannelIds,
        },
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
    const newChannel = await this.prisma.channel.create({
      data: {
        type: 'private',
      },
    });

    const channelId = newChannel.id;

    // 매핑 테이블에 데이터 저장
    await this.createChannelUsers(channelId, [userId1, userId2]);

    // 채널 id 리턴
    return channelId;
  }

  // 기존 채널 조회 or 새 채널 생성
  // 채널id 리턴 (그룹 채팅방)
  async getGroupChannelId(
    userIds: number[],
    title: string,
    thumnailUrl: string
  ) {
    // 기존 채널 조회
    const result = await this.prisma.channel_users.groupBy({
      by: ['channel_id'],
      where: {
        user_id: {
          in: userIds,
        },
      },
      _count: {
        user_id: true,
      },
    });

    if (result.length) {
      const exist = result.filter(
        data => data._count.user_id == userIds.length
      )[0];

      if (exist) {
        return exist.channel_id;
      }
    }

    // 새로운 채널 생성
    const channel = await this.prisma.channel.create({
      data: {
        title,
        thumbnail_url: thumnailUrl,
        type: 'group',
      },
    });
    const channelId = channel.id;

    // 매핑 테이블에 저장
    await this.createChannelUsers(channelId, userIds);

    return channelId;
  }

  // channle_users 테이블에 채널-유저 저장
  async createChannelUsers(channelId: number, userIds: number[]) {
    const data = userIds.map(userId => ({
      channel_id: channelId,
      user_id: userId,
    }));

    await this.prisma.channel_users.createMany({ data });
  }

  // 메세지 저장
  async createMessage(
    type: string,
    channelId: number,
    userId: number,
    content: string
  ) {
    return await this.prisma.message.create({
      data: {
        type,
        content,
        channel_id: channelId,
        user_id: userId,
      },
    });
  }

  // 유저 정보 확인
  async getSenderProfile(userId: number) {
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
      name: result.name,
      nickname: result.nickname,
      profileUrl: result.profile_url,
      authProvide: result.auth_provider,
      roleId: result.role_id,
    };

    return data;
  }

  // 유저가 참여한 채널 전체 조회
  async getAllChannels(id: number) {
    const result = await this.prisma.channel_users.findMany({
      where: { user_id: id },
      select: { channel_id: true },
    });

    const channels = [];
    for (const res of result) {
      const channel = await this.getChannleObj(res.channel_id);
      channels.push(channel);
    }

    return channels;
  }

  // 채널 개별 조회
  async getChannel(userId: number, channelId: number) {
    try {
      // 권한 확인
      await this.confirmAuth(userId, channelId);

      const channel = await this.getChannleObj(channelId);

      const message = {
        code: 200,
        text: '데이터 패칭 성공',
      };
      return { channel, message };
    } catch (err) {
      return err.message;
    }
  }

  // 채널 객체 리턴 로직
  async getChannleObj(channelId: number) {
    // 채널 데이터 조회
    const result = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        Channel_users: {
          select: {
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
      title: result.title,
      type: result.type,
      thumnailUrl: result.thumbnail_url,
      users: result.Channel_users.map(res => ({
        userId: res.user.id,
        email: res.user.email,
        name: res.user.name,
        nickname: res.user.nickname,
        profileUrl: res.user.profile_url,
        authProvider: res.user.auth_provider,
        roleId: res.user.role_id,
      })),
      lastMessage: {
        type: result.Message[0]?.type,
        content: result.Message[0]?.content,
        channelId: result.Message[0]?.channel_id,
        date: result.Message[0]?.created_at,
        userId: result.Message[0]?.user_id,
      },
    };

    return channel;
  }

  // 채널 메세지 조회
  async getMessages(
    userId: number,
    channelId: number,
    getMessageDto: GetMessageDto
  ) {
    try {
      const { cursor, limit, direction } = getMessageDto;
      // 권한 확인
      await this.confirmAuth(userId, channelId);

      // 메세지 데이터 조회
      const result = await this.prisma.message.findMany({
        orderBy: {
          // 커서값이 없다면(초기요청) direction 상관없이 desc 정렬
          id: cursor ? (direction == 'forward' ? 'asc' : 'desc') : 'desc',
        },
        where: cursor
          ? {
              // forward(스크롤 다운)일 시 cursor보다 id 높은 값(최신)
              // backward(스크롤 업)일 시 cursor보다 id 낮은 값(오래된)
              channel_id: channelId,
              id: direction === 'forward' ? { gt: cursor } : { lt: cursor },
            }
          : { channel_id: channelId }, // 커서가 없으면 id 조건 없이 가져오기

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

        take: limit,
      });

      // 메세지 데이터 양식화
      const data = await this.getMessageObj(result);

      // 메세지 데이터, 메세지 id순 오름차순 정렬
      const messages =
        !cursor || direction == 'backward' ? data.reverse() : data;

      // 커서
      const cursors =
        direction == 'backward'
          ? { prev: data[0] ? data[0].messageId : null }
          : {
              next: data[data.length - 1]
                ? data[data.length - 1].messageId
                : null,
            };

      // 응답 메세지
      const message = {
        code: 200,
        text: '데이터 패칭 성공',
      };

      // 응답데이터 {메세지데이터, 커서, 응답메세지}
      return { messages, cursors, message };
    } catch (err) {
      return err.message;
    }
  }

  // 메세지 검색
  async searchMessage(
    userId: number,
    channelId: number,
    searchMessageDto: SearchMessageDto
  ) {
    try {
      const { limit, keyword } = searchMessageDto;
      let { cursor, direction } = searchMessageDto;

      // 권한 확인
      await this.confirmAuth(userId, channelId);

      if (!cursor) {
        const res = await this.prisma.message.findFirst({
          orderBy: { id: 'desc' },
          where: { channel_id: channelId },
          select: { id: true },
        });
        direction = 'backward';
        cursor = res.id;
      }

      // 키워드에 해당하는 메세지id 검색
      const keywordMessage = await this.prisma.message.findFirst({
        orderBy: { id: direction == 'forward' ? 'asc' : 'desc' },
        where: {
          channel_id: channelId,
          // forward(스크롤 다운)일 시 cursor보다 id 높은 값(최신)
          // backward(스크롤 업)일 시 cursor보다 id 낮은 값(오래된)
          id: direction == 'forward' ? { gt: cursor } : { lt: cursor },
          content: { contains: keyword },
        },
        select: { id: true },
      });

      if (!keywordMessage) {
        const message = { code: 404, text: '메세지를 찾을 수 없습니다' };
        return { message };
      }

      // 키워드 메세지 커서 설정
      const search = keywordMessage.id;

      // 커서 기준 이전/후 메세지 15개 아이디 조회
      const [forward, backward] = await this.prisma.$transaction([
        this.prisma.message.findMany({
          orderBy: { id: 'desc' },
          where: { channel_id: channelId, id: { lt: search } },
          select: { id: true },
          take: limit,
        }),
        this.prisma.message.findMany({
          orderBy: { id: 'asc' },
          where: { channel_id: channelId, id: { gt: search } },
          select: { id: true },
          take: limit,
        }),
      ]);

      const forwardIds = forward.reverse().map(pre => pre.id);
      const backwordIds = backward.map(sub => sub.id);
      const ids = [...forwardIds, search, ...backwordIds];

      const messages = await this.getMessageById(ids);
      // 무한 스크롤용 커서 데이터
      const cursors = {
        // backward 무한스크롤 요청 커서
        prev: forwardIds.length ? forwardIds[0] : null,
        // forward 무한스크롤 요청 커서
        next: backwordIds.length ? backwordIds[backwordIds.length - 1] : null,
        // 검색 메세지 아이디 커서
        search,
      };

      const message = {
        code: 200,
        message: '데이터 패칭 성공',
      };

      return { messages, cursors, message };
    } catch (err) {
      return err;
    }
  }

  // 메세지 아이디로 메세지 조회
  async getMessageById(ids) {
    const result = await this.prisma.message.findMany({
      where: { id: { in: ids } },
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
    });

    return this.getMessageObj(result);
  }

  // 메세지 데이터 양식화
  async getMessageObj(messages) {
    const data = messages.map(msg => ({
      messageId: msg.id,
      type: msg.type,
      content: msg.content,
      channelId: msg.channel_id,
      date: msg.created_at,
      readCount: msg.read_count,
      user: {
        userId: msg.user.id,
        email: msg.user.email,
        name: msg.user.name,
        nickname: msg.user.nickname,
        profileUrl: msg.user.profile_url,
        authProvider: msg.user.auth_provider,
        roleId: msg.user.role.id,
      },
    }));
    return data;
  }

  // 유저 채널에서 삭제
  async deleteUser(userId: number, channelId: number) {
    await this.prisma.channel_users.deleteMany({
      where: {
        channel_id: channelId,
        user_id: userId,
      },
    });
    const userData = this.getSenderProfile(userId);
    const nickname = (await userData).nickname;

    const data = {
      type: 'exit',
      content: `${nickname} 님이 방을 나갔습니다`,
      channel_id: channelId,
      user_id: userId,
    };

    const msg = await this.prisma.message.create({
      data,
    });

    return {
      userId,
      type: msg.type,
      content: msg.content,
      channelId: msg.channel_id,
      date: msg.created_at,
      messageId: msg.id,
    };
  }

  // 요청 채널에 대한 유저 권한 확인
  async confirmAuth(userId: number, channelId: number) {
    const auth = await this.prisma.channel_users.findMany({
      where: {
        user_id: userId,
        channel_id: channelId,
      },
    });

    if (!auth.length) {
      throw new HttpException('권한이 없습니다.', HttpStatus.UNAUTHORIZED);
    }
  }

  // 이미지 업로드
  async handleChatFiles(userId: number, file) {
    const data = await fileType.fromBuffer(file);
    const type = data.ext;

    const imageUrl = await this.s3.uploadImage(
      userId,
      file,
      type,
      'pad_chat/images'
    );

    return {
      imageUrl,
      message: { code: 200, message: '이미지 업로드가 완료되었습니다.' },
    };
  }

  async increaseReadCount(messageId) {
    await this.prisma.message.update({
      where: { id: messageId },
      data: { read_count: { increment: 1 } },
    });
  }

  async setLastMessageId(userId, channelId, lastMessageId) {
    const exist = await this.prisma.last_message_status.findFirst({
      where: { user_id: userId, channel_id: channelId },
    });

    if (exist) {
      await this.prisma.last_message_status.updateMany({
        where: { user_id: userId, channel_id: channelId },
        data: { last_message_id: lastMessageId },
      });
    } else {
      await this.prisma.last_message_status.create({
        data: {
          user_id: userId,
          channel_id: channelId,
          last_message_id: lastMessageId,
        },
      });
    }
  }

  // 라스트 메세지 id 조회
  async getLastMessageId(userId, channelId) {
    const lastMessageId = await this.prisma.last_message_status.findFirst({
      where: {
        user_id: userId,
        channel_id: channelId,
      },
      select: { last_message_id: true },
    });

    return lastMessageId;
  }

  // 리드 카운트 증가
  async updateReadCount(lastMessageId: number, channelId) {
    await this.prisma.message.updateMany({
      where: {
        channel_id: channelId,
        id: { gt: lastMessageId },
      },
      data: {
        read_count: { increment: 1 },
      },
    });
  }

  async getChannelLastMessage(channelId: number) {
    const data = await this.prisma.message.findFirst({
      where: { channel_id: channelId },
      orderBy: { id: 'desc' },
      take: 1,
      select: { id: true },
    });

    return data;
  }

  async getChannelOfflineUsers(channelId: number) {
    const userData = await this.prisma.channel_users.findMany({
      where: { channel_id: channelId },
      select: { user_id: true },
    });
    const userIds = userData.map(user => user.user_id);

    const onlineData = await this.prisma.online_users.findMany({
      select: { user_id: true },
    });
    const onlineIds = onlineData.map(user => user.user_id);

    const result = userIds.filter(id => !onlineIds.includes(id));

    return result;
  }
}
