import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAuditWorker } from './payment-audit.worker';

describe('PaymentAuditWorker', () => {
  let worker: PaymentAuditWorker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentAuditWorker],
    }).compile();

    worker = module.get<PaymentAuditWorker>(PaymentAuditWorker);
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });
});
