import { Injectable } from '@nestjs/common';
import { Gender } from 'generated/prisma/enums';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AnalyticsService {
  constructor(private databaseService: DatabaseService) {}

  async getDemographics() {
    return await this.databaseService.$queryRaw<
      Array<{
        ageGroup: string;
        gender: BigInt;
        totalMembers: number;
      }>
    >`
    SELECT * FROM mv_demographic_age_groups
    `;
  }

  async getPeakAttendance() {
    return await this.databaseService.$queryRaw<
      Array<{ attendanceHour: number; gender: Gender; totalCheckIns: number }>
    >`
    SELECT * FROM mv_peak_attendance_hours
    `;
  }
}
