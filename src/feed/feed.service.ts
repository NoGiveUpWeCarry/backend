import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { FeedDto } from './dto/feed.dto';
import * as cheerio from 'cheerio';
import { CommentDto } from './dto/comment.dto';
import { GetFeedsQueryDto } from './dto/getFeedsQuery.dto';
import { S3Service } from '@src/s3/s3.service';
import * as dayjs from 'dayjs';
import { NotificationsService } from '@src/modules/notification/notification.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly notificationsService: NotificationsService
  ) {}

  // 피드 전체 조회
  async getAllFeeds(user, queryDto: GetFeedsQueryDto) {
    try {
      const userId = user ? user.user_id : 0;
      const { latest = false, limit = 10, cursor = 0, tags } = queryDto;

      // 쿼리로 전달받은 태그
      const tagIds = tags ? tags.split(',').map(id => parseInt(id)) : [];

      // 태그를 포함하고 있는 피드 아이디 조회
      const feedTagIds = tagIds?.length
        ? (
            await this.prisma.feedPostTag.groupBy({
              by: ['post_id'],
              where: { tag_id: { in: tagIds } },
              having: {
                post_id: { _count: { equals: tagIds.length } }, // 태그 개수 일치하는 게시글만 조회
              },
            })
          ).map(p => p.post_id)
        : null;

      // 쿼리값이 인기순이면 따로 처리
      if (!latest) {
        return this.getPopularFeed(userId, limit, cursor, feedTagIds);
      }

      const result = await this.prisma.feedPost.findMany({
        orderBy: { id: 'desc' },
        where: {
          ...(cursor ? { id: { lt: cursor } } : {}), // cursor 조건 추가 (옵셔널)
          ...(feedTagIds ? { id: { in: feedTagIds } } : {}), // 태그 조건 추가 (옵셔널)
        },

        take: limit,

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

      const posts = [];
      for (const res of result) {
        const post = await this.getPostObj(res);
        posts.push(post);
      }

      // 라스트 커서
      const lastCursor = posts[posts.length - 1]?.postId || null;

      return {
        posts,
        pagination: { lastCursor },
        message: { code: 200, text: '전체 피드를 정상적으로 조회했습니다.' },
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 인기 피드 조회 (좋아요 순)
  async getPopularFeed(
    userId: number,
    limit: number,
    cursor: number,
    feedTagIds
  ) {
    try {
      const result = await this.prisma.feedPost.findMany({
        orderBy: [{ like_count: 'desc' }, { view: 'desc' }],
        where: {
          ...(feedTagIds ? { id: { in: feedTagIds } } : {}), // 태그 조건 추가 (옵셔널)
        },
        skip: cursor * limit,
        take: limit,
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

      const posts = [];
      for (const res of result) {
        const post = await this.getPostObj(res);
        posts.push(post);
      }

      let lastCursor;
      if (result.length) {
        lastCursor = cursor + 1;
      } else {
        lastCursor = null;
      }

      return {
        posts,
        pagination: { lastCursor },
        message: { code: 200, text: '전체 피드를 정상적으로 조회했습니다.' },
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
  async getFeed(feedId: number, user) {
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

      // 조회수 증가
      await this.prisma.feedPost.update({
        where: { id: feedId },
        data: { view: { increment: 1 } },
      });

      return {
        post,
        message: { code: 200, text: '개별 피드를 정상적으로 조회했습니다.' },
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
  async getFeedComments(feedId: number, user) {
    try {
      const userId = user ? user.user_id : 0;

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
          FeedCommentLikes: true,
        },
      });

      if (!result.length) {
        return {
          comments: [],
          message: {
            code: 200,
            text: '개별 피드(댓글)를 정상적으로 조회했습니다.',
          },
        };
      }

      const comments = result.map(c => ({
        commentId: c.id,
        userId: c.user.id,
        userName: c.user.name,
        userRole: c.user.role.name,
        userProfileUrl: c.user.profile_url,
        comment: c.content,
        likeCount: c.FeedCommentLikes.length,
        createdAt: c.created_at,
        isLiked: userId
          ? !!c.FeedCommentLikes.filter(v => v.user_id == userId).length
          : false,
      }));

      return {
        comments,
        message: {
          code: 200,
          text: '개별 피드(댓글)를 정상적으로 조회했습니다.',
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
  async handleFeedLikes(feedId: number, userId: number) {
    try {
      const exist = await this.prisma.feedLike.findMany({
        where: {
          post_id: feedId,
          user_id: userId,
        },
      });

      if (exist.length) {
        // 좋아요 취소
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

        return { message: { code: 200, text: '좋아요가 취소되었습니다.' } };
      } else {
        // 좋아요 추가
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

        // 피드 작성자 정보 가져오기
        const feed = await this.prisma.feedPost.findUnique({
          where: { id: feedId },
          include: { user: true }, // 작성자 정보 포함
        });

        if (!feed) {
          throw new HttpException(
            '피드를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND
          );
        }

        // 본인이 작성한 피드가 아닌 경우 알림 생성
        if (feed.user_id !== userId) {
          const sender = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { nickname: true, profile_url: true },
          });

          if (!sender) {
            throw new HttpException(
              '보낸 사람 정보를 찾을 수 없습니다.',
              HttpStatus.NOT_FOUND
            );
          }

          const message = `${sender.nickname}님이 회원님의 피드를 좋아합니다.`;

          // 알림 생성 및 notificationId 받기
          const createdNotification =
            await this.notificationsService.createNotification(
              feed.user_id, // 피드 작성자 ID
              userId, // 좋아요 누른 사용자 ID
              'like',
              message
            );

          // 생성된 알림의 notificationId를 포함하여 실시간 알림 전송
          this.notificationsService.sendRealTimeNotification(feed.user_id, {
            notificationId: createdNotification.notificationId, // 알림 ID 추가
            type: 'like',
            message,
            senderNickname: sender.nickname,
            senderProfileUrl: sender.profile_url,
          });
        }

        return { message: { code: 200, text: '좋아요가 추가되었습니다.' } };
      }
    } catch (err) {
      console.error(err);
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
        message: { code: 201, text: '피드 작성이 완료되었습니다.' },
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

      return { message: { code: 200, text: '피드 수정이 완료되었습니다.' } };
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
  async deleteFeed(userId: number, feedId: number) {
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

      return { message: { code: 200, text: '피드가 삭제되었습니다.' } };
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
  async getThumnailUrl(text: string) {
    try {
      const $ = cheerio.load(text);
      const thumnailUrl = $('img').first().attr('src');
      return thumnailUrl;
    } catch (err) {
      throw err;
    }
  }

  // 댓글 등록
  async createComment(userId: number, feedId: number, commentDto: CommentDto) {
    try {
      const content = commentDto.content;

      // 댓글 생성
      await this.prisma.feedComment.create({
        data: {
          user_id: userId,
          post_id: feedId,
          content,
        },
      });

      // 피드 댓글 카운트 증가
      await this.prisma.feedPost.update({
        where: { id: feedId },
        data: { comment_count: { increment: 1 } },
      });

      // 피드 작성자 정보 가져오기
      const feed = await this.prisma.feedPost.findUnique({
        where: { id: feedId },
        include: { user: true }, // 작성자 정보 포함
      });

      if (!feed) {
        throw new HttpException(
          '피드를 찾을 수 없습니다.',
          HttpStatus.NOT_FOUND
        );
      }

      // 피드 작성자가 댓글 작성자가 아닌 경우 알림 생성
      if (feed.user_id !== userId) {
        const sender = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { nickname: true, profile_url: true },
        });

        if (!sender) {
          throw new HttpException(
            '보낸 사람 정보를 찾을 수 없습니다.',
            HttpStatus.NOT_FOUND
          );
        }

        const message = `${sender.nickname}님이 회원님의 피드에 댓글을 남겼습니다.`;

        // 알림 생성 및 notificationId 받기
        const createdNotification =
          await this.notificationsService.createNotification(
            feed.user_id, // 피드 작성자 ID
            userId, // 댓글 작성자 ID
            'comment',
            message
          );

        // 생성된 알림 ID를 포함하여 실시간 알림 전송
        this.notificationsService.sendRealTimeNotification(feed.user_id, {
          notificationId: createdNotification.notificationId, // 알림 ID 추가
          type: 'comment',
          message,
          senderNickname: sender.nickname,
          senderProfileUrl: sender.profile_url,
        });
      }

      return { message: { code: 201, text: '댓글 등록이 완료되었습니다.' } };
    } catch (err) {
      console.error('댓글 등록 중 오류:', err.message);
      throw new HttpException(
        '서버에서 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 댓글 삭제
  async deleteComment(userId: number, feedId: number, commentId: number) {
    try {
      // 권한 확인
      const auth = await this.commentAuth(userId, feedId, commentId);

      if (!auth) {
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
      return { message: { code: 200, text: '댓글이 삭제되었습니다.' } };
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

  // 댓글 수정
  async updateComment(
    userId: number,
    feedId: number,
    commentId: number,
    commentDto: CommentDto
  ) {
    // 권한 확인
    const auth = await this.commentAuth(userId, feedId, commentId);

    if (!auth) {
      throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    const content = commentDto.content;
    await this.prisma.feedComment.update({
      where: { id: commentId },
      data: { content },
    });

    return { message: { code: 200, text: '댓글 수정이 완료되었습니다.' } };
  }

  // 댓글 좋아요 추가/제거
  async handleCommentLikes(userId: number, commentId: number) {
    // 좋아요 여부 확인
    const exist = await this.prisma.feedCommentLikes.findMany({
      where: { user_id: userId, comment_id: commentId },
    });

    if (exist.length) {
      // 있을 시 좋아요 제거
      await this.prisma.feedCommentLikes.deleteMany({
        where: { user_id: userId, comment_id: commentId },
      });

      return { message: { code: 200, text: '좋아요가 취소되었습니다.' } };
    } else {
      // 없을 시 좋아요 추가
      await this.prisma.feedCommentLikes.create({
        data: { user_id: userId, comment_id: commentId },
      });
      return { message: { code: 200, text: '좋아요가 추가되었습니다.' } };
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

  // 댓글 권한 확인
  async commentAuth(userId: number, feedId: number, commentId: number) {
    const auth = await this.prisma.feedComment.findUnique({
      where: { id: commentId },
      select: { user_id: true, post_id: true },
    });

    if (feedId !== auth.post_id) {
      throw new HttpException('잘못된 요청입니다', HttpStatus.BAD_REQUEST);
    }

    return auth.user_id == userId;
  }

  // 이미지 업로드
  async uploadFeedImage(userId: number, file: Express.Multer.File) {
    const fileType = file.mimetype.split('/')[1];
    const imageUrl = await this.s3.uploadImage(
      8,
      file.buffer,
      fileType,
      'pad_feed/images'
    );

    return {
      imageUrl,
      message: { code: 200, text: '이미지 업로드가 완료되었습니다.' },
    };
  }

  async getTags() {
    const tags = await this.prisma.feedTag.findMany();

    return {
      tags,
      message: { code: 200, text: '태그가 성공적으로 조회되었습니다.' },
    };
  }

  async getWeeklyBest() {
    // 현재 날짜
    const now = dayjs();
    // 이번주 시작(일요일)
    const start = now.startOf('week').toDate();
    // 이번주 끝(토요일)
    const end = now.endOf('week').toDate();

    const result = await this.prisma.feedPost.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
      },
      // 1순위 좋아요 수, 2순위 조회수
      orderBy: [{ like_count: 'desc' }, { view: 'desc' }],
      select: {
        id: true,
        title: true,
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
      take: 5,
    });

    const contents = result.map(res => ({
      postId: res.id,
      title: res.title,
      userId: res.user.id,
      userName: res.user.name,
      userNickname: res.user.nickname,
      userProfileUrl: res.user.profile_url,
      userRole: res.user.role.name,
    }));

    return {
      contents,
      message: { code: 200, text: '성공적으로 조회되었습니다.' },
    };
  }
}
