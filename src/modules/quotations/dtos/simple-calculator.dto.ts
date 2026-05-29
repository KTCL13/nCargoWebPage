import { z } from 'zod'

const posNum = (label: string) =>
    z.number({ error: `"${label}" debe ser un número válido` })
     .positive(`"${label}" debe ser mayor a cero`)

export const SimpleCalculatorSchema = z.object({
    city:          z.string({ error: 'La ciudad es obligatoria' }).min(1, 'La ciudad es obligatoria'),
    weight:        posNum('Peso'),
    height:        posNum('Alto'),
    width:         posNum('Ancho'),
    length:        posNum('Largo'),
    declaredValue: z.number({ error: '"Valor declarado" debe ser un número válido' })
                    .min(0, '"Valor declarado" no puede ser negativo'),
    employeeId:     z.number().int().positive().optional(),
    odooCustomerId: z.number().int().positive().optional(),
})

export type SimpleCalculatorDto = z.infer<typeof SimpleCalculatorSchema>
