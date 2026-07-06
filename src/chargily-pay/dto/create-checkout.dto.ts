export class CreateCheckoutDto {
  amount!: number;
  currency!: string;
  success_url!: string;
  failure_url!: string;
  webhook_endpoint!: string;
}
