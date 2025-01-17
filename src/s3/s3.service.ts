import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as crypto from 'crypto';

@Injectable()
export class S3Service {
  private s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  private bucketName = process.env.AWS_S3_BUCKET_NAME;

  async uploadImage(
    userId: number,
    fileBuffer: Buffer,
    fileType: string
  ): Promise<string> {
    try {
      const fileName = `pad_users/profile_${crypto.randomUUID()}.${fileType}`;
      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucketName,
          Key: fileName,
          Body: fileBuffer,
          ContentType: `image/${fileType}`,
        })
        .promise();

      return uploadResult.Location;
    } catch (error) {
      console.error('S3 Upload Error:', error); // 에러 로깅
      throw new InternalServerErrorException('S3 업로드 중 오류 발생');
    }
  }
}
