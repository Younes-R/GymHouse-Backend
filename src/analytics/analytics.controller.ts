import { Controller, Get } from '@nestjs/common';
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
}
