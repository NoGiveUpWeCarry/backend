import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '@prisma/prisma.service';

@Module({
  imports: [AuthModule], // AuthModule을 가져옴
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
