# Contributing

## Setup

Use Node.js 24 for development (`nvm use` reads `.nvmrc`), then run:

```bash
npm ci
npm run check
```

`npm ci` installs the locked development dependencies and builds the library through `prepare`. The library has no runtime dependencies. Keep `package-lock.json` committed so contributors and CI use the same compiler.

## Project layout

- `src/index.ts` defines the package's public exports and chart formatting helpers.
- `src/engine/` contains the calculation engine and ruling planet helpers.
- `test/run.cjs` verifies the public package API with Node's built-in assertions.
- `test/fixtures/release-0.1.7.json` contains expected charts captured from the published npm `0.1.7` archive. It protects release behavior during structural changes. Include a documented behavior change when updating these expectations.
- `scripts/` contains package maintenance commands.
- `.github/workflows/ci.yml` checks the supported minimum Node.js version and Node.js 22/24.
- `dist/` and `node_modules/` are generated locally and are not committed.

The npm archive includes compiled JavaScript, declarations, source maps, and TypeScript source so declaration maps resolve after installation. Tests, scripts, CI configuration, editor settings, and dependency folders are excluded by the `files` allowlist in `package.json`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Remove old output and compile `src/` to `dist/`. |
| `npm run clean` | Remove only the generated `dist/` directory. |
| `npm run typecheck` | Check TypeScript without emitting files. |
| `npm test` | Build and run compatibility tests. |
| `npm run test:package` | Build, pack, install into a temporary consumer, and verify JavaScript and TypeScript entry points. |
| `npm run check` | Run every required local check. |

The package check installs only the local tarball in offline mode and removes its temporary consumer afterward. It requires the existing TypeScript development dependency and does not publish anything.

## Changing code

Keep changes in `src/`, and add tests for behavior that could change. Preserve the documented entry point and Node.js 16 compatibility unless a release intentionally changes them. CommonJS output supports both `require` and named imports from ESM consumers. Type declarations are the first export condition for TypeScript resolution.

## Releasing

1. Run `npm run check` and review the changes.
2. Commit the approved source changes, including any lockfile changes.
3. Bump the version with `npm version patch` (or the appropriate minor/major increment). This updates the manifest and lockfile and creates a version commit and tag.
4. Inspect the archive with `npm run build` followed by `npm pack --dry-run`.
5. Run `npm publish` when ready to publish the new version. The `prepublishOnly` hook runs the complete checks, and `prepare` rebuilds the output before packing.
6. Push the approved commits and version tag to GitHub.

Each published version is immutable. Choose a new version before publishing; do not reuse an existing release number.
