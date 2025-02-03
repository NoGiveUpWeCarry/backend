import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
          redirect_uri: process.env.GOOGLE_CALLBACK_DEPLOY_URL,
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

      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id); // 리프레시 토큰 생성

      // Redis에 리프레시 토큰 저장
      await this.storeRefreshToken(user.id, refreshToken);

      const responseUser = this.filterUserFields(user);

      return {
        user: responseUser,
        accessToken,
        refreshToken,
        isExistingUser,
      };
    } catch (error) {
      console.error(error);
      // throw new HttpException(
      //   ErrorMessages.SERVER.INTERNAL_ERROR.text,
      //   ErrorMessages.SERVER.INTERNAL_ERROR.code
      // );
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
          redirect_uri: process.env.GITHUB_CALLBACK_DEPLOY_URL,
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

      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id); // 리프레시 토큰 생성

      // Redis에 리프레시 토큰 저장
      await this.storeRefreshToken(user.id, refreshToken);
      const responseUser = this.filterUserFields(user);

      return {
        user: responseUser,
        accessToken,
        refreshToken,
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
    // 이메일로 유저 찾기
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      return existingUser; // 기존 유저 반환
    }

    // 새 유저 생성
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

  // 회원가입 로직
  async signup(email: string, nickname: string, password: string) {
    // 이메일 중복 확인
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    // 닉네임 중복 확인 및 처리
    let uniqueNickname = nickname;
    let isNicknameUnique = false;

    while (!isNicknameUnique) {
      const existingUserByNickname = await this.prisma.user.findUnique({
        where: { nickname: uniqueNickname },
      });

      if (!existingUserByNickname) {
        isNicknameUnique = true; // 중복되지 않은 닉네임
      } else {
        // 닉네임 뒤에 랜덤 문자열 추가
        uniqueNickname = `${nickname}_${Math.floor(1000 + Math.random() * 9000)}`; // 랜덤 4자리 숫자 추가
      }
    }

    // 새로운 사용자 생성
    const newUser = await this.prisma.user.create({
      data: {
        email,
        name: uniqueNickname,
        nickname: uniqueNickname,
        password,
        auth_provider: 'pad', // 소셜 로그인과 구분
        role: { connect: { id: 1 } },
        status: { connect: { id: 1 } },
      },
    });

    return {
      userId: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
    };
  }

  // 로그인 로직
  async login(email: string, password: string) {
    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user || user.password !== password) {
      throw new HttpException(
        '유효하지 않는 이메일 혹은 비밀번호 입니다',
        HttpStatus.FORBIDDEN
      );
    }

    // 액세스 토큰 및 리프레시 토큰 생성
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Redis에 리프레시 토큰 저장
    await this.storeRefreshToken(user.id, refreshToken);
    const responseUser = this.filterUserFields(user);
    return {
      user: responseUser,
      accessToken,
    };
  }
  private filterUserFields(user: any) {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profileUrl: user.profile_url,
      authProvider: user.auth_provider,
      roleId: user.role_id,
    };
  }

  generateAccessToken(userId: number): string {
    console.log(`Access Token 생성: userId=${userId}`);
    return this.jwtService.sign(
      { userId },
      { expiresIn: '7d', secret: process.env.ACCESS_TOKEN_SECRET }
    );
  }

  generateRefreshToken(userId: number): string {
    console.log(`Refresh Token 생성: userId=${userId}`);
    return this.jwtService.sign(
      { userId },
      { expiresIn: '7d', secret: process.env.REFRESH_TOKEN_SECRET }
    );
  }

  getUserIdFromRefreshToken(refreshToken: string): number | null {
    try {
      console.log('Refresh Token 디코딩 중...');
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
      console.log('Refresh Token 디코딩 성공:', payload);
      return payload.userId;
    } catch (error) {
      console.error('Refresh Token 디코딩 실패:', error.message);
      return null;
    }
  }
  // 리프레시 토큰 저장
  async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    const ttl = 7 * 24 * 60 * 60; // 7일
    console.log(
      `Redis에 Refresh Token 저장: key=${key}, token=${refreshToken}`
    );
    await this.redisService.set(key, refreshToken, ttl);
  }

  // 리프레시 토큰 검증
  async validateRefreshToken(userId: number, token: string): Promise<boolean> {
    const key = `refresh_token:${userId}`;
    console.log(`Redis에서 Refresh Token 조회: key=${key}`);
    const storedToken = await this.redisService.get(key);
    console.log('Redis에서 조회된 Refresh Token:', storedToken);
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

    const result = {
      user: {
        user_id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        nickname: updatedUser.nickname,
        role_id: updatedUser.role_id,
      },
      message: roleMessages[roleId],
    };
    return result;
  }

  async renewAccessToken(userId: number): Promise<string> {
    const redisKey = `refresh_token:${userId}`;
    const refreshToken = await this.redisService.get(redisKey);

    if (!refreshToken) {
      console.error(`No refresh token found for Redis key: ${redisKey}`);
      throw new Error('Refresh token not found for user');
    }

    console.log(`Retrieved refresh token from Redis: ${refreshToken}`);

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        algorithms: ['HS256'], // 생성 시와 동일한 알고리즘
      });
      console.log(`Decoded payload:`, payload);

      if (payload.userId !== userId) {
        console.error(
          `Token userId mismatch. Expected: ${userId}, Got: ${payload.userId}`
        );
        throw new Error('Invalid refresh token');
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpException(
          'Refresh token has expired',
          HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException(
        'Refresh token validation failed',
        HttpStatus.UNAUTHORIZED
      );
    }

    const newAccessToken = this.jwtService.sign(
      { userId },
      { expiresIn: '15m', secret: process.env.ACCESS_TOKEN_SECRET }
    );

    console.log(`Generated new access token: ${newAccessToken}`);
    return newAccessToken;
  }
}
