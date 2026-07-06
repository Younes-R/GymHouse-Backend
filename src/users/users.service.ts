import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async createClient(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(createUserDto.password, salt);

    try {
      const birthDate = new Date(createUserDto.birthDate);
      return await this.databaseService.user.create({
        data: {
          ...createUserDto,
          birthDate,
          password: hash,
          userType: 'CLIENT',
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          userType: true,
        },
      });
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email is already used');
      }
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async findOneByEmail(email: string) {
    try {
      return await this.databaseService.user.findUnique({
        where: {
          email,
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          userType: true,
          password: true,
        },
      });
    } catch (err: any) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }
}
