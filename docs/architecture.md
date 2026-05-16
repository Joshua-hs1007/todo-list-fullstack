# Architecture

## Project Overview

This project is a full-stack To Do List application built with an Angular frontend and an Express TypeScript backend.

The application supports:

- User registration
- User login
- JWT-based authentication
- Authenticated task CRUD
- Per-user task ownership
- Task search and status filtering
- Drag-and-drop task reordering
- PostgreSQL persistence through Prisma
- Backend, frontend, and end-to-end test coverage

The goal of the architecture is to stay simple enough for a take-home engineering challenge while still demonstrating production-ready structure, clear boundaries, validation, error handling, and testability.

## Technology Stack

### Frontend

- Angular
- TypeScript
- Angular standalone components
- Angular Router
- Angular Reactive Forms
- Angular Signals for local state
- Angular CDK Drag and Drop
- Responsive SCSS or CSS
- Playwright for E2E tests
- Vitest, Karma, or Jasmine for frontend unit tests

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt or argon2 for password hashing
- Zod for request validation
- Jest and Supertest for API tests

### Tooling

- pnpm workspace
- Docker Compose
- ESLint
- Prettier
- GitHub Actions, if CI is included

## Repository Structure

```txt
todo-list-challenge/
  README.md
  package.json
  pnpm-workspace.yaml
  docker-compose.yml
  .env.example
  .gitignore

  apps/
    api/
      package.json
      tsconfig.json
      prisma/
        schema.prisma
        migrations/
      src/
        app.ts
        server.ts
        config/
          env.ts
        modules/
          auth/
            auth.routes.ts
            auth.controller.ts
            auth.service.ts
            auth.schemas.ts
          tasks/
            task.routes.ts
            task.controller.ts
            task.service.ts
            task.schemas.ts
        middleware/
          auth.middleware.ts
          error.middleware.ts
          validate.middleware.ts
        lib/
          prisma.ts
          password.ts
          jwt.ts
      tests/
        auth.test.ts
        tasks.test.ts

    web/
      package.json
      angular.json
      src/
        app/
          core/
            api/
              api-client.ts
            auth/
              auth.service.ts
              auth.guard.ts
              auth.interceptor.ts
          features/
            auth/
              sign-in.page.ts
              register.page.ts
            tasks/
              task-list.page.ts
              task-detail.page.ts
              task-form.component.ts
              task-card.component.ts
              task-search.component.ts
          shared/
            ui/
          app.routes.ts
          app.config.ts
        styles.scss
      tests/
        e2e/
          todo.spec.ts

  docs/
    architecture.md
    testing.md

  scripts/
    lint.sh
    test.sh
    typecheck.sh
```

## Backend Architecture

The backend owns authentication, authorization, validation, persistence, task ownership, task reordering, and API error handling.

### Backend Responsibilities

- Expose REST-style JSON APIs.
- Validate all request bodies, route params, and query params.
- Authenticate protected routes with JWT middleware.
- Enforce that users can only access their own tasks.
- Hash passwords before storing them.
- Never return password hashes in API responses.
- Use Prisma for database access.
- Use database transactions where multiple related writes are required.
- Return predictable HTTP status codes and error responses.

## Backend Request Flow

```txt
HTTP request
  ↓
Express route
  ↓
Validation middleware
  ↓
Authentication middleware, when required
  ↓
Controller
  ↓
Service
  ↓
Prisma client
  ↓
PostgreSQL
  ↓
Response or centralized error middleware
```

## Backend Layers

### Routes

Routes define URL structure and attach middleware. Routes should not contain business logic.

Responsibilities:

- Define endpoint paths.
- Attach validation middleware.
- Attach auth middleware.
- Delegate to controllers.

### Controllers

Controllers translate HTTP requests into service calls.

Responsibilities:

- Read validated request data.
- Read authenticated user identity.
- Call the relevant service.
- Return the correct status code and response body.

Controllers should stay thin.

### Services

Services contain business logic.

Responsibilities:

- Register users.
- Verify login credentials.
- Create tasks for a user.
- Confirm task ownership.
- Update task fields.
- Reorder tasks in a transaction.
- Throw known application errors for the centralized error middleware.

### Middleware

Middleware handles cross-cutting concerns.

Recommended middleware:

- `auth.middleware.ts`
  - Reads bearer token.
  - Verifies JWT.
  - Adds authenticated user context to the request.

- `validate.middleware.ts`
  - Runs Zod schemas against body, params, and query data.
  - Returns `400 Bad Request` for invalid input.

- `error.middleware.ts`
  - Converts expected application errors into HTTP responses.
  - Hides internal implementation details for unexpected errors.

### Lib

The `lib/` folder contains shared infrastructure helpers.

Recommended files:

- `prisma.ts`
  - Exports a singleton Prisma client.

- `password.ts`
  - Hashes and verifies passwords.

- `jwt.ts`
  - Signs and verifies JWT access tokens.

## API Design

### Auth Routes

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Task Routes

```txt
GET    /api/tasks?search=&status=
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/reorder
```

## HTTP Status Codes

The API should use standard HTTP semantics.

```txt
200 OK          Successful read, update, or delete
201 Created     Successful create
400 Bad Request Validation error
401 Unauthorized Missing or invalid authentication token
403 Forbidden   Authenticated user attempted to access another user's resource
404 Not Found   Requested resource does not exist
500 Error       Unexpected server error
```

