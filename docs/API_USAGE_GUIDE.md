# API Usage Guide

Примеры использования обновлённых API функций согласно спецификации.

## Employee API

### 1. Получить список сотрудников

```typescript
import { getEmployees } from '@/entities/employee'

// Без фильтров
const { items, total } = await getEmployees()

// С поиском
const { items, total } = await getEmployees({
  q: 'azhibek',
  page: 0,
  size: 20
})

// С фильтрами по ролям и статусам
const { items, total } = await getEmployees({
  roles: ['MENTOR', 'TEACHER'],
  statuses: ['ACTIVE'],
  page: 0,
  size: 20
})
```

### 2. Создать сотрудника

```typescript
import { createEmployee, EmployeeCreateResultDto } from '@/entities/employee'

const result: EmployeeCreateResultDto = await createEmployee({
  lastName: 'Azhibek',
  firstName: 'Assylkhan',
  documentType: 'ID_CARD', // or 'PASSPORT'
  pnOrIin: '980420300036', // only digits, backend adds prefix
  phoneNumber: '77001234567', // only digits, no "+"
  email: 'user@gmail.com',
  role: 'MENTOR' // any case
})

// Обработка результата
if (result.type === 'CREATED') {
  console.log('Success!')
} else if (result.type === 'PHONE_TAKEN') {
  console.log('Phone taken by:', result.conflictUser)
  // Show dialog: "Take phone?" → call takePhoneAndCreate()
} else if (result.type === 'EMAIL_TAKEN') {
  console.log('Email taken:', result.conflictUser)
  // Show modal: "Email is taken"
} else if (result.type === 'USER_EXISTS_NOT_EMPLOYEE') {
  console.log('User exists but not employee:', result.conflictUser)
  // Show modal: "Add as employee?" → call addAsEmployee()
} else if (result.type === 'EMPLOYEE_ALREADY_EXISTS') {
  console.log('Employee already exists:', result.conflictUser)
  // Show modal: "Employee already exists"
}
```

### 3. Отобрать номер и создать

```typescript
import { takePhoneAndCreate } from '@/entities/employee'

// Called when createEmployee() returns PHONE_TAKEN
const result = await takePhoneAndCreate(conflictUser.id, {
  lastName: 'New',
  firstName: 'Employee',
  documentType: 'ID_CARD',
  pnOrIin: '123456789012',
  phoneNumber: '77009998877',
  email: 'new@example.com',
  role: 'TEACHER'
})

if (result.type === 'CREATED') {
  console.log('Employee created and phone transferred')
}
```

### 4. Добавить существующего пользователя как сотрудника

```typescript
import { addAsEmployee } from '@/entities/employee'

// Called when createEmployee() returns USER_EXISTS_NOT_EMPLOYEE
const result = await addAsEmployee(existingUser.id, 'MENTOR')

if (result.type === 'CREATED') {
  console.log('User added as employee')
  // Show message: "User added as employee but phone/email not updated. 
  // Find in Employees section and update manually"
}
```

### 5. Редактировать роль

```typescript
import { editRole } from '@/entities/employee'

const employee = await editRole(userId, 'TEACHER')
console.log('Role updated:', employee.role)

// Note: Cannot set HEAD role via this endpoint
// Use assignHead() instead
```

### 6. Редактировать номер телефона

```typescript
import { editPhone, takePhone, isEmployeesConflictError } from '@/entities/employee'

try {
  const employee = await editPhone(userId, '77009998877')
  console.log('Phone updated')
} catch (error) {
  if (isEmployeesConflictError(error) && error.type === 'PHONE_TAKEN') {
    // Phone is taken by another user
    console.log('Phone taken by:', error.conflictUser)
    
    // Show dialog: "Take phone?" → call takePhone()
    await takePhone(userId, error.conflictUser.id, '77009998877')
    console.log('Phone transferred')
  }
}
```

### 7. Редактировать email

```typescript
import { editEmail, isEmployeesConflictError } from '@/entities/employee'

try {
  const employee = await editEmail(userId, 'new@example.com')
  console.log('Email updated')
} catch (error) {
  if (isEmployeesConflictError(error) && error.type === 'EMAIL_TAKEN') {
    // Email is taken
    console.log('Email taken by:', error.conflictUser)
    // Show modal: "Email is already taken"
  }
}
```

### 8. Изменить статус (активировать/деактивировать)

