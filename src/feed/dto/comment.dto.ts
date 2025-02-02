import { IsString, IsNotEmpty } from 'class-validator';

export class CommentDto {
  @IsString({ message: '내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '내용을 입력해주세요' })
  content: string;
}
