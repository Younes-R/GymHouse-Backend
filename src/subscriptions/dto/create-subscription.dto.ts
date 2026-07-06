import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsNumber()
  planId!: number;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;
}
