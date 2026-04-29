import { PrismaClient } from "@prisma/client";
import { COLOMBIA_CITIES } from "./data/colombia-cities";

const prisma = new PrismaClient();

async function main() {
  // ── SystemConfig ──────────────────────────────────────────────────
  const configs: { key: string; value: unknown; description: string }[] = [
    {
      key: "divisor",
      value: 153,
      description: "Divisor peso volumétrico (in³/lb)",
    },
    { key: "insurance_rate", value: 0.1, description: "Tasa seguro (10%)" },
    {
      key: "customs_rate",
      value: 0.31,
      description: "Arancel aduanal >$200 (31%)",
    },
    {
      key: "customs_threshold",
      value: 200,
      description: "Umbral valor declarado para aduanas (USD)",
    },
    { key: "pickup_base", value: 10, description: "Costo base recogida (USD)" },
    {
      key: "pickup_per_extra_mile",
      value: 2,
      description: "Costo por milla extra de recogida (>8 mi)",
    },
    {
      key: "pickup_free_miles",
      value: 8,
      description: "Millas incluidas en cargo base de recogida",
    },
    {
      key: "co_flat_rate_enabled",
      value: false,
      description: "Colombia usa tarifa plana (false = por ciudad)",
    },
    {
      key: "co_flat_rate_price",
      value: 0,
      description: "Tarifa plana Colombia USD",
    },
    {
      key: "mx_flat_rate_enabled",
      value: true,
      description: "México usa tarifa plana",
    },
    {
      key: "mx_flat_rate_price",
      value: 5.0,
      description: "Tarifa plana México USD",
    },
  ];

  for (const { key, value, description } of configs) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never, description },
    });
  }
  console.log(`✓ SystemConfig: ${configs.length} keys`);

  // ── Shipping providers ────────────────────────────────────────────
  const serviexpress = await prisma.shippingProvider.upsert({
    where: { name: "Serviexpress" },
    update: {},
    create: { name: "Serviexpress" },
  });
  await prisma.shippingProvider.upsert({
    where: { name: "xCargo" },
    update: {},
    create: { name: "xCargo" },
  });
  await prisma.shippingProvider.upsert({
    where: { name: "DHL" },
    update: {},
    create: { name: "DHL" },
  });
  console.log("✓ Providers: Serviexpress, xCargo, DHL");

  // ── Country: Colombia ─────────────────────────────────────────────
  let colombia = await prisma.location.findFirst({
    where: { type: "COUNTRY", name: "Colombia" },
  });
  if (!colombia) {
    colombia = await prisma.location.create({
      data: { name: "Colombia", type: "COUNTRY" },
    });
  }
  console.log(`✓ Location COUNTRY: Colombia (id=${colombia.id})`);

  // Guard: skip if Colombia cities already seeded
  const existingCities = await prisma.location.count({
    where: {
      type: "CITY",
      parent: { type: "DEPARTMENT", parentId: colombia.id },
    },
  });
  if (existingCities > 0) {
    console.log(
      `⚠ Colombia cities already seeded (${existingCities} rows) — skipping`,
    );
    return;
  }

  // ── Departments ───────────────────────────────────────────────────
  const uniqueDepts = [...new Set(COLOMBIA_CITIES.map((c) => c.department))];
  await prisma.location.createMany({
    data: uniqueDepts.map((name) => ({
      name,
      type: "DEPARTMENT",
      parentId: colombia!.id,
    })),
    skipDuplicates: true,
  });
  console.log(`✓ Departments: ${uniqueDepts.length}`);

  const deptRows = await prisma.location.findMany({
    where: { type: "DEPARTMENT", parentId: colombia.id },
  });
  const deptMap = new Map<string, number>(deptRows.map((d) => [d.name, d.id]));

  // ── Cities (chunks of 500) ────────────────────────────────────────
  const cityData = COLOMBIA_CITIES.flatMap((c) => {
    const parentId = deptMap.get(c.department);
    if (!parentId) return [];
    return [{ name: c.city, type: "CITY", zipCode: c.zip ?? null, parentId }];
  });

  const CHUNK = 500;
  for (let i = 0; i < cityData.length; i += CHUNK) {
    await prisma.location.createMany({
      data: cityData.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    console.log(
      `  Cities: ${Math.min(i + CHUNK, cityData.length)}/${cityData.length}`,
    );
  }
  console.log(`✓ Cities: ${cityData.length} inserted`);

  // Build locationMap keyed by CITY::DEPARTMENT for rate lookup
  const cityRows = await prisma.location.findMany({
    where: { type: "CITY", parent: { parentId: colombia.id } },
    include: { parent: true },
  });
  const locationMap = new Map<string, number>(
    cityRows.map((c) => [`${c.name}::${c.parent!.name}`, c.id]),
  );

  // ── Shipping rates for all Colombia cities via Serviexpress ───────
  const rates = COLOMBIA_CITIES.flatMap((c) => {
    const locationId = locationMap.get(`${c.city}::${c.department}`);
    if (!locationId) return [];
    return [{ providerId: serviexpress.id, locationId, price: c.basePrice }];
  });

  for (let i = 0; i < rates.length; i += 200) {
    await prisma.shippingRate.createMany({
      data: rates.slice(i, i + 200),
      skipDuplicates: true,
    });
    console.log(`  Rates: ${Math.min(i + 200, rates.length)}/${rates.length}`);
  }
  console.log(
    `✓ Shipping rates: ${rates.length} with city-specific prices via Serviexpress`,
  );
  console.log("✓ seed-shipping complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
