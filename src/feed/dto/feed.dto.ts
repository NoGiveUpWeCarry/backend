import { IsString, IsArray, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class FeedDto {
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  title: string;

  @IsArray({ message: '태그는 배열이어야 합니다.' })
  @ArrayNotEmpty({ message: '태그를 하나 이상 입력해주세요' })
  @IsString({ each: true })
  tags: string[];

  @IsString({ message: '내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '내용을 입력해주세요' })
  content: string;
}
