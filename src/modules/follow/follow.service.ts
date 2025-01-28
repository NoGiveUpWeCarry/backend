import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

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

      return {
        message: { code: 200, text: '팔로우 성공' },
        isFollowing: true,
      };
    }
  }
}
