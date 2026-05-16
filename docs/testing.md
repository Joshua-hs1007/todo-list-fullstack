# Testing

## Testing Strategy

This project should include backend API tests, frontend unit or component tests, and an end-to-end happy-path test.

The purpose of the test suite is to prove that the application works as a production-style full-stack To Do List app with authentication, authorization, task ownership, validation, and task management.

## Coverage Requirement

Automated test coverage must be above 90% before the project is considered production-ready.

Recommended minimum thresholds:

```txt
Statements: 90%
Branches:   90%
Functions:  90%
Lines:      90%
```

Coverage should be enforced in CI and in local verification scripts. Do not lower thresholds to make a build pass. Add meaningful tests instead.

## Test Pyramid

Recommended balance:

```txt
Backend API tests       Many
Frontend unit tests     Some
E2E tests               Few but high value
```

Backend tests should carry most of the business-logic and authorization coverage.

Frontend tests should verify important UI behavior, route protection, form validation, and API integration boundaries.

E2E tests should verify that the main user journey works across the full stack.

## Commands

Use these scripts from the repository root:

```bash
./scripts/lint.sh
./scripts/typecheck.sh
./scripts/test.sh
```

Recommended package-level scripts:

```bash
pnpm test
pnpm test:coverage
pnpm api:test
pnpm api:test:coverage
pnpm web:test
pnpm web:test:coverage
pnpm test:e2e
```

## Coverage Configuration

### Backend Jest Coverage

The backend should enforce coverage thresholds in Jest.

Example `apps/api/jest.config.ts`:

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
};

export default config;
```

### Frontend Coverage

The frontend should also enforce 90%+ coverage. Use the coverage tooling appropriate for the selected Angular test runner.

For Vitest, configure thresholds in `vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

For Karma/Jasmine, configure coverage thresholds in the Angular/Karma coverage settings so CI fails when coverage drops below 90%.

## Backend Testing

### Tools

Recommended tools:

- Jest
- Supertest
- Prisma
- PostgreSQL test database

### Scope

Backend tests should verify:

- Auth behavior
- Validation behavior
- Authorization and task ownership
- Task CRUD behavior
- Task reorder behavior
- Correct HTTP status codes
- Safe response payloads

### Recommended Test Cases

#### Auth

```txt
User can register.
Duplicate email is rejected.
User can log in.
Invalid login is rejected.
GET /api/auth/me returns the authenticated user.
GET /api/auth/me rejects unauthenticated requests.
Password hashes are not returned in API responses.
```

#### Tasks

```txt
Unauthenticated users cannot access tasks.
Authenticated user can create a task.
Authenticated user can list their own tasks.
Authenticated user can view their own task.
Authenticated user can update their own task.
Authenticated user can delete their own task.
User cannot view another user's task.
User cannot update another user's task.
User cannot delete another user's task.
User can search their own tasks.
User can filter tasks by status.
User can reorder their own tasks.
Invalid reorder payload is rejected.
Reorder request cannot include another user's task.
```

#### Validation

```txt
Registration rejects invalid email.
Registration rejects missing password.
Login rejects missing email or password.
Create task rejects missing title.
Update task rejects invalid status.
Reorder rejects empty task ID array.
Reorder rejects duplicate task IDs.
```

#### HTTP Status Codes

Verify expected status codes:

```txt
200 OK          Successful read, update, or delete
201 Created     Successful create
400 Bad Request Validation error
401 Unauthorized Missing or invalid authentication token
403 Forbidden   Authenticated user attempted to access another user's resource
404 Not Found   Requested resource does not exist
500 Error       Unexpected server error
```

## Backend Test Guidelines

### Use Test Helpers

Create helpers for repeated setup:

```ts
async function createTestUser() {
  // create a user directly or through the API
}

async function loginTestUser() {
  // return a valid JWT
}

async function createTaskForUser(userId: string) {
  // create a task owned by the user
}
```

### Keep Tests Isolated

Each test should be independent.

Recommended approaches:

- Clear test data before each test.
- Use a dedicated test database.
- Avoid depending on test execution order.
- Avoid sharing mutable state across tests.

### Test Through the API

For integration tests, prefer calling routes through Supertest instead of directly calling service methods.

This validates the complete backend request flow:

```txt
route → middleware → controller → service → database → response
```

