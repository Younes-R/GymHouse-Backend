import { Test, TestingModule } from '@nestjs/testing';
import { AdminSubscriptionsController } from './adminSubscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('AdminSubscriptionsController', () => {
  let controller: AdminSubscriptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSubscriptionsController],
      providers: [SubscriptionsService],
    }).compile();

    controller = module.get<AdminSubscriptionsController>(
      AdminSubscriptionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
