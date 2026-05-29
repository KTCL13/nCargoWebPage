import { contractsService } from '../contracts.service'
import { prismaMock } from '@/lib/__mocks__/prisma'

describe('ContractsService', () => {
  describe('findAll', () => {
    it('should return all contracts with related employee and job', async () => {
      const fullContract: any = {
        id: 1,
        salary: 1000,
        employee: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        job: { id: 1, title: 'Developer' },
        contractType: { id: 1, name: 'Full-time' },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // First findMany returns distinct employeeId rows
      prismaMock.contract.findMany.mockResolvedValue([{ employeeId: 1 } as any]);
      // findFirst returns the full contract per employee
      prismaMock.contract.findFirst.mockResolvedValue(fullContract);

      const result = await contractsService.findAll(1, 10, '');

      expect(prismaMock.contract.findMany).toHaveBeenCalled();
      expect(result.data[0].employee.name).toBe('John Doe');
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update contract correctly', async () => {
      const mockUpdated: any = {
        id: 1,
        salary: 2000,
        employee: { id: 1, firstName: 'John', lastName: 'Doe' },
        job: { id: 1, title: 'Developer' },
        contractType: { id: 1, name: 'Full-time' },
      };
      prismaMock.contract.update.mockResolvedValue(mockUpdated);

      const result = await contractsService.update(1, { salary: 2000 });

      expect(prismaMock.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { salary: 2000 }
        })
      );
      expect(result.salary).toBe(2000);
      expect(result.employee.name).toBe('John Doe');
    });
  });
});
