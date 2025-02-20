import { IsNotEmpty, IsOptional } from 'class-validator';
import { GetMessageDto } from './getMessage.dto';
import { Type } from 'class-transformer';

export class SearchMessageDto extends GetMessageDto {
  @IsOptional()
  @Type(() => Number)
  cursor?: number;

  @IsNotEmpty({ message: '검색어를 입력해주세요' })
  keyword: any;
}
