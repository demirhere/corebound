# Agent Notes

## Project Shape
- The Vite React app entrypoint is `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- Game design docs live in `docs/wiki/`; `docs/wiki/README.md` is the index.

## Commands
- Use pnpm; `pnpm-lock.yaml` is the committed lockfile.
- Install dependencies with `pnpm install`.
- Run the Vite dev server with `pnpm dev`.
- Verify production output with `pnpm build`; this runs `tsc -b` before `vite build`.
- Run lint with `pnpm lint`.
- Preview the built Vite app with `pnpm preview` after a successful build.
- There is no configured test script yet; do not invent `pnpm test` as a verification step.

## Toolchain Quirks
- TypeScript uses project references via root `tsconfig.json`; app code is included only from `src`, and Vite config is included by `tsconfig.node.json`.
- `tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`; avoid TypeScript constructs that require runtime emit.
- ESLint ignores only `dist` and applies JS recommended, TypeScript recommended, React Hooks, and React Refresh Vite rules to `**/*.{ts,tsx}`.
- CSS files use native nesting syntax; preserve the existing nested style rather than flattening without need.
