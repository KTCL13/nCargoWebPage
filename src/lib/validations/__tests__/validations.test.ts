import { UpdateProfileSchema } from '../employee';
import { CreatePickupPointSchema, UpdatePickupPointSchema } from '../pickupPoints';
import { UpdateContractSchema } from '../contracts';

describe('Zod Validations', () => {
  describe('UpdateProfileSchema', () => {
    it('should pass with valid timezone', () => {
      const result = UpdateProfileSchema.safeParse({ timezone: 'America/Bogota' });
      expect(result.success).toBe(true);
    });

    it('should fail with invalid timezone', () => {
      const result = UpdateProfileSchema.safeParse({ timezone: 'Invalid/Timezone' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Timezone inválida');
      }
    });

    it('should fail if no fields are provided', () => {
      const result = UpdateProfileSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Nada que actualizar');
      }
    });
  });

  describe('PickupPointsSchema', () => {
    it('should pass valid creation data', () => {
      const result = CreatePickupPointSchema.safeParse({
        name: 'Main Office',
        location: '123 St',
        phone: '555-1234'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if name is missing', () => {
      const result = CreatePickupPointSchema.safeParse({
        location: '123 St',
        phone: '555-1234'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateContractSchema', () => {
    it('should pass valid update data', () => {
      const result = UpdateContractSchema.safeParse({
        salary: 2000,
        isActive: false
      });
      expect(result.success).toBe(true);
    });

    it('should allow null endDate', () => {
      const result = UpdateContractSchema.safeParse({
        endDate: null
      });
      expect(result.success).toBe(true);
    });
  });
});
