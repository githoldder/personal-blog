// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind(),
  ],
  content: {
    collections: {
      notes: {
        type: 'content',
        glob: 'notes/**/*.md',
      },
      projects: {
        type: 'content',
        glob: 'projects/**/*.md',
      },
      decks: {
        type: 'content',
        glob: 'decks/**/*.md',
      },
    },
  },
});
