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
    console.log('accessToken: ' + accessToken);
    console.log('refreshToken: ' + refreshToken);
    // 리프레시 토큰을 HTTP-Only 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(HttpStatusCodes.OK).json(
      new ApiResponse(HttpStatusCodes.OK, 'Google 로그인 성공', {
        user,
        accessToken,
        refreshToken,
        isExistingUser,
      })
    );
    // return new ApiResponse(HttpStatusCodes.OK, 'Google 로그인 성공', {
    //   user,
    //   accessToken,
    //   isExistingUser,
    // });
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
      maxAge: 7 * 24 * 60 * 60, // 7일
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

  // @Post('refresh')
  // async refreshAccessToken(@Req() req: any, @Res() res: Response) {
  //   console.log('Refresh Token API 호출');
  //   const refreshToken = req.cookies['refreshToken'];
  //
  //   if (!refreshToken) {
  //     throw new HttpException(
  //       ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
  //       ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
  //     );
  //   }
  //   //const userId = req.user?.user_id;
  //   const userId = this.authService.getUserIdFromRefreshToken(refreshToken);
  //   console.log('user_id: ' + userId);
  //   const isValid = await this.authService.validateRefreshToken(
  //     userId,
  //     refreshToken
  //   );
  //   if (!isValid) {
  //     const error = ErrorMessages.AUTH.INVALID_REFRESH_TOKEN;
  //     throw new HttpException(error.text, error.code);
  //   }
  //
  //   const newAccessToken = this.authService.generateAccessToken(userId);
  //   const newRefreshToken = this.authService.generateRefreshToken(userId);
  //   res.cookie('refreshToken', newRefreshToken, {
  //     httpOnly: true,
  //     secure: false,
  //     sameSite: 'none',
  //     maxAge: 7 * 24 * 60 * 60 * 1000,
  //   });
  //   return res.status(HttpStatusCodes.OK).json(
  //     new ApiResponse(
  //       HttpStatusCodes.OK,
  //       '액세스 토큰이 성공적으로 갱신되었습니다.',
  //       {
  //         accessToken: newAccessToken,
  //       }
  //     )
  //   );
  // }

  @Post('refresh')
  async refreshAccessToken(@Req() req: any, @Res() res: Response) {
    console.log('Refresh Token API 호출');
    const refreshToken = req.cookies['refreshToken'];
    console.log('refreshToken from Cookie: ' + refreshToken);
    // 1. Refresh Token이 없는 경우 예외 처리
    if (!refreshToken) {
      console.error('리프레쉬 토큰 없음');
      throw new HttpException(
        ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
        ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
      );
    }
    console.log('요청된 Refresh Token:', refreshToken);

    try {
      // 2. Refresh Token에서 User ID 추출
      const userId = this.authService.getUserIdFromRefreshToken(refreshToken);
      if (!userId) {
        console.error('Refresh Token으로부터 User ID 추출 실패');
        throw new HttpException(
          ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
          ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
        );
      }
      console.log('추출된 User ID:', userId);

      // 3. Refresh Token 유효성 검증
      const isValid = await this.authService.validateRefreshToken(
        userId,
        refreshToken
      );
      console.log('Refresh Token 유효성 검증 결과:', isValid);

      if (!isValid) {
        console.error('Refresh Token이 Redis와 일치하지 않음');
        throw new HttpException(
          ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.text,
          ErrorMessages.AUTH.INVALID_REFRESH_TOKEN.code
        );
      }

      // 4. 새로운 Access Token 및 Refresh Token 생성
      const newAccessToken = this.authService.generateAccessToken(userId);
      const newRefreshToken = this.authService.generateRefreshToken(userId);

      console.log('새로운 Access Token:', newAccessToken);
      console.log('새로운 Refresh Token:', newRefreshToken);

      // 5. Redis에 새로운 Refresh Token 저장
      await this.authService.storeRefreshToken(userId, newRefreshToken);

      // 6. Refresh Token을 쿠키에 저장
      res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        secure: false,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(HttpStatusCodes.OK).json(
        new ApiResponse(
          HttpStatusCodes.OK,
          '액세스 토큰이 성공적으로 갱신되었습니다.',
          {
            accessToken: newAccessToken,
          }
        )
      );
    } catch (error) {
      console.error('Refresh Token 갱신 중 오류 발생:', error.message);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
      });
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
