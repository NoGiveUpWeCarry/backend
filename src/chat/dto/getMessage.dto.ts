import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsOptional,
} from 'class-validator';

export class GetMessageDto {
  @IsNumber({}, { message: 'limit은 숫자타입으로 주어져야 합니다.' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'limit 값을 입력해주세요' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  cursor?: number;

  @IsString({ message: 'direction은 문자타입으로 주어져야 합니다' })
  @IsNotEmpty({ message: 'direction을 입력해주세요' })
  @IsIn(['forward', 'backward'], {
    message: 'direction은 forward/backward 중 하나로 주어져야 합니다.',
  })
  direction: string;
}
