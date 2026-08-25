import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { MqttService } from 'src/mqtt/mqtt.service';

@Injectable()
export class HallsService implements OnModuleInit {
  constructor(
    private databaseService: DatabaseService,
    private mqttService: MqttService,
  ) {}

  onModuleInit() {
    this.mqttService.subscribe('test/topic', this.testt);

    this.mqttService.subscribe(
      'turnstiles/+/enter/scan',
      this.requestAccess.bind(this),
    );
    this.mqttService.subscribe(
      'turnstiles/+/exit',
      this.registerExit.bind(this),
    );
  }

  testt = async (topic: string, payload: any) => {
    console.log(topic);
    console.log('This msg handler was registered from halls service!');
    this.mqttService.publish('test/topic2', {
      msg: 'this msg was published from halls service, nestJs server!',
    });
  };

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

  async requestAccess(topic: string, payload: { userId: number }) {
    const turnstileId = topic.split('/')[1];
    const currentValidSubscription = await this.getCurrentValidSubscriptions(
      payload.userId,
    );

    if (currentValidSubscription.length === 0) {
      this.mqttService.publish(`turnstiles/${turnstileId}/enter/command`, {
        res: 'ACCESS_DENIED',
      });
      return;
      // throw new ForbiddenException('No current subscription found');
    }

    const attendance = await this.getTodayUserAttendance(payload.userId);

    if (attendance.length > 0) {
      this.mqttService.publish(`turnstiles/${turnstileId}/enter/command`, {
        res: 'ACCESS_DENIED',
      });
      return;
      // throw new ForbiddenException('Already attended today');
    }

    const availableSessions = await this.getTodayAvailableSessions(
      payload.userId,
    );

    if (availableSessions.length === 0) {
      this.mqttService.publish(`turnstiles/${turnstileId}/enter/command`, {
        res: 'ACCESS_DENIED',
      });
      return;
      // throw new ForbiddenException('No available sessions currently');
    }

    this.mqttService.publish(`turnstiles/${turnstileId}/enter/command`, {
      res: 'ACCESS_GRANTED',
    });

    const todayAttendance = await this.databaseService.attendance.create({
      data: {
        user: {
          connect: {
            userId: payload.userId,
          },
        },
        startedAt: new Date(),
      },
    });
  }

  async registerExit(topic: string, payload: { userId: number }) {
    const lastAttendance = await this.databaseService.attendance.findFirst({
      where: {
        userId: payload.userId,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // if (!lastAttendance) throw new BadRequestException();
    if (!lastAttendance) {
      // console.log('last attendance not found');
      return;
    }

    if (lastAttendance.endedAt) return;
    // throw new BadRequestException('You already registered your exit');

    // this.openHallDoor();

    await this.databaseService.attendance.update({
      data: {
        endedAt: new Date(),
      },
      where: {
        attendanceId: lastAttendance?.attendanceId,
      },
    });
  }
}
