import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DayOfWeek, Gender } from 'generated/prisma/enums';
import { capitalize } from './create-session.dto';

export class UpdateSessionDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? capitalize(value) : value,
  )
  @IsNotEmpty()
  @IsOptional()
  @IsEnum(DayOfWeek)
  day?: DayOfWeek;

  @IsNotEmpty()
  // @IsDateString()
  // @IsISO8601()
  @IsOptional()
  startTime?: string;

  @IsNotEmpty()
  // @IsDateString()
  // @IsISO8601()
  @IsOptional()
  endTime?: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}
