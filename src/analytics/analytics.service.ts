import { Injectable } from '@nestjs/common';
import { Gender, PaymentStatus } from 'generated/prisma/enums';
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

  async getPaymentStatusRatios() {
    return await this.databaseService.$queryRaw<
      Array<{ paymentStatus: PaymentStatus; total: number }>
    >`
    SELECT "paymentStatus", COUNT(*)::INT AS "total"
    FROM "Payment"
    GROUP BY "paymentStatus"`;
  }

  async getProfits(filterBy: 'quarter' | 'month' | 'year') {
    switch (filterBy) {
      case 'month':
        return await this.databaseService.$queryRaw<
          Array<{ month: string; totalAmount: number }>
        >`
        SELECT
        CONCAT(EXTRACT(YEAR FROM p."updatedAt"), '-', EXTRACT(Month FROM p."updatedAt")) AS "month",
        SUM(s."priceAtPurchase") AS "totalAmount"
        FROM "Payment" p
        JOIN "Subscription" s ON p."subscriptionId" = s."subscriptionId"
        WHERE p."paymentStatus" = 'PAID'
        GROUP BY "month"
        ORDER BY "month";`;
        break;

      case 'quarter':
        return await this.databaseService.$queryRaw<
          Array<{ quarter: string; totalAmount: number }>
        >`
        SELECT
        CONCAT(EXTRACT(YEAR FROM p."updatedAt"), '-Q', EXTRACT(QUARTER FROM p."updatedAt")) AS "quarter",
        SUM(s."priceAtPurchase") AS "totalAmount"
        FROM "Payment" p
        JOIN "Subscription" s ON p."subscriptionId" = s."subscriptionId"
        -- GROUP BY EXTRACT(YEAR FROM p."updatedAt"), EXTRACT(QUARTER FROM p."updatedAt")
        -- ORDER BY EXTRACT(YEAR FROM p."updatedAt"), EXTRACT(QUARTER FROM p."updatedAt");
        WHERE p."paymentStatus" = 'PAID'
        GROUP BY "quarter"
        ORDER BY "quarter";`;
        break;

      case 'year':
        return await this.databaseService.$queryRaw<
          Array<{ year: string; totalAmount: number }>
        >`
        SELECT
        CONCAT(EXTRACT(YEAR FROM p."updatedAt")) AS "year",
        SUM(s."priceAtPurchase") AS "totalAmount"
        FROM "Payment" p
        JOIN "Subscription" s ON p."subscriptionId" = s."subscriptionId"
        WHERE p."paymentStatus" = 'PAID'
        GROUP BY "year"
        ORDER BY "year";`;
        break;

      default:
        break;
    }
  }

  async getPaidSubscriptionsGroupedByCreationDateAndUserGender() {
    return await this.databaseService.$queryRaw<
      Array<{ subscriptionCreationDate: string; gender: Gender; total: number }>
    >`
    SELECT
	    CONCAT(EXTRACT(YEAR FROM s."createdAt"), '-', EXTRACT(MONTH FROM s."createdAt")) AS "subscriptionCreationDate",
	    u."gender",
      COUNT(*)::INT AS "total"
    FROM "Subscription" s
    JOIN "User" u ON s."userId" = u."userId"
    JOIN "Payment" p ON s."subscriptionId" = p."subscriptionId"
    WHERE p."paymentStatus" = 'PAID'
    GROUP BY "subscriptionCreationDate", u."gender"
    ORDER BY "subscriptionCreationDate"
	`;
  }

  async getAttendanceGroupedByAgeGroupAndGender() {
    return await this.databaseService.$queryRaw<
      Array<{
        gender: Gender;
        ageGroup: 'Under 18' | '18-25' | '26-35' | '36-50' | '51+';
        total: number;
      }>
    >`
    SELECT
      u."gender" AS "gender",
      CASE
          WHEN EXTRACT(YEAR FROM AGE(u."birthDate")) < 18 THEN 'Under 18'
          WHEN EXTRACT(YEAR FROM AGE(u."birthDate")) BETWEEN 18 AND 25 THEN '18-25'
          WHEN EXTRACT(YEAR FROM AGE(u."birthDate")) BETWEEN 26 AND 35 THEN '26-35'
          WHEN EXTRACT(YEAR FROM AGE(u."birthDate")) BETWEEN 36 AND 50 THEN '36-50'
          ELSE '51+'
      END AS "ageGroup",
      COUNT(*)::INT AS "total"
    FROM "Attendance" a
    JOIN "User" u ON a."userId" = u."userId"
    GROUP BY "gender", "ageGroup"`;
  }

  async getClientsAtChurnRisk() {
    return await this.databaseService.$queryRaw<
      Array<{
        userId: number;
        lastAttendanceDay: Date;
        daysSinceLastAttendance: number;
      }>
    >`
    SELECT
	    "userId",
	    MAX("startedAt"::DATE) AS "lastAttendanceDay",
	    CURRENT_DATE - MAX("startedAt"::DATE) AS "daysSinceLastAttendance"
    FROM "Attendance"
    GROUP BY "userId"
    HAVING CURRENT_DATE - MAX("startedAt"::DATE) > 45`;
  }
}
