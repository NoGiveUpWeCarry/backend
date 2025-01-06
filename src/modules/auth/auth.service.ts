import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@src/prisma/prisma.service';
import { AuthUserDto } from './dto/auth-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

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

  // 소셜 로그인 프로세스
  async socialLogin(profile: AuthUserDto) {
    const user = await this.findOrCreateUser(profile);
    const accessToken = await this.generateAccessToken(user);
    return { user, accessToken };
  }
}
