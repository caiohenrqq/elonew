# EloNew

League of Legends boosting platform built as a TypeScript monorepo.

## Repository

```text
apps/
├── api/       NestJS API and Socket.IO
├── web/       Next.js frontend
└── workers/   BullMQ workers
packages/
├── auth/
├── config/
├── database/
├── integrations/
└── shared/
infrastructure/docker/
├── dev/
└── prod/
scripts/
docs/
```

## Start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/api/.env.example apps/api/.env.test
cp apps/web/.env.example apps/web/.env
cp apps/workers/.env.example apps/workers/.env
pnpm docker:dev:up
```

Open `http://localhost:3001`.

## Documentation

- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Observability](docs/observability.md)
- [Realtime](docs/realtime.md)
- [Privacy](docs/privacy.md)
- [Contributing](docs/contributing.md)

`package.json` files own commands. GitHub Issues own roadmap and future work.
