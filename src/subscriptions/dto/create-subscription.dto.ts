import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';
import { IsDateAfterNow } from '../is-date-after-now.decorator';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsNumber()
  planId!: number;

  @IsNotEmpty()
  @IsDateString()
  @IsDateAfterNow()
  startDate!: string;
}
