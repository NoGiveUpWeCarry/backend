import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaModule } from '@src/prisma/prisma.module';
import { S3Module } from '@src/s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
