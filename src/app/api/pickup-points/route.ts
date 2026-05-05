import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthEmployee } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "0");
  const onlyActive = searchParams.get("active") === "true";

  const where = onlyActive ? { isActive: true } : {};

  if (pageSize > 0) {
    const [data, total] = await Promise.all([
      prisma.office.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        orderBy: { name: "asc" },
      }),
      prisma.office.count({ where }),
    ]);
    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  const data = await prisma.office.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data, total: data.length });
}

export async function POST(req: NextRequest) {
  try {
    const employee = await getAuthEmployee(req);
    if (employee.role !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { name, address, latitude, longitude, coverageRadiusMiles } = body;

    if (!name?.trim() || !address?.trim() || latitude == null || longitude == null) {
      return NextResponse.json(
        { message: "Nombre, dirección, latitud y longitud son requeridos" },
        { status: 400 }
      );
    }

    const office = await prisma.office.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        coverageRadiusMiles: coverageRadiusMiles != null ? parseFloat(coverageRadiusMiles) : null,
        isActive: true,
      },
    });

    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error interno" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const employee = await getAuthEmployee(req);
    if (employee.role !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const id = parseInt(new URL(req.url).searchParams.get("id") ?? "");
    if (!id) return NextResponse.json({ message: "id requerido" }, { status: 400 });

    const body = await req.json();
    const { name, address, latitude, longitude, coverageRadiusMiles, isActive } = body;

    const office = await prisma.office.update({
      where: { id },
      data: {
        ...(name != null && { name: name.trim() }),
        ...(address != null && { address: address.trim() }),
        ...(latitude != null && { latitude: parseFloat(latitude) }),
        ...(longitude != null && { longitude: parseFloat(longitude) }),
        ...(coverageRadiusMiles !== undefined && {
          coverageRadiusMiles: coverageRadiusMiles != null ? parseFloat(coverageRadiusMiles) : null,
        }),
        ...(isActive != null && { isActive }),
      },
    });

    return NextResponse.json(office);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error interno" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const employee = await getAuthEmployee(req);
    if (employee.role !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const id = parseInt(new URL(req.url).searchParams.get("id") ?? "");
    if (!id) return NextResponse.json({ message: "id requerido" }, { status: 400 });

    await prisma.office.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error interno" },
      { status: 400 }
    );
  }
}
