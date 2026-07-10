import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class HallsService {
  constructor(private databaseService: DatabaseService) {}

  private openHallDoor() {
    // this function should be calling the door IOT system to open the door
    return 'Door is open!';
  }

  private async getCurrentValidSubscriptions(userId: number) {
    return await this.databaseService.$queryRaw<
      Array<{
        subscriptionId: number;
      }>
    >`
    SELECT s."subscriptionId"
    FROM "Subscription" s
    JOIN "Payment" p ON s."subscriptionId" = p."subscriptionId"
    WHERE 
        s."subscrptionTime" @> now()
        AND s."userId" = ${userId}
        AND p."paymentStatus" = 'PAID'
    `;
  }
  private async getTodayUserAttendance(userId: number) {
    return await this.databaseService.$queryRaw<Array<{ attendaceId: number }>>`
    SELECT "attendanceId"
    FROM "Attendance"
    WHERE 
        "userId" = ${userId}
        AND "startedAt"::DATE = now()::DATE
    `;
  }

  private async getTodayAvailableSessions(userId: number) {
    return await this.databaseService.$queryRaw<Array<{ sessionId: number }>>`
    SELECT "sessionId"
    FROM "Session"
    WHERE
        "sessionTime" @> now()
        AND "gender" IN (SELECT "gender" FROM "User" WHERE "userId" = ${userId})
    `;
  }

  //   startedAt <= endedAt

  async requestAccess(userId: number) {
    const currentValidSubscription =
      await this.getCurrentValidSubscriptions(userId);

    if (currentValidSubscription.length === 0)
      throw new ForbiddenException('No current subscription found');

    const attendance = await this.getTodayUserAttendance(userId);

    if (attendance.length > 0)
      throw new ForbiddenException('Already attended today');

    const availableSessions = await this.getTodayAvailableSessions(userId);

    if (availableSessions.length === 0)
      throw new ForbiddenException('No available sessions currently');

    this.openHallDoor();

    const todayAttendance = await this.databaseService.attendance.create({
      data: {
        user: {
          connect: {
            userId,
          },
        },
        startedAt: new Date(),
      },
    });
    return todayAttendance;
  }

  async registerExit(userId: number) {
    const lastAttendance = await this.databaseService.attendance.findFirst({
      where: {
        userId,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!lastAttendance) throw new BadRequestException();

    if (lastAttendance.endedAt)
      throw new BadRequestException('You already registered your exit');

    this.openHallDoor();

    return await this.databaseService.attendance.update({
      data: {
        endedAt: new Date(),
      },
      where: {
        attendanceId: lastAttendance.attendanceId,
      },
    });
  }
}
