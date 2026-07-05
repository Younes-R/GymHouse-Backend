import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlansService } from './plans.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanIdParam } from './dto/planId-param.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAll() {
    return await this.plansService.findAll();
  }

  @Post(':id/update-price')
  async updatePrice(
    @Param() param: PlanIdParam,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return await this.plansService.updatePrice(+param.id, updatePlanDto.price);
  }
}
