import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
//import { NotificationsService } from '@modules/notification/notification.service';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
   //private readonly notificationsService: NotificationsService
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

      // 알림 생성 및 SSE 전송
      //     const message = `사용자 ${userId}님이 당신을 팔로우하기 시작했습니다.`;
      //     await this.notificationsService.sendRealTimeNotification(
      //       targetUserId,
      //       { type: 'follow', message },
      //       this.notificationsService.notifications$ // SSE 스트림
      //     );
      //     return {
      //       message: { code: 200, text: '팔로우 성공' },
      //       isFollowing: true,
      //     };
      //   }
      // }
    }
  }
}
