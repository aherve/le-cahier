import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    treeShaking: true,
  },
  build: {
    rollupOptions: {
      treeshake: true,
    },
  },
  test: {
    include: ['**/*.vitest.ts', '**/*.vitest.tsx'],
  },
});
