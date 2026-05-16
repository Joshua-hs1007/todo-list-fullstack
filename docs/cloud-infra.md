# Cloud Infrastructure

This document describes the recommended cloud deployment setup for the To Do List application.

The proposed production deployment uses:

```txt
Frontend  → Vercel
Backend   → Fly.io
Database  → Railway PostgreSQL
```

---

## Infrastructure Overview

```txt
User Browser
  ↓
Vercel Angular Frontend
  ↓
Fly.io Express API
  ↓
Railway PostgreSQL
```

### Services

| Layer | Provider | Purpose |
| --- | --- | --- |
| Frontend | Vercel | Hosts the Angular web application |
| Backend | Fly.io | Hosts the Node.js / Express API |
| Database | Railway | Hosts PostgreSQL |
| Secrets | Vercel / Fly.io | Stores production environment variables |

---

## Frontend Deployment: Vercel

The Angular frontend can be deployed to Vercel as a static web application.

### Required Vercel Environment Variables

```env
VITE_API_URL="https://your-fly-api.fly.dev"
```

If the Angular app uses a different environment variable naming convention, use one of the following instead:

```env
NG_APP_API_URL="https://your-fly-api.fly.dev"
```

or:

```env
API_URL="https://your-fly-api.fly.dev"
```

Use the variable name that matches the frontend codebase.

### Recommended Frontend Build Settings

```txt
Framework Preset: Angular
Build Command: pnpm web:build
Output Directory: dist/apps/web/browser
Install Command: pnpm install --frozen-lockfile
```

The output directory may differ depending on the Angular workspace configuration.

---

## Backend Deployment: Fly.io

The backend API can be deployed to Fly.io as a Node.js service.

### Required Fly.io Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-secure-production-secret"
NODE_ENV="production"
PORT="3000"
CLIENT_URL="https://your-vercel-app.vercel.app"
```

### Environment Variable Details

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Railway PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWT tokens |
| `NODE_ENV` | Yes | Should be set to `production` |
| `PORT` | Yes | Port the Express app listens on |
| `CLIENT_URL` | Yes | Public Vercel frontend URL used for CORS |

### Set Fly.io Secrets

Run these commands from the backend project directory:

```bash
fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
fly secrets set JWT_SECRET="replace-with-secure-production-secret"
fly secrets set NODE_ENV="production"
fly secrets set PORT="3000"
fly secrets set CLIENT_URL="https://your-vercel-app.vercel.app"
```

### Deploy Backend

```bash
fly deploy
```

### Check Backend Logs

```bash
fly logs
```

### Open Backend App

```bash
fly open
```

---

## Database Deployment: Railway PostgreSQL

Railway PostgreSQL provides a managed PostgreSQL database for the backend API.

### Railway PostgreSQL Environment Variables

Railway provides the following PostgreSQL environment variables:

```env
PGHOST="..."
PGPORT="..."
PGUSER="..."
PGPASSWORD="..."
PGDATABASE="..."
DATABASE_URL="..."
```

### Required Variable for the Backend

The backend should use:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

The individual `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` variables are useful for debugging, local database tools, direct `psql` access, backups, or libraries that do not use a single connection string.

For this project, `DATABASE_URL` should be the primary database connection variable.

---

## Prisma Configuration

If the backend uses Prisma, configure the datasource like this:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Database Migrations

Production database migrations should be run during deployment or immediately after deploying the backend.

Recommended command:

```bash
pnpm db:migrate:deploy
```

For Prisma, this usually maps to:

```bash
prisma migrate deploy
```

Example package script:

```json
{
  "scripts": {
    "db:migrate:deploy": "prisma migrate deploy"
  }
}
```

---

## Local Development Environment

For local development, use a local `.env` file.

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_app"
JWT_SECRET="local-development-secret"
NODE_ENV="development"
PORT="3000"
CLIENT_URL="http://localhost:4200"
```

Do not commit real `.env` files.

Commit only `.env.example`.

---

## Example `.env.example`

```env
DATABASE_URL=""
JWT_SECRET=""
NODE_ENV="development"
PORT="3000"
CLIENT_URL="http://localhost:4200"
```

---

## CORS Configuration

The backend should allow requests from the deployed Vercel frontend.

Example:

```ts
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
```

For local development, `CLIENT_URL` should be:

```txt
http://localhost:4200
```

For production, `CLIENT_URL` should be the Vercel URL:

```txt
https://your-vercel-app.vercel.app
```

---

## Deployment Flow

Recommended production deployment flow:

```txt
1. Create Railway PostgreSQL database
2. Copy Railway DATABASE_URL
3. Create Fly.io backend app
4. Add DATABASE_URL and other backend secrets to Fly.io
5. Deploy backend to Fly.io
6. Run production database migrations
7. Create Vercel frontend project
8. Add backend API URL to Vercel environment variables
9. Deploy frontend to Vercel
10. Verify login and task CRUD flows in production
```

---

## Security Notes

- Never commit real Railway credentials to GitHub.
- Never commit production JWT secrets.
- Use `.env.example` for variable names only.
- Store production backend secrets in Fly.io.
- Store production frontend environment variables in Vercel.
- Rotate secrets if they are accidentally exposed.
- Restrict CORS to the deployed Vercel frontend URL.
- Use HTTPS-only production URLs.
- Use strong random values for `JWT_SECRET`.

---

## Production URLs

After deployment, document the final URLs here.

```txt
Frontend: https://your-vercel-app.vercel.app
Backend:  https://your-fly-api.fly.dev
Database: Railway PostgreSQL
```

---

## Verification Checklist

Before submitting the project, verify the following:

- Vercel frontend loads successfully.
- Fly.io backend health check responds successfully.
- Backend can connect to Railway PostgreSQL.
- Database migrations have run successfully.
- User can register.
- User can log in.
- User can create a task.
- User can edit a task.
- User can search tasks.
- User can reorder tasks.
- User can delete a task.
- CORS is configured correctly.
- No real secrets are committed to the repository.
- README includes local and cloud deployment instructions.
