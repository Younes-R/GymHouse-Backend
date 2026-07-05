import { IsNumberString } from 'class-validator';

export class PlanIdParam {
  @IsNumberString()
  id!: number;
}
