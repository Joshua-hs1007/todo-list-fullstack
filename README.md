# To Do List Challenge

Full-stack To Do List application implemented as a pnpm workspace with an Angular web app, Express TypeScript API, Prisma, PostgreSQL, and automated test entry points.

## Assignment Summary

The application lets users register, log in, and manage their own tasks through a responsive web client backed by a REST API. Tasks support create, read, update, delete, search, status filtering, and drag-and-drop reordering.

## Approach

The backend keeps routes, controllers, services, schemas, middleware, and shared infrastructure separate. Zod validates requests, JWT middleware protects task routes, Prisma owns persistence, and task services enforce per-user ownership.

The frontend uses Angular standalone components, Router, Reactive Forms, Signals, an HTTP interceptor for bearer tokens, and Angular CDK drag-and-drop for task ordering.

## Completed Features

- User registration and login with hashed passwords
- JWT authentication and `/api/auth/me`
- Authenticated task CRUD
- Per-user task ownership checks
- Server-side task search and status filtering
- Transactional task reordering
- OpenAPI JSON and Swagger UI endpoints
- Responsive Angular auth, list, and detail screens
- Loading, empty, and error UI states
- Backend service/schema tests, frontend utility tests, and a mocked Playwright happy-path flow

## Stable Version Baseline

- Node.js: LTS-compatible `>=22.13 <25`
- pnpm: `11.1.2`
- Angular: `21.2.11`
- TypeScript: `5.9.3` for Angular 21 compatibility
- Express: `5.2.1`
- Prisma: `7.8.0`
- PostgreSQL: `16-alpine` for local Docker development

## Project Structure

```txt
apps/
  api/
    prisma/
    src/
      config/
      docs/
      lib/
      middleware/
      modules/
        auth/
        tasks/
      types/
    tests/
  web/
    src/
      app/
        core/
        features/
        shared/
    tests/
      e2e/
docs/
scripts/
```

## Local Setup

Install dependencies after reviewing the manifests:

```bash
pnpm install
```

Copy `.env.example` to `.env` and set local values before running the API.

Generate the Prisma client after installing dependencies:

```bash
pnpm db:generate
```

Run verification from the repository root:

```bash
./scripts/lint.sh
./scripts/typecheck.sh
./scripts/test.sh
```

Run development servers:

```bash
pnpm api:dev
pnpm web:dev
```

Build production artifacts:

```bash
pnpm api:build
pnpm web:build
```

The Angular production output is written to `apps/web/dist/apps/web/browser`.

Database commands are available but should only be run when you intentionally want to use the local database:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:deploy
```

## API Docs

After starting the API, open:

```txt
http://localhost:3000/api/docs
http://localhost:3000/api/openapi.json
```

## Given More Time

- Add full API integration tests against an isolated PostgreSQL test database.
- Add Angular component tests for forms, guard behavior, and task interactions.
- Add CI and deployment manifests for Fly.io, Vercel, and Railway.
- Add refresh tokens or short-lived access-token rotation for stronger auth hardening.
