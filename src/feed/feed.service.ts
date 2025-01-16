import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}
  /** 피드 전체 조회 / 남은 구현 과제
   * 최신순 정렬
   * 예외 처리
   **/
  async getAllFeeds(user) {
    try {
      const userId = user ? user.user_id : 0;

      const result = await this.prisma.feedPost.findMany({
        include: {
          Likes: {
            where: { user_id: userId },
          },
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
        // 인기순 정렬 : 좋아요 순
        orderBy: { like_count: 'desc' },
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
        liked: !!post.Likes.length,
      }));

      return { posts };
      // return result;
    } catch (err) {
      return err;
    }
  }

  /** 피드 조회 (게시글 부분) / 남은 구현 과제
   * 예외 처리
   **/
  async getFeed(feedId, user) {
    const userId = user ? user.user_id : 0;
    const result = await this.prisma.feedPost.findUnique({
      where: { id: feedId },
      include: {
        Likes: {
          where: { user_id: userId },
        },
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
      Liked: !!result.Likes.length,
    };
    return { post };
  }

  async getFeedComments(feedId) {
    const result = await this.prisma.feedComment.findMany({
      where: {
        post_id: feedId,
      },
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
      },
    });

    const comments = result.map(c => ({
      commentId: c.id,
      userId: c.user.id,
      userName: c.user.name,
      userRole: c.user.role.name,
      userProfileUrl: c.user.profile_url,
      comment: c.content,
      createdAt: c.created_at,
    }));

    return { comments };
  }

  // 게시글 좋아요 추가/제거
  async handlePostLikes(feedId, userId) {
    try {
      const exist = await this.prisma.feedLike.findMany({
        where: {
          post_id: feedId,
          user_id: userId,
        },
      });

      if (exist.length) {
        await this.prisma.feedLike.deleteMany({
          where: {
            post_id: feedId,
            user_id: userId,
          },
        });

        await this.prisma.feedPost.update({
          where: { id: feedId },
          data: { like_count: { decrement: 1 } },
        });

        return { message: '좋아요 취소 ' };
      } else {
        await this.prisma.feedLike.create({
          data: {
            post_id: feedId,
            user_id: userId,
          },
        });

        await this.prisma.feedPost.update({
          where: { id: feedId },
          data: { like_count: { increment: 1 } },
        });

        return { message: '좋아요 추가 ' };
      }
    } catch (err) {
      return err;
    }
  }
}
