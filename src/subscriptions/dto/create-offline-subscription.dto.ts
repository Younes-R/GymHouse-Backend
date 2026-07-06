import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateSubscriptionDto } from './create-subscription.dto';

export class CreateOfflineSubscriptionDto extends CreateSubscriptionDto {
  @IsNotEmpty()
  @IsNumber()
  userId!: number;
}
