import { DispatchService } from './dispatch.service';
import { KycStatus } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

describe('DispatchService', () => {
  let service: DispatchService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      partnerProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'partner-1',
          userId: 'user-partner',
          kycStatus: KycStatus.APPROVED,
          user: { name: 'Raj' },
        }),
      },
      order: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };
    mockAudit = { log: jest.fn() };
    service = new DispatchService(mockPrisma, mockAudit);
  });

  it('throws ConflictException when job was already claimed by another partner (concurrency test)', async () => {
    // updateMany returns count: 0 when another partner claimed it first
    mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.acceptJob('ord-123', 'user-partner'),
    ).rejects.toThrow(ConflictException);
  });
});
