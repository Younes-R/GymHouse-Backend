import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ChargilyPayModule } from 'src/chargily-pay/chargily-pay.module';
import { PaymentStatusWorker } from './jobs/payment-status.worker';
import { PgmqModule } from 'src/pgmq/pgmq.module';

@Module({
  imports: [DatabaseModule, ChargilyPayModule, PgmqModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentStatusWorker],
  exports: [PaymentsService],
})
export class PaymentsModule {}
