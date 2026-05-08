import { locationRepository } from "../repositories/location.repository";
import { LocationResponseDto } from "../dtos/location.dto";

class LocationService {
  async findCountries(): Promise<LocationResponseDto[]> {
    const locations = await locationRepository.findCountries();
    return locations.map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
      zipCode: l.zipCode ?? undefined,
    }));
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
