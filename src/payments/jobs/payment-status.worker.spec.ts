import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatusWorker } from './payment-status.worker';

describe('PaymentStatusWorker', () => {
  let worker: PaymentStatusWorker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentStatusWorker],
    }).compile();

    worker = module.get<PaymentStatusWorker>(PaymentStatusWorker);
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });
});
