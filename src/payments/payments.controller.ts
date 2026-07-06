import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Headers,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async update(@Headers('signature') signature: string, @Req() req) {
    await this.paymentsService.update(signature, req);
  }
}
