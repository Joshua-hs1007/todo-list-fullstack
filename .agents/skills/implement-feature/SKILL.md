---
name: implement-feature
description: Use when asked to implement a new production-ready feature in the Angular + Express + Prisma To Do app, including API, UI, validation, persistence, and tests.
---

# Implement Feature Skill

## Goal

Deliver a scoped feature end-to-end with production-ready code, tests, and documentation updates.

## Workflow

1. Identify the user-visible behavior.
2. Locate existing conventions in nearby API, Angular, Prisma, and test files.
3. Design the smallest vertical slice.
4. Update API contract if needed.
5. Update Prisma schema/migration if persistence changes are required.
6. Implement backend validation, service logic, ownership checks, and routes.
7. Implement frontend API service, state, form/component/page changes.
8. Add or update tests.
9. Update docs when commands, API, env, or architecture changes.
10. Run relevant checks.

## Required quality gates

- Request validation exists.
- Auth and ownership behavior is explicit.
- Loading, empty, and error states are handled in UI.
- Tests cover success and failure cases.
- Public behavior is documented.
