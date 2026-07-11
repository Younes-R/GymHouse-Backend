import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async createOnlineSubscription(
    @Req() req,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const userId = req.user.userId;
    return await this.subscriptionsService.create(
      userId,
      createSubscriptionDto,
      'ONLINE',
    );
  }
}
