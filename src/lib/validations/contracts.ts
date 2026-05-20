import { z } from 'zod';

export const UpdateContractSchema = z.object({
  salary: z.number().optional(),
  hourlyRate: z.number().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;
