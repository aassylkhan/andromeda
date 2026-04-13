# Andromeda Frontend — Полный гайд для разработчика

## 1. О проекте

**Andromeda** — внутренняя CRM-система для образовательного центра. Frontend — SPA на React с MUI, обеспечивает управление сотрудниками, учениками, родителями, оплатами, расписанием и операционными процессами.

---

## 2. Технологический стек

| Технология | Версия | Роль |
|------------|--------|------|
| React | 19 | UI-фреймворк |
| TypeScript | ~5.9 | Типизация |
| Vite | 7 | Сборка и dev server |
| MUI (Material UI) | 7 | Компонентная библиотека |
| @mui/x-data-grid | 8 | Установлен, но не используется (таблицы на `Table`) |
| Zustand | 5 | Стейт-менеджмент (auth store) |
| Axios | 1.13 | HTTP-клиент |
| react-hook-form + yup | 7 / 1.7 | Формы + валидация (частично) |
| react-router-dom | 7 | Маршрутизация |
| notistack | 3 | Snackbar-уведомления |
| Emotion | 11 | CSS-in-JS (MUI styling) |

---

## 3. Структура проекта

```
src/
├── app/                        # Ядро приложения
│   ├── App.tsx                 # Корневой компонент (RouterProvider)
│   ├── router.tsx              # Определение маршрутов (createBrowserRouter)
│   ├── layout/
│   │   └── AppLayout.tsx       # Основной layout: sidebar + outlet
│   ├── providers/
│   │   └── AppProviders.tsx    # MUI тема + SnackbarProvider
│   └── routes/
│       ├── ProtectedRoute.tsx  # Auth guard + role/section check
│       └── MaintenanceGuard.tsx # Maintenance mode check
│
├── entities/                   # Доменные модули (types + API)
│   ├── auth/                   # Авторизация: types, api, store (Zustand)
│   ├── employee/               # Сотрудники: types, api, store
│   ├── student/                # Ученики: types, api
│   ├── parent/                 # Родители: types, api
│   ├── user/                   # Пользователи: types, api
│   ├── payment-request/        # Оплаты: types, api
│   ├── lookup/                 # Справочники: types, api
│   ├── schedule/               # Расписание: types, api
│   ├── session/                # Сессии: types, api
│   └── maintenance/            # Maintenance: api
│
├── features/                   # Диалоги и формы (бизнес-UI)
│   ├── auth-login/             # LoginPage, CodePage
│   ├── student-dialogs/        # AddStudentDialog, EnrollStudentDialog, StudentFilterDialog
│   ├── payment-dialogs/        # PaymentRequestsFilterDialog
│   ├── employee-dialogs/       # AddEmployeeModal, EditEmployeeModal, FilterModal, TeacherRatesModal, AddTeacherRateModal
│   ├── user-dialogs/           # AddUserModal, EditDocumentModal
│   ├── parent-dialogs/         # AddParentDialog, ManageParentStudentsDialog
│   └── schedule-dialogs/       # CreateGroupDialog, EditGroupDialog, AddStudentToGroupDialog, ScheduleFilterDialog
│
├── pages/                      # Страницы (page-level components)
│   ├── users/                  # UsersPage
│   ├── employees/              # EmployeesPage
│   ├── students/               # StudentsPage, StudentDetailPage, CuratorAssignmentPage
│   ├── parents/                # ParentsPage
│   ├── payment-requests/       # PaymentRequestsPage
│   ├── schedule/               # OfflineSchedulePage
│   ├── maintenance/            # MaintenancePage
│   └── SessionsPage.tsx        # Страница сессий
│
├── shared/                     # Переиспользуемые утилиты
│   ├── api/                    # HTTP-клиент (axios), токены
│   ├── hooks/                  # useDebounce
│   └── utils/                  # roleUtils, phoneUtils, validationUtils, documentUtils
│
├── components/                 # UI-компоненты (Sidebar — legacy, RocketLogo)
├── main.tsx                    # Точка входа
└── index.css                   # Глобальные стили + шрифты
```

---

## 4. Архитектурные паттерны

### 4.1 Feature-Sliced подход (упрощённый)

