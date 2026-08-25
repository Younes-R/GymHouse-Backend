import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsISO8601, IsNotEmpty } from 'class-validator';
import { Gender, DayOfWeek } from 'generated/prisma/enums';

export function capitalize(value: string) {
  value = value.trim();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export class CreateSessionDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? capitalize(value) : value,
  )
  @IsNotEmpty()
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @IsNotEmpty()
  // @IsDateString()
  // @IsISO8601()
  startTime!: string;

  @IsNotEmpty()
  // @IsDateString()
  // @IsISO8601()
  endTime!: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender!: Gender;
}
