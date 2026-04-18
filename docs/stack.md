# Technology Stack

## Why this stack
This stack is optimized for a web-first MVP that includes payments, order lifecycle automation, admin operations, and real-time-ish user workflows (chat, tickets, status updates). The priority is reliability and operational simplicity over novelty.

## Core choices
- Runtime: `Node.js`
- Package manager and workspace tooling: `pnpm` + `pnpm workspaces`
- Language: `TypeScript`
- Backend: `NestJS` on `Fastify`
- Frontend: `Next.js`
- Frontend styling: `Tailwind CSS v4` with CSS-first design tokens in `@packages/ui`
- Database: `PostgreSQL`
- ORM and migrations: `Prisma`
- Queue and background jobs: `BullMQ` on `Redis`
- API documentation: `OpenAPI` via Swagger
- Validation: `Zod`
- Frontend forms: `React Hook Form`
- Frontend server state: `TanStack Query`
- Logging: `Pino` (`nestjs-pino` in API)
- Observability: `OpenTelemetry`
- Testing: `Jest` (unit/integration), `Playwright` (E2E)
- CI/CD: `GitHub Actions`

## How to use this in the codebase
- Keep package boundaries inside the monorepo explicit (`apps/*`, `packages/*`).
- Keep runtime and package workflows standardized on pnpm to avoid drift in local and CI environments.
- Keep business validation in shared schemas where possible (`Zod`), then enforce again at API boundaries.
- Keep background work out of request/response paths when it is retryable or delay-based.

## Notes for future evolution
- Storage provider is intentionally abstracted behind a port/adapter boundary; provider can be chosen later.
- Error monitoring starts with OpenTelemetry + logs; paid SaaS is a later decision based on actual incident volume and triage cost.
