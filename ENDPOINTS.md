# API Endpoints - Kairo Backend

## Base URL
```
http://localhost:3000/api
```

## Health Check
- **GET** `/api/health` - Verifica el estado del servidor

---

## User Routes (`/api`)

### Authentication

#### Register User
- **POST** `/api/register`
- **Body:**
  ```json
  {
    "email": "string (email válido)",
    "username": "string (mín. 3 caracteres)",
    "password": "string (mín. 6 caracteres)",
    "firstName": "string",
    "lastName": "string",
    "recoveryAnswer": "string"
  }
  ```
- **Response:** Usuario creado con datos básicos

#### Login User
- **POST** `/api/login`
- **Body:**
  ```json
  {
    "email": "string (email o username)",
    "password": "string"
  }
  ```
- **Features:**
  - Búsqueda por email o username
  - Protección contra fuerza bruta (5 intentos, bloqueo 5 min)
  - Crea 6 tareas predefinidas en el primer login
- **Response:** Datos del usuario autenticado

#### Password Recovery
- **POST** `/api/recovery`
- **Body:**
  ```json
  {
    "email": "string (email válido)",
    "recoveryAnswer": "string",
    "password": "string (nueva contraseña, mín. 6 caracteres)"
  }
  ```
- **Response:** Confirmación de recuperación exitosa

---

## Task Routes (`/api/tasks`)

### Task Management

#### Create Task
- **POST** `/api/tasks/`
- **Body:**
  ```json
  {
    "titulo": "string (requerido)",
    "usernameAsignado": "string (requerido)",
    "descripcion": "string (opcional)",
    "prioridad": "alta|media|baja (opcional)",
    "fechaVencimiento": "ISO8601 date (opcional)",
    "estado": "pendiente|en_progreso|completada|cancelada (opcional, default: pendiente)",
    "asignadoPor": "string (opcional)",
    "nota": "string (opcional)",
    "esPrioridad": "boolean (opcional, default: false)"
  }
  ```
- **Response:** Tarea creada y asignación generada

#### Get Tasks Created by User
- **GET** `/api/tasks/createdByUser/:username`
- **Response:** Lista de tareas creadas por el usuario especificado

#### Get Tasks Assigned to User
- **GET** `/api/tasks/assignedToUser/:username`
- **Response:** Lista de tareas asignadas al usuario con información de asignación

#### Get Priority Tasks for User
- **GET** `/api/tasks/priority/:username`
- **Response:** Lista de tareas marcadas como prioritarias por el usuario

### Task Updates

#### Update Task Status
- **PATCH** `/api/tasks/status/:id`
- **Body:**
  ```json
  {
    "estado": "pendiente|en progreso|completada"
  }
  ```
- **Response:** Tarea actualizada con nuevo estado

#### Update Task Note
- **PATCH** `/api/tasks/note/:id`
- **Body:**
  ```json
  {
    "nota": "string (opcional, puede ser null)"
  }
  ```
- **Response:** Tarea actualizada con nueva nota

#### Toggle Task Priority
- **PATCH** `/api/tasks/priority/:idTarea`
- **Body:**
  ```json
  {
    "username": "string (requerido)"
  }
  ```
- **Response:** Estado de prioridad invertido para el usuario especificado

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "string",
  "data": "object|array"
}
```

### Error Response
```json
{
  "success": false,
  "message": "string",
  "errors": "array (opcional)"
}
```

---

## Database Schema

### Tables
- **users**: Información de usuarios
- **tareas**: Tareas del sistema
- **asignaciones**: Relación usuario-tarea con prioridad

### Key Features
- Encriptación de contraseñas con bcryptjs
- Validación de entrada con express-validator
- Protección contra ataques de fuerza bruta
- Tareas predefinidas en primer login
- Sistema de prioridades por usuario
- Timestamps automáticos (creación y actualización)

---

## Status Codes
- **200**: OK
- **201**: Created
- **400**: Bad Request (datos inválidos)
- **401**: Unauthorized (credenciales incorrectas)
- **404**: Not Found
- **500**: Internal Server Error
