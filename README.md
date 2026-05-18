# To Do List Challenge

Full-stack To Do List application built as a pnpm workspace with an Angular frontend, an Express TypeScript API, Prisma ORM, PostgreSQL, JWT authentication, and automated backend, frontend, and Playwright E2E tests.

## Assignment Summary

The assignment was to build a production-style To Do List application where users can register, log in, and manage only their own tasks. The app supports authenticated task CRUD, search, status filtering, task detail editing, drag-and-drop reordering, validation, error handling, and responsive UI states.

The target architecture is a distributed deployment:

```txt
Browser -> Vercel Angular frontend -> Fly.io Express API -> Railway PostgreSQL
```

## Overall Approach

I split the project into a pnpm monorepo with separate `apps/api` and `apps/web` workspaces.

On the backend, Express app setup is separated from server startup. Routes, controllers, services, schemas, middleware, Prisma access, password hashing, JWT handling, and error handling are kept in separate modules. Zod validates request bodies, params, and query strings. Task services enforce per-user ownership, and task reordering is handled with Prisma transactions.

On the frontend, Angular standalone components are organized by feature. Auth and API concerns live in `core`, task UI lives in `features/tasks`, API calls stay in services, local task state is handled with Angular Signals, forms use Reactive Forms, protected routes use an auth guard, and JWT headers are attached by an HTTP interceptor.

Testing is layered: backend Jest/Supertest tests cover service, schema, middleware, controller, and route behavior; frontend Vitest tests cover services, guards, forms, components, and stores; Playwright verifies the main user journey with mocked API responses.

## Completed Features

- User registration, login, logout, and `/api/auth/me`
- Password hashing with `bcryptjs`
- JWT bearer authentication
- Angular auth guard for protected task routes
- HTTP interceptor for auth headers
- Authenticated task create, read, update, and delete
- Per-user task ownership checks for read, update, delete, and reorder
- Server-side task search by title/description
- Status filtering by `TODO`, `IN_PROGRESS`, and `DONE`
- Task detail create/edit page
- Delete confirmation modal
- Drag-and-drop task reordering with Angular CDK
- Transactional reorder endpoint: `PATCH /api/tasks/reorder`
- Zod request validation
- Centralized API error handling
- Prisma schema and migrations for PostgreSQL
- Responsive Angular auth, list, search/filter, card, and detail screens
- Loading, empty, error, and success notification states
- OpenAPI JSON and Swagger UI endpoints
- Dockerfile and Fly.io config for API deployment
- Docker Compose PostgreSQL for local development
- Backend tests, frontend unit tests, and Playwright E2E happy path

## Stack

| Area | Technology |
| --- | --- |
| Frontend | Angular 21, TypeScript, standalone components, Angular Router, Reactive Forms, Signals, Angular CDK Drag and Drop |
| Backend | Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL, JWT, bcryptjs, Zod |
| Testing | Jest, Supertest, Vitest, Playwright |
| Tooling | pnpm workspace, Docker Compose, ESLint, Prettier |
| Cloud target | Vercel frontend, Fly.io API, Railway PostgreSQL |

## Repository Layout

```txt
apps/
  api/
    prisma/
      schema.prisma
      migrations/
    src/
      app.ts
      server.ts
      config/
      docs/
      lib/
      middleware/
      modules/
        auth/
        tasks/
    tests/
  web/
    src/
      app/
        core/
        features/
        shared/
      environments/
    tests/
      e2e/
docs/
scripts/
docker-compose.yml
pnpm-workspace.yaml
```

## Running Locally On Mac

### Requirements

- Node.js `>=22.13 <25`
- pnpm `>=11 <12`
- Docker Desktop
- Fly CLI and Vercel CLI only if deploying

This repo is pinned to pnpm `11.1.2`.

### Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Expected local values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_app"
JWT_SECRET="replace-with-a-secure-local-secret"
NODE_ENV="development"
PORT=3000
CLIENT_URL="http://localhost:4200"
NG_APP_API_URL="http://localhost:3000/api"
```

Do not commit real secrets. The Angular API URL is configured in:

```txt
apps/web/src/environments/environment.ts
apps/web/src/environments/environment.prod.ts
```

### Setup

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Generate Prisma client and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

Start the API and web app in separate terminals:

```bash
pnpm api:dev
pnpm web:dev
```

Open:

```txt
http://localhost:4200
```

The API runs at:

```txt
http://localhost:3000
```

API docs:

```txt
http://localhost:3000/api/docs
http://localhost:3000/api/openapi.json
```

## Verification Commands

Use the wrapper scripts from the repository root:

```bash
./scripts/lint.sh
./scripts/typecheck.sh
./scripts/test.sh
```

Useful package scripts:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm api:test
pnpm web:test
pnpm test:e2e
pnpm api:build
pnpm web:build
```

Install Playwright browsers if needed:

```bash
pnpm exec playwright install
```

Latest local verification:

```txt
pnpm lint       passed
pnpm typecheck  passed
pnpm web:test   passed, 14 files and 50 tests
pnpm test:e2e   passed, 1 Playwright test
```

## API Contract

Auth routes:

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

Task routes:

```txt
GET    /api/tasks?search=&status=
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/reorder
```

Reorder payload:

```json
{
  "orderedTaskIds": ["task_1", "task_2", "task_3"]
}
```

## Deployment Instructions

### Production Topology

```txt
Browser -> Vercel Angular frontend -> Fly.io Express API -> Railway PostgreSQL
```

See `docs/cloud-infra.md` for the longer deployment checklist.

### Railway PostgreSQL

Create a Railway PostgreSQL database and copy the production `DATABASE_URL`.

Run production migrations after the API environment is configured:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE" pnpm db:migrate:deploy
```

### Fly.io API

Required API environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-secure-production-secret"
NODE_ENV="production"
PORT="3000"
CLIENT_URL="https://your-vercel-app.vercel.app"
```

Deploy from a Mac:

```bash
fly auth login
pnpm install
pnpm api:build
fly apps create todo-list-api
fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
fly secrets set JWT_SECRET="replace-with-secure-production-secret"
fly secrets set NODE_ENV="production"
fly secrets set PORT="3000"
fly secrets set CLIENT_URL="https://your-vercel-app.vercel.app"
fly deploy
```

If you want two Fly machines for availability after the app is healthy:

```bash
fly scale count 2
```

Verify:

```txt
https://your-fly-api.fly.dev/health
https://your-fly-api.fly.dev/api/docs
```

### Vercel Frontend

Before deploying, set the production API URL in:

```txt
apps/web/src/environments/environment.prod.ts
```

Example:

```ts
apiUrl: 'https://your-fly-api.fly.dev/api'
```

Recommended Vercel settings:

```txt
Framework Preset: Angular
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm web:build
Output Directory: apps/web/dist/apps/web/browser
```

After deployment, open the Vercel frontend and verify:

```txt
register -> login -> create task -> edit task -> search task -> reorder task -> delete task
```

## Given More Time: Product Features

- Task due-date reminders and overdue indicators: about 4-6 hours.
- Pagination or infinite scroll for large task lists: about 4-6 hours.
- Keyboard-accessible reorder controls in addition to drag-and-drop: about 4-8 hours.
- Task priority, labels, or projects: about 1-2 days depending on UI depth.
- Account settings and password reset flow: about 1-2 days.
- Better empty-state onboarding and optional sample tasks: about 2-4 hours.

## Given More Time: Robustness

- Add CI for lint, typecheck, backend tests, frontend tests, Playwright E2E, Docker build, and Prisma migration checks: about 4-8 hours.
- Enforce backend and frontend coverage thresholds in CI: about 2-4 hours.
- Add full API integration tests against an isolated PostgreSQL test database: about 1 day.
- Add production rate limiting, request logging, and structured logs: about 4-6 hours.
- Add refresh tokens or short-lived access-token rotation: about 1 day.
- Add monitoring, uptime checks, and error reporting for Fly.io and Vercel: about 4-6 hours.
- Add database backup/restore runbook for Railway: about 2-4 hours.
- Add accessibility audit and fixes with keyboard and screen-reader testing: about 1 day.

## Documentation

- `docs/architecture.md`: architecture, boundaries, data model, and API design
- `docs/testing.md`: test strategy, recommended coverage, E2E expectations, and QA checklist
- `docs/cloud-infra.md`: Vercel, Fly.io, and Railway deployment checklist
