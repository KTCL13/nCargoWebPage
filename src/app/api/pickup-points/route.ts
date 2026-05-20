import { NextRequest, NextResponse } from "next/server";
import { getAuthEmployee } from "@/lib/auth-guard";
import { pickupPointsService } from "@/modules/services/pickupPoints.service";
import { CreatePickupPointSchema, UpdatePickupPointSchema } from "@/lib/validations/pickupPoints";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    getAuthEmployee(req);
  } catch (error) {
    const status =
      error instanceof Error && error.message.includes("Token") ? 401 : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No autorizado" },
      { status },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "0");
  const onlyActive = searchParams.get("active") === "true";

  const result = await pickupPointsService.findAll(page, pageSize, onlyActive);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const employee = await getAuthEmployee(req);
    if (employee.role !== "ADMIN") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = CreatePickupPointSchema.parse(body);

    const office = await pickupPointsService.create(validatedData);

    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
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
    const validatedData = UpdatePickupPointSchema.parse(body);

    const office = await pickupPointsService.update(id, validatedData);

    return NextResponse.json(office);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
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

    await pickupPointsService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error interno" },
      { status: 400 }
    );
  }
}
