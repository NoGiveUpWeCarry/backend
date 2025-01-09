import {
  Controller,
  Get,
  UseGuards,
  Req,
  Body,
  Post,
  Put,
  HttpException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '@src/modules/auth/auth.service';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '@common/dto/response.dto';
import { ErrorMessages } from '@common/constants/error-messages';
import { HttpStatusCodes } from '@common/constants/http-status-code';
import { Response } from 'express';
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
  async googleCallback(@Body('code') code: string, @Res() res: Response) {
    // Authorization Code 교환 및 사용자 정보 가져오기
    const { user, accessToken, refreshToken, isExistingUser } =
      await this.authService.handleGoogleCallback(code);

    // 리프레시 토큰을 HTTP-Only 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict', // CSRF 방지
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    return new ApiResponse(HttpStatusCodes.OK, 'Google 로그인 성공', {
      user,
      accessToken,
      isExistingUser,
    });
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // GitHub 로그인 요청
  }

  @Post('github/callback')
  async githubCallback(@Body('code') code: string, @Res() res: Response) {
    // Authorization Code 교환 및 사용자 정보 가져오기
    const { user, accessToken, refreshToken, isExistingUser } =
      await this.authService.handleGithubCallback(code);

    // 리프레시 토큰을 HTTP-Only 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict', // CSRF 방지
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    return new ApiResponse(HttpStatusCodes.OK, 'Google 로그인 성공', {
      user,
      accessToken,
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
  async refreshAccessToken(@Req() req: any, @Res() res: Response) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new HttpException(
        ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
        ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
      );
    }
    //const userId = req.user?.user_id;
    const userId = this.authService.getUserIdFromRefreshToken(refreshToken);
    const isValid = await this.authService.validateRefreshToken(
      userId,
      refreshToken
    );
    if (!isValid) {
      const error = ErrorMessages.AUTH.INVALID_REFRESH_TOKEN;
      throw new HttpException(error.text, error.code);
    }

    const newAccessToken = await this.authService.generateAccessToken(userId);
    const newRefreshToken = await this.authService.generateRefreshToken(userId);
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return new ApiResponse(
      HttpStatusCodes.OK,
      '액세스 토큰이 성공적으로 갱신되었습니다.',
      {
        accessToken: newAccessToken,
      }
    );
  }

  @Post('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    res.clearCookie('refreshToken'); // HTTP-Only 쿠키 삭제
    return res
      .status(HttpStatusCodes.OK)
      .json(new ApiResponse(HttpStatusCodes.OK, '로그아웃 성공'));
  }
}
