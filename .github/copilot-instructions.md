# AI Agent Instructions — my-react-app

## 🏗️ Архитектура

### 5-слойная структура (Feature-Sliced Design inspired)
1. **app/** — Инициализация: providers (MUI theme, Snackbar, Router), layout, routing, ProtectedRoute
2. **shared/** — Инфраструктура: Axios HTTP с refresh queue, tokens, хуки (useDebounce), утилиты (roleUtils)
3. **entities/** — Доменные модели: auth, employee, session (типы, API, Zustand сторы)
4. **features/** — UI фичи: employee-dialogs, auth-login (бизнес-логика + UI)
5. **pages/** — Композиция: собирают features + entities в полные экраны

### Критичные компоненты

**[src/shared/api/http.ts](src/shared/api/http.ts)** — Axios instance с интеллектуальным refresh механизмом:
- **401-handling**: единственный refresh, остальные 401-запросы ждут в очереди `failedQueue` (предотвращает race conditions при параллельных запросах)
- **AUTH_EXCLUDE**: `/api/v1/auth/send-code`, `/api/v1/auth/login`, `/api/v1/auth/refresh` — не имеют токена, не триггерят refresh
- **Критичный паттерн**: если refresh токена нет → `clearTokens()` + редирект на `/login` (предотвращает 401 loops)
- **Queue processing**: после успешного refresh все отложенные запросы повторяются с новым токеном

**[src/app/routes/ProtectedRoute.tsx](src/app/routes/ProtectedRoute.tsx)** — Auth guard с строгой последовательностью проверок:
- **Без токена** → редирект на `/login`, `loadMe()` НЕ вызывается (критично для предотвращения 401 loops)
- **С токеном** → вызывает `loadMe()` один раз → проверяет `requiredSections`/`requiredRoles` → рендерит 403 если нет доступа
- **Loading state**: показывает CircularProgress пока загружаются данные пользователя

**[src/entities/auth/store.ts](src/entities/auth/store.ts)** — Zustand store с localStorage persistence:
- `sendCode(phone)` → сохраняет `tempPhoneNumber` в localStorage (восстановление после перезагрузки)
- `login(phone, code)` → очищает `tempPhoneNumber` ТОЛЬКО после успешного логина
- `loadMe()` → вызывается только при наличии accessToken (guard в ProtectedRoute)
- **Паттерн**: все async actions → set loading → try/catch → set error/result

---

## 📋 Типовые паттерны

### HTTP + обработка ошибок
- Все API в entities (auth, employee, session) используют единый `http` из [src/shared/api](src/shared/api)
- [src/entities/employee/api.ts](src/entities/employee/api.ts) — специализированная обработка через `handleApiError()`:
  - **400 conflicts** → выбрасывает `EmployeesConflictError` с деталями: `{ userId, existingUser, conflictType }`
  - **500+ errors** → выбрасывает generic `Error`, диалог остаётся открытым для повтора (не auto-close)
- **Type guard**: используйте `isEmployeesConflictError(error)` для проверки типа ошибки в catch-блоках
- **Почему так**: UI показывает разные диалоги в зависимости от `conflictType` (USER_EXISTS/EMPLOYEE_EXISTS/UNKNOWN)

### Конфликты создания сотрудника (employee creation conflicts)
[src/features/employee-dialogs/CreateEmployeeDialog.tsx](src/features/employee-dialogs/CreateEmployeeDialog.tsx) использует `determineConflictScenario()` для маршрутизации:
- **USER_EXISTS** → ExistingUserDialog (выбор: использовать существующего пользователя или взять только телефон)
- **EMPLOYEE_EXISTS** → EmployeeExistsDialog (информационный диалог: сотрудник уже существует)
- **CONFLICT_UNCLEAR** → RefusalDialog (отказ без действия)

**Критичный flow**:
1. `createEmployee()` → 400 conflict → catch `EmployeesConflictError`
2. `determineConflictScenario(error)` → определяет сценарий (приоритет: `conflictType` field → message matching → UNKNOWN)
3. Открывает соответствующий диалог с данными `existingUser`
4. Пользователь выбирает действие → вызывает `confirmExistingEmployee()` или `takePhoneAndCreate()`
5. При ошибке (включая 500) диалог остаётся открытым для повтора

Детали: [src/features/employee-dialogs/ZD3_CHANGES.md](src/features/employee-dialogs/ZD3_CHANGES.md), типы: [src/entities/employee/types.ts](src/entities/employee/types.ts), архитектура: [src/entities/employee/ERROR_HANDLING.md](src/entities/employee/ERROR_HANDLING.md)

### UI/Формы
- **React Hook Form** + **Yup-валидация**: используйте `yupResolver(schema)` из `@hookform/resolvers/yup`
- **Snackbar**: `const { enqueueSnackbar } = useSnackbar(); enqueueSnackbar(msg, { variant: 'success'|'error'|'warning'|'info' })`
- **Форматирование телефонов**: `formatPhoneNumber()` в [src/pages/employees/utils.ts](src/pages/employees/utils.ts) (использует libphonenumber-js)
- **Иконки**: `@mui/icons-material` (Add, FilterList, MoreVert, Edit, Delete и т.д.)

### Пагинация & фильтры
- **[src/pages/employees/EmployeesPage.tsx](src/pages/employees/EmployeesPage.tsx)**: 
  - Дебаунс 400 мс через `useDebounce` для поиска (предотвращает частые запросы)
  - Пагинация 0-based: `{ page: 0, size: 10 }` (backend ожидает page с 0)
  - Фильтры: role (teacher/student), status (active/inactive)
- **[src/pages/MySessionsPage.tsx](src/pages/MySessionsPage.tsx)**: авто-фетч на mount, рефетч после удаления
- **[src/pages/AllSessionsPage.tsx](src/pages/AllSessionsPage.tsx)**: ленивая загрузка (только по кнопке + фильтр userId)

### Zustand сторы (только в entities/)
- Сторы ТОЛЬКО в entities (auth, employee, session), NOT в features или pages
- Экспортируются как хуки: `export const useAuthStore = create<AuthStore>(...)`
# AI Agent Instructions — my-react-app (concise)

Краткие практические указания для AI-агента, чтобы быстро быть продуктивным в этом репозитории.

- **Структура:** feature-sliced (high-level): `app/`, `shared/`, `entities/`, `features/`, `pages/`.
- **Первые файлы, которые смотреть:** [src/shared/api/http.ts](src/shared/api/http.ts), [src/shared/api/tokens.ts](src/shared/api/tokens.ts), [src/app/routes/ProtectedRoute.tsx](src/app/routes/ProtectedRoute.tsx), [src/entities/auth/store.ts](src/entities/auth/store.ts), [src/features/employee-dialogs/CreateEmployeeDialog.tsx](src/features/employee-dialogs/CreateEmployeeDialog.tsx).

- **HTTP / Auth patterns:**
  - Централизованный `http` (Axios) со single-refresh queue; см. [src/shared/api/http.ts](src/shared/api/http.ts).
  - `AUTH_EXCLUDE` endpoints: `/api/v1/auth/send-code`, `/api/v1/auth/login`, `/api/v1/auth/refresh` — не должны иметь Authorization header.
  - Если нет refresh token → `clearTokens()` + редирект на `/login` (предотвращение 401 loop).

- **ProtectedRoute behaviour (critical):**
  - Если нет accessToken → редирект на `/login` и `loadMe()` НЕ вызывается.
  - Если есть token → `loadMe()` вызывается ровно один раз, затем проверяются `requiredSections`/`requiredRoles`.
  - См. [src/app/routes/ProtectedRoute.tsx](src/app/routes/ProtectedRoute.tsx).

- **Zustand stores:** только в `entities/` (auth, employee, session). Используются как хуки (`useAuthStore`). Async-actions: set loading → try/catch → set error/result.

- **Employee creation conflicts:** backend возвращает 400 с `EmployeesConflictError` (поля: `{ userId, existingUser, conflictType }`). UI маршрутизирует через `determineConflictScenario()` и открывает один из диалогов в `features/employee-dialogs/`.

- **Forms & UI:** React Hook Form + Yup (`@hookform/resolvers/yup`). Snackbar через `notistack`.

- **Pagination & search:** employee page uses `useDebounce(400)` and 0-based paging `{ page: 0, size: 10 }` (см. [src/pages/employees/EmployeesPage.tsx](src/pages/employees/EmployeesPage.tsx)).

- **Dev & CI commands:** use `npm run dev` (Vite dev at port 3000, proxy `/api` → `https://api.andromedaedu.kz`), `npm run build` (tsc + vite), `npm run lint` (eslint), `npm run preview`.

- **Env / Docker:** `VITE_API_BASE_URL` controls API base; local dev can use `.env.local`. Docker compose setup proxies Vite to nginx (local container port 8082).

- **When changing API flows:** update `src/shared/api/http.ts`, `src/shared/api/tokens.ts` and adjust callers in `entities/*/api.ts` — other files rely on single-refresh semantics.

- **Where to add new stores/features:** always under `entities/` (state) and `features/` (UI/business logic). Avoid placing new global state in `features/` or `pages/`.

- **Quick debugging hints:**
  - To reproduce auth 401/refresh flows, run dev server and inspect calls to `/api/v1/auth/refresh`.
  - Temp phone stored under key `tempPhoneNumber` in localStorage (auth flow).

Документы и детали: [INDEX.md](INDEX.md), [src/entities/employee/ERROR_HANDLING.md](src/entities/employee/ERROR_HANDLING.md), [src/features/employee-dialogs/ZD3_CHANGES.md](src/features/employee-dialogs/ZD3_CHANGES.md).

Если нужно — сократим/расширим разделы (например, добавить примеры кода для retry-queue или тест-стратегию). Пожалуйста, скажите, какие разделы хотите уточнить.
- Success: #22C55E
