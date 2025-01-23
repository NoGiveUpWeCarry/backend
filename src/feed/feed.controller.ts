import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalAuthGuard } from '@src/modules/auth/guards/optional-auth.guard';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { FeedDto } from './dto/feed.dto';
import { CommentDto } from './dto/comment.dto';
import { GetFeedsQueryDto } from './dto/getFeedsQuery.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}
  // 메인 페이지 조회
  @Get()
  @UseGuards(OptionalAuthGuard)
  async getAllFeed(@Req() req, @Query() queryDto: GetFeedsQueryDto) {
    return this.feedService.getAllFeeds(req.user, queryDto);
  }

  // 태그 데이터 조회
  @Get('/tags')
  async getTags() {
    return this.feedService.getTags();
  }

  // 위클리 베스트 컨텐츠
  @Get('/weekly')
  async getWeeklyBest() {
    return this.feedService.getWeeklyBest();
  }

  // 피드 조회 (게시글)
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getFeed(@Param('id') feedId: number, @Req() req) {
    return await this.feedService.getFeed(feedId, req.user);
  }

  // 피드 조회 (댓글)
  @Get(':id/comments')
  @UseGuards(OptionalAuthGuard)
  async getFeedComments(@Param('id') feedId: number, @Req() req) {
    return await this.feedService.getFeedComments(feedId, req.user);
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
  async createFeed(@Req() req, @Body() feedDto: FeedDto) {
    const userId = req.user.user_id;
    return this.feedService.createFeed(feedDto, userId);
  }

  // 피드 수정
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateFeed(
    @Req() req,
    @Body() feedDto: FeedDto,
    @Param('id') feedId: number
  ) {
    const userId = req.user.user_id;
    return this.feedService.updateFeed(feedDto, feedId, userId);
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
    @Body() commentDto: CommentDto
  ) {
    const userId = req.user.user_id;
    return this.feedService.createComment(userId, feedId, commentDto);
  }

  // 댓글 수정
  @Put(':id/comment/:commentId')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Req() req,
    @Param('id') feedId: number,
    @Param('commentId') commentId: number,
    @Body() commentDto: CommentDto
  ) {
    const userId = req.user.user_id;
    return await this.feedService.updateComment(
      userId,
      feedId,
      commentId,
      commentDto
    );
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

  @Post('comment/:id')
  @UseGuards(JwtAuthGuard)
  async handleCommentLikes(@Req() req, @Param('id') commentId: number) {
    const userId = req.user.user_id;
    return await this.feedService.handleCommentLikes(userId, commentId);
  }

  // 이미지 업로드
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  async func(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.user_id;
    return await this.feedService.uploadFeedImage(userId, file);
  }
}
