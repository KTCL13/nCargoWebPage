import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  timezone: z.string().optional().refine(tz => {
    if (!tz) return true;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Timezone inválida"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, "Nada que actualizar");

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
