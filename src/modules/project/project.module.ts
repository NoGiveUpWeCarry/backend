import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaService } from '@prisma/prisma.service';
import { S3Module } from '@src/s3/s3.module';

@Module({
  imports: [AuthModule, S3Module],
  controllers: [ProjectController],
  providers: [ProjectService, PrismaService],
  exports: [ProjectService],
})
export class ProjectModule {}
