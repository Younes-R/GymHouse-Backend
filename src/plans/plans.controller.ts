import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanIdParam } from './dto/planId-param.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(AuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAll() {
    return await this.plansService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/update-price')
  async updatePrice(
    @Param() param: PlanIdParam,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return await this.plansService.updatePrice(+param.id, updatePlanDto.price);
  }
}
