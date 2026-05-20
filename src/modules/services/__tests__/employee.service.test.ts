import { employeeService } from '../employee.service'
import { prismaMock } from '@/lib/__mocks__/prisma'

describe('EmployeeService', () => {
  describe('getProfile', () => {
    it('should throw an error if employee is not found', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);
      await expect(employeeService.getProfile(999)).rejects.toThrow('Empleado no encontrado');
    });

    it('should return employee profile without passwordHash', async () => {
      const mockEmployee: any = {
        id: 1,
        firstName: 'Alice',
        passwordHash: 'secret123',
        contracts: []
      };
      prismaMock.employee.findUnique.mockResolvedValue(mockEmployee);
      
      const result = await employeeService.getProfile(1);
      
      expect(prismaMock.employee.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.firstName).toBe('Alice');
    });
  });

  describe('updateProfile', () => {
    it('should update employee profile successfully', async () => {
      prismaMock.employee.update.mockResolvedValue({ id: 1 } as any);
      
      const result = await employeeService.updateProfile(1, { firstName: 'Alice Updated' });
      
      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { firstName: 'Alice Updated' }
      });
      expect(result.message).toBe('Perfil actualizado');
    });
  });
});
