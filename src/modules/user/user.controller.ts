import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
  Put,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId')
  async getUserProfile(@Param('userId') userId: string, @Req() req) {
    const loggedInUserId = req.user?.user_id;
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    return this.userService.getUserProfile(loggedInUserId, numUserId);
  }

  @Get(':userId/followers')
  async getUserFollowers(@Param('userId') userId: string) {
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    return this.userService.getUserFollowers(numUserId);
  }

  @Get(':userId/followers')
  async getUserFollowings(@Param('userId') userId: string) {
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    return this.userService.getUserFollowings(numUserId);
  }

  @Post('projects')
  async addProject(@Req() req, @Body() projectData: any) {
    const userId = req.user?.user_id;
    return this.userService.addProject(userId, projectData);
  }

  @Put('projects/:projectId')
  async updateProject(
    @Req() req,
    @Param('projectId') projectId: string,
    @Body() projectData: any
  ) {
    const userId = req.user?.user_id;
    const numProjectId = parseInt(projectId, 10);
    return this.userService.updateProject(userId, numProjectId, projectData);
  }

  @Get('profile/settings')
  async getUserSetting(@Req() req) {
    const userId = req.user?.user_id;
    return this.userService.getUserSetting(userId);
  }

  @Patch('profile/nickname')
  async patchUserNickname(@Req() req, @Body('nickname') nickname: string) {
    const userId = req.user?.user_id;
    return this.userService.patchUserNickname(userId, nickname);
  }

  @Patch('profile/introduce')
  async patchUserIntroduce(@Req() req, @Body('introduce') introduce: string) {
    const userId = req.user?.user_id;
    return this.userService.patchUserIntroduce(userId, introduce);
  }

  @Patch('profile/status')
  async patchUserStatus(@Req() req, @Body('statusId') statusId: number) {
    const userId = req.user?.user_id;
    return this.userService.patchUserStatus(userId, statusId);
  }

  @Patch('profile/job')
  async updateUserJobDetail(
    @Req() req,
    @Body('category') category: string,
    @Body('jobDetail') jobDetail: string
  ) {
    const userId = req.user?.user_id;
    return this.userService.updateUserJobDetail(userId, category, jobDetail);
  }

  @Post('profile/skills')
  async patchUserSkills(@Req() req, @Body('skills') skills: string[]) {
    const userId = req.user?.user_id;
    return this.userService.addUserSkills(userId, skills);
  }

  @Delete('profile/skills')
  async deleteUserSkills(@Req() req, @Body('skills') skills: string[]) {
    const userId = req.user?.user_id;
    return this.userService.deleteUserSkills(userId, skills);
  }

  @Patch('profile/image')
  @UseInterceptors(FileInterceptor('file'))
  async patchProfileImage(
    @Req() req,
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user?.user_id;
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }
    const fileType = file.mimetype.split('/')[1];
    const updateUser = await this.userService.patchProfileImage(
      userId,
      file.buffer,
      fileType
    );
    return {
      message: '프로필 이미지가 성공적으로 업데이트되었습니다.',
      user: updateUser,
    };
  }

  @Patch('profile/notification')
  async patchUserNotification(
    @Req() req,
    @Body('notification')
    notifications: {
      pushAlert: boolean;
      followingAlert: boolean;
      projectAlert: boolean;
    }
  ) {
    const userId = req.user?.user_id;
    return this.userService.patchUserNotification(userId, notifications);
  }

  @Post('profile/links')
  async addUserLinks(@Req() req, @Body('links') links: { url: string }[]) {
    const userId = req.user?.user_id;
    return this.userService.addUserLinks(userId, links);
  }

  @Delete('profile/links')
  async deleteUserLinks(@Req() req, @Body('linkIds') linkIds: number[]) {
    const userId = req.user?.user_id;
    return this.userService.deleteUserLinks(userId, linkIds);
  }

  @Delete('account')
  async deleteAccount(@Req() req) {
    const userId = req.user?.user_id; // 인증된 사용자 ID 가져오기
    if (!userId) {
      throw new HttpException(
        '유효하지 않은 사용자입니다.',
        HttpStatus.FORBIDDEN
      );
    }

    await this.userService.deleteAccount(userId);

    return {
      message: '계정이 성공적으로 삭제되었습니다.',
    };
  }

  @Get('profile/resume/:userId')
  async getUserResume(@Req() req, @Param('userId') targetUserId: number) {
    const loggedInUserId = req.user?.user_id;
    return this.userService.getUserResume(loggedInUserId, targetUserId);
  }

  @Post('profile/resume')
  async createUserResume(
    @Req() req,
    @Body() body: { title: string; portfolioUrl?: string; detail: string }
  ) {
    const userId = req.user?.user_id;
    return this.userService.createUserResume(userId, body);
  }

  // 지원서 수정
  @Patch('profile/resume/:resumeId')
  async updateUserResume(
    @Req() req,
    @Param('resumeId') resumeId: number,
    @Body() body: { title?: string; portfolioUrl?: string; detail?: string }
  ) {
    const userId = req.user?.user_id;
    return this.userService.updateUserResume(userId, resumeId, body);
  }

  @Delete(':resumeId')
  async deleteUserResume(@Req() req, @Param('resumeId') resumeId: number) {
    const userId = req.user?.user_id;
    return this.userService.deleteUserResume(userId, resumeId);
  }

  @Get(':userId/feeds')
  async getUserFeedPosts(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.userService.getFeeds(userId, page, limit);
  }

  @Get(':userId/connection-hub')
  async getUserConnectionHubProjects(
    @Param('userId') userId: number,
    @Query('type') type: 'applied' | 'created',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.userService.getConnectionHubProjects(userId, type, page, limit);
  }
}
