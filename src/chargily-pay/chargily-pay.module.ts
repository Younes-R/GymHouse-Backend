import { Module } from '@nestjs/common';
import { ChargilyPayService } from './chargily-pay.service';

@Module({
  providers: [ChargilyPayService],
  exports: [ChargilyPayService],
})
export class ChargilyPayModule {}
