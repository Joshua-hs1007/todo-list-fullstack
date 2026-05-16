---
name: write-tests
description: Use when asked to add, repair, or improve tests for auth, task CRUD, task reorder, Angular forms/components/services/guards, or Playwright E2E flows in this project.
---

# Write Tests Skill

## Goal

Add meaningful tests that prove the user-facing behavior and protect the most important production risks.

## Test selection

Choose the narrowest useful test type:

- Backend route behavior: Jest + Supertest
- Backend service logic: Jest unit/integration tests
- Frontend component/form behavior: Angular unit tests
- Frontend API services/guards/interceptors: Angular unit tests with HTTP testing utilities
- Full user journey: Playwright E2E

## Backend test cases to prioritize

- Register succeeds.
- Duplicate registration fails.
- Login succeeds.
- Invalid login fails.
- Missing/invalid JWT returns 401.
- Create task succeeds for authenticated user.
- List tasks returns only authenticated user's tasks.
- Get/update/delete another user's task is forbidden or not found according to project convention.
- Reorder rejects invalid payload.
- Reorder rejects tasks not owned by user.
- Reorder persists positions in order.

## Frontend test cases to prioritize

- Login/register forms validate required fields.
- Auth guard redirects unauthenticated users.
- Auth interceptor attaches token.
- Task list renders tasks and empty state.
- Search and status filter update query/store state.
- Task form validates required title.
- Create/edit/delete flows call API service correctly.
- Reorder emits ordered task IDs correctly.

## E2E happy path

Cover:

```txt
register -> login -> create task -> edit task -> search task -> reorder task -> delete task
```

Use stable selectors such as `data-testid` attributes. Add selectors if needed.

## Rules

- Do not write brittle tests against implementation details unless necessary.
- Prefer realistic fixtures.
- Keep test names behavior-focused.
- Ensure tests fail before the fix when possible.
- Avoid network calls outside the test process.
- Clean up test data between runs.
