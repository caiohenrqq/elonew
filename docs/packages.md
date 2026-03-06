# Workspace Packages

## Overview
This project uses a `pnpm` monorepo structure. Code is organized into `apps/` (executable applications) and `packages/` (reusable libraries and shared logic). This structure enforces clean boundaries and allows sharing code between the backend (`api`), frontend (`web`), and background processors (`workers`).

## Package Structure
All packages are located in the `packages/` directory and should follow this naming convention:
- **Folder name:** `packages/<name>` (e.g., `packages/shared`)
- **Package name in `package.json`:** `@packages/<name>` (e.g., `@packages/shared`)

### Mandatory Files
Every package must contain:
1. `package.json`: Defines the package name, version, and dependencies.
2. `tsconfig.json`: (If TypeScript) Configures the TypeScript compiler for the package.
3. `src/index.ts`: The main entry point that exports the package's public API.

## How to Add a New Package

### 1. Create the Directory
```bash
mkdir -p packages/new-package/src
```

### 2. Initialize `package.json`
Create `packages/new-package/package.json`:
```json
{
  "name": "@packages/new-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.8" 
  }
}
```
*Note: Only add dependencies that are strictly necessary for the package's purpose.*

### 3. Add `tsconfig.json`
Create `packages/new-package/tsconfig.json`. It should ideally extend a base configuration:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

### 4. Update Workspace Configuration
When a new package is added with a `package.json`, `pnpm` will automatically recognize it as part of the workspace.

### 5. Update Docker Configuration (CRITICAL)
For the development environment to work, you **must** update `infrastructure/docker/dev/Dockerfile.dev` to copy the new package's `package.json`. 

Add a line like this before the `RUN pnpm install` command:
```dockerfile
COPY packages/new-package/package.json packages/new-package/package.json
```
**Failure to do this will result in the package not being linked correctly inside the Docker container.**

### 6. Add TypeScript Paths
Update the root `tsconfig.json` (or `tsconfig.base.json`) and the `tsconfig.json` of any app that will use the package to include the new path alias:
```json
"paths": {
  "@packages/new-package/*": ["packages/new-package/src/*"]
}
```

### 7. Install Dependencies
Run from the root:
```bash
pnpm install
```

## Requirements & Constraints

- **Single Responsibility:** Each package should have a clear, focused purpose (e.g., `@packages/database` only handles Prisma and DB-related code).
- **No Circular Dependencies:** Package A cannot depend on Package B if Package B depends on Package A.
- **Internal Aliases:** Always use `@packages/<name>` when importing from other workspace members.
- **Framework Agnostic:** Packages like `@shared`, `@config`, and `@auth` should avoid depending on framework-specific libraries (like NestJS or Next.js) to remain portable.
- **Version Pinning:** Use consistent versions for shared dependencies (e.g., `zod`, `typescript`) across all packages.

## What to Avoid
- **"God" Packages:** Avoid creating a `utils` package that contains everything. Prefer specific packages like `math-utils`, `date-utils`, or keep them within the domain they belong to.
- **Direct App Imports:** Packages should NEVER import from `apps/`.
- **Redundant Code:** Before creating a new utility, check if it already exists in `@packages/shared`.
- **Large Assets in Packages:** Keep heavy assets (images, videos) in `public/` folders of the apps or a dedicated CDN/storage, not inside logic packages.

## Allowed Dependencies
- **Runtime:** `zod`, `decimal.js`, `date-fns`, etc.
- **Development:** `typescript`, `vitest`/`jest`, `biome`.
- **Avoid:** Heavy UI libraries in non-UI packages, or database drivers in the `@shared` package.
