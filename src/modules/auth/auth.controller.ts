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
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '@src/modules/auth/auth.service';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { MyApiResponse } from '@common/dto/response.dto';
import { HttpStatusCodes } from '@common/constants/http-status-code';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
        message: 'Github 로그인 성공',
      },
      user,
      accessToken,
      isExistingUser,
    };
    console.log(response);
    return res.status(HttpStatusCodes.OK).json(response);
  }

  @Put('roleselect')
  @UseGuards(JwtAuthGuard)
  async selectRole(
    @Body('roleId') roleId: number,
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
    @Body('userId') userId: number, // user_id는 숫자로 받음
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
        accessToken: newAccessToken,
      };

      return res.status(200).json(response);
    } catch (error) {
      //throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      console.log(error);
    }
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Res() res: Response) {
    const userId = req.user?.user_id;
    await this.authService.deleteRefreshToken(userId);
    return res
      .status(HttpStatusCodes.OK)
      .json(new MyApiResponse(HttpStatusCodes.OK, '로그아웃 성공'));
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '회원가입',
    description: '이메일, 닉네임, 비밀번호로 회원가입을 합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '회원가입 성공',
    schema: {
      example: {
        message: '일반 회원가입 성공',
        user: {
          userId: 1,
          email: 'user@example.com',
          nickname: 'nickname123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '이메일이 이미 존재할 경우',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email already exists',
      },
    },
  })
  @ApiBody({
    description: '회원가입 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        nickname: { type: 'string', example: 'nickname123' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'nickname', 'password'],
    },
  })
  async signup(
    @Body() body: { email: string; nickname: string; password: string }
  ) {
    const result = await this.authService.signup(
      body.email,
      body.nickname,
      body.password
    );
    return {
      message: '일반 회원가입 성공',
      user: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일과 비밀번호로 로그인을 수행합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '로그인 성공',
    schema: {
      example: {
        message: '일반 로그인 성공',
        user: {
          userId: 1,
          email: 'user@example.com',
          name: 'nickname123',
          nickname: 'nickname123',
          profileUrl: null,
          authProvider: 'pad',
          roleId: 1,
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '잘못된 이메일 또는 비밀번호',
    schema: {
      example: {
        statusCode: 401,
        message: '유효하지 않는 이메일 또는 비밀번호 입니다',
      },
    },
  })
  @ApiBody({
    description: '로그인 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login(body.email, body.password);
    return {
      message: '일반 로그인 성공',
      user: result.user,
      accessToken: result.accessToken,
    };
  }
}
