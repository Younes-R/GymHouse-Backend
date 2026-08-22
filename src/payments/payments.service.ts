import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ChargilyPayService } from 'src/chargily-pay/chargily-pay.service';
import { Request } from 'express';
import { Checkout } from 'src/chargily-pay/interfaces/checkout.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private databaseService: DatabaseService,
    private chargilyPayService: ChargilyPayService,
  ) {}

  async createCheckout(amount: number) {
    return await this.chargilyPayService.createCheckout(amount);
  }

  async getPaidOverlappingSubscriptions(transactionId: string) {
    try {
      const [{ lower, upper }] = (await this.databaseService.$queryRaw`
          SELECT 
          lower(s."subscrptionTime"), upper(s."subscrptionTime")
          FROM "Subscription" s
          JOIN "Payment" p ON p."subscriptionId" = s."subscriptionId"
          WHERE p."transactionId" = ${transactionId}
          `) as Array<{ upper: Date; lower: Date }>;

      return await this.databaseService.$queryRaw<
        Array<{ subscriptionId: number }>
      >`
          SELECT s."subscriptionId"
          FROM "Subscription" s
          JOIN "Payment" p ON p."subscriptionId" = s."subscriptionId"
          WHERE p."paymentStatus" = 'PAID'
          AND s."userId" IN (
            SELECT s."userId"
            FROM "Subscription" s
            JOIN "Payment" p ON p."subscriptionId" = s."subscriptionId"
            WHERE p."transactionId" = ${transactionId}
          )
          AND s."subscrptionTime" && tstzrange(${lower.toISOString()}, ${upper.toISOString()}, '[)')
          AND p."transactionId" <> ${transactionId}
          `;
    } catch (err: any) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async update(
    signatureHeader: string,
    request: Request & { rawBody: string },
  ) {
    const { isSignature, isRequestValid } =
      this.chargilyPayService.verifyRequest(signatureHeader, request);

    if (!isSignature) {
      throw new BadRequestException();
    }

    if (!isRequestValid) {
      throw new ForbiddenException();
    }

    const event = request.body;
    const checkout: Checkout = event.data;

    const payment = await this.databaseService.payment.findFirst({
      where: {
        transactionId: checkout.id,
      },
      select: {
        paymentId: true,
      },
    });

    switch (event.type) {
      case 'checkout.paid':
        const paidOverlappingSubs = await this.getPaidOverlappingSubscriptions(
          checkout.id,
        );

        if (paidOverlappingSubs.length > 0) {
          console.log('This must be refunded!');
        }

        return await this.databaseService.payment.update({
          where: {
            paymentId: payment?.paymentId,
          },
          data: {
            paymentStatus:
              paidOverlappingSubs.length > 0 ? 'REFUND_REQUIRED' : 'PAID',
          },
        });
        break;
      case 'checkout.failed':
        return await this.databaseService.payment.update({
          where: {
            paymentId: payment?.paymentId,
          },
          data: {
            paymentStatus: 'FAILED',
          },
        });
        break;
      case 'checkout.canceled':
        return await this.databaseService.payment.update({
          where: {
            paymentId: payment?.paymentId,
          },
          data: {
            paymentStatus: 'CANCELED',
          },
        });
        break;
      case 'checkout.expired':
        return await this.databaseService.payment.update({
          where: {
            paymentId: payment?.paymentId,
          },
          data: {
            paymentStatus: 'EXPIRED',
          },
        });
        break;
    }
  }
}
