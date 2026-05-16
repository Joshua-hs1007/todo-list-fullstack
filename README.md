# To Do List Challenge

Full-stack To Do List application scaffolded as a pnpm workspace with an Angular web app, Express TypeScript API, Prisma, PostgreSQL, and automated test entry points.

## Stable Version Baseline

- Node.js: LTS-compatible `>=22.13 <25`
- pnpm: `11.1.2`
- Angular: `21.2.12`
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

Database commands are available but should only be run when you intentionally want to use the local database:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:deploy
```
