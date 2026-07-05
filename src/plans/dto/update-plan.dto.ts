import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePlanDto {
  @IsNotEmpty()
  @IsNumber()
  price!: number;
}
