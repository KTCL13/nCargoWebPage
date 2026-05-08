import { locationRepository } from "../repositories/location.repository";
import { LocationResponseDto } from "../dtos/location.dto";

class LocationService {
  async findCountries(): Promise<(LocationResponseDto & { code: string | null })[]> {
    const locations = await locationRepository.findCountries();
    return locations.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      code: l.code ?? null,
      zipCode: l.zipCode ?? undefined,
    }));
  }

  async createCountry(name: string, code: string): Promise<LocationResponseDto & { code: string | null }> {
    const location = await locationRepository.createCountry(name, code)
    return { id: location.id, name: location.name, type: location.type, code: location.code ?? null }
  }

  async findDepartmentsByCountry(
    countryId: number,
  ): Promise<LocationResponseDto[]> {
    const locations =
      await locationRepository.findDepartmentsByCountry(countryId);
    return locations.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      parentId: l.parentId ?? undefined,
    }));
  }

  async findCitiesByDepartment(
    departmentId: number,
  ): Promise<LocationResponseDto[]> {
    const locations =
      await locationRepository.findCitiesByDepartment(departmentId);
    return locations.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      zipCode: l.zipCode ?? undefined,
      parentId: l.parentId ?? undefined,
    }));
  }

  async updateLocation(id: number, name: string): Promise<void> {
    await locationRepository.updateLocation(id, name);
  }

  async findByCountry(country: string): Promise<{ id: number; city: string; region: string | null; country: string }[]> {
    const code = country.toUpperCase()
    if (!['CO', 'MX'].includes(code)) return []
    const cities = await locationRepository.findCitiesByCountryCode(code)
    return cities.map(l => ({
      id: l.id,
      city: l.name,
      region: l.parent?.name ?? null,
      country: code,
    }))
  }
}

export const locationService = new LocationService();
