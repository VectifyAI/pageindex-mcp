import { z } from 'zod';

// Schema for get document structure parameters
export const getDocumentStructureSchema = z.object({
  doc_id: z
    .string()
    .min(1, 'Document ID cannot be empty')
    .describe('The ID of the document to get structure from'),
  mode: z
    .enum(['summary', 'outline', 'full'])
    .default('summary')
    .describe(
      'Level of detail: summary (titles only), outline (titles + summaries), full (complete structure)',
    ),
  max_depth: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe('Maximum depth level to return (1-10)'),
});

export type McpGetDocumentStructureParams = z.infer<typeof getDocumentStructureSchema>;
