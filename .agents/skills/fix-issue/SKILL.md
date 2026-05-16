---
name: fix-issue
description: Use when asked to investigate and fix a bug, failing test, regression, broken API route, broken Angular flow, auth issue, Prisma issue, or task CRUD/reorder issue in this project.
---

# Fix Issue Skill

## Goal

Find the smallest production-ready fix for a reported bug while preserving architecture, tests, and project conventions.

## Workflow

1. Restate the failure in one sentence.
2. Inspect the relevant route, service, schema, component, guard, interceptor, store, or test before editing.
3. Reproduce the failure with the narrowest command available when possible.
4. Identify whether the issue is in:
   - API routing/controller/service
   - validation schema
   - auth middleware/JWT handling
   - Prisma query/transaction
   - Angular API client/service/store
   - Angular form/component/router/guard
   - test setup or fixtures
5. Make the smallest change that fixes the root cause.
6. Add or update a regression test.
7. Run the most relevant checks.

## Backend-specific checks

For Express/Prisma bugs:

- Validate request inputs with Zod.
- Preserve HTTP status semantics.
- Ensure ownership checks are explicit.
- Ensure password hashes and secrets are never returned.
- Use Prisma transactions for reorder changes.
- Prefer service-level tests for business rules and Supertest for route behavior.

## Frontend-specific checks

For Angular bugs:

- Keep API concerns in services.
- Keep route protection in guards/interceptors.
- Use Reactive Forms for validation.
- Use Signals for local state when appropriate.
- Preserve responsive behavior and accessibility.
- Avoid putting business logic directly in templates.

## Completion response

Report:

- Root cause
- Fix summary
- Tests added or updated
- Commands run and results
- Any remaining risk
