import { Test, TestingModule } from '@nestjs/testing';
import { PgmqService } from './pgmq.service';

describe('PgmqService', () => {
  let service: PgmqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PgmqService],
    }).compile();

    service = module.get<PgmqService>(PgmqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
