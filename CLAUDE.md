# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm workspace monorepo (`apps/*`, `packages/*`). Currently the only package is `apps/backend`: an Express 5 + tsoa REST API for a task planner, backed by Postgres via Drizzle ORM.

## Commands

Run from the repo root:

```bash
pnpm start:local          # docker compose up backend (:3000) + postgres 18 (:5432)
```

Run from `apps/backend`:

```bash
pnpm start:dev            # regenerate the tsoa spec, then tsx --watch src/bootstrap.ts
pnpm gen:api-spec         # tsoa spec-and-routes -> src/api/spec/{routes.ts,swagger.json}
pnpm build                # tsc -> dist/
pnpm start:prod           # node dist/bootstrap.js
pnpm lint                 # biome lint --write
pnpm format               # biome format --write
pnpm db:seed              # tsx scripts/seed.ts (script is currently empty)
pnpm exec drizzle-kit generate | migrate | push   # migrations; needs DB_URL in the env
```

Swagger UI is served at `/docs`, liveness at `/healthcheck`. Drizzle's output dir `apps/backend/drizzle/` is gitignored, so no migrations are tracked yet.

### Testing

`test:unit`, `test:api` and `test:e2e` in `apps/backend/package.json` are empty placeholders — no test runner is installed yet. Ask before picking one.

### Formatting caveat

`biome.json` sets `indentStyle: "tab"`, but the committed source is 2-space indented. Running `pnpm format` over the whole tree reformats every file. Scope Biome to the files you touched.

## Architecture

### tsoa is the source of truth for routing

Controllers are plain decorated classes; there is no manual router. `tsoa.json` picks up **`src/**/controller.ts`** (the filename matters) and generates `src/api/spec/routes.ts` + `swagger.json`. Both generated files live in the tree (not gitignored) and must never be hand-edited — rerun `pnpm gen:api-spec` after changing any controller, DTO or response type. `bootstrap.ts` calls `RegisterRoutes(app)` between the request-logger middleware and the error/notFound handlers.

### Auth is opt-out, not opt-in

`tsoa.json` declares `rootSecurity: [{ jwt: [] }]`, so **every endpoint requires a bearer token unless it is annotated `@NoSecurity()`** (see `AuthController.signup` / `login`). The generated routes call `expressAuthentication` in `src/auth/middleware.ts`; whatever it resolves becomes `req.user` (typed globally in `src/types.d.ts`), and whatever it throws goes to the express error middleware. `TokenService` (RS256) reads the PEM key pair from disk once at startup — paths come from `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH`.

### Composition root

`src/container.ts` owns every singleton (env, logger, `Database`, `TokenService`) and implements tsoa's `IocContainer`. `src/ioc.ts` exports it as `iocContainer`, which `tsoa.json` wires into the generated routes.

**Adding a controller requires registering it in the `Container` constructor** via `this.register(Foo, new Foo(...))` — an unregistered controller throws at request time, not at build time.

Models are active-record classes that receive the DB statically at boot (`User.setDb(this.db)` in the constructor), so they are imported directly rather than injected.

### Feature module layout

Each feature lives in `src/<feature>/` with the same three files:

- `controller.ts` — tsoa controller, extends `@/common/controller`'s `Controller`
- `model.ts` — active-record class: private `props`, getters, static `create` / `find*` / `deleteById`, plus `fromDb(row)` and `toDto(model)` mappers
- `dtos.ts` — plain request/response types (tsoa reads these to build the schema)

Modules also carry a `schemas.ts` (see Request validation below).

`src/tasks` is the fullest worked example — five endpoints, owner scoping, query/param/body validation. `src/lists` is still an empty stub; follow the `tasks` shape when filling it in.

**Ownership scoping is the model's job, not the controller's.** `Task.findById`, `deleteById` and `findMany` all take a `userId` and filter on it, so another user's row reads as *missing* rather than *forbidden* — the endpoints never leak which ids exist. Keep that pattern for every user-owned resource; a finder without a `userId` parameter is a bug waiting to happen.

Tasks are owned by a user only. There is no `listId` column yet — add the FK when `src/lists` lands.

### Request validation

Zod owns request validation; tsoa's generated validation is a second, redundant pass.

- Field rules live in `src/<feature>/schemas.ts`. `src/users/schemas.ts` is the user-domain vocabulary (`usernameSchema`, `passwordSchema`, …), aligned with the column definitions in `common/db/schemas/users.ts`; other modules compose their request schemas out of it rather than restating limits.
- Request schemas are `z.strictObject(...)`, matching tsoa's `noImplicitAdditionalProperties: "throw-on-extras"`.
- **Request DTOs are derived, never hand-written**: `export type SignupDto = z.infer<typeof signupSchema>`. Response DTOs stay hand-written — nothing validates them.
- Attach with tsoa's `@Middlewares(validate({ body, query, params }))` (`src/common/middleware/validate.ts`). It replaces each validated part with the parsed output, so `trim()`, coercions and defaults reach both the controller and tsoa. `req.query` is a getter in Express 5, hence the `Object.defineProperty` write-back.
- Failures become `HttpError(400, "invalid request <part>", z.treeifyError(err))` and flow through the existing error middleware.

Two constraints discovered the hard way — do not "clean these up":

- `export interface Dto extends z.infer<typeof schema> {}` **crashes** tsoa's metadata generation.
- Flattening through a mapped type (`{ [K in keyof z.infer<...>]: ... }`) makes tsoa emit an **empty** schema, which silently rejects every request body. Use the plain `z.infer` alias.

Two costs of the plain alias:

- OpenAPI names the component `infer_typeofsignupSchema_` and points `SignupDto` at it via `$ref`. Runtime validation is unaffected, but generated API clients carry that name.
- **Derived DTOs lose nullability.** tsoa resolves `z.infer` of a `.nullable()` field down to the bare type, so its second pass rejects `null` with its own `ValidateError` even though zod accepted it. tsoa handles `string | null` correctly for hand-written types (it emits `nullable: true`) — the null is lost only through `z.infer`. Consequence: PATCH bodies cannot use `null` to clear a field. Absent key means "leave unchanged", and there is no clear-a-field operation. Supporting one means hand-writing that DTO and giving up derivation for it.

### Response envelope

Every handler returns `ApiResponse<T>` (`src/api/types.ts`): `{ success, timestamp }` plus either `data` or `error: { message, httpStatus, apiCode?, details? }`. Build it with the base `Controller`'s `sendSuccess` / `sendError` / `sendNotFound`, which also set the HTTP status. Never `res.json()` directly from a controller.

For failures raised outside a controller, throw `HttpError(status, message, details)` from `src/common/error.ts`. Its property is named `status` on purpose — that's the field tsoa's generated auth wrapper reads. `src/common/middleware/error.ts` maps `ValidateError` (tsoa validation) → 400, `HttpError` → its status, anything else → logged 500.

### Env and config

`src/common/env/schema.ts` is a Zod schema parsed once in the `Container` constructor; a bad env fails startup with a treeified error. Add new variables there **and** to `apps/backend/.env.example` — compose loads `.env.example` as the required env file and `.env` as an optional override.

### Paths

`@/*` → `apps/backend/src/*`. The alias is declared in both `tsconfig.json` and `tsoa.json`'s `compilerOptions`; keep them in sync or spec generation breaks.

### Notable versions

TypeScript 7, Express 5, tsoa 7 alpha, drizzle-orm 1.0 rc, Zod 4, Node 26 in Docker. APIs in these differ from the widely documented older majors — check `node_modules` rather than assuming.
