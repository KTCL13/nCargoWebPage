import { z } from "zod";

export const CreatePickupPointSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  latitude: z.union([z.string(), z.number()]).transform((val) => parseFloat(val as string)),
  longitude: z.union([z.string(), z.number()]).transform((val) => parseFloat(val as string)),
  coverageRadiusMiles: z.union([z.string(), z.number()]).transform((val) => parseFloat(val as string)).optional().nullable(),
});

export const UpdatePickupPointSchema = CreatePickupPointSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreatePickupPointInput = z.infer<typeof CreatePickupPointSchema>;
export type UpdatePickupPointInput = z.infer<typeof UpdatePickupPointSchema>;
