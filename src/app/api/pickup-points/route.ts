import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
