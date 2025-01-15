import { Controller, Get } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}
  @Get()
  // 메인 페이지 조회
  async getAllFeed() {
    return this.feedService.getAllFeeds();
  }
}