Проект организован по слоям:
- **entities/** — типы + API-вызовы для каждого домена
- **features/** — диалоги, формы, сложные UI-компоненты
- **pages/** — страницы, привязанные к маршрутам
- **shared/** — общие утилиты

### 4.2 Управление состоянием

| Тип состояния | Инструмент |
|---------------|------------|
| Авторизация (user, loading) | **Zustand** (`useAuthStore`) |
| Данные страниц (списки, фильтры) | **React useState + useEffect** |
| Формы (простые) | **Controlled inputs** (useState) |
| Формы (сложные) | **react-hook-form + yup** (AddUserModal) |

### 4.3 API-слой

```
entities/{domain}/api.ts  →  shared/api/http.ts  →  axios  →  Backend API
```

- `http.ts` — axios-инстанс с interceptors:
  - **Request:** автоматически добавляет `Bearer` token
  - **Response 401:** автоматический refresh + retry failed queue
- Токены хранятся в `localStorage`
- Base URL: `import.meta.env.VITE_API_BASE_URL` или `https://api.andromedaedu.kz`
- Dev proxy: Vite проксирует `/api` на `https://api.andromedaedu.kz`

### 4.4 Маршрутизация

```tsx
createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },
  { path: '/login/code', element: <CodePage /> },
  
  // Protected (auth + maintenance guard)
  { path: '/', element: <MaintenanceGuard><ProtectedRoute><AppLayout /></ProtectedRoute></MaintenanceGuard>,
    children: [
      { index: true, element: <Navigate to="/sessions" /> },
      { path: 'users', element: <ProtectedRoute requiredRoles={[...]}><UsersPage /></ProtectedRoute> },
      { path: 'employees', ... },
      { path: 'students', ... },
      { path: 'students/:id', ... },
      { path: 'students/without-curator', ... },
      { path: 'parents', ... },
      { path: 'payment-requests', ... },
      { path: 'offline-schedule', ... },
      { path: 'sessions', element: <SessionsPage /> },  // доступно всем
    ]
  },
  { path: '*', element: <Navigate to="/login" /> },
])
```

**ProtectedRoute:**
1. Нет токена → redirect на `/login`
2. Загружает `user` через `useAuthStore().loadMe()`
3. Проверяет `requiredSections` — есть ли доступ к секции
4. Проверяет `requiredRoles` — есть ли нужная роль
5. Нет доступа → экран "Нет доступа"

### 4.5 Sidebar (навигация)

Определена в `AppLayout.tsx` через массив `menuItems`. Каждый пункт имеет:
- `label` — название
- `icon` — MUI иконка
- `path` — путь
- `sectionKey` — ключ из `UserSections` (определяет видимость)

Видимые пункты фильтруются по `user.sections[sectionKey]`.

---

## 5. Тема и стилизация

### 5.1 MUI Theme (`AppProviders.tsx`)

- **Primary:** `#1877F2` (синий)
- **Secondary:** `#8E33FF` (фиолетовый)
- **Background:** `#F9FAFB` (светло-серый)
- **Paper:** `#FFFFFF`
- **Шрифты:** DM Sans Variable (основной), Barlow (заголовки)
- **Border radius:** 8px
- **Тонкий scrollbar:** кастомный через CssBaseline

### 5.2 Паттерны стилизации

| Паттерн | Как используется |
|---------|-----------------|
| `sx` prop | Везде (inline стили через MUI system) |
| Константы `TH_SX` | Стили заголовков таблиц (копируются между страницами) |
| `NAV` объект | Стили навигации в AppLayout |
| Тема | Глобальные стили компонентов (Button, Card, Dialog, Table, TextField) |

### 5.3 Паттерн страницы

Типичная страница:
```tsx
<Box>
  <Typography variant="h5">Заголовок</Typography>
  
  {/* Toolbar: поиск + фильтр + действия */}
  <Box sx={{ display: 'flex', gap: 2 }}>
    <TextField placeholder="Поиск..." />
    <Button>Фильтр</Button>
    <Button>Добавить</Button>
  </Box>
  
  {/* Таблица */}
  <Paper variant="outlined">
    {loading ? <CircularProgress /> : (
      <TableContainer>
        <Table>...</Table>
      </TableContainer>
    )}
    <TablePagination />
  </Paper>
  
  {/* Диалоги */}
  <FilterDialog />
  <AddDialog />
</Box>
```

### 5.4 Паттерн диалога

```tsx
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>Заголовок</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
    {error && <Typography color="error">{error}</Typography>}
    {/* Поля формы */}
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={onClose}>Отменить</Button>
    <Button variant="contained" onClick={handleSubmit}>Сохранить</Button>
  </DialogActions>
