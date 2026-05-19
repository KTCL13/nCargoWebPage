import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n===== 1) TAREAS COMPLETADAS (datos crudos) =====\n')

  const completedStatus = await prisma.taskStatus.findFirst({
    where: { name: 'COMPLETED' },
  })

  if (!completedStatus) {
    console.log('No existe estado COMPLETED')
    return
  }

  const completedTasks = await prisma.task.findMany({
    where: { statusId: completedStatus.id },
    select: {
      id: true,
      title: true,
      employeeId: true,
      startTime: true,
      endTime: true,
      minutesSpent: true,
      employee: { select: { firstName: true, lastName: true } },
    },
    orderBy: { id: 'asc' },
  })

  console.log(`Total tareas COMPLETED: ${completedTasks.length}\n`)

  for (const t of completedTasks) {
    const fallback = t.startTime && t.endTime
      ? Math.round((t.endTime.getTime() - t.startTime.getTime()) / 60000)
      : null
    const used = t.minutesSpent ?? fallback
    console.log(
      `  Task #${t.id} "${t.title.slice(0, 30)}" | empleado=${t.employee.firstName} ${t.employee.lastName}` +
      `\n    minutesSpent=${t.minutesSpent} | startTime=${t.startTime?.toISOString() ?? 'null'}` +
      `\n    endTime=${t.endTime?.toISOString() ?? 'null'} | fallback(end-start)=${fallback}` +
      `\n    => valor usado en el cálculo: ${used}\n`
    )
  }

  console.log('\n===== 2) REGISTROS EmployeeKPI (lo que ve el frontend) =====\n')

  const kpis = await prisma.employeeKPI.findMany({
    select: {
      id: true,
      employeeId: true,
      date: true,
      tasksCompleted: true,
      avgTaskTimeMinutes: true,
      totalWorkedHours: true,
      productivityScore: true,
      employee: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ date: 'asc' }, { employeeId: 'asc' }],
  })

  console.log(`Total registros EmployeeKPI: ${kpis.length}\n`)

  for (const k of kpis) {
    console.log(
      `  ${k.date.toISOString().slice(0, 10)} | ${k.employee.firstName} ${k.employee.lastName}` +
      `\n    tasksCompleted=${k.tasksCompleted} | avgTaskTimeMinutes=${k.avgTaskTimeMinutes} (tipo: ${typeof k.avgTaskTimeMinutes})` +
      `\n    totalWorkedHours=${k.totalWorkedHours} | productivityScore=${k.productivityScore}\n`
    )
  }

  console.log('\n===== 3) SIMULACIÓN: promedio que calcula el frontend =====\n')

  const values = kpis
    .map(k => k.avgTaskTimeMinutes)
    .filter(v => v != null)
    .map(v => Number(v))

  if (values.length === 0) {
    console.log('  No hay valores no-nulos para promediar')
  } else {
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    console.log(`  Valores no-nulos: [${values.join(', ')}]`)
    console.log(`  Suma: ${sum}`)
    console.log(`  Cantidad: ${values.length}`)
    console.log(`  Promedio (minutos): ${avg}`)
    console.log(`  Promedio (horas): ${(avg / 60).toFixed(2)}h`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
