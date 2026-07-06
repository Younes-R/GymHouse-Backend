import { Test, TestingModule } from '@nestjs/testing';
import { ChargilyPayService } from './chargily-pay.service';

describe('ChargilyPayService', () => {
  let service: ChargilyPayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargilyPayService],
    }).compile();

    service = module.get<ChargilyPayService>(ChargilyPayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
