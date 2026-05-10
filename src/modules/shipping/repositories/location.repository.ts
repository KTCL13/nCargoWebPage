import { prisma } from "@/lib/prisma";

class LocationRepository {
  findCountries() {
    return prisma.location.findMany({
      where: { type: "COUNTRY", parentId: null },
      orderBy: { name: "asc" },
    });
  }

  createCountry(name: string, code: string) {
    return prisma.location.create({
      data: { name, type: "COUNTRY", code: code.toUpperCase() },
    });
  }

  // Find departments by country
  findDepartmentsByCountry(countryId: number) {
    return prisma.location.findMany({
      where: { type: "DEPARTMENT", parentId: countryId },
      orderBy: { name: "asc" },
    });
  }

  // Find cities by department
  findCitiesByDepartment(departmentId: number) {
    return prisma.location.findMany({
      where: { type: "CITY", parentId: departmentId },
      orderBy: { name: "asc" },
    });
  }

  // Find city by name
  findCityByName(cityName: string) {
    return prisma.location.findFirst({
      where: {
        type: "CITY",
        name: { equals: cityName, mode: "insensitive" },
      },
    });
  }

  findCitiesByCountryCode(countryCode: string) {
    return prisma.location.findMany({
      where: {
        type: 'CITY',
        parent: { type: 'DEPARTMENT', parent: { type: 'COUNTRY', code: countryCode.toUpperCase() } },
      },
      include: { parent: true },
      orderBy: { name: 'asc' },
    })
  }

  findById(id: number) {
    return prisma.location.findUnique({ where: { id } });
  }

  updateLocation(id: number, name: string) {
    return prisma.location.update({ where: { id }, data: { name } });
  }
}

export const locationRepository = new LocationRepository();
