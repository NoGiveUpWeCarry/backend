import { Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@modules/redis/redis.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { AuthUserDto } from './dto/auth-user.dto';
import axios from 'axios';
import { ErrorMessages } from '@common/constants/error-messages';
import { HttpStatusCodes } from '@common/constants/http-status-code';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  async handleGoogleCallback(code: string) {
    try {
      // Google 토큰 요청
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_CALLBACK_DEVELOP_URL,
          grant_type: 'authorization_code',
        }
      );
      const { access_token } = tokenResponse.data;
      // Google 사용자 정보 요청
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const userData = userInfoResponse.data;

      const isExistingUser = await this.checkUserExist(userData.email);
      const user = await this.findOrCreateUser({
        email: userData.email,
        name: userData.name,
        nickname: userData.given_name,
        profile_url: userData.picture,
        auth_provider: 'google',
      });

      const jwt = this.generateAccessToken(user.id);
      const refreshToken = await this.generateRefreshToken(user.id); // 리프레시 토큰 생성

      // Redis에 리프레시 토큰 저장
      await this.storeRefreshToken(user.id, refreshToken);

      const responseUser = this.filterUserFields(user);

      return {
        user: responseUser,
        accessToken: jwt,
        refreshToken: refreshToken, // 리프레시 토큰 반환
        isExistingUser,
      };
    } catch (error) {
      throw new HttpException(
        ErrorMessages.SERVER.INTERNAL_ERROR.text,
        ErrorMessages.SERVER.INTERNAL_ERROR.code
      );
    }
  }

  async handleGithubCallback(code: string) {
    try {
      // GitHub 토큰 요청
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          code,
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );

      const { access_token } = tokenResponse.data;
      // GitHub 사용자 정보 요청
      const userInfoResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userData = userInfoResponse.data;

      // GitHub 사용자 이메일 요청 (필요 시)
      let email = userData.email;
      if (!email) {
        const emailResponse = await axios.get(
          'https://api.github.com/user/emails',
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );

        const primaryEmail = emailResponse.data.find(
          (e: any) => e.primary && e.verified
        );
        email = primaryEmail?.email;
      }

      if (!email) {
        throw new Error('GitHub 사용자 이메일을 확인할 수 없습니다.');
      }

      const isExistingUser = await this.checkUserExist(email);
      const user = await this.findOrCreateUser({
        email,
        name: userData.name || userData.login,
        nickname: userData.login,
        profile_url: userData.avatar_url,
        auth_provider: 'github',
      });

      const jwt = this.generateAccessToken(user.id);
      const refreshToken = await this.generateRefreshToken(user.id); // 리프레시 토큰 생성

      // Redis에 리프레시 토큰 저장
      await this.storeRefreshToken(user.id, refreshToken);
      const responseUser = this.filterUserFields(user);
      return {
        user: responseUser,
        accessToken: jwt,
        refreshToken: refreshToken, // 리프레시 토큰 반환
        isExistingUser,
      };
    } catch (error) {
      throw new HttpException(
        ErrorMessages.SERVER.INTERNAL_ERROR.text,
        ErrorMessages.SERVER.INTERNAL_ERROR.code
      );
    }
  }

  private async checkUserExist(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !!user;
  }
  // 사용자 찾기 또는 생성
  async findOrCreateUser(profile: AuthUserDto) {
    return this.prisma.user.upsert({
      where: { email: profile.email },
      update: {}, // 이미 존재하면 아무것도 업데이트하지 않음
      create: {
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

  private filterUserFields(user: any) {
    return {
      user_id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profile_url: user.profile_url,
      auth_provider: user.auth_provider,
      role_id: user.role_id,
    };
  }

  async generateAccessToken(userId: number): Promise<string> {
    return this.jwtService.sign({ user_id: userId }, { expiresIn: '1h' });
  }

  async generateRefreshToken(userId: number): Promise<string> {
    return this.jwtService.sign({ user_id: userId }, { expiresIn: '1h' });
  }

  // 리프레시 토큰 저장
  async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    const ttl = 7 * 24 * 60 * 60; // 7일
    await this.redisService.set(key, refreshToken, ttl);
  }

  // 리프레시 토큰 검증
  async validateRefreshToken(userId: number, token: string): Promise<boolean> {
    const key = `refresh_token:${userId}`;
    const storedToken = await this.redisService.get(key);
    return storedToken === token;
  }

  // 리프레시 토큰 삭제
  async deleteRefreshToken(userId: number): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.redisService.del(key);
  }
  // 사용자 Role 업데이트
  async updateUserRole(userId: number, roleId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = ErrorMessages.AUTH.USER_NOT_FOUND;
      throw new HttpException(error.text, error.code);
    }

    // 역할에 따른 메시지 생성
    const roleMessages = {
      1: '프로그래머로 변경되었습니다.',
      2: '아티스트로 변경되었습니다.',
      3: '디자이너로 변경되었습니다.',
    };

    if (!roleMessages[roleId]) {
      throw new HttpException(
        '유효하지 않은 역할 ID입니다.',
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // 사용자 역할 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role_id: roleId },
    });

    return {
      user: {
        user_id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        nickname: updatedUser.nickname,
        role_id: updatedUser.role_id,
      },
      message: roleMessages[roleId], // 역할별 메시지 추가
    };
  }
}
