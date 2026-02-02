# API Spec Implementation Report

## Дата: 2 февраля 2026

### 📋 Обновления API слоя

#### ✅ Завершено

**1. Типы (`src/entities/employee/types.ts`)**
- ✅ Добавлены новые типы результатов создания: `CREATED`, `PHONE_TAKEN`, `EMAIL_TAKEN`, `USER_EXISTS_NOT_EMPLOYEE`, `EMPLOYEE_ALREADY_EXISTS`
- ✅ Добавлен `EmployeeCreateResultDto` с полем `type` и `conflictUser`
- ✅ Добавлен `ConflictUserDto` (вместо `ExistingUserInfo`)
- ✅ Добавлена поддержка `DocumentType` (ID_CARD | PASSPORT)
- ✅ Изменено `iin` → `pnOrIin` во всех типах
- ✅ Обновлён `EmployeesConflictError` с поддержкой новых полей

**2. Employee API (`src/entities/employee/api.ts`)**

Все функции обновлены согласно спецификации:

| Функция | Эндпойнт | Статус |
|---------|----------|--------|
| `getEmployees()` | GET /api/v1/employees | ✅ |
| `createEmployee()` | POST /api/v1/employees | ✅ Возвращает `EmployeeCreateResultDto` |
| `takePhoneAndCreate()` | POST /api/v1/employees/actions/take-phone-and-create | ✅ С параметром `sourceUserId` |
| `addAsEmployee()` | POST /api/v1/employees/actions/add-as-employee | ✅ Новая функция |
| `editRole()` | PATCH /api/v1/employees/{userId}/role | ✅ Новая функция |
| `editPhone()` | PATCH /api/v1/employees/{userId}/phone | ✅ Новая функция |
| `takePhone()` | POST /api/v1/employees/{userId}/phone/take | ✅ Новая функция |
| `editEmail()` | PATCH /api/v1/employees/{userId}/email | ✅ Новая функция |
| `setStatus()` | PATCH /api/v1/employees/{userId}/status | ✅ Новая функция |
| `assignHead()` | PATCH /api/v1/employees/{userId}/assign-head | ✅ Новая функция |

**3. Auth API (`src/entities/auth/api.ts`)**
- ✅ Добавлены комментарии к функциям
- ✅ Явно указано, что `phoneNumber` должен быть без "+"
- ✅ Документированы требования к Authorization header

**4. Auth типы (`src/entities/auth/types.ts`)**
- ✅ Добавлена документация всех интерфейсов
- ✅ Подробные комментарии о формате данных

**5. Конфликты (`src/features/employee-dialogs/conflict-utils.ts`)**
- ✅ Обновлён `determineConflictScenario()` для новых типов результатов
- ✅ Добавлена `hasValidConflictUserData()` для проверки данных
- ✅ Сохранена обратная совместимость с `hasValidExistingUserData()`

#### ⚠️ TODO: Нужны обновления в компонентах

**1. `CreateEmployeeDialog.tsx`** - логика добавления сотрудника

Текущее состояние:
- Использует `createEmployee()` но ловит ошибку и показывает диалоги
- Не использует `EmployeeCreateResultDto` (получает ошибку вместо результата)

Что нужно:
1. Обновить типы в форме (добавить `documentType`, использовать `pnOrIin`)
2. Убрать `notCitizen` флаг (если не требуется в спецификации)
3. Убедиться, что `phoneNumber` отправляется без "+"
4. Обновить обработку ответов для всех типов конфликтов:
   - `PHONE_TAKEN` → `ExistingUserDialog` (кнопки: Cancel, Take phone)
   - `EMAIL_TAKEN` → модалка "Email занят" (кнопка: Close)
   - `USER_EXISTS_NOT_EMPLOYEE` → модалка с выбором роли → `addAsEmployee()`
   - `EMPLOYEE_ALREADY_EXISTS` → модалка "Сотрудник существует" (кнопка: Close)

**2. `ConfirmExistingDialog.tsx` и другие диалоги**

Нужно обновить типы с `existingUser` на `conflictUser` (тип `ConflictUserDto`).

**3. Форма валидации (`schemas.ts`)**

Нужно обновить для новых полей:
- Добавить `documentType` (required)
- Переименовать `iin` → `pnOrIin`
- Убрать `notCitizen` если не используется

**4. EmployeesPage.tsx и редактирование**

