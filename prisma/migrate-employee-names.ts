/**
 * One-time data migration: seed IdentificationType records and
 * fix employee FK references (identification_type_id=0 → real CC id).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ID_TYPES = [
  { code: 'CC',       name: 'Cédula de ciudadanía' },
  { code: 'CE',       name: 'Cédula de extranjería' },
  { code: 'PASSPORT', name: 'Passport' },
  { code: 'NIT',      name: 'NIT' },
  { code: 'TI',       name: 'Tarjeta de identidad' },
  { code: 'PPT',      name: 'Permiso de protección temporal' },
]

async function main() {
  // 1. Seed IdentificationType records using raw SQL (Prisma client may not have the model yet)
  for (const idType of ID_TYPES) {
    await prisma.$executeRaw`
      INSERT INTO identification_types (code, name, created_at, updated_at)
      VALUES (${idType.code}, ${idType.name}, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    `
  }
  console.log(`✓ IdentificationType: ${ID_TYPES.length} records seeded`)

  // 2. Get the CC id
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM identification_types WHERE code = 'CC'
  `
  const ccId = rows[0]?.id
  if (!ccId) throw new Error('CC identification type not found after seeding')

  // 3. Update all employees that still have invalid identification_type_id (0 or NULL)
  const result = await prisma.$executeRaw`
    UPDATE employees
    SET identification_type_id = ${ccId}
    WHERE identification_type_id IS NULL OR identification_type_id = 0
  `
  console.log(`✓ Employees updated: ${result} rows fixed`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
