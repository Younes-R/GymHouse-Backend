import { Body, Controller, Post, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async createOnlineSubscription(
    @Req() req,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    // const userId = req.user.userId;
    return await this.subscriptionsService.create(
      1,
      createSubscriptionDto,
      'ONLINE',
    );
  }
}
