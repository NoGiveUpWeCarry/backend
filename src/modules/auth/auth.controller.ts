import {
  Controller,
  Get,
  UseGuards,
  Req,
  Body,
  Post,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Google 로그인 요청
  }

  @Post('google/callback')
  async googleCallback(@Body('code') code: string) {
    // Authorization Code 교환 및 사용자 정보 가져오기
    const { user, accessToken, refreshToken, isExistingUser } =
      await this.authService.handleGoogleCallback(code);
    return { user, accessToken, refreshToken, isExistingUser };
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // GitHub 로그인 요청
  }

  @Post('github/callback')
  async githubCallback(@Body('code') code: string) {
    const { user, accessToken, refreshToken, isExistingUser } =
      await this.authService.handleGithubCallback(code);
    return { user, accessToken, refreshToken, isExistingUser };
  }

  // Role 선택 API
  @Put('roleselect')
  @UseGuards(JwtAuthGuard)
  async selectRole(
    @Body('role_id') roleId: number,
    @Req() req: any // JWT에서 사용자 정보 추출
  ) {
    const validRoles = [1, 2, 3]; // 1: Programmer, 2: Artist, 3: Designer

    // 유효한 role_id인지 확인
    if (!validRoles.includes(roleId)) {
      throw new BadRequestException('유효하지 않은 역할 ID입니다.');
    }

    const userId = req.user?.user_id; // JWT에서 추출된 userId 확인
    console.log(userId);
    if (!userId) {
      throw new BadRequestException('사용자 ID가 누락되었습니다.');
    }

    return await this.authService.updateUserRole(userId, roleId);
  }

  @Post('refresh')
  async refreshAccessToken(
    @Body('refreshToken') refreshToken: string,
    @Req() req: any
  ) {
    const userId = req.user?.user_id; // JWT에서 사용자 ID 추출

    // 리프레시 토큰 검증
    const isValid = await this.authService.validateRefreshToken(
      userId,
      refreshToken
    );
    if (!isValid) {
      throw new Error('유효하지 않은 리프레시 토큰입니다.');
    }

    // 새 액세스 토큰 발급
    const newAccessToken = this.jwtService.sign({ user_id: userId });
    return { accessToken: newAccessToken };
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user?.user_id;
    await this.authService.deleteRefreshToken(userId);
    return { message: '로그아웃 성공' };
  }
}
