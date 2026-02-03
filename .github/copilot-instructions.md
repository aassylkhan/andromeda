# AI Agent Instructions  my-react-app

Purpose: quick, repo-specific guidance to make AI coding assistants productive immediately.

**Quick Start (dev)**
- `npm run dev`  Vite dev server (port 3000 in dev); `/api` is proxied to the real backend.
- `npm run build`  runs type-check + vite build.
- `npm run lint`  runs `eslint` (workspace has per-file ESLint tasks you can reuse for fixes).

**Architecture (high level)**
- Feature-sliced layout: `app/`, `shared/`, `entities/`, `features/`, `pages/`.
- `entities/` contains all Zustand stores and domain APIs (auth, employee, session).
- `features/` is UI + business logic (dialogs, forms) and is composed inside `pages/`.

**Critical integration points (must-read files)**
- HTTP & auth: [src/shared/api/http.ts](src/shared/api/http.ts) and [src/shared/api/tokens.ts](src/shared/api/tokens.ts)
- Route guard: [src/app/routes/ProtectedRoute.tsx](src/app/routes/ProtectedRoute.tsx)
- Auth store: [src/entities/auth/store.ts](src/entities/auth/store.ts)
- Employee flows & conflicts: [src/features/employee-dialogs/CreateEmployeeDialog.tsx](src/features/employee-dialogs/CreateEmployeeDialog.tsx) and [src/entities/employee/ERROR_HANDLING.md](src/entities/employee/ERROR_HANDLING.md)

**Important patterns & conventions (explicit, not generic)**
- Single refresh queue: when a 401 occurs the code pushes failed requests to a `failedQueue` and fires exactly one refresh call  do not bypass this mechanism. (See `http.ts`.)
- AUTH_EXCLUDE endpoints: `/api/v1/auth/send-code`, `/api/v1/auth/login`, `/api/v1/auth/refresh`  these requests must not send Authorization header and must not trigger refresh logic.
- No refresh token => call `clearTokens()` and redirect to `/login` to avoid 401 loops.
- `ProtectedRoute` will only call `loadMe()` when an access token exists; ensure you don't force `loadMe()` earlier.
- Temp phone persistence: `sendCode()` stores `tempPhoneNumber` in localStorage; `login()` clears it only on success. Preserve that behaviour when modifying auth flows.
- Employee conflict handling: `createEmployee()` may return structured conflicts (`USER_EXISTS`, `EMPLOYEE_EXISTS`)  UI shows different dialogs rather than failing silently.
- Stores must live in `entities/` (do not add new stores in `features/` or `pages/`).

**Forms, UI & UX conventions**
- Forms use React Hook Form + Yup (`yupResolver(schema)` from `@hookform/resolvers/yup`).
- Snackbars: use `notistack` via `enqueueSnackbar(...)` for success/error messages.
- Phone formatting: use `formatPhoneNumber()` in [src/pages/employees/utils.ts](src/pages/employees/utils.ts).

**API & UI interaction specifics**
- Pagination is 0-based: backend expects `{ page: 0, size: 10 }`.
- Employee search is debounced using `useDebounce(400)` (see [src/pages/employees/EmployeesPage.tsx](src/pages/employees/EmployeesPage.tsx)).

**Dev / debugging tips**
- To debug auth refresh loops, run the dev server and watch network calls to `/api/v1/auth/refresh`.
- Local dev: override API host with `.env.local` or `VITE_API_BASE_URL`.
- ESLint helper tasks exist for specific files (see workspace tasks for per-file `npx eslint <file> --fix`).

**When editing auth/http flows**
1. Update [src/shared/api/http.ts](src/shared/api/http.ts) and [src/shared/api/tokens.ts](src/shared/api/tokens.ts).
2. Run dev server and reproduce 401 to verify single-refresh and `failedQueue` behaviour.
3. Update `entities/*` API calls only after http/tokens changes are validated.

If anything is unclear or you need more examples, ask for the specific file/path to expand with code snippets.

Reference: full architecture in [INDEX.md](INDEX.md)
