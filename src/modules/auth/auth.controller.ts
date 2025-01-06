import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { Response } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Google 로그인 요청
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
   const { user, accessToken } = await this.authService.socialLogin(req.user);

    // 응답 헤더에 토큰 추가
    res.setHeader('Authorization', `Bearer ${accessToken}`);

    // 프론트엔드의 특정 페이지로 리다이렉트
    res.redirect(`http://localhost:5173`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // GitHub 로그인 요청
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res: Response) {
    const { user, accessToken } = await this.authService.socialLogin(req.user);

    // 응답 헤더에 토큰 추가
    res.setHeader('Authorization', `Bearer ${accessToken}`);

    // 프론트엔드의 특정 페이지로 리다이렉트
    res.redirect(`http://localhost:5173`);
  }
}
