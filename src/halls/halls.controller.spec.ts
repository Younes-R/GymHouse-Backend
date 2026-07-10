import { Test, TestingModule } from '@nestjs/testing';
import { HallsController } from './halls.controller';
import { HallsService } from './halls.service';

describe('HallsController', () => {
  let controller: HallsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HallsController],
      providers: [HallsService],
    }).compile();

    controller = module.get<HallsController>(HallsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
