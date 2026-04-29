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

  async findByCountry(country: string): Promise<LocationResponseDto[]> {
    const nameMap: Record<string, string> = {
      CO: "Colombia",
      MX: "Mexico",
      US: "United States",
    };
    const countryName =
      nameMap[country.toUpperCase()] ??
      country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();

    const countries = await locationRepository.findCountries();
    const match = countries.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase(),
    );
    if (!match) return [];
    return this.findDepartmentsByCountry(match.id);
  }
}

export const locationService = new LocationService();
