# To Do List Challenge

Full-stack To Do List application implemented as a pnpm workspace with an Angular web app, Express TypeScript API, Prisma, PostgreSQL, and automated test entry points.

Production is intended to run on distributed cloud infrastructure:

- Frontend: Vercel
- Backend API: Fly.io
- Database: Railway PostgreSQL

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

## Cloud Deployment

The planned production topology is:

```txt
Browser -> Vercel Angular frontend -> Fly.io Express API -> Railway PostgreSQL
```

Use `docs/cloud-infra.md` for the longer deployment checklist. The short setup is below.

### Railway PostgreSQL

Create a Railway PostgreSQL database and copy its public `DATABASE_URL`.

The Fly.io backend uses that value as its Prisma connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Run production migrations against Railway after the backend environment is configured:

```bash
pnpm db:migrate:deploy
```

### Fly.io Backend

Deploy `apps/api` as the Node/Express API. Required Fly.io secrets:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-secure-production-secret"
NODE_ENV="production"
PORT="3000"
CLIENT_URL="https://your-vercel-app.vercel.app"
```

Set them with:

```bash
fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
fly secrets set JWT_SECRET="replace-with-secure-production-secret"
fly secrets set NODE_ENV="production"
fly secrets set PORT="3000"
fly secrets set CLIENT_URL="https://your-vercel-app.vercel.app"
```

`CLIENT_URL` must match the deployed Vercel URL so CORS allows browser requests.

Current backend deployment steps:

1. Install and authenticate the Fly CLI:

```bash
fly auth login
```

2. Build the API locally before deploying:

```bash
pnpm install
pnpm db:generate
pnpm api:build
```

3. Create the Fly app from the repository root:

```bash
fly apps create todo-api
```

Use a unique app name if `todo-api` is unavailable, then update the `app` value in `fly.toml`.

The repository includes the backend deployment files:

- `fly.toml` should expose internal port `3000`.
- `Dockerfile` installs workspace dependencies, generates Prisma, builds `@todo/api`, and starts the compiled API.
- `.dockerignore` keeps local dependencies, build output, logs, and secrets out of the Docker build context.

The app start command must resolve to:

```bash
pnpm --filter @todo/api start
```

4. Set production secrets on the Fly app:

```bash
fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
fly secrets set JWT_SECRET="replace-with-secure-production-secret"
fly secrets set NODE_ENV="production"
fly secrets set PORT="3000"
fly secrets set CLIENT_URL="https://your-vercel-app.vercel.app"
```

5. Deploy the backend:

```bash
fly deploy
```

6. Run Railway database migrations from your local machine with the production `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE" pnpm db:migrate:deploy
```

On Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
pnpm.cmd db:migrate:deploy
```

7. Check logs if the app does not start:

```bash
fly logs
```

After deployment, verify:

```txt
https://your-fly-api.fly.dev/health
https://your-fly-api.fly.dev/api/docs
```

### Vercel Frontend

Deploy the Angular app to Vercel.

Recommended Vercel settings:

```txt
Framework Preset: Angular
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm web:build
Output Directory: apps/web/dist/apps/web/browser
```

The frontend API base URL is configured in:

```txt
apps/web/src/environments/environment.ts
apps/web/src/environments/environment.prod.ts
```

For production, set the API URL to the Fly.io API origin plus `/api`:

```ts
apiUrl: 'https://your-fly-api.fly.dev/api'
```

If the production URL changes, update the frontend environment before rebuilding and redeploying to Vercel.

### Production Verification

After all services are deployed:

1. Open the Vercel frontend.
2. Confirm the Fly.io `/health` endpoint returns `{ "status": "ok" }`.
3. Confirm Prisma migrations have run against Railway.
4. Register a user.
5. Log in.
6. Create, edit, search, reorder, and delete a task.

## API Docs

After starting the API, open:

```txt
http://localhost:3000/api/docs
http://localhost:3000/api/openapi.json
```

## Given More Time

- Add full API integration tests against an isolated PostgreSQL test database.
- Add Angular component tests for forms, guard behavior, and task interactions.
- Add CI automation for lint, typecheck, tests, migrations, and cloud deploys.
- Add refresh tokens or short-lived access-token rotation for stronger auth hardening.
