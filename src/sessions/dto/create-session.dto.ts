import { IsDateString, IsEnum, IsISO8601, IsNotEmpty } from 'class-validator';
import { Gender } from 'generated/prisma/enums';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsDateString()
  @IsISO8601()
  startTime!: string;

  @IsNotEmpty()
  @IsDateString()
  @IsISO8601()
  endTime!: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender!: Gender;
}
