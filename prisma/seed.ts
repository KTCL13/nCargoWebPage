import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { COLOMBIA_CITIES } from "./data/colombia-cities";

const prisma = new PrismaClient();

async function main() {
  // ── IdentificationType ────────────────────────────────────────────
  const idTypes = [
    { code: 'CC', name: 'Cédula de ciudadanía' },
    { code: 'CE', name: 'Cédula de extranjería' },
    { code: 'PASSPORT', name: 'Passport' },
    { code: 'NIT', name: 'NIT' },
    { code: 'TI', name: 'Tarjeta de identidad' },
    { code: 'PPT', name: 'Permiso de protección temporal' },
  ]
  for (const idType of idTypes) {
    await prisma.identificationType.upsert({
      where: { code: idType.code },
      update: { name: idType.name },
      create: idType,
    })
  }
  console.log(`✓ IdentificationType: ${idTypes.length} records`)

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
    {
      key: "overtime_multiplier",
      value: 1.5,
      description: "Multiplicador horas extras (1.5 = 50% recargo)",
    },
    {
      key: "overtime_threshold_hours",
      value: 8,
      description: "Horas diarias antes de aplicar recargo por horas extras",
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

  const defaultPasswordHash = await bcrypt.hash("123", 10);
  const ccType = await prisma.identificationType.findUniqueOrThrow({ where: { code: 'CC' } });

  // ── 1. JOBS ──
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: "Operador Logístico",
        description: "Gestión de paquetes y envíos",
      },
    }),
    prisma.job.create({
      data: {
        title: "Coordinador de Casilleros",
        description: "Administración de casilleros USA",
      },
    }),
    prisma.job.create({
      data: {
        title: "Agente de Servicio",
        description: "Atención al cliente y cotizaciones",
      },
    }),
    prisma.job.create({
      data: {
        title: "Supervisor de Operaciones",
        description: "Supervisión del equipo operativo",
      },
    }),
    prisma.job.create({
      data: {
        title: "Analista de Logística",
        description: "Análisis de rutas y tarifas",
      },
    }),
  ]);

  // ── 2. CONTRACT TYPES ──
  const ctMensual = await prisma.contractType.create({
    data: { name: "MENSUAL" },
  });
  const ctPorHora = await prisma.contractType.create({
    data: { name: "POR_HORA" },
  });

  // ── 3. ROLES ──
  const roleAdmin = await prisma.role.create({ data: { name: "ADMIN" } });
  const roleEmp = await prisma.role.create({ data: { name: "EMPLOYEE" } });

  // ── 4. EMPLOYEES ──
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        firstName: "Carlos", lastName: "Mendoza",
        identificationNumber: "10000001", identificationTypeId: ccType.id,
        email: "carlos@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3001234567", city: "Los Angeles" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Ana", lastName: "Gómez",
        identificationNumber: "10000002", identificationTypeId: ccType.id,
        email: "ana@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3009876543", city: "Bogotá" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Luis", lastName: "Torres",
        identificationNumber: "10000003", identificationTypeId: ccType.id,
        email: "luis@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3112223344", city: "Los Angeles" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "María", lastName: "Rodríguez",
        identificationNumber: "10000004", identificationTypeId: ccType.id,
        email: "maria@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3154445566", city: "Medellín" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Pedro", lastName: "Sánchez",
        identificationNumber: "10000005", identificationTypeId: ccType.id,
        email: "pedro@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3006667788", city: "Los Angeles" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Sofía", lastName: "Castro",
        identificationNumber: "10000006", identificationTypeId: ccType.id,
        email: "sofia@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3178889900", city: "Cali" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Andrés", lastName: "Vargas",
        identificationNumber: "10000007", identificationTypeId: ccType.id,
        email: "andres@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3011112233", city: "Los Angeles" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Valentina", lastName: "López",
        identificationNumber: "10000008", identificationTypeId: ccType.id,
        email: "valentina@ncargo.com",
        status: "INACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3143334455", city: "Bogotá" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Javier", lastName: "Morales",
        identificationNumber: "10000009", identificationTypeId: ccType.id,
        email: "javier@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3025556677", city: "Los Angeles" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Camila", lastName: "Herrera",
        identificationNumber: "10000010", identificationTypeId: ccType.id,
        email: "camila@ncargo.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "3167778899", city: "Barranquilla" },
      },
    }),
    prisma.employee.create({
      data: {
        firstName: "Thomas", lastName: "Sorza",
        identificationNumber: "10000011", identificationTypeId: ccType.id,
        email: "thomas@sorza.com",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
        metadata: { phone: "", city: "Los Angeles" },
      },
    }),
  ]);

  // ── 5. CONTRACTS ──
  const contracts = await Promise.all(
    employees.map((emp, i) =>
      prisma.contract.create({
        data: {
          employeeId: emp.id,
          jobId: jobs[i % jobs.length].id,
          contractTypeId: i % 3 === 0 ? ctPorHora.id : ctMensual.id,
          salary: i % 3 === 0 ? null : 1800000 + i * 150000,
          hourlyRate: i % 3 === 0 ? 18000 : null,
          startDate: new Date(`2024-0${(i % 9) + 1}-01`),
          isActive: true,
        },
      }),
    ),
  );

  // ── 6. JOB HISTORY ──
  await Promise.all(
    employees.slice(0, 8).map((emp, i) =>
      prisma.jobHistory.create({
        data: {
          employeeId: emp.id,
          contractId: contracts[i].id,

          startDate: new Date(`2024-0${(i % 9) + 1}-01`),
        },
      }),
    ),
  );

  // ── 7. EMPLOYEE ROLES ──
  // employees[0] = Carlos (admin), employees[10] = Thomas Sorza (admin)
  await prisma.employeeRole.create({
    data: { employeeId: employees[0].id, roleId: roleAdmin.id },
  });
  await prisma.employeeRole.create({
    data: { employeeId: employees[10].id, roleId: roleAdmin.id },
  });
  await Promise.all(
    employees.slice(1, 10).map((emp) =>
      prisma.employeeRole.create({
        data: { employeeId: emp.id, roleId: roleEmp.id },
      }),
    ),
  );

  // ── 8. TASK STATUS ──
  const tsCompleted = await prisma.taskStatus.create({
    data: { name: "COMPLETED" },
  });
  const tsInProgress = await prisma.taskStatus.create({
    data: { name: "IN_PROGRESS" },
  });
  const tsPending = await prisma.taskStatus.create({
    data: { name: "PENDING" },
  });
  const tsCancelled = await prisma.taskStatus.create({
    data: { name: "CANCELLED" },
  });

  // ── 9. ATTENDANCE ──
  const attendances = await Promise.all(
    employees.slice(0, 8).map((emp, i) =>
      prisma.attendance.create({
        data: {
          employeeId: emp.id,
          status: "CLOSED",
          startedAt: new Date(
            `2025-03-${String(i + 10).padStart(2, "0")}T08:00:00`,
          ),
          endedAt: new Date(
            `2025-03-${String(i + 10).padStart(2, "0")}T17:00:00`,
          ),
          workedHours: 8.5,
        },
      }),
    ),
  );

  // ── 10. ATTENDANCE EVENTS ──
  await Promise.all(
    attendances.slice(0, 5).map((att) =>
      prisma.attendanceEvent.createMany({
        data: [
          {
            attendanceId: att.id,
            type: "CLOCK_IN",
            timestamp: att.startedAt,
            locationMetadata: { ip: "192.168.1.1", device: "Chrome/Windows" },
          },
          {
            attendanceId: att.id,
            type: "PAUSE",
            timestamp: new Date(att.startedAt.getTime() + 3 * 3600000),
          },
          {
            attendanceId: att.id,
            type: "RESUME",
            timestamp: new Date(att.startedAt.getTime() + 4 * 3600000),
          },
          { attendanceId: att.id, type: "CLOCK_OUT", timestamp: att.endedAt! },
        ],
      }),
    ),
  );

  // ── 11. TASKS ──
  const taskTitles = [
    "Registrar paquete recibido #LA-001",
    "Actualizar estado envío cliente Pérez",
    "Preparar embalaje 5 paquetes",
    "Verificar casillero #C-042",
    "Generar cotización cliente Torres",
    "Coordinar recogida zona norte LA",
    "Revisar incidencia envío #ENV-089",
    "Actualizar tracking Serviexpress",
    "Gestionar devolución paquete",
    "Contactar cliente por paquete retenido",
  ];
  const tasks = await Promise.all(
    taskTitles.map((title, i) =>
      prisma.task.create({
        data: {
          employeeId: employees[i % employees.length].id,
          createdBy: employees[0].id,
          attendanceId: attendances[i % attendances.length].id,
          statusId: [tsCompleted, tsInProgress, tsPending, tsCancelled][i % 4]
            .id,
          title,
          description: `Descripción de tarea: ${title}`,
          startTime: new Date(
            `2025-03-${String(10 + i).padStart(2, "0")}T09:00:00`,
          ),
          endTime:
            i % 4 === 1
              ? null
              : new Date(`2025-03-${String(10 + i).padStart(2, "0")}T11:30:00`),
          minutesSpent: i % 4 === 1 ? null : 90 + i * 10,
          metadata: { priority: ["LOW", "MEDIUM", "HIGH"][i % 3] },
        },
      }),
    ),
  );

  // ── 12. USER SESSIONS ──
  await Promise.all(
    employees.slice(0, 8).map((emp, i) =>
      prisma.userSession.create({
        data: {
          employeeId: emp.id,
          loginAt: new Date(
            `2025-03-${String(i + 10).padStart(2, "0")}T07:55:00`,
          ),
          logoutAt: new Date(
            `2025-03-${String(i + 10).padStart(2, "0")}T17:05:00`,
          ),
          ipAddress: `192.168.1.${10 + i}`,
          deviceInfo: { browser: "Chrome", os: "Windows 11", version: "120" },
        },
      }),
    ),
  );

  // ── 13. LOCATIONS (COUNTRY / DEPARTMENT / CITY) & OFFICES ──
  // Countries
  const countryUS = await prisma.location.upsert({
    where: {
      id:
        (
          await prisma.location.findFirst({
            where: { type: "COUNTRY", name: "United States" },
          })
        )?.id ?? 0,
    },
    update: {},
    create: { name: "United States", type: "COUNTRY" },
  });
  if (
    !(await prisma.location.findFirst({
      where: { type: "COUNTRY", name: "Colombia" },
    }))
  ) {
    await prisma.location.create({
      data: { name: "Colombia", type: "COUNTRY" },
    });
  }
  if (
    !(await prisma.location.findFirst({
      where: { type: "COUNTRY", name: "Mexico" },
    }))
  ) {
    await prisma.location.create({ data: { name: "Mexico", type: "COUNTRY" } });
  }

  // US: California → Los Angeles, Downey, Long Beach
  const california = await prisma.location.create({
    data: { name: "California", type: "DEPARTMENT", parentId: countryUS.id },
  });
  const [cityLA, cityDowney, cityLongBeach] = await Promise.all([
    prisma.location.create({
      data: { name: "Los Angeles", type: "CITY", parentId: california.id },
    }),
    prisma.location.create({
      data: { name: "Downey", type: "CITY", parentId: california.id },
    }),
    prisma.location.create({
      data: { name: "Long Beach", type: "CITY", parentId: california.id },
    }),
  ]);

  // Offices
  const offices = await Promise.all([
    prisma.office.create({
      data: {
        name: "nCargo – Los Angeles",
        address: "1234 S Figueroa St, Los Angeles, CA",
        latitude: 34.0522,
        longitude: -118.2437,
        coverageRadiusMiles: 15,
        isActive: true,
        locationId: cityLA.id,
      },
    }),
    prisma.office.create({
      data: {
        name: "nCargo – Downey",
        address: "8700 Florence Ave, Downey, CA",
        latitude: 33.9401,
        longitude: -118.1331,
        coverageRadiusMiles: 10,
        isActive: true,
        locationId: cityDowney.id,
      },
    }),
    prisma.office.create({
      data: {
        name: "nCargo – Long Beach",
        address: "100 W Broadway, Long Beach, CA",
        latitude: 33.7701,
        longitude: -118.1937,
        coverageRadiusMiles: 12,
        isActive: true,
        locationId: cityLongBeach.id,
      },
    }),
  ]);
  console.log("✓ 3 offices created");

  // ── 14. SYSTEM CONFIG ──
  await prisma.systemConfig.createMany({
    skipDuplicates: true,
    data: [
      {
        key: "iva_rate",
        value: { rate: 0.19, label: "IVA Colombia" },
        description: "Tasa de IVA aplicada en cotizaciones para Colombia",
      },
      {
        key: "base_price_per_lb",
        value: { amount: 3.5, currency: "USD" },
        description: "Precio base por libra de envío internacional",
      },
      {
        key: "min_weight_lbs",
        value: { min: 1, max: 100 },
        description: "Peso mínimo y máximo permitido en cotizaciones",
      },
      {
        key: "packaging_fee",
        value: { express: 0, personal: 0, commercial: 0 },
        description: "Costo de embalaje por plan de casillero",
      },
      {
        key: "storage_fee_daily",
        value: { after_days: 15, price_usd: 2 },
        description: "Cargo por almacenamiento después del período gratis",
      },
      {
        key: "commission_rates",
        value: {
          client_buys: 0,
          ncargo_buys_express: 0.2,
          ncargo_buys_other: 0.1,
        },
        description: "Tasas de comisión por tipo de compra",
      },
      {
        key: "currency_exchange",
        value: { usd_to_cop: 4100, updated: "2025-03-01" },
        description: "Tasa de cambio USD a COP",
      },
      {
        key: "serviexpress_url",
        value: {
          tracking:
            "https://serviexpress.managercargo.com/public/status/indexstatusacc/wi/si",
        },
        description: "URL de tracking Serviexpress",
      },
    ],
  });

  // ── 15. QUOTATIONS ──
  // Requires seed-shipping.ts to have run first (Colombia cities must exist)
  const [bogota, medellin, cali, barranquilla, bucaramanga] = await Promise.all(
    [
      prisma.location.findFirst({
        where: { type: "CITY", name: "BOGOTA D.C." },
      }),
      prisma.location.findFirst({ where: { type: "CITY", name: "MEDELLÍN" } }),
      prisma.location.findFirst({ where: { type: "CITY", name: "CALI" } }),
      prisma.location.findFirst({
        where: { type: "CITY", name: "BARRANQUILLA" },
      }),
      prisma.location.findFirst({
        where: { type: "CITY", name: "BUCARAMANGA" },
      }),
    ],
  );

  if (!bogota || !medellin || !cali || !barranquilla || !bucaramanga) {
    console.warn(
      "⚠ Colombian cities not found — run npm run seed:shipping first. Skipping quotations.",
    );
  } else {
    const quotations = await Promise.all([
      prisma.quotation.create({
        data: {
          employeeId: employees[0].id,
          odooCustomerId: 1001,
          originOfficeId: offices[0].id,
          destinationLocationId: bogota.id,
          weightLbs: 5.2,
          volume: 0.0432,
          declaredValue: 120.0,
          totalPrice: 75.8,
          status: "APPROVED",
        },
      }),
      prisma.quotation.create({
        data: {
          employeeId: employees[1].id,
          odooCustomerId: 1002,
          originOfficeId: offices[1].id,
          destinationLocationId: medellin.id,
          weightLbs: 12.0,
          volume: 0.096,
          declaredValue: 350.0,
          totalPrice: 174.9,
          status: "DRAFT",
        },
      }),
      prisma.quotation.create({
        data: {
          employeeId: employees[2].id,
          odooCustomerId: 1003,
          originOfficeId: offices[0].id,
          destinationLocationId: cali.id,
          weightLbs: 3.5,
          volume: 0.0288,
          declaredValue: 80.0,
          totalPrice: 51.0,
          status: "SENT",
        },
      }),
      prisma.quotation.create({
        data: {
          employeeId: employees[3].id,
          odooCustomerId: 1004,
          originOfficeId: offices[2].id,
          destinationLocationId: barranquilla.id,
          weightLbs: 8.0,
          volume: 0.064,
          declaredValue: 220.0,
          totalPrice: 116.6,
          status: "REJECTED",
        },
      }),
      prisma.quotation.create({
        data: {
          employeeId: employees[0].id,
          odooCustomerId: 1005,
          originOfficeId: offices[1].id,
          destinationLocationId: bucaramanga.id,
          weightLbs: 20.0,
          volume: 0.16,
          declaredValue: 500.0,
          totalPrice: 291.6,
          status: "APPROVED",
        },
      }),
    ]);

    // ── 16. SHIPPING PROVIDERS (xCargo, DHL — Serviexpress created in seed-shipping.ts) ──
    await prisma.shippingProvider.createMany({
      data: [{ name: "xCargo" }, { name: "DHL" }],
      skipDuplicates: true,
    });
    const serviexpress = await prisma.shippingProvider.findFirst({
      where: { name: "Serviexpress" },
    });

    // ── 17. SHIPMENT STATUS ──
    const ssReceived = await prisma.shipmentStatus.create({
      data: { name: "RECEIVED_AT_MAILBOX" },
    });
    const ssPicked = await prisma.shipmentStatus.create({
      data: { name: "PICKED_BY_NCARGO" },
    });
    const ssTransit = await prisma.shipmentStatus.create({
      data: { name: "IN_INTERNATIONAL_TRANSIT" },
    });
    const ssCustoms = await prisma.shipmentStatus.create({
      data: { name: "IN_CUSTOMS_COLOMBIA" },
    });
    const ssWarehouse = await prisma.shipmentStatus.create({
      data: { name: "IN_LOCAL_WAREHOUSE" },
    });
    const ssOutDel = await prisma.shipmentStatus.create({
      data: { name: "OUT_FOR_DELIVERY" },
    });
    const ssDelivered = await prisma.shipmentStatus.create({
      data: { name: "DELIVERED" },
    });
    const ssCancelled = await prisma.shipmentStatus.create({
      data: { name: "CANCELLED" },
    });
    const ssFailed = await prisma.shipmentStatus.create({
      data: { name: "FAILED_DELIVERY_ATTEMPT" },
    });

    if (serviexpress) {
      // ── 18. SHIPMENTS ──
      const shipments = await Promise.all([
        prisma.shipment.create({
          data: {
            quotationId: quotations[0].id,
            providerId: serviexpress.id,
            statusId: ssDelivered.id,
            odooOrderId: 5001,
            odooCustomerId: 1001,
            trackingNumber: "SRV-2025-00101",
            weightLbs: 5.2,
            receivedAtMailbox: new Date("2025-03-01"),
            pickedByNcargo: new Date("2025-03-03"),
            handedToProvider: new Date("2025-03-04"),
            deliveredAt: new Date("2025-03-10"),
          },
        }),
        prisma.shipment.create({
          data: {
            quotationId: quotations[1].id,
            providerId: serviexpress.id,
            statusId: ssTransit.id,
            odooOrderId: 5002,
            odooCustomerId: 1002,
            trackingNumber: "SRV-2025-00102",
            weightLbs: 12.0,
            receivedAtMailbox: new Date("2025-03-05"),
            pickedByNcargo: new Date("2025-03-07"),
            handedToProvider: new Date("2025-03-08"),
          },
        }),
        prisma.shipment.create({
          data: {
            quotationId: quotations[2].id,
            providerId: serviexpress.id,
            statusId: ssCustoms.id,
            odooOrderId: 5003,
            odooCustomerId: 1003,
            trackingNumber: "SRV-2025-00103",
            weightLbs: 3.5,
            receivedAtMailbox: new Date("2025-03-08"),
            pickedByNcargo: new Date("2025-03-10"),
            handedToProvider: new Date("2025-03-11"),
          },
        }),
        prisma.shipment.create({
          data: {
            quotationId: quotations[3].id,
            providerId: serviexpress.id,
            statusId: ssReceived.id,
            odooOrderId: 5004,
            odooCustomerId: 1004,
            trackingNumber: null,
            weightLbs: 8.0,
            receivedAtMailbox: new Date("2025-03-14"),
          },
        }),
        prisma.shipment.create({
          data: {
            quotationId: quotations[4].id,
            providerId: serviexpress.id,
            statusId: ssPicked.id,
            odooOrderId: 5005,
            odooCustomerId: 1005,
            trackingNumber: null,
            weightLbs: 20.0,
            receivedAtMailbox: new Date("2025-03-12"),
            pickedByNcargo: new Date("2025-03-14"),
          },
        }),
        prisma.shipment.create({
          data: {
            providerId: serviexpress.id,
            statusId: ssWarehouse.id,
            odooOrderId: 5006,
            odooCustomerId: 1006,
            trackingNumber: "SRV-2025-00106",
            weightLbs: 7.3,
            receivedAtMailbox: new Date("2025-03-06"),
            pickedByNcargo: new Date("2025-03-08"),
            handedToProvider: new Date("2025-03-09"),
          },
        }),
        prisma.shipment.create({
          data: {
            providerId: serviexpress.id,
            statusId: ssOutDel.id,
            odooOrderId: 5007,
            odooCustomerId: 1007,
            trackingNumber: "SRV-2025-00107",
            weightLbs: 2.1,
            receivedAtMailbox: new Date("2025-03-04"),
            pickedByNcargo: new Date("2025-03-06"),
            handedToProvider: new Date("2025-03-07"),
          },
        }),
        prisma.shipment.create({
          data: {
            providerId: serviexpress.id,
            statusId: ssCancelled.id,
            odooOrderId: 5008,
            odooCustomerId: 1008,
            trackingNumber: null,
            weightLbs: 4.0,
            receivedAtMailbox: new Date("2025-03-10"),
            cancelledAt: new Date("2025-03-11"),
            cancellationReason: "Cliente canceló el pedido",
          },
        }),
        prisma.shipment.create({
          data: {
            providerId: serviexpress.id,
            statusId: ssFailed.id,
            odooOrderId: 5009,
            odooCustomerId: 1009,
            trackingNumber: "SRV-2025-00109",
            weightLbs: 6.5,
            receivedAtMailbox: new Date("2025-03-03"),
            pickedByNcargo: new Date("2025-03-05"),
            handedToProvider: new Date("2025-03-06"),
            metadata: { failReason: "Dirección incorrecta", attempts: 1 },
          },
        }),
        prisma.shipment.create({
          data: {
            providerId: serviexpress.id,
            statusId: ssDelivered.id,
            odooOrderId: 5010,
            odooCustomerId: 1010,
            trackingNumber: "SRV-2025-00110",
            weightLbs: 9.8,
            receivedAtMailbox: new Date("2025-02-20"),
            pickedByNcargo: new Date("2025-02-22"),
            handedToProvider: new Date("2025-02-23"),
            deliveredAt: new Date("2025-03-01"),
          },
        }),
      ]);

      // ── 19. SHIPMENT EVENTS ──
      await Promise.all(
        shipments.slice(0, 6).map((sh, i) =>
          prisma.shipmentEvent.createMany({
            data: [
              {
                shipmentId: sh.id,
                status: "RECEIVED_AT_MAILBOX",
                performedBy: employees[i % employees.length].id,
                notes: "Paquete recibido en casillero",
              },
              {
                shipmentId: sh.id,
                status: "PICKED_BY_NCARGO",
                performedBy: employees[i % employees.length].id,
                notes: "Recolectado por el equipo N-Cargo",
              },
            ],
          }),
        ),
      );

      // ── 20. AUDIT LOGS ──
      await prisma.auditLog.createMany({
        data: [
          {
            entityType: "shipments",
            entityId: shipments[0].id,
            action: "STATUS_CHANGE",
            performedBy: employees[0].id,
            oldValues: { status: "PICKED_BY_NCARGO" },
            newValues: { status: "DELIVERED" },
          },
          {
            entityType: "employees",
            entityId: employees[7].id,
            action: "UPDATE",
            performedBy: employees[0].id,
            oldValues: { status: "ACTIVE" },
            newValues: { status: "INACTIVE" },
          },
          {
            entityType: "quotations",
            entityId: quotations[0].id,
            action: "STATUS_CHANGE",
            performedBy: employees[0].id,
            oldValues: { status: "DRAFT" },
            newValues: { status: "APPROVED" },
          },
          {
            entityType: "shipments",
            entityId: shipments[7].id,
            action: "STATUS_CHANGE",
            performedBy: employees[2].id,
            oldValues: { status: "RECEIVED_AT_MAILBOX" },
            newValues: { status: "CANCELLED" },
          },
          {
            entityType: "contracts",
            entityId: contracts[0].id,
            action: "UPDATE",
            performedBy: employees[0].id,
            oldValues: { salary: 1800000 },
            newValues: { salary: 2000000 },
          },
          {
            entityType: "system_config",
            entityId: 0,
            action: "UPDATE",
            performedBy: employees[0].id,
            oldValues: { iva_rate: 0.18 },
            newValues: { iva_rate: 0.19 },
          },
          {
            entityType: "shipments",
            entityId: shipments[1].id,
            action: "STATUS_CHANGE",
            performedBy: employees[1].id,
            oldValues: { status: "PICKED_BY_NCARGO" },
            newValues: { status: "IN_INTERNATIONAL_TRANSIT" },
          },
          {
            entityType: "tasks",
            entityId: tasks[0].id,
            action: "STATUS_CHANGE",
            performedBy: employees[0].id,
            oldValues: { status: "IN_PROGRESS" },
            newValues: { status: "COMPLETED" },
          },
        ],
      });
    }
  }

  // ── 21. NOTIFICATIONS ──
  await prisma.notification.createMany({
    data: [
      {
        employeeId: employees[0].id,
        type: "SHIPMENT_UPDATE",
        message: "Envío SRV-2025-00101 entregado exitosamente",
        read: true,
      },
      {
        employeeId: employees[1].id,
        type: "TASK_ASSIGNED",
        message: "Se te asignó la tarea: Verificar casillero #C-042",
        read: false,
      },
      {
        employeeId: employees[2].id,
        type: "SHIPMENT_UPDATE",
        message: "Envío SRV-2025-00103 en aduana Colombia",
        read: false,
      },
      {
        employeeId: employees[3].id,
        type: "SYSTEM",
        message: "Recuerda actualizar el estado del envío #5004",
        read: false,
      },
      {
        employeeId: employees[4].id,
        type: "TASK_ASSIGNED",
        message: "Nueva tarea asignada: Gestionar devolución",
        read: true,
      },
      {
        employeeId: employees[0].id,
        type: "SYSTEM",
        message: "Reporte mensual de marzo disponible",
        read: false,
      },
      {
        employeeId: employees[5].id,
        type: "SHIPMENT_UPDATE",
        message: "Nuevo paquete en casillero para cliente 1006",
        read: false,
      },
      {
        employeeId: employees[6].id,
        type: "TASK_ASSIGNED",
        message: "Tarea urgente: Contactar cliente por paquete retenido",
        read: false,
      },
      {
        employeeId: employees[1].id,
        type: "SHIPMENT_UPDATE",
        message: "Envío SRV-2025-00102 salió de LA en tránsito",
        read: true,
      },
      {
        employeeId: employees[7].id,
        type: "SYSTEM",
        message: "Tu contrato fue actualizado. Revisa los detalles.",
        read: false,
      },
    ],
  });

  // ── 22. EMPLOYEE KPIs ──
  await Promise.all(
    employees.slice(0, 8).map((emp, i) =>
      prisma.employeeKPI.create({
        data: {
          employeeId: emp.id,
          date: new Date(`2025-03-${String(i + 10).padStart(2, "0")}`),
          tasksCompleted: 3 + i,
          tasksPending: 2,
          avgTaskTimeMinutes: 85 + i * 5,
          totalWorkedHours: 8.0 + (i % 3) * 0.5,
          productivityScore: 70 + i * 3,
        },
      }),
    ),
  );

  // ── 23. TASK ANALYTICS ──
  await Promise.all(
    tasks.slice(0, 8).map((task, i) =>
      prisma.taskAnalytics.create({
        data: {
          taskId: task.id,
          employeeId: employees[i % employees.length].id,
          durationMinutes: 60 + i * 15,
          wasDelayed: i % 5 === 0,
        },
      }),
    ),
  );

  // ── 24. WORKLOAD SNAPSHOTS ──
  await Promise.all(
    employees.slice(0, 8).map((emp, i) =>
      prisma.workloadSnapshot.create({
        data: {
          employeeId: emp.id,
          date: new Date(`2025-03-${String(i + 10).padStart(2, "0")}`),
          activeTasks: 2 + (i % 3),
          completedTasks: 3 + i,
          workloadScore: 65 + i * 4,
        },
      }),
    ),
  );

  // ── 25. EMPLOYEE ALERTS ──
  await prisma.employeeAlert.createMany({
    data: [
      {
        employeeId: employees[7].id,
        type: "INACTIVITY",
        message: "Empleado sin actividad registrada por 3 días",
        severity: "MEDIUM",
        resolvedAt: null,
      },
      {
        employeeId: employees[3].id,
        type: "LOW_PRODUCTIVITY",
        message: "Productividad por debajo del 60% esta semana",
        severity: "LOW",
        resolvedAt: null,
      },
      {
        employeeId: employees[5].id,
        type: "OVERLOAD",
        message: "Empleado con más de 12 tareas activas simultáneas",
        severity: "HIGH",
        resolvedAt: new Date("2025-03-12"),
      },
      {
        employeeId: employees[1].id,
        type: "LOW_PRODUCTIVITY",
        message: "Promedio de tareas completadas muy bajo esta semana",
        severity: "MEDIUM",
        resolvedAt: null,
      },
    ],
  });

  console.log("✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
