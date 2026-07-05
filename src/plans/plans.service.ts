import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class PlansService {
  constructor(private databaseService: DatabaseService) {}

  async findAll() {
    return await this.databaseService.plan.findMany();
  }

  async updatePrice(planId: number, newPrice: number) {
    try {
      return await this.databaseService.plan.update({
        where: {
          planId,
        },
        data: {
          price: newPrice,
        },
      });
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new BadRequestException('Plan not found');
      }
      console.error(err);
      throw new InternalServerErrorException();
    }
  }
}
