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
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '@src/modules/auth/auth.service';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ApiResponse } from '@common/dto/response.dto';
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
    console.log('refreshToken: ', refreshToken);
    const response = {
      message: {
        code: 200,
        message: 'Google 로그인 성공',
      },
      user,
      accessToken,
      isExistingUser,
    };
    console.log(response);
    return res.status(HttpStatusCodes.OK).json(response);
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
    console.log(refreshToken);
    const response = {
      message: {
        code: 200,
        message: 'Google 로그인 성공',
      },
      user,
      accessToken,
      isExistingUser,
    };
    console.log(response);
    return res.status(HttpStatusCodes.OK).json(response);
  }

  // @Post('login')
  // async login(
  //   @Body()
  // )
  // Role 선택 API
  @Put('roleselect')
  @UseGuards(JwtAuthGuard)
  async selectRole(
    @Body('role_id') roleId: number,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = req.user?.user_id;
    const serviceResult = await this.authService.updateUserRole(userId, roleId);
    // 응답 객체 생성
    const responseBody = {
      message: {
        code: HttpStatusCodes.OK,
        text: serviceResult.message,
      },
      user: serviceResult.user,
    };
    // 응답 반환
    return res.status(HttpStatusCodes.OK).json(responseBody);
  }

  @Post('refresh')
  async refreshAccessToken(
    @Body('user_id') userId: number, // user_id는 숫자로 받음
    @Res() res: Response
  ) {
    if (userId === undefined || userId === null) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    console.log(userId);
    try {
      // 리프레쉬 토큰 확인 및 액세스 토큰 재발급
      const newAccessToken = await this.authService.renewAccessToken(userId);

      // 성공 메시지와 새로운 액세스 토큰 반환
      const response = {
        message: {
          code: 200,
          text: 'Access token이 성공적으로 갱신 되었습니다.',
        },
        access_token: newAccessToken,
      };

      return res.status(200).json(response);
    } catch (error) {
      //throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      console.log(error);
    }
  }
  @Post('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    res.clearCookie('refreshToken'); // HTTP-Only 쿠키 삭제
    return res
      .status(HttpStatusCodes.OK)
      .json(new ApiResponse(HttpStatusCodes.OK, '로그아웃 성공'));
  }
}
