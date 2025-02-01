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
import {
  createCommentDocs,
  createFeedDocs,
  deleteCommentDocs,
  deleteFeedDocs,
  getFeedCommentDocs,
  getFeedDocs,
  getMainPageDocs,
  getTagsDoc,
  getWeeklyBestDocs,
  handleCommentLikesDocs,
  handleFeedLikesDocs,
  updateCommentDocs,
  updateFeedDocs,
  uploadImageDocs,
} from './docs/feed.docs';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}
  // 메인 페이지 조회
  @Get()
  @getMainPageDocs.ApiOperation
  @getMainPageDocs.ApiQuery
  @getMainPageDocs.ApiQuery2
  @getMainPageDocs.ApiQuery3
  @getMainPageDocs.ApiResponse
  @UseGuards(OptionalAuthGuard)
  async getAllFeed(@Req() req, @Query() queryDto: GetFeedsQueryDto) {
    return this.feedService.getAllFeeds(req.user, queryDto);
  }

  // 태그 데이터 조회
  @Get('/tags')
  @getTagsDoc.ApiOperation
  @getTagsDoc.ApiResponse
  async getTags() {
    return this.feedService.getTags();
  }

  // 위클리 베스트 컨텐츠
  @Get('/weekly')
  @getWeeklyBestDocs.ApiOperation
  @getWeeklyBestDocs.ApiResponse
  async getWeeklyBest() {
    return this.feedService.getWeeklyBest();
  }

  // 피드 조회 (게시글)
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  @getFeedDocs.ApiOperation
  @getFeedDocs.ApiParam
  @getFeedDocs.ApiResponse
  async getFeed(@Param('id') feedId: number, @Req() req) {
    return await this.feedService.getFeed(feedId, req.user);
  }

  // 피드 조회 (댓글)
  @Get(':id/comments')
  @UseGuards(OptionalAuthGuard)
  @getFeedCommentDocs.ApiOperation
  @getFeedCommentDocs.ApiParam
  @getFeedCommentDocs.ApiResponse
  async getFeedComments(@Param('id') feedId: number, @Req() req) {
    return await this.feedService.getFeedComments(feedId, req.user);
  }

  // 좋아요 추가/ 제거
  @Post(':id/likes')
  @UseGuards(JwtAuthGuard)
  @handleFeedLikesDocs.ApiBearerAuth
  @handleFeedLikesDocs.ApiOperation
  @handleFeedLikesDocs.ApiParam
  @handleFeedLikesDocs.ApiResponse
  async handleFeedLikes(@Req() req, @Param('id') feedId: number) {
    const userId = req.user.user_id;
    return await this.feedService.handleFeedLikes(feedId, userId);
  }

  // 피드 등록
  @Post()
  @UseGuards(JwtAuthGuard)
  @createFeedDocs.ApiBearerAuth
  @createFeedDocs.ApiOperation
  @createFeedDocs.ApiBody
  @createFeedDocs.ApiResponse
  async createFeed(@Req() req, @Body() feedDto: FeedDto) {
    const userId = req.user.user_id;
    return this.feedService.createFeed(feedDto, userId);
  }

  // 피드 수정
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @updateFeedDocs.ApiBearerAuth
  @updateFeedDocs.ApiOperation
  @updateFeedDocs.ApiBody
  @updateFeedDocs.ApiResponse
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
  @deleteFeedDocs.ApiBearerAuth
  @deleteFeedDocs.ApiOperation
  @deleteFeedDocs.ApiParam
  @deleteFeedDocs.ApiResponse
  async deleteFeed(@Req() req, @Param('id') feedId: number) {
    const userId = req.user.user_id;
    return this.feedService.deleteFeed(userId, feedId);
  }

  // 댓글 등록
  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  @createCommentDocs.ApiBearerAuth
  @createCommentDocs.ApiOperation
  @createCommentDocs.ApiParam
  @createCommentDocs.ApiBody
  @createCommentDocs.ApiResponse
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
  @updateCommentDocs.ApiBearerAuth
  @updateCommentDocs.ApiOperation
  @updateCommentDocs.ApiParam
  @updateCommentDocs.ApiParam2
  @updateCommentDocs.ApiBody
  @updateCommentDocs.ApiResponse
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
  @deleteCommentDocs.ApiBearerAuth
  @deleteCommentDocs.ApiOperation
  @deleteCommentDocs.ApiParam
  @deleteCommentDocs.ApiResponse
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
  @handleCommentLikesDocs.ApiBearerAuth
  @handleCommentLikesDocs.ApiOperation
  @handleCommentLikesDocs.ApiParam
  @handleCommentLikesDocs.ApiResponse
  async handleCommentLikes(@Req() req, @Param('id') commentId: number) {
    const userId = req.user.user_id;
    return await this.feedService.handleCommentLikes(userId, commentId);
  }

  // 이미지 업로드
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  @uploadImageDocs.ApiBearerAuth
  @uploadImageDocs.ApiOperation
  @uploadImageDocs.ApiConsumes
  @uploadImageDocs.ApiBody
  @uploadImageDocs.ApiResponse
  async func(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.user_id;
    return await this.feedService.uploadFeedImage(userId, file);
  }
}
