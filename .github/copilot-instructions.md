# AI Agent Instructions — my-react-app

Purpose: quick, repo-specific guidance to make AI coding assistants productive immediately.

**Quick Start (dev)**
- `npm run dev` — Vite dev server (port 3000); `/api` proxied to backend (see proxy in [vite.config.ts](vite.config.ts#L13)).
- `npm run build` — type-check + vite build (fails on TS errors).
- `npm run lint` — runs eslint; workspace has per-file ESLint tasks for individual files.
- `.env.local` — override `VITE_API_BASE_URL` for local dev (defaults to `https://api.andromedaedu.kz`).

**Architecture (high level)**
- Feature-sliced layout: `app/`, `shared/`, `entities/`, `features/`, `pages/`.
- `entities/` holds all Zustand stores AND domain APIs (auth, employee, session). This is **the data layer**.
- `features/` has UI + orchestration logic (dialogs, forms) composed inside `pages/`.
- `shared/` is cross-cutting concerns: HTTP client, hooks, utils, types, i18n, UI base components.

**Critical integration points (must-read files)**
- **HTTP & token mgmt**: [src/shared/api/http.ts](src/shared/api/http.ts) (interceptors, refresh queue, AUTH_EXCLUDE), [src/shared/api/tokens.ts](src/shared/api/tokens.ts) (token storage)
- **Auth flow**: [src/entities/auth/store.ts](src/entities/auth/store.ts) (sendCode → login → loadMe → user state)
- **Route guard**: [src/app/routes/ProtectedRoute.tsx](src/app/routes/ProtectedRoute.tsx) (token check, loadMe() logic, role/section validation)
- **Employee conflicts**: [src/entities/employee/ERROR_HANDLING.md](src/entities/employee/ERROR_HANDLING.md) (400 error structure, `EmployeesConflictError`, type guards)
- **Conflict UI routing**: [src/features/employee-dialogs/CreateEmployeeDialog.tsx](src/features/employee-dialogs/CreateEmployeeDialog.tsx) (how `USER_EXISTS` vs `EMPLOYEE_EXISTS` show different dialogs)

**Important patterns & conventions (explicit, not generic)**

*Auth & token refresh:*
- **Single refresh queue**: when 401 occurs, push failed requests to `failedQueue`, fire ONE refresh. Set `isRefreshing=true` to block duplicates. **Never bypass this.** (See [http.ts](src/shared/api/http.ts#L19-L36).)
- **AUTH_EXCLUDE endpoints**: `/api/v1/auth/send-code`, `/api/v1/auth/login`, `/api/v1/auth/refresh` — NO Authorization header, NO refresh logic triggered.
- **No refresh token?** Call `clearTokens()` + redirect to `/login` to avoid infinite 401 loops. (See [tokens.ts](src/shared/api/tokens.ts).)
- **ProtectedRoute guard**: only calls `loadMe()` if `getAccessToken()` exists. Never force `loadMe()` before login completes. (See [ProtectedRoute.tsx](src/app/routes/ProtectedRoute.tsx#L18-L30).)
- **Temp phone persistence**: `sendCode()` stores `tempPhoneNumber` in localStorage; `login()` clears it only on success. **Preserve this** when modifying auth.

*Employee workflows:*
- **Conflict detection**: `createEmployee()` throws `EmployeesConflictError` (400) with `conflictType: 'USER_EXISTS' | 'EMPLOYEE_EXISTS'`. Use `isEmployeesConflictError()` type guard to route to correct dialog. (See [ERROR_HANDLING.md](src/entities/employee/ERROR_HANDLING.md).)
- **Different dialogs for conflicts**: `USER_EXISTS` → ExistingUserDialog; `EMPLOYEE_EXISTS` → EmployeeExistsDialog. Not silently ignored. (See [CreateEmployeeDialog.tsx](src/features/employee-dialogs/CreateEmployeeDialog.tsx#L324-L337).)

*State & architecture:*
- **Stores in entities/**: all Zustand stores (auth, employee) **must** live in `entities/`. Do NOT add new stores in `features/` or `pages/`.
- **Phone formatting on display**: use `formatPhoneForUi()` from [shared/utils/phoneUtils.ts](src/shared/utils/phoneUtils.ts) for consistent UI display.

**Forms, UI & UX conventions**
- **React Hook Form + Yup**: all forms use `yupResolver(schema)` from `@hookform/resolvers/yup`. See [employee-dialogs/schemas.ts](src/features/employee-dialogs/schemas.ts) for examples.
- **Snackbars**: use `notistack` via `useSnackbar()` hook → `enqueueSnackbar(message, { variant: 'success'|'error' })` for user feedback.
- **Phone field validation**: use Yup schema with `phoneUtils.validatePhoneNumber()` and display via `formatPhoneForUi()`.
- **Debounced search**: wrap search input with `useDebounce(searchQuery, 400)` to avoid excessive API calls. (See [EmployeesPage.tsx](src/pages/employees/EmployeesPage.tsx#L72).)
- **UI state isolation**: modals/dialogs have local state (useState) for form data; persist only on successful API call.

**API & UI interaction specifics**
- **Pagination is 0-based**: backend expects `{ page: 0, size: 10 }`, not 1-based. (See [EmployeesPage.tsx](src/pages/employees/EmployeesPage.tsx#L76).)
- **Conflict error structure**: 400 response includes `conflictType`, `userId`, `existingUser` object. See [types.ts](src/entities/employee/types.ts#L75-L85) and `ApiErrorResponse` interface.
- **Role/section checks**: use `hasAnyRole(user, ['head', 'director'])` utility for permission logic. (See [roleUtils.ts](src/shared/utils/roleUtils.ts).)

**Dev / debugging tips**
- **Auth 401 loops**: add network tab filter to `/api/v1/auth/refresh`; should fire only once even with multiple failed requests.
- **Local API override**: create `.env.local` and set `VITE_API_BASE_URL=http://localhost:8080` for backend dev.
- **ESLint per-file tasks**: workspace has tasks for `LoginPage.tsx`, `EmployeesPage.tsx`, `CreateEmployeeDialog.tsx` — use them for quick fixes.
- **Component hot reload**: Vite with React plugin provides instant HMR on save.

**When editing auth/http flows**
1. Modify [http.ts](src/shared/api/http.ts) (interceptors, refresh queue) and [tokens.ts](src/shared/api/tokens.ts) (storage).
2. Run `npm run dev` and reproduce 401 scenario to verify single-refresh + `failedQueue` behavior works.
3. Only update `entities/*` API calls after http/tokens changes are validated.
4. Ensure temp phone persistence is preserved in `sendCode()` and cleared in `login()` success.

**When adding employee API operations**
1. Add function to [src/entities/employee/api.ts](src/entities/employee/api.ts).
2. Catch 400 status and throw `EmployeesConflictError` with proper conflict type. Use existing pattern: `isEmployeesConflictError()` check.
3. Update UI in [src/features/employee-dialogs/](src/features/employee-dialogs/) to handle the conflict scenario.
4. Add Yup schema to [src/features/employee-dialogs/schemas.ts](src/features/employee-dialogs/schemas.ts) if new form fields are needed.
5. Test with real backend; watch for 400 responses with `conflictType` in payload.

Reference: see full docs in [INDEX.md](INDEX.md).
