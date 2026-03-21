import { Test, TestingModule } from '@nestjs/testing';
import { SponsorService } from './sponsor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SponsorService', () => {
  let service: SponsorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<SponsorService>(SponsorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
