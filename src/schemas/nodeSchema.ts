import { z } from 'zod';

export const nodeSchema = z.object({
  id: z.string().min(1, 'Node ID is required'),
  type: z.string().min(1, 'Node type is required'),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.record(z.string(), z.any())
});
