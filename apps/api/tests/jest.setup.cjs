/* global process */

process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/todo_app_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-with-enough-length';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:4200';
