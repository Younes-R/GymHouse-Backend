import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const payload = await this.usersService.createClient(createUserDto);

    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async login(email: string, password: string) {
    const foundUser = await this.usersService.findOneByEmail(email);

    if (!foundUser) {
      throw new NotFoundException('No users found with this email');
    }

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Wrong password');
    }

    const payload = {
      userId: foundUser.userId,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      role: foundUser.userType,
    };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
