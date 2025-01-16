import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import * as cheerio from 'cheerio';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}
  /** 피드 전체 조회 / 남은 구현 과제
   * 최신순 정렬
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
    } catch (err) {
      console.log(err);
      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 피드 조회 (게시글 부분)
  async getFeed(feedId, user) {
    try {
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

      if (!result) {
        throw new HttpException(
          '게시글을 찾을 수 없습니다',
          HttpStatus.NOT_FOUND
        );
      }

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
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 피드 개별 조회 (댓글)
  async getFeedComments(feedId) {
    try {
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

      if (!result.length) {
        throw new HttpException(
          '게시글을 찾을 수 없습니다',
          HttpStatus.NOT_FOUND
        );
      }

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
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 피드 좋아요 추가/제거
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
      console.log(err);
      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 피드 등록
  async createPost(createPostDto: CreatePostDto, userId: number) {
    const { title, tags, content } = createPostDto;
    try {
      // 썸네일 url 추출
      const thumnailUrl = await this.getThumnailUrl(content);

      // FeedPost에 피드 데이터 저장
      const feedData = await this.prisma.feedPost.create({
        data: {
          user_id: userId,
          title,
          content,
          thumbnail_url: thumnailUrl,
        },
      });

      // 태그 이름으로 태그 id 조회
      const tagIds = await this.prisma.feedTag.findMany({
        where: { name: { in: tags } },
        select: { id: true },
      });

      // 태그 데이터 양식화 {post_id, tag_id}
      const tagData = tagIds.map(tag => ({
        post_id: feedData.id,
        tag_id: tag.id,
      }));

      // 태그 데이터 저장
      await this.prisma.feedPostTag.createMany({
        data: tagData,
      });

      return { success: true, message: '게시글 작성이 완료되었습니다.' };
    } catch (err) {
      throw err;
    }
  }

  async getThumnailUrl(text) {
    try {
      const $ = cheerio.load(text);
      const thumnailUrl = $('img').first().attr('src');
      return thumnailUrl;
    } catch (err) {
      throw err;
    }
  }
}
