import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { QueueName } from 'src/pgmq/enums/queue-name.enum';
import { PGMQMessage } from 'src/pgmq/interfaces/pgmq-message.interface';
import { PgmqService } from 'src/pgmq/pgmq.service';
import { ChargilyPayService } from 'src/chargily-pay/chargily-pay.service';
import { Checkout } from 'src/chargily-pay/interfaces/checkout.interface';
import { PaymentStatus } from 'generated/prisma/enums';

@Injectable()
export class PaymentStatusWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentStatusWorker.name);
  private isRunning = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly pgmqService: PgmqService,
    private readonly chargilyPayService: ChargilyPayService,
  ) {}

  async onModuleInit() {
    this.isRunning = true;
    this.pollQueue(); // start background loop without awaiting
    this.logger.log('Job started');
  }

  onModuleDestroy() {
    this.isRunning = false; // graceful stop on shutdown
  }

  private async pollQueue() {
    while (this.isRunning) {
      try {
        const messages = await this.pgmqService.read<{ transactionId: string }>(
          QueueName.PAYMENTS_CHECKS_QUEUE,
        );

        // if queue is empty, pause for 2s to save DB CPU
        if (!messages || messages.length === 0) {
          this.logger.log('Message queue is empty. Waiting for 2secs...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        const message = messages[0];
        await this.handlePaymentCheck(message);
      } catch (err) {
        this.logger.error('Job failed', err);
        // pause briefly on DB/network errors before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private async handlePaymentCheck(
    message: PGMQMessage<{ transactionId: string }>,
  ) {
    const payment = await this.databaseService.payment.findFirst({
      where: {
        transactionId: message.message.transactionId,
      },
    });

    if (!payment) {
      this.logger.warn('No payment found for the transactionId provided');
      await this.pgmqService.delete(
        QueueName.PAYMENTS_CHECKS_QUEUE,
        Number(message.msg_id),
      );
      return;
    }

    if (payment.paymentStatus === 'PENDING') {
      const updatedCheckout: Checkout =
        await this.chargilyPayService.getCheckout(
          message.message.transactionId,
        );

      if (updatedCheckout.status === 'processing') return;

      await this.databaseService.payment.update({
        where: {
          paymentId: payment.paymentId,
        },
        data: {
          paymentStatus:
            updatedCheckout.status === 'pending'
              ? 'EXPIRED'
              : (updatedCheckout.status.toUpperCase() as PaymentStatus),
        },
      });
    }

    await this.pgmqService.delete(
      QueueName.PAYMENTS_CHECKS_QUEUE,
      Number(message.msg_id),
    );

    // console.log('Done with transcation of ID=' + payment.transactionId);
  }
}
