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
        user: true,
        Tags: true,
      },
      take: limit,
    });

    return result;
  }
}
