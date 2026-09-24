import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:T1sy7cEhciZI4FeMSCc6JzwkBcokqA4ubRBNVmRhLZWLrvKEoGjsORiF6nIoRcSl@localhost:5432/flashlearn';

// For migrations & queries in Bun
export const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
