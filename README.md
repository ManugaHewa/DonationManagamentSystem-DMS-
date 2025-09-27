<<<<<<< HEAD
## DMS – Donations Management System
A monorepo for a temple’s donation platform:
- Web (React/Vite/TS) – donor self-service (e.g., Donate page)
- API (Express/TS) – donation + donor endpoints, validation
- DB (PostgreSQL + Prisma) – schema, migrations, type-safe client
- Worker (BullMQ/Redis) – background jobs (emails, receipts, reports)
- Dev infra (Docker Compose) – Postgres, Redis, MinIO (S3), Mailpit (SMTP)

## Tech Stack 
- React + Vite + TypeScript – fast, modern SPA development (HMR on port 5173).
- Express + TypeScript + Zod – REST API on 3000 with runtime request validation.
- PostgreSQL 16 – primary data store (donors, donations, receipts).
- Prisma – schema/migrations, type-safe client, and Prisma Studio.
- Redis + BullMQ – async jobs so API stays responsive under load.
- MinIO – S3-compatible storage for future files (dev only).
- Mailpit – local SMTP inbox for email previews (acknowledgements/receipts).
- pnpm workspaces – monorepo management (apps/*, packages/*).
- Docker Compose – one-shot dev infra.

## Prerequisities
- Node.js 20+ (LTS recommended)
- pnpm 9+
- Docker Desktop (for Compose)
- Windows tip: avoid OneDrive-synced folders for dev (Prisma can hit file locks).