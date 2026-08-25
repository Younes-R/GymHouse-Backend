import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { DayOfWeek, Gender, Prisma } from 'generated/prisma/client';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createSessionDto: CreateSessionDto) {
    try {
      const [createdSession] = await this.databaseService.$queryRaw<
        Array<{
          sessionId: number;
          gender: Gender;
          day: DayOfWeek;
          timeSlot: string;
          start: Date;
          end: Date;
        }>
      >`
      INSERT INTO "Session"("gender", "day", "timeSlot")
      VALUES (
        ${createSessionDto.gender}, ${createSessionDto.day}, timerange(${createSessionDto.startTime}, ${createSessionDto.endTime}, '[)')
      )
      RETURNING
        "sessionId",
        "gender",
        "day",
        "timeSlot",
        lower("timeSlot") AS start,
        upper("timeSlot") AS end
    `;
      return createdSession;
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2010'
      ) {
        switch ((err.meta?.driverAdapterError as any).cause.code) {
          case '23P01':
            throw new BadRequestException('Cannot create overlapping sessions');
            break;

          case '22000':
            throw new BadRequestException(
              'startTime must be less than or equal to endTime',
            );
            break;

          default:
            break;
        }
      }
      console.error(err);
      throw new InternalServerErrorException();
    }
  }
  async findAll() {
    try {
      return await this.databaseService.$queryRaw<
        Array<{
          sessionId: number;
          gender: Gender;
          day: DayOfWeek;
          timeSlot: string;
          start: Date;
          end: Date;
        }>
      >`
      SELECT "sessionId", "gender", "day", "timeSlot", lower("timeSlot") AS start, upper("timeSlot") AS end
      FROM "Session"
      `;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async update(sessionId: number, updateSessionDto: UpdateSessionDto) {
    const newStart = updateSessionDto.startTime;
    const newEnd = updateSessionDto.endTime;

    try {
      const [updated] = await this.databaseService.$queryRaw<
        Array<{
          sessionId: number;
          gender: Gender;
          day: DayOfWeek;
          timeSlot: string;
          start: Date;
          end: Date;
        }>
      >`
    UPDATE "Session"
    SET 
      "gender" = COALESCE(${updateSessionDto.gender}, "gender"),
      "day" = COALESCE(${updateSessionDto.day}, "day"),
      "timeSlot" = CASE
        WHEN ${newStart}::TIME IS NOT NULL AND ${newEnd}::TIME IS NOT NULL
          THEN timerange(${newStart}, ${newEnd}, '[)')
        WHEN ${newStart}::TIME IS NOT NULL
          THEN timerange(${newStart}, upper("timeSlot"), '[)')
        WHEN ${newEnd}::TIME IS NOT NULL
          THEN timerange(lower("timeSlot"), ${newEnd}, '[)')
        ELSE "timeSlot"
      END
    WHERE "sessionId" = ${sessionId}
    RETURNING 
      "sessionId",
      "gender",
      "day",
      "timeSlot",
      lower("timeSlot") AS start,
      upper("timeSlot") AS end
    `;

      if (!updated) throw new BadRequestException('No session found');

      return updated;
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2010'
      ) {
        switch ((err.meta?.driverAdapterError as any).cause.code) {
          case '23P01':
            throw new BadRequestException('Cannot create overlapping sessions');
            break;

          case '22000':
            throw new BadRequestException(
              'startTime must be less than or equal to endTime',
            );
            break;

          case '22007':
            throw new BadRequestException(
              'Invalid input syntax for startTime or endTime',
            );

          default:
            break;
        }
      }

      if (err instanceof BadRequestException) throw err;

      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async delete(sessionId: number) {
    try {
      const deletedSessions = await this.databaseService.$queryRaw<
        Array<{
          sessionId: number;
          gender: Gender;
          day: DayOfWeek;
          timeSlot: string;
          start: Date;
          end: Date;
        }>
      >`
      DELETE FROM "Session"
      WHERE "sessionId" = ${sessionId}
      RETURNING
        "sessionId",
        "gender",
        "day",
        "timeSlot",
        lower("timeSlot") AS start,
        upper("timeSlot") AS end
      `;

      if (deletedSessions.length === 0) {
        throw new BadRequestException('No session found');
      }

      return deletedSessions[0];
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;

      console.error(err);
      throw new InternalServerErrorException();
    }
  }
}
