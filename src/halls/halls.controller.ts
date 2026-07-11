import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HallsService } from './halls.service';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('enter')
  async requestAccess(@Req() req) {
    const userId: number = req.user.userId;
    return await this.hallsService.requestAccess(userId);
  }

  @Post('exit')
  async registerExit(@Req() req) {
    const userId: number = req.user.userId;
    return await this.hallsService.registerExit(userId);
  }
}
