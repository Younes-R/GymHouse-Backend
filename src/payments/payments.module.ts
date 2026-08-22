import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ChargilyPayModule } from 'src/chargily-pay/chargily-pay.module';
import { PaymentAuditWorker } from './jobs/payment-audit.worker';
import { PgmqModule } from 'src/pgmq/pgmq.module';

@Module({
  imports: [DatabaseModule, ChargilyPayModule, PgmqModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentAuditWorker],
  exports: [PaymentsService],
})
export class PaymentsModule {}
