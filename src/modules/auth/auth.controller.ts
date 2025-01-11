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
    console.log('accessToken: ' + accessToken);
    console.log('refreshToken: ' + refreshToken);
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
    const { user, accessToken, isExistingUser } =
      await this.authService.handleGithubCallback(code);
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
      // user_id를 문자열로 변환
      //const userIdStr = String(userId);

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

  // @Post('refresh')
  // async refreshAccessToken(@Req() req: any, @Res() res: Response) {
  //   console.log('Refresh Token API 호출');
  //   const refreshToken = req.cookies['refreshToken'];
  //   console.log('refreshToken from Cookie: ' + refreshToken);
  //   // 1. Refresh Token이 없는 경우 예외 처리
  //   if (!refreshToken) {
  //     console.error('리프레쉬 토큰 없음');
  //     throw new HttpException(
  //       ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
  //       ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
  //     );
  //   }
  //   console.log('요청된 Refresh Token:', refreshToken);
  //
  //   try {
  //     // 2. Refresh Token에서 User ID 추출
  //     const userId = this.authService.getUserIdFromRefreshToken(refreshToken);
  //     if (!userId) {
  //       console.error('Refresh Token으로부터 User ID 추출 실패');
  //       throw new HttpException(
  //         ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
  //         ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
  //       );
  //     }
  //     console.log('추출된 User ID:', userId);
  //
  //     // 3. Refresh Token 유효성 검증
  //     const isValid = await this.authService.validateRefreshToken(
  //       userId,
  //       refreshToken
  //     );
  //     console.log('Refresh Token 유효성 검증 결과:', isValid);
  //
  //     if (!isValid) {
  //       console.error('Refresh Token이 Redis와 일치하지 않음');
  //       throw new HttpException(
  //         ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
  //         ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
  //       );
  //     }
  //
  //     // 4. 새로운 Access Token 및 Refresh Token 생성
  //     const newAccessToken = this.authService.generateAccessToken(userId);
  //     const newRefreshToken = this.authService.generateRefreshToken(userId);
  //
  //     console.log('새로운 Access Token:', newAccessToken);
  //     console.log('새로운 Refresh Token:', newRefreshToken);
  //
  //     // 5. Redis에 새로운 Refresh Token 저장
  //     await this.authService.storeRefreshToken(userId, newRefreshToken);
  //
  //     // 6. Refresh Token을 쿠키에 저장
  //     res.cookie('refreshToken', refreshToken, {
  //       httpOnly: false,
  //       secure: false,
  //       sameSite: 'none',
  //       path: '/',
  //       maxAge: 7 * 24 * 60 * 60,
  //     });
  //
  //     return res.status(HttpStatusCodes.OK).json(
  //       new ApiResponse(
  //         HttpStatusCodes.OK,
  //         '액세스 토큰이 성공적으로 갱신되었습니다.',
  //         {
  //           accessToken: newAccessToken,
  //         }
  //       )
  //     );
  //   } catch (error) {
  //     console.error('Refresh Token 갱신 중 오류 발생:', error.message);
  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: 'Internal Server Error',
  //     });
  //   }
  // }

  @Post('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    res.clearCookie('refreshToken'); // HTTP-Only 쿠키 삭제
    return res
      .status(HttpStatusCodes.OK)
      .json(new ApiResponse(HttpStatusCodes.OK, '로그아웃 성공'));
  }
}
