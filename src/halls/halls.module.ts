import { Module } from '@nestjs/common';
import { HallsService } from './halls.service';
import { HallsController } from './halls.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MqttModule } from 'src/mqtt/mqtt.module';

@Module({
  imports: [DatabaseModule, MqttModule],
  controllers: [HallsController],
  providers: [HallsService],
})
export class HallsModule {}