```typescript
import { setStatus } from '@/entities/employee'

await setStatus(userId, true)  // Activate
await setStatus(userId, false) // Deactivate
console.log('Status changed')
```

### 9. Назначить руководителем (только для DIRECTOR)

```typescript
import { assignHead } from '@/entities/employee'

try {
  await assignHead(userId)
  console.log('Employee assigned as HEAD')
} catch (error) {
  if ((error as any).status === 403) {
    console.log('Only DIRECTOR can assign HEAD')
  }
}
```

## Auth API

### 1. Отправить код подтверждения

```typescript
import { sendCode } from '@/entities/auth'

await sendCode({
  phoneNumber: '77001234567' // only digits, no "+"
})
console.log('Code sent')
```

### 2. Авторизация (логин)

```typescript
import { login } from '@/entities/auth'

const tokens = await login({
  phoneNumber: '77001234567',
  code: '250219' // master code
})

// Frontend should store accessToken and set it in Authorization header
// This is done automatically by http client via token storage
console.log('Logged in, tokens received')
```

### 3. Получить текущего пользователя

```typescript
import { getMe } from '@/entities/auth'

const user = await getMe() // Requires Authorization header

console.log('User sections:', user.sections)
// sections.employees controls "Сотрудники" visibility
if (!user.sections.employees) {
  console.log('User cannot access employees section')
}
```

## Error Handling

### Обработка конфликтов (409/400)

```typescript
import { 
  createEmployee, 
  isEmployeesConflictError, 
  type EmployeeCreateResultDto 
} from '@/entities/employee'

try {
  const result = await createEmployee(formData)
  
  // Note: Success results don't throw error, check result.type instead
  if (result.type === 'CREATED') {
    // Success
  } else if (result.type === 'PHONE_TAKEN') {
    // Conflict but with data
    console.log('Phone taken by:', result.conflictUser)
  }
} catch (error) {
  if (isEmployeesConflictError(error)) {
    console.log('Conflict type:', error.type)
    console.log('Conflict user:', error.conflictUser)
    console.log('Status:', error.status) // 400 or 409
  }
}
```

### Обработка 401 (из http.ts)

401 конфликты обрабатываются автоматически в [src/shared/api/http.ts](../src/shared/api/http.ts):
- Первый запрос с 401 триггерит refresh
- Остальные запросы ждут в очереди
- После успешного refresh повторяются с новым токеном
- Если refresh не удался → редирект на `/login`

---

## Integration с React компонентами

### CreateEmployeeDialog пример

```typescript
const [result, setResult] = useState<EmployeeCreateResultDto | null>(null)

const handleSubmit = async (formData: CreateEmployeeRequest) => {
  try {
    const result = await createEmployee(formData)
    setResult(result)
    
    switch (result.type) {
      case 'CREATED':
        enqueueSnackbar('Employee added', { variant: 'success' })
        onClose()
        onSuccess() // Refetch employees
        break
        
      case 'PHONE_TAKEN':
        setConflictUser(result.conflictUser)
        setShowPhoneConflict(true)
        break
        
      case 'EMAIL_TAKEN':
        setConflictUser(result.conflictUser)
        setShowEmailConflict(true)
        break
        
      case 'USER_EXISTS_NOT_EMPLOYEE':
        setConflictUser(result.conflictUser)
        setShowExistingUser(true)
        break
        
      case 'EMPLOYEE_ALREADY_EXISTS':
        setConflictUser(result.conflictUser)
        setShowEmployeeExists(true)
        break
    }
  } catch (error) {
    enqueueSnackbar('Error', { variant: 'error' })
  }
}
```

### Phone conflict resolution

```typescript
const handleTakePhone = async () => {
  try {
    const result = await takePhoneAndCreate(conflictUser.id, formData)
    if (result.type === 'CREATED') {
      enqueueSnackbar('Employee added, phone transferred', { variant: 'success' })
      onClose()
      onSuccess()
    }
  } catch (error) {
    enqueueSnackbar('Error taking phone', { variant: 'error' })
  }
}
```

### Add existing user as employee

```typescript
const handleAddAsEmployee = async () => {
  try {
    const result = await addAsEmployee(conflictUser.id, formData.role)
    if (result.type === 'CREATED') {
      enqueueSnackbar(
        'User added as employee. Update phone/email manually in Employees section',
        { variant: 'info' }
      )
      onClose()
      onSuccess()
    }
  } catch (error) {
    enqueueSnackbar('Error', { variant: 'error' })
  }
}
```
