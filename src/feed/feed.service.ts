import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}
  /** 피드 전체 조회 / 남은 구현 과제
   * 유저 토큰 제공 시 좋아요 여부
   * 인기순 정렬
   * 예외 처리
   **/
  async getAllFeeds() {
    try {
      const result = await this.prisma.feedPost.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: { name: true },
              },
              profile_url: true,
            },
          },
          Tags: {
            select: {
              tag: {
                select: { name: true },
              },
            },
          },
        },
      });

      const posts = result.map(post => ({
        userId: post.user.id,
        userName: post.user.name,
        userRole: post.user.role.name,
        userProfileUrl: post.user.profile_url,
        title: post.title,
        postId: post.id,
        thumnailUrl: post.thumbnail_url,
        content: post.content,
        tags: post.Tags.map(v => v.tag.name),
        commentCount: post.comment_count,
        likeCount: post.like_count,
        viewCount: post.view,
        createdAt: post.created_at,
      }));

      return { posts };
    } catch (err) {
      return err;
    }
  }

  /** 피드 조회 (게시글 부분) / 남은 구현 과제
   * 유저 토큰 제공 시 좋아요 여부
   * 예외 처리
   **/
  async getFeed(feedId) {
    const result = await this.prisma.feedPost.findUnique({
      where: { id: feedId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: { name: true },
            },
            profile_url: true,
          },
        },
        Tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    const post = {
      userId: result.user.id,
      userName: result.user.name,
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
    };
    return { post };
  }
}
