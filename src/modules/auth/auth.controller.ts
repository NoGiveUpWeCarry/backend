import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';

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
  async googleCallback(@Req() req: { user: AuthUserDto }) {
    const { user, accessToken } = await this.authService.socialLogin(req.user);
    return { user, accessToken };
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // GitHub 로그인 요청
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: { user: AuthUserDto }) {
    const { user, accessToken } = await this.authService.socialLogin(req.user);
    return { user, accessToken };
  }
}
