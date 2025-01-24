import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthUserDto } from '../dto/auth-user.dto';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_DEPLOY_URL,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<AuthUserDto> {
    const { id, emails, displayName, username, photos } = profile;

    if (!emails || emails.length === 0) {
      throw new Error('No email associated with this GitHub account');
    }

    return {
      email: emails[0].value,
      name: displayName || username,
      nickname: username,
      profile_url: photos[0]?.value || null,
      auth_provider: 'github',
    };
  }
}
