import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { AdminSubscriptionsController } from './adminSubscriptions.controller';

@Module({
  imports: [DatabaseModule, PaymentsModule],
  controllers: [SubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
