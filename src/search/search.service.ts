import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}
  // 모달 검색 핸들러
  async handleModalSearch(user, keyword: string, category: string) {
    const userId = user ? user.user_id : 0;

    let result;
    const limit = 4;

    // category 값에 따라 응답데이터 변경
    switch (category) {
      case 'all':
        result = {
          feedResult: await this.feedResultModal(
            await this.searchFeed(userId, keyword, limit, 0)
          ),

          projectResult: await this.connectionhubResultModal(
            await this.searchConnectionhub(userId, keyword, limit, 0)
          ),
        };
        break;
      case 'feed':
        result = {
          feedResult: await this.feedResultModal(
            await this.searchFeed(userId, keyword, limit, 0)
          ),
          projectResult: { projects: [], hasMore: false },
        };
        break;
      case 'connectionhub':
        result = {
          feedResult: { feeds: [], hasMore: false },
          projectResult: await this.connectionhubResultModal(
            await this.searchConnectionhub(userId, keyword, limit, 0)
          ),
        };
    }
    result.messgae = { code: 200, text: '검색 결과 조회에 성공했습니다.' };
    return result;
  }

  // 피드 페이지 검색 핸들러
  async handleFeedPageSearch(user, keyword: string, cursor: number) {
    const userId = user ? user.user_id : 0;
    const limit = 10;
    const posts = await this.feedResultPage(
      await this.searchFeed(userId, keyword, limit, 0)
    );

    return { posts };
  }

  // 피드 검색결과 조회
  async searchFeed(
    userId: number,
    keyword: string,
    limit: number,
    cursor: number
  ) {
    const result = await this.prisma.feedPost.findMany({
      where: {
        ...(cursor ? { id: { lt: cursor } } : {}),
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
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
        Likes: { where: { user_id: userId } },
      },
    });
    return result;
  }

  // 모달 피드 검색결과 데이터
  async feedResultModal(result) {
    const hasMore = result.length == 5;
    if (hasMore) result = result.slice(0, 4);
    if (!result.length) return { feeds: [], hasMore };
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

    return { feeds, hasMore };
  }

  // 페이지 피드 검색결과 데이터
  async feedResultPage(result) {
    const feeds = result.map(result => ({
      userId: result.user.id,
      userName: result.user.name,
      userNickname: result.user.nickname,
      userRole: result.user.role.name,
      userProfileUrl: result.user.profile_url,
      title: result.title,
      postId: result.id,
      thumnailUrl: result.thumbnail_url,
      content: result.content,
      tags: result.Tags.map(v => v.tag.name),
      commentCount: result.comment_count,
      likeCount: result.like_count,
      viewCount: result.view,
      createdAt: result.created_at,
      isLiked: !!result.Likes.length,
    }));

    return feeds;
  }

  // 커넥션허브 검색결과 조회
  async searchConnectionhub(
    userId: number,
    keyword: string,
    limit: number,
    cursor: number
  ) {
    const result = await this.prisma.projectPost.findMany({
      where: {
        ...(cursor ? { id: { lt: cursor } } : {}),
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
      orderBy: { id: 'desc' },
      take: limit + 1,
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
        Saves: { where: { user_id: userId } },
      },
    });

    return result;
  }

  // 모달 커넥션허브 검색결과 데이터
  async connectionhubResultModal(result) {
    const hasMore = result.length == 5;
    if (hasMore) result = result.slice(0, 4);
    if (!result.length) return { projects: [], hasMore };
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
      skills: res.Tags.map(v => v.tag.name),
      startDate: res.start_date,
      duration: res.duration,
      hubType: res.hub_type,
      workType: res.work_type,
    }));

    return { projects, hasMore };
  }

  // 페이지 커넥션허브 검색결과 데이터
  async connectionhubResultPage(result) {
    const projects = result.map(res => ({
      userId: res.user.id,
      userName: res.user.name,
      userNickname: res.user.nickname,
      userProfileUrl: res.user.profile_url,
      userRole: res.user.role.name,
      projectId: res.id,
      title: res.title,
      content: res.content,
      thumbnailUrl: res.thumbnail_url,
      role: res.role,
      skills: res.Tags.map(tag => `${tag.tag.name}`),
      detailRoles: res.Details.map(d => `${d.detail_role.name}`),
      hubType: res.hub_type,
      startDate: res.start_date.toISOString().split('T')[0],
      duration: res.duration,
      workType: res.work_type,
      applyCount: res.applicant_count,
      bookMarkCount: res.saved_count,
      viewCount: res.view + 1,
      status: res.recruiting ? 'OPEN' : 'CLOSED',
      isMarked: res.Saves.length,
    }));
    return { projects };
  }
}
