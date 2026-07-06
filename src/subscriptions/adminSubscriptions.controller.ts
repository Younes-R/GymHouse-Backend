import { Body, Controller, Post, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateOfflineSubscriptionDto } from './dto/create-offline-subscription.dto';

@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async createOfflineSubscription(
    @Body() createOfflineSubscriptionDto: CreateOfflineSubscriptionDto,
  ) {
    return await this.subscriptionsService.create(
      createOfflineSubscriptionDto.userId,
      createOfflineSubscriptionDto,
      'CASH',
    );
  }
}
