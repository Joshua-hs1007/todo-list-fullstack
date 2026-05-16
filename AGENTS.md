# AGENTS.md

## Ground Rules

### Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Goal-Driven Execution

**Define success criteria. Loop until verified.**

## Project context

This repository is a full-stack To Do List application.

Primary stack:

- Frontend: Angular, TypeScript, standalone components, Angular Router, Reactive Forms, Signals, Angular CDK Drag and Drop, responsive SCSS/CSS
- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT authentication, bcrypt or argon2, Zod validation
- Testing: Jest/Supertest for API tests, Angular unit tests, Playwright for E2E
- Tooling: pnpm workspace, Docker Compose, ESLint, Prettier

The app must support user registration, login, authenticated per-user task CRUD, search, status filtering, task detail editing, drag-and-drop reordering, validation, error handling, and test coverage.

## Repository layout

Expected structure:

```txt
apps/
  api/
    prisma/
    src/
      config/
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
    tests/
      e2e/
docs/
scripts/
.agents/skills/
.codex/
```

## Architecture rules

### Backend

- Keep Express app setup separate from server startup.
  - `apps/api/src/app.ts` creates and exports the app.
  - `apps/api/src/server.ts` starts the HTTP server.
- Keep route, controller, service, schema, and middleware responsibilities separate.
- Validate all request bodies and query params with Zod.
- Use centralized error handling middleware.
- Use Prisma transactions when updating task order.
- Never expose `passwordHash` in API responses.
- Never store plain-text passwords.
- Enforce task ownership on every task read, update, delete, and reorder operation.
- Return standard HTTP status codes:
  - `200` for successful reads, updates, deletes
  - `201` for creates
  - `400` for validation errors
  - `401` for missing or invalid auth
  - `403` for authenticated cross-user access
  - `404` for missing resources
  - `500` only for unexpected failures

### Frontend

- Prefer Angular standalone components.
- Prefer Angular Signals for local feature state.
- Use Reactive Forms for auth and task forms.
- Keep API calls in services, not components.
- Protect task routes with an auth guard.
- Use an HTTP interceptor for JWT auth headers.
- Keep task list, task detail, task form, task card, search/filter controls separated.
- Implement drag-and-drop ordering with Angular CDK.
- Keep UI responsive and accessible.

### Shared project quality

- Make small, focused changes.
- Avoid broad unrelated refactors.
- Do not introduce new production dependencies without a clear reason.
- Prefer explicit, readable TypeScript over clever abstractions.
- Keep behavior covered by tests.
- Update docs when changing setup, commands, architecture, API behavior, or testing approach.
- Do not leave TODO, FIXME, debug logs, console logs, or commented-out code in final changes.

## Commands

Use the wrapper scripts first because they are the stable interface for Codex:

```bash
./scripts/lint.sh
./scripts/typecheck.sh
./scripts/test.sh
```

Expected package scripts may include:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm api:test
pnpm web:test
pnpm test:e2e
pnpm db:migrate
pnpm api:dev
pnpm web:dev
```

## Environment

Use `.env.example` as the source of truth for required variables.

Expected local values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_app"
JWT_SECRET="replace-with-a-secure-local-secret"
PORT=3000
CLIENT_URL="http://localhost:4200"
```

Do not commit real secrets.

## Database model expectations

Use Prisma models equivalent to:

- `User`
  - `id`
  - `email`
  - `passwordHash`
  - timestamps
  - relation to tasks
- `Task`
  - `id`
  - `userId`
  - `title`
  - `description`
  - `status`
  - `dueDate`
  - `position`
  - timestamps
  - user relation
- `TaskStatus`
  - `TODO`
  - `IN_PROGRESS`
  - `DONE`

Use indexes for per-user ordering and status filtering.

## API contract

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

Task reorder request:

```json
{
  "orderedTaskIds": ["task_1", "task_2", "task_3"]
}
```

Reorder requirements:

- Validate payload.
- Verify all task IDs belong to the authenticated user.
- Update positions in a transaction.
- Return the reordered task list.

## Testing expectations

### Backend tests

Cover at minimum:

- User can register.
- Duplicate email is rejected.
- User can log in.
- Invalid login is rejected.
- Unauthenticated users cannot access tasks.
- Authenticated user can create a task.
- Authenticated user can list only their own tasks.
- User cannot view, update, delete, or reorder another user's tasks.
- User can update their own task.
- User can delete their own task.
- User can reorder their own tasks.
- Invalid reorder payload is rejected.

### Frontend tests

Cover at minimum:

- Login form validates required fields.
- Register form validates required fields.
- Auth guard redirects unauthenticated users.
- Task list renders loaded tasks.
- Search/filter controls update task query state.
- Task form validates required title.
- Create, edit, and delete flows call the expected API service methods.

### E2E test

Cover the happy path:

```txt
register -> login -> create task -> edit task -> search task -> reorder task -> delete task
```

## Definition of done

Before finishing a code task, Codex should:

1. Explain the intended change briefly.
2. Inspect relevant existing files before editing.
3. Implement the smallest production-ready change.
4. Add or update tests for changed behavior.
5. Run the most relevant checks:
   - `./scripts/lint.sh`
   - `./scripts/typecheck.sh`
   - `./scripts/test.sh`
6. Report:
   - files changed
   - verification commands and results
   - risks or follow-up work

If checks cannot run because dependencies, Docker, or environment variables are missing, say exactly what blocked verification and what command should be run next.
