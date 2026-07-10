import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('demographics')
  async getDemographics() {
    return await this.analyticsService.getDemographics();
  }

  @Get('peak-attendance')
  async getPeakAttendance() {
    return await this.analyticsService.getPeakAttendance();
  }

  @Get('payment-status-ratios')
  async getPaymentStatusRatios() {
    return await this.analyticsService.getPaymentStatusRatios();
  }

  @Get('payments')
  async getProfits(@Query('filterBy') filterBy: 'month' | 'quarter' | 'year') {
    return await this.analyticsService.getProfits(filterBy);
  }

  @Get('subscriptions/by-creation-date-and-gender')
  async getPaidSubscriptionsGroupedByCreationDateAndUserGender() {
    return await this.analyticsService.getPaidSubscriptionsGroupedByCreationDateAndUserGender();
  }

  @Get('attendance/by-age-groups-and-gender')
  async getAttendanceGroupedByAgeGroupAndGender() {
    return await this.analyticsService.getAttendanceGroupedByAgeGroupAndGender();
  }

  @Get('churn-risk-clients')
  async getClientsAtChurnRisk() {
    return await this.analyticsService.getClientsAtChurnRisk();
  }
}
