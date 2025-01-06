import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경 변수를 글로벌하게 사용할 수 있도록 설정
    }),
    AuthModule, // Auth 모듈 추가
  ],
})
export class AppModule {}
