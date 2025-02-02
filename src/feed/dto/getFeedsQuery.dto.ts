import { IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetFeedsQueryDto {
  // 최신순
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  latest?: boolean;

  // 리밋
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  // 커서
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  cursor?: number;

  @IsOptional()
  tags?: string;
}
