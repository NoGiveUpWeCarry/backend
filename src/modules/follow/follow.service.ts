import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { NotificationsService } from '@modules/notification/notification.service';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async toggleFollow(userId: number, targetUserId: number) {
    // 현재 팔로우 상태 확인
    const existingFollow = await this.prisma.follows.findFirst({
      where: {
        following_user_id: userId,
        followed_user_id: targetUserId,
      },
    });

    if (existingFollow) {
      // 언팔로우 처리
      await this.prisma.follows.delete({
        where: { id: existingFollow.id },
      });

      return {
        message: { code: 200, text: '언팔로우 성공' },
        isFollowing: false,
      };
    } else {
      // 팔로우 처리
      await this.prisma.follows.create({
        data: {
          following_user_id: userId,
          followed_user_id: targetUserId,
        },
      });

      // 상대방 정보 가져오기
      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!sender || !targetUser) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 알림 메시지 생성 및 전송
      const message = `${sender.nickname}님이 회원님을 팔로우하기 시작했습니다.`;
      const notificationData = {
        message,
        senderNickname: sender.nickname,
        senderProfileUrl: sender.profile_url,
        type: 'follow',
      };

      // 알림 생성
      await this.notificationsService.createNotification(
        targetUserId,
        userId,
        notificationData.type,
        notificationData.message
      );

      // SSE를 통해 실시간 알림 전송
      this.notificationsService.sendRealTimeNotification(
        targetUserId,
        notificationData
      );

      return {
        message: { code: 200, text: '팔로우 성공' },
        isFollowing: true,
      };
    }
  }
}
