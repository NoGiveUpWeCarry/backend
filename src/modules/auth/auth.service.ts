import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    try {
      console.log('Received Authorization Code:', code);

      // Google 토큰 요청
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_DEVELOP_URL,
        grant_type: 'authorization_code',
      });

      const { access_token } = tokenResponse.data;

      // Google 사용자 정보 요청
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userData = userInfoResponse.data;

      const isExistingUser = await this.checkUserExist(userData.email);
      const user = await this.findOrCreateUser({
        email: userData.email,
        name: userData.name,
        nickname: userData.given_name,
        profile_url: userData.picture,
        auth_provider: 'google',
      });

      const jwt = this.generateJwt(user);
      const responseUser = this.filterUserFields(user);

      return { user: responseUser, accessToken: jwt, isExistingUser };
    } catch (error) {
      console.error('Google OAuth Error:', error.response?.data || error.message);

      if (error.response?.data?.error === 'invalid_grant') {
        throw new Error('Authorization Code가 이미 사용되었거나 만료되었습니다.');
      }

      throw new Error('Google OAuth 인증 실패');
    }
  }

  async handleGithubCallback(code: string) {
    try {
      console.log('Received GitHub Authorization Code:', code);

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
        },
      );
      
      const { access_token } = tokenResponse.data;
      console.log(access_token);
      // GitHub 사용자 정보 요청
      const userInfoResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userData = userInfoResponse.data;

      // GitHub 사용자 이메일 요청 (필요 시)
      let email = userData.email;
      if (!email) {
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        const primaryEmail = emailResponse.data.find((e: any) => e.primary && e.verified);
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

      const jwt = this.generateJwt(user);
      const responseUser = this.filterUserFields(user);

      return { user: responseUser, accessToken: jwt, isExistingUser };
    } catch (error) {
      console.error('GitHub OAuth Error:', error.response?.data || error.message);

      if (error.response?.data?.error === 'bad_verification_code') {
        throw new Error('Authorization Code가 잘못되었거나 만료되었습니다.');
      }

      throw new Error('GitHub OAuth 인증 실패');
    }
  }

  private async checkUserExist(email: string): Promise<boolean>{
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !!user;
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

  private filterUserFields(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      profile_url: user.profile_url,
      auth_provider: user.auth_provider,
      role_id: user.role_id,
    };
  }

  private generateJwt(user: any) {
    const payload = { email: user.email, id: user.id };
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  // 사용자 Role 업데이트
  async updateUserRole(userId: number, roleId: number) {
    if (!userId) {
      throw new BadRequestException('유효하지 않은 사용자 ID입니다.');
    }

    // 사용자 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, // userId가 반드시 존재해야 함
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Role 메시지 설정
    let roleMessage = '';
    switch (roleId) {
      case 1:
        roleMessage = '프로그래머로 변경되었습니다.';
        break;
      case 2:
        roleMessage = '아티스트로 변경되었습니다.';
        break;
      case 3:
        roleMessage = '디자이너로 변경되었습니다.';
        break;
      default:
        throw new BadRequestException('유효하지 않은 역할 ID입니다.');
    }
    // 사용자 Role 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role_id: roleId },
    });

    return {
      message: {
        code : 200,
        text: `${roleMessage}`
      },
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        nickname: updatedUser.nickname,
        role_id: updatedUser.role_id,
      },
    };
  }
}
