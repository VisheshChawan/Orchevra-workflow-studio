import { z } from 'zod';
import { nodeSchema } from './nodeSchema';
import { edgeSchema } from './edgeSchema';

export const pipelineSchema = z.object({
  nodes: z.array(nodeSchema).min(1, 'A valid pipeline must contain at least one node block'),
  edges: z.array(edgeSchema),
  name: z.string().optional(),
  description: z.string().optional()
});
