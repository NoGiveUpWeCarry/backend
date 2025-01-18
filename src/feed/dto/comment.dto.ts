import { IsString, IsNotEmpty } from 'class-validator';

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
