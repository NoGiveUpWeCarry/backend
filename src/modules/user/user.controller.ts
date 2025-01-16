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
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId/profile')
  async getUserProfile(@Param('userId') userId: string, @Req() req) {
    const loggedInUserId = req.user?.user_id;
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    console.log(loggedInUserId);
    return this.userService.getUserProfile(loggedInUserId, numUserId);
  }

  @Get(':userId/follow-relations')
  async getFollowRelations(@Param('userId') userId: string, @Req() req) {
    const loggedInUserId = req.user?.user_id;
    const numUserId = parseInt(userId); // 인증된 사용자 ID
    console.log(loggedInUserId);
    return this.userService.getFollowRelations(loggedInUserId, numUserId);
  }

  @Get('setting')
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
  async patchUserStatus(@Req() req, @Body('status') statusId: number) {
    const userId = req.user?.user_id;
    return this.userService.patchUserStatus(userId, statusId);
  }

  @Post('profile/skills')
  async patchUserSkills(@Req() req, @Body('skills') skills: string[]) {
    const userId = req.user?.user_id;
    return this.userService.patchUserSkills(userId, skills);
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

  @Delete('profile/skills')
  async deleteUserSkills(@Req() req, @Body('skills') skills: string[]) {
    const userId = req.user?.user_id;
    return this.userService.deleteUserSkills(userId, skills);
  }

  @Patch('profile/notification')
  async patchUserNotification(
    @Req() req,
    @Body('notification') notification: boolean
  ) {
    const userId = req.user?.user_id;
    return this.userService.patchUserNotification(userId, notification);
  }
}