При редактировании сотрудника (EditEmployeeDialog):
- Использовать новые функции: `editRole()`, `editPhone()`, `editEmail()`, `setStatus()`, `assignHead()`
- Обработать 409 конфликты для phone/email редактирования

---

## 🔄 Сценарии использования (согласно спецификации)

### Добавление сотрудника (CreateEmployeeDialog)

```
1. Нажать "Сохранить" → POST /api/v1/employees
   ↓
2. Получить EmployeeCreateResultDto с type:
   - CREATED → закрыть, toast "Добавлен", refresh
   - PHONE_TAKEN → ExistingUserDialog (Cancel / Take phone)
   - EMAIL_TAKEN → модалка "Email занят" (Close)
   - USER_EXISTS_NOT_EMPLOYEE → модалка выбора + addAsEmployee()
   - EMPLOYEE_ALREADY_EXISTS → модалка "Существует" (Close)
```

### Редактирование номера (EditPhoneDialog)

```
1. PATCH /api/v1/employees/{userId}/phone?phone=...
   ↓
2. Если 409 PHONE_TAKEN → модалка "Номер занят" (Cancel / Take phone)
   ↓
3. POST /api/v1/employees/{userId}/phone/take?sourceUserId=...&phone=...
   ↓
4. Закрыть, refresh
```

### Редактирование email (EditEmailDialog)

```
1. PATCH /api/v1/employees/{userId}/email?email=...
   ↓
2. Если 409 EMAIL_TAKEN → модалка "Email занят" (Close)
   ↓
3. Закрыть
```

---

## 📝 Примеры запросов

### GET список с фильтрами
```
GET /api/v1/employees?page=0&size=20&q=azhibek&roles=MENTOR&roles=TEACHER&statuses=ACTIVE
```

### POST создать сотрудника
```
POST /api/v1/employees
{
  "lastName": "Azhibek",
  "firstName": "Assylkhan",
  "documentType": "ID_CARD",
  "pnOrIin": "980420300036",
  "phoneNumber": "77001234567",
  "email": "user@gmail.com",
  "role": "MENTOR"
}
```

### POST отобрать номер и создать
```
POST /api/v1/employees/actions/take-phone-and-create?sourceUserId=12
{
  "lastName": "New",
  "firstName": "Employee",
  ...
}
```

### PATCH обновить роль
```
PATCH /api/v1/employees/123/role?role=TEACHER
```

### PATCH обновить номер
```
PATCH /api/v1/employees/123/phone?phone=77009998877
```

---

## 🚀 Следующие шаги

1. **Обновить CreateEmployeeDialog.tsx**
   - Поменять типы формы
   - Реализовать обработку всех 5 типов результатов
   - Вызвать правильные функции API для каждого сценария

2. **Обновить EditEmployeeDialog.tsx** (если существует)
   - Использовать новые функции `editRole()`, `editPhone()`, `editEmail()`, `setStatus()`, `assignHead()`
   - Обработать 409 конфликты

3. **Обновить EmployeesPage.tsx**
   - Убедиться, что `getEmployees()` правильно передаёт `roles` и `statuses` как массивы

4. **Добавить примеры использования в документацию**
   - Как вызывать API функции
   - Как обрабатывать конфликты

---

## ✅ Проверка соответствия спецификации

| Требование | Статус | Комментарий |
|-----------|--------|-----------|
| GET /api/v1/employees | ✅ | Готов |
| POST /api/v1/employees | ✅ | Возвращает EmployeeCreateResultDto |
| POST /api/v1/employees/actions/take-phone-and-create | ✅ | С sourceUserId |
| POST /api/v1/employees/actions/add-as-employee | ✅ | Новая функция |
| PATCH /api/v1/employees/{userId}/role | ✅ | Готов |
| PATCH /api/v1/employees/{userId}/phone | ✅ | Готов |
| POST /api/v1/employees/{userId}/phone/take | ✅ | Готов |
| PATCH /api/v1/employees/{userId}/email | ✅ | Готов |
| PATCH /api/v1/employees/{userId}/status | ✅ | Готов |
| PATCH /api/v1/employees/{userId}/assign-head | ✅ | Готов |
| POST /api/v1/auth/send-code | ✅ | Готов |
| POST /api/v1/auth/login | ✅ | Готов |
| GET /api/v1/auth/me | ✅ | Готов |
| Обработка 409 конфликтов | ✅ | Поддержана в EmployeesConflictError |
| Типизация конфликтов | ✅ | 5 типов результатов |
| Форматирование телефонов (без "+") | ✅ | Документировано в коде |
