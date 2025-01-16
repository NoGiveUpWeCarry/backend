import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalAuthGuard } from '@src/modules/auth/guards/optional-auth.guard';

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

  @Get(':id/comments')
  async getFeedComments(@Param('id') feedId: number) {
    return await this.feedService.getFeedComments(+feedId);
  }
}
