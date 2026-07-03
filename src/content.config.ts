import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    slug: z.string().optional(),
    author: z.string().optional(),
    annotationTarget: z.string().optional(),
    pdfAsset: z.string().optional(),
    annotationCount: z.number().optional()
  })
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['todo', 'in_progress', 'done', 'archived']).default('todo'),
    date: z.coerce.date(),
    tech: z.array(z.string()).default([]),
    slug: z.string().optional(),
    github: z.string().optional()
  })
});

export const collections = { notes, projects };
