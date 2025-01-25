import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}
  // 모달 검색 핸들러
  async handleModalSearch(keyword: string, category: string) {
    let result;
    const limit = 4;

    // category 값에 따라 응답데이터 변경
    switch (category) {
      case 'all':
        result = {
          feed: await this.feedResultModal(
            await this.searchFeed(keyword, limit)
          ),

          projects: await this.connectionhubResultModal(
            await this.searchConnectionhub(keyword, limit)
          ),
        };
        break;
      case 'feed':
        result = {
          feeds: await this.feedResultModal(
            await this.searchFeed(keyword, limit)
          ),
        };
        break;
      case 'connectionhub':
        result = {
          projects: await this.connectionhubResultModal(
            await this.searchConnectionhub(keyword, limit)
          ),
        };
    }
    result.messgae = { code: 200, text: '검색 결과 조회에 성공했습니다.' };
    return result;
  }

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
    if (!result.length) return '검색 결과가 없습니다.';
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

  // 커넥션허브 검색결과 조회
  async searchConnectionhub(keyword: string, limit: number) {
    const result = await this.prisma.projectPost.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
          {
            Tags: {
              some: {
                tag: { name: { contains: keyword } },
              },
            },
          },
          {
            Details: {
              some: {
                detail_role: {
                  name: { contains: keyword },
                },
              },
            },
          },
        ],
      },
      include: {
        Tags: { select: { tag: { select: { name: true } } } },
        Details: { select: { detail_role: { select: { name: true } } } },
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profile_url: true,
            role: { select: { name: true } },
          },
        },
      },
      take: limit,
    });

    return result;
  }

  // 모달 커넥션허브 검색결과 데이터
  async connectionhubResultModal(result) {
    if (!result.length) return '검색 결과가 없습니다.';
    const projects = result.map(res => ({
      userId: res.user.id,
      userName: res.user.name,
      userNickname: res.user.nickname,
      userProfileUrl: res.user.profile_url,
      userRole: res.user.role.name,
      projectId: res.id,
      title: res.title,
      role: res.role,
      detailRoles: res.Details.map(v => v.detail_role.name),
      tags: res.Tags.map(v => v.tag.name),
      startDate: res.start_date,
      duration: res.duration,
      hubType: res.hub_type,
      workType: res.work_type,
    }));

    return projects;
  }
}
