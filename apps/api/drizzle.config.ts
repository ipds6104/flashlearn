import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:T1sy7cEhciZI4FeMSCc6JzwkBcokqA4ubRBNVmRhLZWLrvKEoGjsORiF6nIoRcSl@localhost:5432/flashlearn',
  },
});
