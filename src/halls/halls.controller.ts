import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { HallsService } from './halls.service';

@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('enter')
  async requestAccess() {
    return await this.hallsService.requestAccess(4);
  }

  @Post('exit')
  async registerExit() {
    return await this.hallsService.registerExit(4);
  }
}
