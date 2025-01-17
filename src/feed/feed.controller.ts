import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalAuthGuard } from '@src/modules/auth/guards/optional-auth.guard';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}
  // 메인 페이지 조회
  @Get()
  @UseGuards(OptionalAuthGuard)
  async getAllFeed(@Req() req, @Query('latest') latest: boolean) {
    return this.feedService.getAllFeeds(req.user, latest);
  }

  // 피드 조회 (게시글)
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getFeed(@Param('id') feedId: number, @Req() req) {
    return await this.feedService.getFeed(feedId, req.user);
  }

  // 피드 조회 (댓글)
  @Get(':id/comments')
  async getFeedComments(@Param('id') feedId: number) {
    return await this.feedService.getFeedComments(feedId);
  }

  // 좋아요 추가/ 제거
  @Post(':id/likes')
  @UseGuards(JwtAuthGuard)
  async handleFeedLikes(@Req() req, @Param('id') feedId: number) {
    const userId = req.user.user_id;
    return await this.feedService.handleFeedLikes(feedId, userId);
  }

  // 피드 등록
  @Post()
  @UseGuards(JwtAuthGuard)
  async createFeed(@Req() req, @Body() createPostDto: CreatePostDto) {
    const userId = req.user.user_id;
    return this.feedService.createFeed(createPostDto, userId);
  }

  // 피드 삭제
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteFeed(@Req() req, @Param('id') feedId: number) {
    const userId = req.user.user_id;
    return this.feedService.deleteFeed(userId, feedId);
  }

  // 댓글 등록
  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Req() req,
    @Param('id') feedId: number,
    @Body() comment
  ) {
    const userId = req.user.user_id;
    return this.feedService.createComment(userId, feedId, comment.content);
  }

  // 댓글 삭제
  @Delete(':id/comment/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Req() req,
    @Param('id') feedId: number,
    @Param('commentId') commentId: number
  ) {
    const userId = req.user.user_id;
    return this.feedService.deleteComment(userId, feedId, commentId);
  }
}
