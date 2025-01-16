import { IsString, IsArray, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  @IsNotEmpty()
  content: string;
}
