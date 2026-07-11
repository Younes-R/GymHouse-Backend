import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateOfflineSubscriptionDto } from './dto/create-offline-subscription.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
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
