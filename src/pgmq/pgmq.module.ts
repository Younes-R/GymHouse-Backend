import { Module } from '@nestjs/common';
import { PgmqService } from './pgmq.service';

@Module({
  providers: [PgmqService],
  exports: [PgmqService],
})
export class PgmqModule {}
