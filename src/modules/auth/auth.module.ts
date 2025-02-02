import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaService } from '@src/prisma/prisma.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RedisModule } from '../redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    PassportModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET, // 비밀키 설정
      signOptions: { expiresIn: '1m' }, // 기본 만료 시간
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService, // Prisma 사용
    JwtStrategy, // JWT 검증 전략
    GitHubStrategy, // GitHub OAuth 전략
    GoogleStrategy, // Google OAuth 전략
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, JwtModule], // 다른 모듈에서 AuthService를 사용할 수 있도록 내보냄
})
export class AuthModule {}
