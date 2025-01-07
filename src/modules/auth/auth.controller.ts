import { Controller, Get, UseGuards, Req, Body, Post, Put, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Google 로그인 요청
  }

  @Post('google/callback')
  async googleCallback(@Body('code') code: string) {
    // Authorization Code 교환 및 사용자 정보 가져오기
    const { user, accessToken, isExistingUser } = await this.authService.handleGoogleCallback(code);
    return { user, accessToken, isExistingUser };
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // GitHub 로그인 요청
  }

  @Post('github/callback')
  async githubCallback(@Body('code') code: string) {
    const { user, accessToken, isExistingUser } = await this.authService.handleGithubCallback(code);
    return { user, accessToken, isExistingUser };
  }

  // Role 선택 API
  @Put('roleselect')
  @UseGuards(JwtAuthGuard)
  async selectRole(
    @Body('role_id') roleId: number,
    @Req() req: any, // JWT에서 사용자 정보 추출
  ) {
    const validRoles = [1, 2, 3]; // 1: Programmer, 2: Artist, 3: Designer

    // 유효한 role_id인지 확인
    if (!validRoles.includes(roleId)) {
      throw new BadRequestException('유효하지 않은 역할 ID입니다.');
    }

    const userId = req.user?.id; // JWT에서 추출된 userId 확인

    if (!userId) {
      throw new BadRequestException('사용자 ID가 누락되었습니다.');
    }

    return await this.authService.updateUserRole(userId, roleId);
  }

}
