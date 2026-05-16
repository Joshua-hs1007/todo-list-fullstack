---
name: code-review
description: Use when asked to review code, assess production readiness, inspect a pull request, find bugs, evaluate architecture, or identify missing tests in this Angular + Express + Prisma To Do app.
---

# Code Review Skill

## Goal

Review for correctness, security, maintainability, test coverage, and production readiness.

## Review priorities

1. Security and data isolation
   - Passwords must be hashed.
   - JWT verification must be enforced on task routes.
   - Users must not access other users' tasks.
   - Secrets must not be committed or logged.

2. API correctness
   - REST routes match the documented contract.
   - Status codes are correct.
   - Zod validation covers params, query, and body.
   - Error middleware returns safe, consistent responses.

3. Database correctness
   - Prisma schema supports ownership and ordering.
   - Reorder operations are transactional.
   - Queries are scoped by `userId`.
   - Indexes support common access patterns.

4. Angular correctness
   - Auth flow redirects correctly.
   - JWT is attached by interceptor.
   - Protected routes use guards.
   - Forms validate before submission.
   - Task list supports search, filter, reorder, empty state, loading state, and errors.

5. Test coverage
   - Backend auth and ownership tests exist.
   - Task CRUD and reorder tests exist.
   - Frontend form/guard/service/component tests exist.
   - Playwright happy path exists.

6. Maintainability
   - Code is simple, typed, and idiomatic.
   - No unrelated refactors.
   - No debug logs, TODOs, or commented-out code.
   - Docs and scripts match actual commands.

## Output format

Use this structure:

```md
## Summary

## Blocking issues

## Non-blocking improvements

## Missing tests

## Production-readiness notes

## Suggested next steps
```

Be specific. Reference files, functions, routes, or components when possible.
