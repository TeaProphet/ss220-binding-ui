# SS220 Binding repository guide

## Product intent

- The product name shown to users is **SS220 Binding**.
- The primary workflow is creating chat and emote keybinds (`me`, `say`, and `whisper`).
- The binding modal must open in the chat/emote mode. System actions are an advanced workflow exposed by the explicit `Переназначить системный бинд` toggle.
- Binding inheritance is `Для всех` → character → role. Keep the global layer independently persisted and merge it first when applying bindings to the game.
- Never preselect a physical key for a new binding. Require the user to record or select one.
- The system-bindings page is a read-only reference. Editing system actions happens only in the binding modal's advanced mode.

## Architecture

- `src/main.jsx` contains the React application and UI components.
- `src/styles.css` contains the active application styling; `src/accessibility.css` contains accessibility helpers.
- `shared/bindings.js` owns YAML validation, binding changes, key normalization, and keyboard-event conversion used by both client and server.
- `server/index.js` exposes the loopback-only API and serves Vite in development or `dist/` in production.
- `server/storage.js` handles atomic writes, backups, revision checks, and profile migration.
- `binding-deck-global.json` stores the global layer independently from character profiles in `binding-deck-presets.json`.
- `src/presetCatalog.js` contains races, departments, roles, and associated wiki assets.
- `resources/default-keybinds.yml` is the bundled SS14 reference layout. Do not hand-edit generated files in `dist/`.
- `tests/bindings.test.js` covers shared and storage behavior. `tests/browser/editor.spec.js` covers user workflows with Playwright.

## Commands

- Install dependencies: `npm install`
- Development server: `npm run dev` (http://127.0.0.1:3141)
- Production build: `npm run build`
- Production server: `npm start`
- Unit tests: `npm test`
- Browser tests: `npm run test:e2e`

On restricted Windows environments, Node's test runner, Vite, or Playwright may fail with `spawn EPERM`. This is a sandbox process-launch restriction, not an application failure. If available, run unit tests without worker isolation using `node --test --test-isolation=none tests/bindings.test.js`; request the required permission for Vite or Playwright rather than changing application code to work around the sandbox.

## Engineering conventions

- Use ES modules and the existing compact React style. Do not introduce TypeScript, a state library, a component library, or new production dependencies unless the task requires it.
- Reuse native controls and existing components. Preserve keyboard access, modal focus trapping, visible focus states, and reduced-motion behavior.
- Keep binding transformations in `shared/bindings.js` when they are shared or independently testable; avoid duplicating YAML or key-normalization logic in the UI.
- Preserve unknown YAML fields and existing binding metadata when editing a binding.
- Keep the server bound to `127.0.0.1` and retain Host, Origin, and write-token checks.
- Writes to the game's `keybinds.yml` must remain revision-checked, atomic, and backed up. Tests must use `test-results/` paths, never the user's live SS14 data.
- Do not edit `node_modules/`, `dist/`, screenshots, generated test artifacts, or `%APPDATA%` as source files.
- User-facing copy is Russian. Internal identifiers and code remain English.

## Verification

- For shared logic or storage changes, run the unit suite.
- For UI changes, run `npm run build` and the relevant Playwright tests; run the full E2E suite when modal, profile, save, or navigation behavior changes.
- Visually check non-trivial UI changes at desktop and mobile widths. Confirm that overlays fit the viewport and that no horizontal overflow is introduced.
- A task is complete only when the relevant checks pass or the exact environmental blocker is reported.

## Interface system

- Follow `.interface-design/system.md` for visual decisions and reusable UI patterns.
- Preserve the existing SS14/TGUI-inspired workbench rather than replacing it with generic SaaS styling.
