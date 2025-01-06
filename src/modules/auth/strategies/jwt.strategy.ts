import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 만료된 토큰은 거부
      secretOrKey: process.env.JWT_SECRET, // 환경 변수에서 비밀키 가져오기
    });
  }

  async validate(payload: any) {
    return { userId: payload.userId, email: payload.email };
  }
}
