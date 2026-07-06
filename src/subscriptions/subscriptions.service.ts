import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PlanType } from 'generated/prisma/enums';
import { PaymentMethod } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { PaymentsService } from 'src/payments/payments.service';
import { Checkout } from 'src/chargily-pay/interfaces/checkout.interface';

@Injectable()
export class SubscriptionsService {
  constructor(
    private databaseService: DatabaseService,
    private paymentService: PaymentsService,
  ) {}

  private getSubscriptionEndDate(
    startingDate: string,
    planType: PlanType,
  ): Date {
    const start = new Date(startingDate);
    const end = new Date(start);

    switch (planType) {
      case PlanType.WEEKLY:
        end.setUTCDate(end.getUTCDate() + 7);
        break;
      case PlanType.MONTHLY:
        end.setUTCMonth(end.getUTCMonth() + 1);
        break;
      case PlanType.YEARLY:
        end.setUTCFullYear(end.getUTCFullYear() + 1);
        break;
    }

    return end;
  }

  private async getPaidOverlappingSubscriptions(
    userId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return await this.databaseService.$queryRaw<
      Array<{ subscriptionId: number }>
    >`
    SELECT s."subscriptionId"
    FROM "Subscription" s
    JOIN "Payment" p ON p."subscriptionId" = s."subscriptionId"
    WHERE p."paymentStatus" = 'PAID'
    AND s."userId" = ${userId}
    AND s."subscrptionTime" && tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)') 
    `;
  }

  private async createDBSubscriptionRecord(
    userId: number,
    plan: { planId: number; price: number },
    startDate: Date,
    endDate: Date,
  ) {
    const [created] = await this.databaseService.$queryRaw<
      Array<{
        subscriptionId: number;
        userId: number;
        planId: number;
        priceAtPurchase: number;
        subscrptionTime: string;
        createdAt: Date;
      }>
    >`
    INSERT INTO "Subscription" (
        "userId",
        "planId",
        "priceAtPurchase",
        "subscrptionTime",
        "createdAt"
    )
    VALUES (
        ${userId},
        ${plan.planId},
        ${plan.price},
        tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)'),
        now()
    )
    RETURNING
        "subscriptionId",
        "userId",
        "planId",
        "priceAtPurchase",
        "subscrptionTime"::text AS "subscrptionTime",
        "createdAt"
    `;
    return created;
  }

  async create(
    userId: number,
    createSubscriptionDto: CreateSubscriptionDto,
    paymentMethod: PaymentMethod,
  ) {
    const plan = await this.databaseService.plan.findUnique({
      where: {
        planId: createSubscriptionDto.planId,
      },
    });

    if (!plan) {
      throw new BadRequestException('Choose a valid plan');
    }

    const startDate = new Date(createSubscriptionDto.startDate);
    const endDate = this.getSubscriptionEndDate(
      createSubscriptionDto.startDate,
      plan.planType,
    );

    const paidOverlappingSubs = await this.getPaidOverlappingSubscriptions(
      userId,
      startDate,
      endDate,
    );

    if (paidOverlappingSubs.length > 0) {
      throw new BadRequestException(
        'There are paid overlapping subscriptions with this new subscription',
      );
    }

    try {
      const subscription = await this.createDBSubscriptionRecord(
        userId,
        plan,
        startDate,
        endDate,
      );

      let checkout: Checkout | null = null;
      if (paymentMethod === 'ONLINE') {
        checkout = await this.paymentService.createCheckout(plan.price);
      }

      const payment = await this.databaseService.payment.create({
        data: {
          subscriptionId: subscription.subscriptionId,
          paymentMethod,
          transactionId: checkout ? checkout.id : null,
          paymentStatus: paymentMethod === 'CASH' ? 'PAID' : 'PENDING',
        },
      });

      return { subscription, checkout_url: checkout?.checkout_url };
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2010'
      ) {
        throw new BadRequestException(
          'Cannot create overlapping subscriptions',
        );
      }
      console.error(err);
      throw new InternalServerErrorException();
    }
  }
}
