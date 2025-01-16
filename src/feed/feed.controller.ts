import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalAuthGuard } from '@src/modules/auth/guards/optional-auth.guard';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}
  // 메인 페이지 조회
  @Get()
  @UseGuards(OptionalAuthGuard)
  async getAllFeed(@Req() req) {
    return this.feedService.getAllFeeds();
  }

  // 피드 조회 (게시글)
  @Get(':id')
  async getFeed(@Param('id') feedId: number) {
    return await this.feedService.getFeed(+feedId);
  }

  // 피드 조회 (댓글)
  @Get(':id/comments')
  async getFeedComments(@Param('id') feedId: number) {
    return await this.feedService.getFeedComments(+feedId);
  }

  // 좋아요 추가/ 제거
  @Post(':id/likes')
  @UseGuards(JwtAuthGuard)
  async handleFeedLikes(@Req() req, @Param('id') feedId: number) {
    const userId = req.user.user_id;
    return await this.feedService.handlePostLikes(feedId, userId);
  }
}
