# AI Agent Instructions — my-react-app

## 🏗️ Architecture at a Glance

**Feature-Sliced Design** (5 layers):
- `app/` — Initialization (providers, layout, routing, auth guards)
- `shared/` — Infrastructure (HTTP client, tokens, hooks, utils)
- `entities/` — Domain models with Zustand stores (auth, employee, session)
- `features/` — Business logic + UI (dialogs, forms, pages composition)
- `pages/` — Route handlers combining features + entities

## 🔑 Critical Patterns

### HTTP + Auth (see [src/shared/api/http.ts](src/shared/api/http.ts))
- **Single refresh queue**: When 401 occurs, all failed requests wait in `failedQueue`. Only ONE refresh token request fires; others reuse its result.
- **AUTH_EXCLUDE endpoints** (no Authorization header, no refresh trigger): `/api/v1/auth/send-code`, `/api/v1/auth/login`, `/api/v1/auth/refresh`
- **No refresh token** → `clearTokens()` + redirect to `/login` (prevents 401 loops)
- **Proxy in dev**: `npm run dev` runs Vite on port 3000, proxies `/api` → `https://api.andromedaedu.kz`

### ProtectedRoute (see [src/app/routes/ProtectedRoute.tsx](src/app/routes/ProtectedRoute.tsx))
- **No token** → redirect `/login`, skip `loadMe()` (critical for preventing 401 loops)
- **Has token** → call `loadMe()` exactly once → check `requiredRoles`/`requiredSections` → show 403 if denied
- **Loading state**: CircularProgress while fetching user data

### Auth Store (see [src/entities/auth/store.ts](src/entities/auth/store.ts))
- `sendCode(phone)` → save `tempPhoneNumber` to localStorage (survives page reload)
- `login(phone, code)` → clear `tempPhoneNumber` ONLY after success
- `loadMe()` → only called with accessToken present
- Pattern: all async actions → set loading → try/catch → set error/result

### Employee Creation Conflicts (see [src/features/employee-dialogs/CreateEmployeeDialog.tsx](src/features/employee-dialogs/CreateEmployeeDialog.tsx))
When `createEmployee()` returns 400 conflict, catch `EmployeesConflictError`:
- `conflictType` determines dialog: `USER_EXISTS` → ExistingUserDialog | `EMPLOYEE_EXISTS` → EmployeeExistsDialog | else → RefusalDialog
- ExistingUserDialog actions: `confirmExistingEmployee(userId, payload)` or `takePhoneAndCreate()`
- **Error behavior**: on 500 or API errors, dialogs stay open (no auto-close) → user retries

### Forms & UI
- **React Hook Form + Yup**: use `yupResolver(schema)` from `@hookform/resolvers/yup`
- **Snackbar**: `enqueueSnackbar(msg, { variant: 'success'|'error'|'warning'|'info' })` via `notistack`
- **Phone formatting**: `formatPhoneNumber()` in [src/pages/employees/utils.ts](src/pages/employees/utils.ts) (libphonenumber-js)
- **Icons**: `@mui/icons-material`

### Pagination & Search (see [src/pages/employees/EmployeesPage.tsx](src/pages/employees/EmployeesPage.tsx))
- **Debounce search**: `useDebounce(400)` prevents frequent API calls
- **0-based paging**: `{ page: 0, size: 10 }` (backend expects page starting at 0)
- **Filters**: `role` (teacher/student), `status` (active/inactive)

### Zustand Stores (entities only)
Stores live ONLY in `entities/` (auth, employee, session), exported as hooks: `export const useAuthStore = create<AuthStore>(...)`

## 📋 Dev Commands

```bash
npm run dev      # Vite dev server on port 3000, /api proxied
npm run build    # tsc type check + vite build
npm run lint     # eslint with --fix
npm run preview  # preview production build locally
```

## 🐳 Docker & Env

- `VITE_API_BASE_URL` env var controls API base (default: `https://api.andromedaedu.kz`)
- Local dev: use `.env.local` to override
- Docker Compose: Vite proxied through nginx to container port 8082

## ⚠️ When Making Changes

1. **Changing HTTP/auth flows**: update [src/shared/api/http.ts](src/shared/api/http.ts), [src/shared/api/tokens.ts](src/shared/api/tokens.ts), then adjust entity API calls
2. **Adding stores**: place ONLY in `entities/`, NEVER in `features/` or `pages/`
3. **New features**: use `features/` for UI + business logic, compose in `pages/`

## 🐛 Debugging

- Auth 401/refresh flow: run dev server, inspect `/api/v1/auth/refresh` calls
- Temp phone key in localStorage: `tempPhoneNumber` (auth flow recovery)
- Conflicts: [src/entities/employee/ERROR_HANDLING.md](src/entities/employee/ERROR_HANDLING.md) and [src/features/employee-dialogs/ZD3_CHANGES.md](src/features/employee-dialogs/ZD3_CHANGES.md) for details

## 📚 Reference Files

- Full architecture: [INDEX.md](INDEX.md)
- Employee error handling: [src/entities/employee/ERROR_HANDLING.md](src/entities/employee/ERROR_HANDLING.md)
- Conflict scenarios: [src/features/employee-dialogs/ZD3_CHANGES.md](src/features/employee-dialogs/ZD3_CHANGES.md)
