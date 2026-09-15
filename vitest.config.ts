import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

// Manually load .env file for testing environment
try {
  const envPath = path.resolve(__dirname, './.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const firstEquals = trimmed.indexOf('=');
      if (firstEquals !== -1) {
        const key = trimmed.substring(0, firstEquals).trim();
        const value = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.error("Error loading .env file in vitest config:", err);
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', '**/src/tests/e2e/**', '**/.next/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
