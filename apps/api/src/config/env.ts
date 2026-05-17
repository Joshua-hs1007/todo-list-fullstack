import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_URL: z.string().url().default('http://localhost:4200'),
});

export const env = envSchema.parse(process.env);
