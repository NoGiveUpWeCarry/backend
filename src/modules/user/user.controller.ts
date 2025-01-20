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
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  GetUserFollowersDocs,
  GetUserFollowingsDocs,
  GetUserProfileDocs,
  GetUserProfileHeaderDocs,
  AddProjectDocs,
  UpdateProjectDocs,
  DeleteProjectDocs,
  AddWorkDocs,
  UpdateWorkDocs,
  DeleteWorkDocs,
  PatchUserNicknameDocs,
  GetUserSettingDocs,
  UpdateGithubUsernameDocs,
  UpdateUserJobDetailDocs,
  PatchUserStatusDocs,
  PatchUserIntroduceDocs,
  PatchUserSkillsDocs,
  DeleteUserSkillsDocs,
  PatchProfileImageDocs,
  PatchUserNotificationDocs,
  AddUserLinksDocs,
  DeleteUserLinksDocs,
  GetUserResumeDocs,
  CreateUserResumeDocs,
  UpdateUserResumeDocs,
  DeleteUserResumeDocs,
  GetUserFeedPostsDocs,
  GetUserConnectionHubProjectsDocs,
} from './docs/user.docs';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { S3Service } from '@src/s3/s3.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service
  ) {}

  @Get(':userId')
  @GetUserProfileDocs.ApiOperation
  @GetUserProfileDocs.ApiParam
  @GetUserProfileDocs.ApiResponse
  async getUserProfile(@Param('userId') userId: string, @Req() req) {
    const loggedInUserId = req.user?.user_id;
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    return this.userService.getUserProfile(loggedInUserId, numUserId);
  }

  @Get(':userId/headers')
  @GetUserProfileHeaderDocs.ApiOperation
  @GetUserProfileHeaderDocs.ApiParam
  @GetUserProfileHeaderDocs.ApiResponse
  async getUserProfileHeader(@Param('userId') userId: string, @Req() req) {
    const loggedInUserId = req.user?.user_id;
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    return this.userService.getUserProfileHeader(loggedInUserId, numUserId);
  }

  @Get(':userId/followers')
  @GetUserFollowersDocs.ApiOperation
  @GetUserFollowersDocs.ApiResponse
  async getUserFollowers(@Param('userId') userId: string) {
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    return this.userService.getUserFollowers(numUserId);
  }

  @Get(':userId/following')
  @GetUserFollowingsDocs.ApiOperation
  @GetUserFollowingsDocs.ApiResponse
  async getUserFollowings(@Param('userId') userId: string) {
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    return this.userService.getUserFollowings(numUserId);
  }

  @Post('projects')
  @UseInterceptors(FileInterceptor('file'))
  @AddProjectDocs.ApiOperation
  @AddProjectDocs.ApiBody
  @AddProjectDocs.ApiResponse
  async addProject(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    const userId = req.user?.user_id;
    let imageUrl = null;
    if (file) {
      imageUrl = await this.s3Service.uploadImage(
        userId,
        file.buffer,
        file.mimetype.split('/')[1], // 파일 확장자 추출
        'pad_projects/images' // S3 저장 경로 설정
      );
    }
    const projectData = {
      ...body,
      links: JSON.parse(body.links), // 문자열을 객체로 변환
    };
    return this.userService.addProject(userId, projectData, imageUrl);
  }

  @Put('projects/:projectId')
  @UpdateProjectDocs.ApiOperation
  @UpdateProjectDocs.ApiParam
  @UpdateProjectDocs.ApiBody
  @UpdateProjectDocs.ApiResponse
  async updateProject(
    @Req() req,
    @Param('projectId') projectId: string,
    @Body() projectData: any
  ) {
    const userId = req.user?.user_id;
    const numProjectId = parseInt(projectId, 10);
    return this.userService.updateProject(userId, numProjectId, projectData);
  }

  @Delete('projects/:projectId')
  @DeleteProjectDocs.ApiOperation
  @DeleteProjectDocs.ApiParam
  @DeleteProjectDocs.ApiResponse
  async deleteProject(@Req() req, @Param('projectId') projectId: string) {
    const userId = req.user?.user_id;
    const numProjectId = parseInt(projectId, 10);
    return this.userService.deleteProject(userId, numProjectId);
  }

  @Post('artist/works')
  @AddWorkDocs.ApiOperation
  @AddWorkDocs.ApiBody
  @AddWorkDocs.ApiResponse
  async addWork(@Req() req, @Body('musicUrl') musicUrl: string) {
    const userId = req.user?.user_id;
    return this.userService.addArtistWork(userId, musicUrl);
  }

  @Put('artist/works/:workId')
  @UpdateWorkDocs.ApiOperation
  @UpdateWorkDocs.ApiParam
  @UpdateWorkDocs.ApiBody
  @UpdateWorkDocs.ApiResponse
  async updateWork(
    @Req() req,
    @Param('workId') workId: string,
    @Body() musicUrl: string
  ) {
    const userId = req.user?.user_id;
    const numWorkId = parseInt(workId, 10);
    return this.userService.updateArtistWork(userId, numWorkId, musicUrl);
  }

  @Delete('artist/works/:workId')
  @DeleteWorkDocs.ApiOperation
  @DeleteWorkDocs.ApiParam
  @DeleteWorkDocs.ApiResponse
  async deleteWork(@Req() req, @Param('workId') workId: string) {
    const userId = req.user?.user_id;
    const numWorkId = parseInt(workId, 10);
    return this.userService.deleteArtistWork(userId, numWorkId);
  }

  @Patch('githubNickname')
  @UpdateGithubUsernameDocs.ApiOperation
  @UpdateGithubUsernameDocs.ApiBody
  @UpdateGithubUsernameDocs.ApiResponse
  async updateGithubUsername(
    @Req() req,
    @Body('githubUsername') githubUsername: string
  ) {
    const userId = req.user?.user_id;
    return this.userService.updateGithubUsername(userId, githubUsername);
  }

  @Get('profile/settings')
  @GetUserSettingDocs.ApiOperation
  @GetUserSettingDocs.ApiResponse
  async getUserSetting(@Req() req) {
    const userId = req.user?.user_id;
    return this.userService.getUserSetting(userId);
  }

  @Patch('profile/nickname')
  @PatchUserNicknameDocs.ApiOperation
  @PatchUserNicknameDocs.ApiBody
  @PatchUserNicknameDocs.ApiResponse
  async patchUserNickname(@Req() req, @Body('nickname') nickname: string) {
    const userId = req.user?.user_id;
    return this.userService.patchUserNickname(userId, nickname);
  }

  @Patch('profile/introduce')
  @PatchUserIntroduceDocs.ApiOperation
  @PatchUserIntroduceDocs.ApiBody
  @PatchUserIntroduceDocs.ApiResponse
  async patchUserIntroduce(@Req() req, @Body('introduce') introduce: string) {
    const userId = req.user?.user_id;
    return this.userService.patchUserIntroduce(userId, introduce);
  }

  @Patch('profile/status')
  @PatchUserStatusDocs.ApiOperation
  @PatchUserStatusDocs.ApiBody
  @PatchUserStatusDocs.ApiResponse
  async patchUserStatus(@Req() req, @Body('statusId') statusId: number) {
    const userId = req.user?.user_id;
    return this.userService.patchUserStatus(userId, statusId);
  }

  @Patch('profile/job')
  @UpdateUserJobDetailDocs.ApiOperation
  @UpdateUserJobDetailDocs.ApiBody
  @UpdateUserJobDetailDocs.ApiResponse
  async updateUserJobDetail(
    @Req() req,
    @Body('category') category: string,
    @Body('jobDetail') jobDetail: string
  ) {
    const userId = req.user?.user_id;
    return this.userService.updateUserJobDetail(userId, category, jobDetail);
  }

  @Post('profile/skills')
  @PatchUserSkillsDocs.ApiOperation
  @PatchUserSkillsDocs.ApiBody
  @PatchUserSkillsDocs.ApiResponse
  async patchUserSkills(@Req() req, @Body('skills') skills: string[]) {
    const userId = req.user?.user_id;
    return this.userService.addUserSkills(userId, skills);
  }

  @Delete('profile/skills')
  @DeleteUserSkillsDocs.ApiOperation
  @DeleteUserSkillsDocs.ApiBody
  @DeleteUserSkillsDocs.ApiResponse
  async deleteUserSkills(@Req() req, @Body('skills') skills: string[]) {
    const userId = req.user?.user_id;
    return this.userService.deleteUserSkills(userId, skills);
  }

  @Patch('profile/image')
  @PatchProfileImageDocs.ApiOperation
  @PatchProfileImageDocs.ApiConsumes
  @PatchProfileImageDocs.ApiBody
  @PatchProfileImageDocs.ApiResponse
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
    return this.userService.patchProfileImage(userId, file.buffer, fileType);
  }

  @Patch('profile/notification')
  @PatchUserNotificationDocs.ApiOperation
  @PatchUserNotificationDocs.ApiBody
  @PatchUserNotificationDocs.ApiResponse
  async patchUserNotification(
    @Req() req,
    @Body('notification')
    notifications: {
      pushAlert?: boolean;
      followingAlert?: boolean;
      projectAlert?: boolean;
    }
  ) {
    const userId = req.user?.user_id;
    return this.userService.patchUserNotification(userId, notifications);
  }

  @Post('profile/links')
  @AddUserLinksDocs.ApiOperation
  @AddUserLinksDocs.ApiBody
  @AddUserLinksDocs.ApiResponse
  async addUserLinks(@Req() req, @Body('links') links: string[]) {
    const userId = req.user?.user_id;
    const formattedLinks = links.map(url => ({ url }));
    return this.userService.addUserLinks(userId, formattedLinks);
  }

  @Delete('profile/links')
  @DeleteUserLinksDocs.ApiOperation
  @DeleteUserLinksDocs.ApiBody
  @DeleteUserLinksDocs.ApiResponse
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
  @GetUserResumeDocs.ApiOperation
  @GetUserResumeDocs.ApiParam
  @GetUserResumeDocs.ApiResponse
  async getUserResume(@Req() req, @Param('userId') targetUserId: string) {
    const loggedInUserId = req.user?.user_id;
    const numUserId = parseInt(targetUserId, 10);
    return this.userService.getUserResume(loggedInUserId, numUserId);
  }

  @Post('profile/resume')
  @CreateUserResumeDocs.ApiOperation
  @CreateUserResumeDocs.ApiBody
  @CreateUserResumeDocs.ApiResponse
  async createUserResume(
    @Req() req,
    @Body() body: { title: string; portfolioUrl?: string; detail: string }
  ) {
    const userId = req.user?.user_id;
    return this.userService.createUserResume(userId, body);
  }

  // 지원서 수정
  @Patch('profile/resume/:resumeId')
  @UpdateUserResumeDocs.ApiOperation
  @UpdateUserResumeDocs.ApiParam
  @UpdateUserResumeDocs.ApiBody
  @UpdateUserResumeDocs.ApiResponse
  async updateUserResume(
    @Req() req,
    @Param('resumeId') resumeId: string,
    @Body() body: { title?: string; portfolioUrl?: string; detail?: string }
  ) {
    const userId = req.user?.user_id;
    const numResumeId = parseInt(resumeId, 10);
    return this.userService.updateUserResume(userId, numResumeId, body);
  }

  @Delete('profile/resume/:resumeId')
  @DeleteUserResumeDocs.ApiOperation
  @DeleteUserResumeDocs.ApiParam
  @DeleteUserResumeDocs.ApiResponse
  async deleteUserResume(@Req() req, @Param('resumeId') resumeId: string) {
    const userId = req.user?.user_id;
    const numResumeId = parseInt(resumeId, 10);
    return this.userService.deleteUserResume(userId, numResumeId);
  }

  @Get(':userId/feeds')
  @GetUserFeedPostsDocs.ApiOperation
  @GetUserFeedPostsDocs.ApiParam
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 항목 수 (기본값: 10)',
    type: 'number',
  })
  @GetUserFeedPostsDocs.ApiResponse
  async getUserFeedPosts(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const numUserId = parseInt(userId, 10);
    return this.userService.getFeeds(numUserId, page, limit);
  }

  @Get(':userId/connection-hub')
  @GetUserConnectionHubProjectsDocs.ApiOperation
  @GetUserConnectionHubProjectsDocs.ApiParam
  @ApiQuery({
    name: 'type',
    required: true,
    description: "프로젝트 유형 ('applied' 또는 'created')",
    enum: ['applied', 'created'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 항목 수 (기본값: 10)',
    type: 'number',
  })
  @GetUserConnectionHubProjectsDocs.ApiResponse
  async getUserConnectionHubProjects(
    @Param('userId') userId: string,
    @Query('type') type: 'applied' | 'created',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const numUserId = parseInt(userId, 10);
    return this.userService.getConnectionHubProjects(
      numUserId,
      type,
      page,
      limit
    );
  }
}
