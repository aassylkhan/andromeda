# Andromeda Frontend — описание проекта

Документ для онбординга разработчиков и для передачи контекста ИИ (ТЗ, архитектура, интеграции).

---

## 1. Назначение

**Andromeda** — одностраничное веб-приложение (SPA) для внутренней системы управления (бренд **Yadro by Andromeda**). Фронтенд обеспечивает:

- вход по номеру телефона и одноразовому коду;
- работу с **сотрудниками** (список, поиск, фильтры, роли, статусы, создание с обработкой конфликтов);
- просмотр и управление **сессиями** («мои сессии», «все сессии» для администраторов).

В репозитории — **только фронтенд**. Бэкенд — отдельный REST API; базовый URL задаётся через переменную окружения.

---

## 2. Технологический стек

| Слой | Технологии |
|------|------------|
| Язык | TypeScript |
| UI | React 19, React Router 7 |
| Сборка | Vite 7 |
| Компоненты / стили | MUI (Material UI) 7, Emotion |
| Формы | react-hook-form, yup, @hookform/resolvers |
| HTTP | Axios (`src/shared/api/http.ts`) |
| Состояние | Zustand (auth, employee store) |
| Уведомления | notistack |
| Телефоны | libphonenumber-js, утилиты в `src/shared/utils/phoneUtils.ts` |

Production-сборка: `npm run build` (`tsc -b && vite build`) → статика для **nginx** (Docker).

---

## 3. Структура репозитория

```
src/
├── app/                 # Корневой layout, провайдеры, роутер, ProtectedRoute
├── api/                 # Legacy/доп. клиенты (при необходимости)
├── auth/                # Токены (часть логики дублируется в shared/api)
├── components/          # Общие UI (логотип и т.д.)
├── entities/            # Домен: auth, employee, session (types, api, store)
├── features/            # Сценарии: auth-login, employee-create, employee-dialogs
├── pages/               # Экраны: EmployeesPage, MySessionsPage, AllSessionsPage, …
├── shared/              # http, hooks, i18n, utils
└── theme/               # Тема (если используется)
```

Условно **feature-oriented**: `entities` — данные и API, `features` — составные сценарии и модалки, `pages` — страницы маршрутов.

---

## 4. Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `VITE_API_BASE_URL` | Базовый URL API (по умолчанию в коде: `https://api.andromedaedu.kz`) |

Локально: файл `.env.local` в корне проекта.  
Production: `.env.production` или build-args в Docker (см. `docker-compose.yml`, `Dockerfile`).

---

## 5. Интеграция с API

- База: **`import.meta.env.VITE_API_BASE_URL`**.
- Префикс путей: в основном **`/api/v1/...`**.
- **Authorization**: `Bearer <accessToken>` для всех запросов, кроме исключений (`/api/v1/auth/send-code`, `/login`, `/refresh`) — см. `src/shared/api/http.ts`.
- **401**: interceptor выполняет **refresh** токена, очередь повторных запросов; при ошибке — очистка сессии.

Основные группы:

- **Auth** — отправка кода, логин, refresh, загрузка текущего пользователя (`entities/auth`).
- **Employees** — список с `q`, `roles`, `statuses`, пагинация; создание; смена роли, телефона, email, статуса; сценарии конфликтов (`take-phone-and-create`, `add-as-employee` и т.д.) — `src/entities/employee/api.ts`.
- **Sessions** — `GET/DELETE /api/v1/me/sessions`, админские `/api/v1/admin/users/{userId}/sessions` — `src/entities/session/api.ts`.

---

## 6. Аутентификация и пользователь

Поток: **логин (телефон)** → **страница кода** → сохранение токенов → загрузка профиля.

Модель пользователя (`entities/auth/types.ts`):

- `userId`, ФИО, `email`, `phoneNumber`
- **`roles: string[]`**
- **`sections`**: `{ admin, employees, mySessions }` — управляет видимостью пунктов меню

Токены: `src/shared/api/tokens.ts` (access / refresh).

---

## 7. Маршрутизация и доступ

Файл: `src/app/router.tsx`.

| Путь | Описание |
|------|----------|
| `/login`, `/login/code` | Публичные страницы входа |
| `/` | Под `AppLayout` + `ProtectedRoute`; редирект на `/employees` |
| `/employees` | Сотрудники; дополнительно `requiredRoles: ['head', 'director']` |
| `/my-sessions` | Мои сессии |
| `/sessions` | Все сессии (доступ к пункту меню через `sections.admin`) |
| `*` | Редирект на `/login` |

`ProtectedRoute` (`src/app/routes/ProtectedRoute.tsx`):

- без токена → `/login`;
- с токеном — загрузка пользователя (`loadMe`);
- опционально **`requiredRoles`** и **`requiredSections`** — иначе экран «Нет доступа».

Меню в `AppLayout` фильтруется по **`user.sections`** (ключи `employees`, `mySessions`, `admin`).

---

## 8. Основные функциональные модули

### 8.1 Сотрудники

- Страница: `src/pages/employees/EmployeesPage.tsx`.
- Список нормализуется к типу **`Employee`** (`iin`, `userId`, ФИО, телефон, email, роль, статус). Ответ API может отдавать DTO с `pnOrIin`; на клиенте это приводится к `iin` в `entities/employee/api.ts`.
- Действия: редактирование роли, телефона, email, статуса, назначение head и др. через функции из `employee/api.ts`.
- Добавление сотрудника: форма `CreateEmployeeRequest` → маппинг **`toEmployeeCreateRequest`** → тело **`EmployeeCreateRequest`** (`documentType`, `pnOrIin`, …) для POST.
- Конфликты при создании: **`EmployeesConflictError`**, сценарии с диалогами в `features/employee-dialogs/` (существующий пользователь / сотрудник, подтверждение, отбор номера и т.д.).

### 8.2 Сессии

- **Мои сессии**: `MySessionsPage` + `getMySessions`, удаление сессий.
- **Все сессии**: `AllSessionsPage` + admin API по `userId`.

---

## 9. UI и брендинг

- Тема MUI и палитра в `src/app/providers/AppProviders.tsx`.
- Layout: боковое меню (desktop), drawer (mobile), `src/app/layout/AppLayout.tsx`.
- Логотип и изображения: `public/`, `src/assets/`.

---

## 10. Docker

- `docker-compose.yml`: сервис **frontend**, порт **8082** на `127.0.0.1`, образ на **nginx:alpine** после stage сборки Node.
- Build-arg `VITE_API_BASE_URL` задаёт API для production-сборки.

```bash
docker compose up -d --build
```

---

## 11. Скрипты npm

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Разработка (Vite) |
| `npm run build` | Проверка типов + production bundle |
| `npm run lint` | ESLint |
| `npm run preview` | Превью production-сборки |

---

## 12. Дополнительная документация

- **`README.md`** — env, Docker, быстрый старт.
- **`INDEX.md`** — при наличии: оглавление внутренних документов (ЗД, спеки ошибок/конфликтов).

---

## 13. Ограничения для интеграций

1. Контракты REST должны совпадать с тем, что вызывается из `entities/*/api.ts`.
2. Права на UI завязаны на **`roles`** и **`sections`** — изменения на бэкенде должны отражаться в типах и в логике меню/маршрутов.
3. CI/деплой обычно опираются на успешный **`npm run build`** (строгая типизация).

---

*Версия документа: по состоянию репозитория. При крупных изменениях API или роутинга обновляйте этот файл.*
