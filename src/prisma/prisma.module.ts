import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // PrismaService를 전역으로 사용
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 다른 모듈에서 PrismaService를 사용할 수 있도록 내보내기
})
export class PrismaModule {}
