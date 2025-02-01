import { IsNotEmpty } from 'class-validator';
import { GetMessageDto } from './getMessage.dto';

export class SearchMessageDto extends GetMessageDto {
  @IsNotEmpty({ message: '검색어를 입력해주세요' })
  keyword: any;
}