### Assert Security-Sensitive Behavior

Always verify:

- Password hashes are never returned.
- Users cannot access other users' tasks.
- Auth is required for protected routes.
- Invalid tokens are rejected.

## Frontend Testing

### Tools

Recommended options:

- Vitest, Karma, or Jasmine for unit tests
- Angular Testing Library, if included
- Playwright for E2E tests

### Scope

Frontend tests should verify:

- Form validation
- Auth guard behavior
- Auth service behavior
- API service behavior
- Task list rendering
- Search and filter controls
- Task create/edit/delete flows
- Error and loading states

## Recommended Frontend Test Cases

### Auth UI

```txt
Login form validates required fields.
Login form shows an error for invalid credentials.
Login form submits valid credentials.
Register form validates required fields.
Register form validates email format.
Register form submits valid registration data.
Authenticated user is redirected to /tasks.
Unauthenticated user is redirected to /login for protected routes.
```

### Task UI

```txt
Task list renders tasks.
Task list shows loading state.
Task list shows empty state.
Task list shows error state.
Search input updates task query.
Status filter updates task query.
Create task form validates required title.
Create task flow calls API correctly.
Edit task form loads existing task values.
Edit task flow calls API correctly.
Delete confirmation works.
Drag-and-drop reorder calls API with ordered task IDs.
```

### API Services

```txt
Auth service stores token after login.
Auth service clears token after logout.
Auth interceptor attaches bearer token.
Task API service sends correct request payloads.
Task API service handles API errors.
```

## End-to-End Testing

### Tool

Use Playwright.

### Recommended Happy Path

The core E2E test should cover:

```txt
register → login → create task → edit task → search task → reorder task → delete task
```

### E2E Test Expectations

The test should verify that:

- A new user can register.
- The registered user can log in.
- The user can create a task.
- The created task appears in the task list.
- The user can edit the task.
- Search finds the task.
- Reordering works when multiple tasks exist.
- The user can delete the task.
- The deleted task no longer appears.

## E2E Data Strategy

Use unique user emails per test run.

Example:

```ts
const email = `test-${Date.now()}@example.com`;
```

This avoids collisions across local and CI runs.

## Test Database Strategy

Use a separate database for tests.

Example environment value:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_app_test"
```

Recommended behavior:

- Do not run tests against the development database.
- Reset test data between test runs.
- Keep migrations aligned with the development database.
- Seed only the minimum data needed for a test.

## CI Testing

If GitHub Actions or another CI system is included, the CI workflow should run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm test:e2e
```

For PostgreSQL-backed tests, CI should start a Postgres service or use Docker Compose.

CI must fail when global backend or frontend coverage drops below 90%.

## Coverage Priorities

Prioritize tests for areas most likely to break production behavior:

1. Authentication
2. Authorization and task ownership
3. Request validation
4. Task CRUD
5. Task reorder transaction
6. Frontend route protection
7. Main E2E happy path

## Manual QA Checklist

Before submitting the project, manually verify:

```txt
User can register.
User can log in.
User can log out.
Unauthenticated users cannot access /tasks.
Task list loads after login.
User can create a task.
User can edit a task.
User can delete a task.
User can search tasks.
User can filter tasks by status.
User can reorder tasks.
Task changes persist after refresh.
Another user cannot access the first user's tasks.
Mobile layout is usable.
No console errors appear during normal use.
```

## Pre-Submission Checklist

Run:

```bash
./scripts/lint.sh
./scripts/typecheck.sh
./scripts/test.sh
```

Then verify:

```txt
All tests pass.
Coverage is above 90% for statements, branches, functions, and lines.
Lint passes.
Typecheck passes.
README instructions work from a clean clone.
Docker Compose starts required services.
.env.example is complete.
No secrets are committed.
No debug logs remain.
No TODO or FIXME comments remain.
```

## Known Tradeoffs

For a take-home challenge, the test suite should focus on correctness and coverage of important flows rather than exhaustive UI snapshots.

Good coverage includes:

- Backend integration tests for business behavior.
- Frontend tests for forms and route protection.
- One strong E2E happy path.
- Coverage thresholds above 90% enforced in automated checks.

Additional tests can be added later for:

- Accessibility
- Keyboard drag-and-drop support
- Refresh token behavior
- Rate limiting
- Pagination
- Monitoring and error reporting
