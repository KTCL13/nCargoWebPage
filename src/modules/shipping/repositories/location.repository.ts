import { prisma } from "@/lib/prisma";

class LocationRepository {
  // Find all countries (top-level locations)
  findCountries() {
    return prisma.location.findMany({
      where: { type: "COUNTRY", parentId: null },
      orderBy: { name: "asc" },
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

  findById(id: number) {
    return prisma.location.findUnique({ where: { id } });
  }
}

export const locationRepository = new LocationRepository();
