import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { FeedDto } from './dto/feed.dto';
import * as cheerio from 'cheerio';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  // 피드 전체 조회
  async getAllFeeds(user, latest) {
    try {
      const userId = user ? user.user_id : 0;

      const orderKey = latest ? 'created_at' : 'like_count';

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
              nickname: true,
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
        orderBy: { [orderKey]: 'desc' },
      });

      const posts = [];
      for (const res of result) {
        const post = await this.getPostObj(res);
        posts.push(post);
      }
      return {
        posts,
        message: { code: 200, message: '전체 피드를 정상적으로 조회했습니다.' },
      };
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
              nickname: true,
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

      const post = await this.getPostObj(result);

      return {
        post,
        message: { code: 200, message: '개별 피드를 정상적으로 조회했습니다.' },
      };
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

  // 피드 데이터 응답 양식
  async getPostObj(result) {
    const post = {
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
    };
    return post;
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

      return {
        comments,
        message: {
          code: 200,
          message: '개별 피드(댓글)를 정상적으로 조회했습니다.',
        },
      };
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
  async handleFeedLikes(feedId, userId) {
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

        return { message: { code: 200, message: '좋아요가 취소되었습니다.' } };
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

        return { message: { code: 200, message: '좋아요가 추가되었습니다.' } };
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
  async createFeed(feedDto: FeedDto, userId: number) {
    const { title, tags, content } = feedDto;
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

      return {
        message: { code: 201, message: '피드 작성이 완료되었습니다.' },
        post: { id: feedData.id },
      };
    } catch (err) {
      throw err;
    }
  }

  // 피드 수정
  async updateFeed(feedDto: FeedDto, feedId: number, userId: number) {
    try {
      const { title, tags, content } = feedDto;

      const thumnailUrl = (await this.getThumnailUrl(content)) || null;

      // 권한 확인
      const auth = await this.feedAuth(userId, feedId);

      if (!auth) {
        throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
      }

      // 태그 이름으로 태그 id 조회
      const tagIds = await this.prisma.feedTag.findMany({
        where: { name: { in: tags } },
        select: { id: true },
      });

      const tagData = tagIds.map(tag => ({
        post_id: feedId,
        tag_id: tag.id,
      }));

      await this.prisma.feedPost.update({
        where: { id: feedId },
        data: {
          title,
          content,
          thumbnail_url: thumnailUrl,
          Tags: {
            deleteMany: {},

            create: tagData.map(tag => ({ tag_id: tag.tag_id })),
          },
        },
      });

      return { message: { code: 200, message: '피드 수정이 완료되었습니다.' } };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 피드 삭제
  async deleteFeed(userId, feedId) {
    try {
      // 권한 확인
      const auth = await this.feedAuth(userId, feedId);

      if (!auth) {
        throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
      }

      // 트랜잭션으로 한번에 처리
      // 태그(매핑 테이블), 댓글, 좋아요(매핑 테이블), 게시글 삭제
      await this.prisma.$transaction([
        this.prisma.feedPostTag.deleteMany({
          where: { post_id: feedId },
        }),

        this.prisma.feedComment.deleteMany({
          where: { post_id: feedId },
        }),

        this.prisma.feedLike.deleteMany({
          where: { post_id: feedId },
        }),

        this.prisma.feedPost.delete({
          where: { id: feedId },
        }),
      ]);

      return { message: { code: 200, message: '피드가 삭제되었습니다.' } };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 썸네일 추출
  async getThumnailUrl(text) {
    try {
      const $ = cheerio.load(text);
      const thumnailUrl = $('img').first().attr('src');
      return thumnailUrl;
    } catch (err) {
      throw err;
    }
  }

  // 댓글 등록
  async createComment(userId, feedId, content) {
    try {
      // 댓글 데이터 저장
      await this.prisma.feedComment.create({
        data: {
          user_id: userId,
          post_id: feedId,
          content: content,
        },
      });

      // 피드 댓글 카운트 증가
      await this.prisma.feedPost.update({
        where: { id: feedId },
        data: { comment_count: { increment: 1 } },
      });

      return { message: { code: 201, message: '댓글 등록이 완료되었습니다.' } };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 댓글 삭제
  async deleteComment(userId, feedId, commentId) {
    try {
      // 권한 확인
      const auth = await this.prisma.feedComment.findUnique({
        where: { id: commentId },
        select: { user_id: true, post_id: true },
      });

      // 권한 예외 처리
      if (!auth) {
        throw new HttpException(
          '게시글을 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND
        );
      }

      if (feedId !== auth.post_id) {
        throw new HttpException('잘못된 요청입니다', HttpStatus.BAD_REQUEST);
      }

      if (userId !== auth.user_id) {
        throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
      }

      await this.prisma.$transaction([
        // 댓글 삭제
        this.prisma.feedComment.delete({
          where: { id: commentId },
        }),
        // 피드 댓글 수 감소
        this.prisma.feedPost.update({
          where: { id: feedId },
          data: { comment_count: { decrement: 1 } },
        }),
      ]);
      return { message: { code: 200, message: '댓글이 삭제되었습니다.' } };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 게시글 권한 확인
  async feedAuth(userId: number, feedId: number) {
    const auth = await this.prisma.feedPost.findUnique({
      where: { id: feedId },
      select: { user_id: true },
    });

    return auth.user_id === userId;
  }
}
