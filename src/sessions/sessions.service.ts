import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Gender, Prisma } from 'generated/prisma/client';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createSessionDto: CreateSessionDto) {
    const start = new Date(createSessionDto.startTime);
    const end = new Date(createSessionDto.endTime);

    try {
      const [createdSession] = await this.databaseService.$queryRaw<
        Array<{ sessionId: number; start: Date; end: Date; gender: Gender }>
      >`
    INSERT INTO "Session" ("sessionTime", "gender")
    VALUES (
        tstzrange(${start.toISOString()}, ${end.toISOString()}, '[)'),
        ${createSessionDto.gender}
    )
    RETURNING
      "sessionId",
      lower("sessionTime") AS start,
      upper("sessionTime") AS end,
      "gender"
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
        Array<{ sessionId: number; start: Date; end: Date; gender: Gender }>
      >`
      SELECT "sessionId", lower("sessionTime") AS start, upper("sessionTime") AS end, "gender"
      FROM "Session"
      `;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async update(sessionId: number, updateSessionDto: UpdateSessionDto) {
    const newStart = updateSessionDto.startTime
      ? new Date(updateSessionDto.startTime)
      : null;
    const newEnd = updateSessionDto.endTime
      ? new Date(updateSessionDto.endTime)
      : null;

    try {
      const [updated] = await this.databaseService.$queryRaw<
        Array<{
          sessionId: number;
          start: Date;
          end: Date;
          gender: Gender;
        }>
      >`
    UPDATE "Session"
    SET 
      "gender" = COALESCE(${updateSessionDto.gender}, "gender"),
      "sessionTime" = CASE
        WHEN ${newStart}::timestamptz IS NOT NULL AND ${newEnd}::timestamptz IS NOT NULL
          THEN tstzrange(${newStart?.toISOString()}, ${newEnd?.toISOString()}, '[)')
        WHEN ${newStart}::timestamptz IS NOT NULL
          THEN tstzrange(${newStart?.toISOString()}, upper("sessionTime"), '[)')
        WHEN ${newEnd}::timestamptz IS NOT NULL
          THEN tstzrange(lower("sessionTime"), ${newEnd?.toISOString()}, '[)')
        ELSE "sessionTime"
      END
    WHERE "sessionId" = ${sessionId}
    RETURNING 
      "sessionId",
      lower("sessionTime") AS start,
      upper("sessionTime") AS end,
      "gender"
    `;

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

          default:
            break;
        }
      }
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async delete(sessionId: number) {
    try {
      const deletedSessions = await this.databaseService.$queryRaw<
        Array<{ sessionId: number; start: Date; end: Date; gender: Gender }>
      >`
      DELETE FROM "Session"
      WHERE "sessionId" = ${sessionId}
      RETURNING
        "sessionId",
        lower("sessionTime") AS start,
        upper("sessionTime") AS end,
        "gender"
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