</Dialog>
```

---

## 6. Разделы и бизнес-логика

### 6.1 Авторизация (`features/auth-login/`)

**Процесс:**
1. `LoginPage` — ввод номера телефона → `sendCode` → redirect на `/login/code`
2. `CodePage` — ввод 6-значного кода → `login` → redirect на `/`
3. `useAuthStore` хранит user + loading + error
4. Мастер-код: `250219` (для разработки)

### 6.2 Все пользователи (`pages/users/UsersPage.tsx`)

- Таблица всех users с поиском
- Кнопка "Добавить" → `AddUserModal` (react-hook-form + yup): ФИ, документ, телефон, язык
- Редактирование документов через `EditDocumentModal`

### 6.3 Сотрудники (`pages/employees/EmployeesPage.tsx`)

- Таблица с фильтрами (роль, статус, руководитель)
- Добавление: `AddEmployeeModal` — выбор user → роль → supervisor
- Редактирование: `EditEmployeeModal` — смена роли и supervisor
- Активация/деактивация через кнопку в строке
- Назначение HEAD — только для DIRECTOR
- Ставки преподавателей: `TeacherRatesModal` → `AddTeacherRateModal`

### 6.4 Ученики (`pages/students/`)

**StudentsPage:**
- Таблица 14 колонок с пагинацией и фильтром
- Клик на строку → `StudentDetailPage`
- Кнопка "Без куратора" → `CuratorAssignmentPage`

**StudentDetailPage:**
- Карточка ученика с tabs:
  - Info (основная информация + баланс)
  - Родители (`ParentsTab`)
- "Записать на обучение" → `EnrollStudentDialog` (создание payment_request)

**EnrollStudentDialog:**
- Сложная форма: эксперт, родитель, класс, продукт, язык, офис, время, дата, заморозки, дни, оплата
- Автоматический расчёт: months, hours, totalFee
- Зависимые поля (parent зависит от привязанных родителей)

**CuratorAssignmentPage:**
- Список учеников без куратора
- Dropdown для назначения куратора

**StudentFilterDialog:**
- 15+ фильтров: gradeIds, productIds, learningLanguageIds, officeIds, learningHourOptionIds, curatorIds, часы min/max, заморозки min/max, дата от/до

### 6.5 Родители (`pages/parents/ParentsPage.tsx`)

- Таблица с поиском
- `AddParentDialog` — создание из user
- `ManageParentStudentsDialog` — привязка/отвязка учеников

### 6.6 Оплаты (`pages/payment-requests/PaymentRequestsPage.tsx`)

- Таблица запросов на оплату с фильтрами
- Кнопки подтверждения/отклонения (payment + signature) — только для ACCOUNTANT
- Фильтры: дата, эксперт, статус оплаты, статус подписи

### 6.7 Оффлайн расписание (`pages/schedule/OfflineSchedulePage.tsx`)

**Основной контент — табличная сетка расписания:**
- По горизонтали: кабинеты филиала (отсортированы А-Я)
- По вертикали: 7 дней × таймслоты с 7:00 до 23:00 (шаг 30 мин)
- Sticky header (кабинеты) + sticky columns (день, время)
- Группы отображаются как карточки с цветной полосой, ФИ преподавателя, предметом, счётчиком учеников

**Toolbar:**
- "Добавить" — проверка роли → CreateGroupDialog или ошибка
- "Фильтр" → ScheduleFilterDialog
- Dropdown филиала — обновляет данные
- "Кабинеты" — disabled (будущий функционал)

**CreateGroupDialog:**
- Поля: название, тип группы (только offline), предмет → преподаватель (зависимое), филиал → кабинет (зависимое), время, длительность, дни
- Валидация: backend проверяет конфликты

**EditGroupDialog:**
- Те же поля + список учеников с удалением
- "Добавить ученика" → AddStudentToGroupDialog (autocomplete поиск)
- "Удалить" → confirm dialog → каскадное удаление

**ScheduleFilterDialog:**
- Тип группы (multi-select)
- Предмет (multi-select)
- Количество учеников (от/до)

### 6.8 Сессии (`pages/SessionsPage.tsx`)

- Таблица моих auth-сессий
- IP, User-Agent, дата создания, статус
- Отзыв сессии

### 6.9 Maintenance Guard

- При каждом входе проверяется `GET /platform-status`
- Если `enabled: true` → показывается `MaintenancePage` с сообщением и временем возврата

---

## 7. Типы и интерфейсы (ключевые)

### Auth
```typescript
interface User {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string
  roles: string[]
  sections: UserSections
}

