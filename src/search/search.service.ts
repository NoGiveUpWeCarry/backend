import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  // 피드 검색결과 조회
  async searchFeed(keyword: string, limit: number) {
    const result = await this.prisma.feedPost.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profile_url: true,
            role: { select: { name: true } },
          },
        },
        Tags: { select: { tag: { select: { name: true } } } },
      },
      take: limit,
    });

    return result;
  }

  // 모달 피드 검색결과 데이터
  async feedResultModal(result) {
    const feeds = result.map(res => ({
      userId: res.user.id,
      userName: res.user.name,
      userNickname: res.user.nickname,
      userProfileUrl: res.user.profile_url,
      userRole: res.user.role.name,
      feedId: res.id,
      title: res.title,
      tags: res.Tags.map(v => v.tag.name),
      createdAt: res.created_at,
    }));

    return feeds;
  }
}
