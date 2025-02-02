import {
  IsString,
  IsBoolean,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
  IsIn,
  Length,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @Length(1, 500)
  content: string;

  @IsString()
  @IsIn(['Programmer', 'Designer', 'Artist'])
  role: string;

  @IsString()
  @IsIn(['PROJECT', 'OUTSOURCING'])
  hub_type: string;

  @IsDateString()
  start_date: string;

  @IsString()
  duration: string;

  @IsString()
  @IsIn(['ONLINE', 'OFFLINE'])
  work_type: string;

  @IsBoolean()
  recruiting: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  detail_roles: string[];
}
