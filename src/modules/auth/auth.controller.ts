import {
  Controller,
  Get,
  UseGuards,
  Req,
  Body,
  Post,
  Put,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '@src/modules/auth/auth.service';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '@common/dto/response.dto';
import { ErrorMessages } from '@common/constants/error-messages';
import { HttpStatusCodes } from '@common/constants/http-status-code';

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
    return new ApiResponse(HttpStatusCodes.OK, 'Google 로그인 성공', {
      user,
      accessToken,
      refreshToken,
      isExistingUser,
    });
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
    return new ApiResponse(HttpStatusCodes.OK, 'GitHub 로그인 성공', {
      user,
      accessToken,
      refreshToken,
      isExistingUser,
    });
  }

  // Role 선택 API
  @Put('roleselect')
  @UseGuards(JwtAuthGuard)
  async selectRole(@Body('role_id') roleId: number, @Req() req: any) {
    const userId = req.user?.user_id;
    const { user, message } = await this.authService.updateUserRole(
      userId,
      roleId
    );

    return new ApiResponse(HttpStatusCodes.OK, message, { user });
  }

  @Post('refresh')
  async refreshAccessToken(
    @Body('refreshToken') refreshToken: string,
    @Req() req: any
  ) {
    const userId = req.user?.user_id;

    const isValid = await this.authService.validateRefreshToken(
      userId,
      refreshToken
    );
    if (!isValid) {
      const error = ErrorMessages.AUTH.INVALID_REFRESH_TOKEN;
      throw new HttpException(error.text, error.code);
    }

    const newAccessToken = await this.authService.generateAccessToken(userId);

    return new ApiResponse(
      HttpStatusCodes.OK,
      '액세스 토큰이 성공적으로 갱신되었습니다.',
      {
        accessToken: newAccessToken,
      }
    );
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user?.user_id;
    await this.authService.deleteRefreshToken(userId);
    return new ApiResponse(HttpStatusCodes.OK, '로그아웃 성공');
  }
}
