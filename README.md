# To Do List Challenge

Full-stack To Do List application built as a pnpm workspace with an Angular frontend, an Express TypeScript API, Prisma ORM, PostgreSQL, JWT authentication, and automated backend, frontend, and Playwright E2E tests.

The app supports user registration, login, authenticated per-user task CRUD, search, status filtering, task detail editing, drag-and-drop reordering, validation, error handling, and responsive UI states.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | Angular 21, TypeScript, standalone components, Angular Router, Reactive Forms, Signals, Angular CDK Drag and Drop |
| Backend | Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL, JWT, bcryptjs, Zod |
| Testing | Jest, Supertest, Vitest, Playwright |
| Tooling | pnpm workspace, Docker Compose, ESLint, Prettier |
| Planned cloud target | Vercel frontend, Fly.io API, Railway PostgreSQL |

## Features

- Register, login, logout, and `/api/auth/me`
- Password hashing and JWT bearer authentication
- Protected task routes and Angular auth guard
- Per-user task ownership enforcement on read, update, delete, and reorder
- Task create, read, update, delete, search, status filter, and detail editing
- Transactional task reordering through `PATCH /api/tasks/reorder`
- Responsive Angular screens for auth, task list, task detail, forms, task cards, search/filter controls, and delete confirmation
- Loading, empty, error, and success notification states
- OpenAPI JSON and Swagger UI for the API
- Backend service/controller/schema/middleware tests
- Frontend service/guard/interceptor/form/store/component tests
- Mocked Playwright happy path covering register, create, edit, search, reorder, and delete

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

## Requirements

- Node.js `>=22.13 <25`
- pnpm `>=11 <12`
- Docker Desktop, if running PostgreSQL locally
- Playwright browsers for E2E tests

This repo is pinned to pnpm `11.1.2` in `package.json`.

## Environment

Copy `.env.example` to `.env` before running the API:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_app"
JWT_SECRET="replace-with-a-secure-local-secret"
NODE_ENV="development"
PORT=3000
CLIENT_URL="http://localhost:4200"
NG_APP_API_URL="http://localhost:3000/api"
```

Do not commit real secrets. The Angular app currently reads its API URL from:

```txt
apps/web/src/environments/environment.ts
apps/web/src/environments/environment.prod.ts
```

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Generate the Prisma client:

```bash
pnpm db:generate
```

Run local migrations:

```bash
pnpm db:migrate
```

Start the API and web app in separate terminals:

```bash
pnpm api:dev
pnpm web:dev
```

Open the app at:

```txt
http://localhost:4200
```

The API runs at:

```txt
http://localhost:3000
```

## API

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

API docs are available after starting the API:

```txt
http://localhost:3000/api/docs
http://localhost:3000/api/openapi.json
```

## Database Model

Prisma defines:

- `User`: `id`, `email`, `passwordHash`, timestamps, relation to tasks
- `Task`: `id`, `userId`, `title`, `description`, `status`, `dueDate`, `position`, timestamps
- `TaskStatus`: `TODO`, `IN_PROGRESS`, `DONE`

The schema indexes per-user ordering and status filtering:

```prisma
@@index([userId, position])
@@index([userId, status])
```

## Commands

On macOS, use the wrapper scripts from the repository root:

```bash
./scripts/lint.sh
./scripts/typecheck.sh
./scripts/test.sh
```

Equivalent package scripts:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm api:test
pnpm web:test
pnpm test:e2e
pnpm api:build
pnpm web:build
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:deploy
```

## Testing

Backend tests live under:

```txt
apps/api/tests/
```

They cover auth services, task services, schemas, middleware, controllers, and app routes.

Frontend unit tests live beside Angular source files under:

```txt
apps/web/src/app/**/*.spec.ts
```

They cover API clients, auth service, auth guard, auth interceptor, notifications, auth pages, task store, list/detail pages, task form, task card, and search controls.

The Playwright E2E test lives at:

```txt
apps/web/tests/e2e/todo.spec.ts
```

The current E2E test uses mocked API routes and verifies the full UI flow:

```txt
register -> task list -> create task -> edit task -> search task -> reorder task -> delete task
```

Install Playwright browsers if needed:

```bash
pnpm exec playwright install
```

Latest local verification performed in this workspace:

```txt
pnpm lint       passed
pnpm typecheck  passed
pnpm web:test   passed, 14 files and 50 tests
pnpm test:e2e   passed, 1 Playwright test
```

## Build

Build the backend:

```bash
pnpm api:build
```

Build the frontend:

```bash
pnpm web:build
```

Angular production output is written to:

```txt
apps/web/dist/apps/web/browser
```

## Deployment Notes

The intended production topology is:

```txt
Browser -> Vercel Angular frontend -> Fly.io Express API -> Railway PostgreSQL
```

See `docs/cloud-infra.md` for the full cloud checklist.

### Fly.io API

Required API environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-secure-production-secret"
NODE_ENV="production"
PORT="3000"
CLIENT_URL="https://your-vercel-app.vercel.app"
```

Deploy flow:

```bash
pnpm install
pnpm db:generate
pnpm api:build
fly apps create todo-list-api
fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
fly secrets set JWT_SECRET="replace-with-secure-production-secret"
fly secrets set NODE_ENV="production"
fly secrets set PORT="3000"
fly secrets set CLIENT_URL="https://your-vercel-app.vercel.app"
fly deploy
```

Run production migrations against Railway:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE" pnpm db:migrate:deploy
```

Verify:

```txt
https://your-fly-api.fly.dev/health
https://your-fly-api.fly.dev/api/docs
```

### Vercel Frontend

Recommended settings:

```txt
Framework Preset: Angular
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm web:build
Output Directory: apps/web/dist/apps/web/browser
```

Before deploying, set the production API URL in:

```txt
apps/web/src/environments/environment.prod.ts
```

Example:

```ts
apiUrl: 'https://your-fly-api.fly.dev/api'
```

## Documentation

- `docs/architecture.md`: architecture, boundaries, data model, and API design
- `docs/testing.md`: test strategy, recommended coverage, E2E expectations, and QA checklist
- `docs/cloud-infra.md`: Vercel, Fly.io, and Railway deployment checklist

## Known Follow-Up Work

- Add CI to run lint, typecheck, backend tests, frontend tests, Playwright E2E, and migrations.
- Enforce coverage thresholds in CI.
- Add production hardening such as rate limiting, token rotation or refresh tokens, monitoring, and structured logs.
