import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@src/prisma/prisma.service';
import { AuthUserDto } from './dto/auth-user.dto';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async handleGoogleCallback(code: string) {
    // Google 토큰 요청
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: '1030869508870-7svsfcscu3la43lpprj6kui580cp0uhf.apps.googleusercontent.com',
      client_secret: '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',
      redirect_uri: 'http://localhost:5173/auth/google/callback',
      grant_type: 'authorization_code',
    });
    const { access_token } = tokenResponse.data;
    // Google 사용자 정보 요청
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = userInfoResponse.data;

    // JWT 생성
    const jwt = this.generateJwt(userData);
    return { user: userData, accessToken: jwt };
  }

  // 사용자 찾기 또는 생성
  async findOrCreateUser(profile: AuthUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      return this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          nickname: profile.nickname,
          profile_url: profile.profile_url,
          auth_provider: profile.auth_provider,
          push_alert: false,
          following_alert: false,
          project_alert: false,
          role: { connect: { id: 1 } },
          status: { connect: { id: 1 } },
        },
      });
    }
    return user;
  }

  // JWT Access Token 생성
  async generateAccessToken(user: any) {
    const payload = { userId: user.id, email: user.email };
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  private generateJwt(user: any) {
    const payload = { email: user.email, id: user.id };
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }
  // 소셜 로그인 프로세스
  async socialLogin(profile: AuthUserDto) {
    const user = await this.findOrCreateUser(profile);
    const accessToken = await this.generateAccessToken(user);
    return { user, accessToken };
  }
}