## Database Model

The data model has two primary entities:

- `User`
- `Task`

A user owns many tasks. A task belongs to exactly one user.

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tasks        Task[]
}

model Task {
  id          String     @id @default(cuid())
  userId      String
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?
  position    Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, position])
  @@index([userId, status])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

## Authentication and Authorization

Authentication uses JWT access tokens.

Recommended behavior:

1. User registers with email and password.
2. Password is hashed with bcrypt or argon2.
3. User logs in with valid credentials.
4. Backend returns a JWT access token.
5. Frontend sends the token with API requests using the `Authorization` header.
6. Backend verifies the token on protected routes.
7. Task services enforce that the authenticated user owns the requested task.

Example header:

```txt
Authorization: Bearer <token>
```

Security requirements:

- Never store plain-text passwords.
- Never expose password hashes in API responses.
- Validate all incoming request data.
- Enforce ownership on every task operation.
- Return `401 Unauthorized` for missing or invalid authentication.
- Return `403 Forbidden` when a valid user attempts to access another user's resource.

## Task Reordering

Task reordering is handled through:

```txt
PATCH /api/tasks/reorder
```

Request body:

```json
{
  "orderedTaskIds": ["task_1", "task_2", "task_3"]
}
```

Backend behavior:

1. Validate that `orderedTaskIds` is a non-empty array of task IDs.
2. Fetch all matching tasks for the authenticated user.
3. Confirm that all IDs belong to the authenticated user.
4. Update task positions in a database transaction.
5. Return the reordered task list.

The transaction prevents partial reorder updates.

## Search and Filtering

Task list search should be server-side.

Example:

```txt
GET /api/tasks?search=invoice
```

Optional filtering:

```txt
GET /api/tasks?search=invoice&status=TODO
```

Search fields:

- `title`
- `description`

Filtering field:

- `status`

Results should be scoped to the authenticated user and ordered by `position`.

## Frontend Architecture

The frontend owns navigation, forms, UI state, responsive layout, and communication with the backend API.

### Frontend Responsibilities

- Show login and registration pages.
- Persist the auth token locally.
- Attach the auth token to API requests.
- Protect authenticated routes.
- Display task list and task detail views.
- Support task creation, update, deletion, search, filtering, and reordering.
- Show loading, error, and empty states.
- Provide responsive layouts for desktop and mobile.

## Frontend Request Flow

```txt
Angular component
  ↓
Task store or Auth service
  ↓
API service
  ↓
Angular HTTP client
  ↓
Express API
  ↓
Component state update
```

## Frontend Layers

### Core

The `core/` folder contains app-wide services and infrastructure.

Recommended areas:

- API client
- Auth service
- Auth guard
- Auth interceptor

### Features

The `features/` folder contains route-level feature areas.

Recommended feature areas:

- `auth/`
  - Sign-in page
  - Register page

- `tasks/`
  - Task list page
  - Task detail page
  - Task form component
  - Task card component
  - Task search component

### Shared

The `shared/` folder contains reusable UI or utility code that is not tied to a single feature.

## State Management

Use a lightweight state management approach rather than a large global store.

Recommended flow:

```txt
TaskApiService
  ↓
TaskStore using Angular Signals
  ↓
Components
```

Example state shape:

```ts
type TaskState = {
  tasks: Task[];
  selectedTask: Task | null;
  search: string;
  status: TaskStatus | 'ALL';
  loading: boolean;
  error: string | null;
};
```

Angular Signals are appropriate for this project because the state is local and feature-scoped.

## Frontend Routes

Recommended routes:

```txt
/login
/register
/tasks
/tasks/new
/tasks/:id
```

Route behavior:

- `/login` and `/register` are public.
- `/tasks`, `/tasks/new`, and `/tasks/:id` are protected.
- Unauthenticated users should be redirected to `/login`.
- Authenticated users should land on `/tasks`.

## Environment Configuration

Use environment variables for values that differ across environments.

Recommended `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_app"
JWT_SECRET="replace-with-a-secure-local-secret"
PORT=3000
CLIENT_URL="http://localhost:4200"
```

Rules:

- Do not commit real secrets.
- Keep `.env.example` updated.
- Validate required environment variables during backend startup.
- Fail fast if required config is missing.

## Error Handling

The backend should return consistent error responses.

Recommended shape:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

Guidelines:

- Use `400` for validation errors.
- Use `401` for missing or invalid authentication.
- Use `403` for ownership violations.
- Use `404` for missing resources.
- Use `500` for unexpected errors.
- Do not leak stack traces in production responses.

## Production Readiness Checklist

Before considering the project complete:

- Auth routes work.
- Task CRUD routes work.
- Task ownership is enforced.
- Passwords are hashed.
- JWTs are validated.
- Request bodies are validated.
- Centralized error handling is implemented.
- Database schema and migrations are committed.
- Docker Compose starts PostgreSQL locally.
- Frontend routes are protected.
- UI is responsive.
- Loading, error, and empty states are present.
- Backend tests cover auth, CRUD, ownership, and reorder behavior.
- Frontend tests cover forms, guards, and task UI behavior.
- E2E test covers the happy path.
- Overall automated test coverage is above 90%.
- README contains setup and running instructions.
- No debug logging, TODO comments, or FIXME comments remain.
