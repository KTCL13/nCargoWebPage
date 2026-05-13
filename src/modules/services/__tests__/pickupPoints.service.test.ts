import { pickupPointsService } from '../pickupPoints.service'
import { prismaMock } from '@/lib/__mocks__/prisma'

describe('PickupPointsService', () => {
  describe('findAll', () => {
    it('should return all offices with total count', async () => {
      // Se actualizan las propiedades para coincidir con el esquema esperado:
      // location -> address
      // active -> isActive
      // Se agregan: latitude, longitude, coverageRadiusMiles, locationId
      const mockOffices = [
        {
          id: 1,
          name: 'Office A',
          address: 'City A', // Cambiado de 'location'
          latitude: 10.0,    // Agregado
          longitude: 10.0,   // Agregado
          coverageRadiusMiles: null, // Agregado
          isActive: true,    // Cambiado de 'active'
          locationId: null,  // Agregado
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Se usa 'as any' porque Prisma espera objetos Decimal para lat/long, 
      // pero en el mock usamos números simples.
      prismaMock.office.findMany.mockResolvedValue(mockOffices as any);
      prismaMock.office.count.mockResolvedValue(1);

      const result = await pickupPointsService.findAll(1, 10, false);

      expect(prismaMock.office.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.office.count).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual(mockOffices);
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a new office', async () => {
      // El input de creación ahora requiere address, latitude y longitude
      const mockInput = {
        name: 'New Office',
        address: 'New Loc', // Cambiado de 'location'
        latitude: 10.0,     // Agregado
        longitude: 10.0     // Agregado
      };

      const mockOffice = {
        id: 1,
        ...mockInput,
        coverageRadiusMiles: null,
        isActive: true,
        locationId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaMock.office.create.mockResolvedValue(mockOffice as any);

      const result = await pickupPointsService.create(mockInput);

      expect(prismaMock.office.create).toHaveBeenCalledWith({ data: mockInput });
      expect(result).toEqual(mockOffice);
    });
  });
});