interface UserSections {
  allUsers: boolean
  employees: boolean
  mySessions: boolean
  admin: boolean
  students: boolean
  parents: boolean
  paymentRequests: boolean
  offlineSchedule: boolean
}
```

### Student
```typescript
interface StudentListItem {
  studentId: number, userId: number
  lastName: string, firstName: string
  phoneNumber: string | null
  gradeId/Name, productId/Name, learningLanguageId/Name
  officeId/Name, learningHourOptionId/Name
  curatorUserId, curatorLastName, curatorFirstName
  amountOfOfflineGroupHours, amountOfOfflineIndividualHours, amountOfOnlineIndividualHours
  freezings: number
  offerStartDate: string | null
}
```

### Schedule
```typescript
interface GroupListItemDto {
  id: number, name: string
  groupTypeId: number, groupTypeName: string
  teacherId: number, teacherName: string
  subjectId: number, subjectName: string
  classroomId: number, classroomName: string
  startTime: string, endTime: string  // "HH:mm:ss"
  mon, tue, wed, thu, fri, sat, sun: boolean
  studentCount: number
}
```

### Lookup (используется везде)
```typescript
interface LookupDto {
  id: number
  name: string
}
```

---

## 8. Как работает авторизация на фронте

```
1. Пользователь вводит телефон → POST /auth/send-code
2. Вводит код → POST /auth/login → получает {accessToken, refreshToken}
3. Токены сохраняются в localStorage
4. axios interceptor добавляет Bearer token к каждому запросу
5. При 401 → автоматический refresh через /auth/refresh
6. Если refresh тоже 401 → clearTokens → redirect /login
7. GET /auth/me → загружает user с roles и sections
8. ProtectedRoute фильтрует по roles/sections
9. AppLayout фильтрует menuItems по sections
```

---

## 9. Как добавить новый раздел

### Шаг 1: Backend
1. Добавить секцию в `CurrentUserDto.Sections` + `CurrentUserService.buildSections()`
2. Создать контроллер с `@PreAuthorize`
3. Создать сервис + DTO + репозитории

### Шаг 2: Frontend
1. Добавить `sectionKey` в `UserSections` (`entities/auth/types.ts`)
2. Создать `entities/{domain}/types.ts` + `api.ts`
3. Создать `pages/{domain}/MyPage.tsx`
4. Создать `features/{domain}-dialogs/` если нужны диалоги
5. Добавить маршрут в `app/router.tsx` с `ProtectedRoute`
6. Добавить пункт меню в `app/layout/AppLayout.tsx` → `menuItems`

---

## 10. Как запустить

```bash
npm install
npm run dev          # Dev server на http://localhost:3000
npm run build        # Production build (tsc + vite build)
npm run lint         # ESLint
```

**Proxy:** В dev-режиме запросы `/api` проксируются на `https://api.andromedaedu.kz`

Для работы с локальным backend — создать `.env`:
```
VITE_API_BASE_URL=http://localhost:8080
```

---

## 11. Что ещё не реализовано / потенциальные направления

1. **Онлайн расписание** — аналогичный раздел для online-групп
2. **CRUD кабинетов** — кнопка "Кабинеты" готова, но disabled
3. **Dashboard** — сводная панель с ключевыми метриками
4. **Журнал посещаемости** — отметки на занятиях, списание часов
5. **Задачи кураторов** — раздел для управления задачами
6. **История транзакций** — подробная финансовая история ученика
7. **Уведомления** — real-time уведомления (WebSocket)
8. **Тёмная тема** — тема уже кастомизирована, можно добавить toggle
9. **Мобильная адаптация** — layout адаптирован, но таблицы нет
10. **Экспорт данных** — CSV/Excel экспорт из таблиц
11. **Фриз/разморозка** — UI для управления заморозками
12. **Возвраты** — UI для обработки возвратов средств
13. **Отчёты** — графики и аналитика

---

## 12. Советы для нового разработчика

1. **Не ломай существующие компоненты** — проект production, все изменения эволюционные
2. **Копируй паттерны** — лучший способ сделать новую страницу = скопировать `StudentsPage` и адаптировать
3. **Используй `sx` prop** — не создавай отдельные CSS файлы
4. **Все API через entities/** — не делай axios-вызовы напрямую из компонентов
5. **Проверяй типы** — `npm run build` запускает `tsc -b` перед сборкой
6. **Зависимые selects** — паттерн: при смене parent → сбрасывать child → загружать options
7. **Ошибки показывай в Dialog** — не в console.log
8. **Пагинация серверная** — `page`, `size`, `total` для всех таблиц
9. **Debounce для поиска** — `useDebounce(query, 400)`
10. **Нет глобального state для данных** — каждая страница загружает свои данные в useEffect
