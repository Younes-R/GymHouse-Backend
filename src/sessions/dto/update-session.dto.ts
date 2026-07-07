import {
  IsDateString,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Gender } from 'generated/prisma/enums';

export class UpdateSessionDto {
  @IsNotEmpty()
  @IsDateString()
  @IsISO8601()
  @IsOptional()
  startTime?: string;

  @IsNotEmpty()
  @IsDateString()
  @IsISO8601()
  @IsOptional()
  endTime?: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}
